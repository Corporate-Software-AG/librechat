import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { SystemRoles } from 'librechat-data-provider';
import { useAuthContext, useLocalize } from '~/hooks';
import {
  useGetAdminBaseConfig,
  useGetAdminConfigs,
  usePatchAdminConfigFields,
  useDeleteAdminConfigFields,
} from '~/data-provider';
import SectionEditor from './SectionEditor';

const EDITABLE_SECTIONS = [
  { key: 'interface', label: 'Interface' },
  { key: 'modelSpecs', label: 'Model Specs' },
  { key: 'endpoints', label: 'Endpoints' },
  { key: 'balance', label: 'Balance' },
  { key: 'transactions', label: 'Transactions' },
  { key: 'registration', label: 'Registration' },
  { key: 'speech', label: 'Speech' },
  { key: 'rateLimits', label: 'Rate Limits' },
] as const;

const PRINCIPAL_TYPE = 'role';
const PRINCIPAL_ID = '__base__';

export default function AdminConfigView() {
  const navigate = useNavigate();
  const localize = useLocalize();
  const { user, isAuthenticated } = useAuthContext();

  const [activeTab, setActiveTab] = useState<string>(EDITABLE_SECTIONS[0].key);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: baseConfig, isLoading: baseLoading } = useGetAdminBaseConfig({
    enabled: isAuthenticated && user?.role === SystemRoles.ADMIN,
  });

  const { data: configsData, isLoading: configsLoading } = useGetAdminConfigs({
    enabled: isAuthenticated && user?.role === SystemRoles.ADMIN,
  });

  const patchMutation = usePatchAdminConfigFields();
  const deleteMutation = useDeleteAdminConfigFields();

  useEffect(() => {
    return () => {
      if (statusTimerRef.current != null) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  const scheduleIdle = useCallback((delay: number) => {
    if (statusTimerRef.current != null) {
      clearTimeout(statusTimerRef.current);
    }
    statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), delay);
  }, []);

  const globalOverride = useMemo(() => {
    if (!configsData?.configs) {
      return null;
    }
    return configsData.configs.find(
      (c) => c.principalType === PRINCIPAL_TYPE && c.principalId === PRINCIPAL_ID,
    );
  }, [configsData]);

  const overrides = useMemo(() => {
    return (globalOverride?.overrides ?? {}) as Record<string, unknown>;
  }, [globalOverride]);

  const handleSave = useCallback(
    async (section: string, value: unknown) => {
      setSaveStatus('saving');
      try {
        await patchMutation.mutateAsync({
          principalType: PRINCIPAL_TYPE,
          principalId: PRINCIPAL_ID,
          section,
          value,
        });
        setSaveStatus('saved');
        scheduleIdle(2000);
      } catch {
        setSaveStatus('error');
        scheduleIdle(3000);
      }
    },
    [patchMutation, scheduleIdle],
  );

  const handleReset = useCallback(
    async (section: string) => {
      setSaveStatus('saving');
      try {
        await deleteMutation.mutateAsync({
          principalType: PRINCIPAL_TYPE,
          principalId: PRINCIPAL_ID,
          section,
        });
        setSaveStatus('saved');
        scheduleIdle(2000);
      } catch {
        setSaveStatus('error');
        scheduleIdle(3000);
      }
    },
    [deleteMutation, scheduleIdle],
  );

  const shouldRedirect = !isAuthenticated || user?.role !== SystemRoles.ADMIN;

  useEffect(() => {
    if (shouldRedirect) {
      navigate('/c/new');
    }
  }, [shouldRedirect, navigate]);

  if (shouldRedirect) {
    return null;
  }

  const isLoading = baseLoading || configsLoading;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border-medium px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/c/new')}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-xl font-semibold text-text-primary">
            {localize('com_nav_settings') + ' — Admin'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <span className="text-sm text-text-secondary">Saving...</span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-sm text-green-500">Saved</span>
          )}
          {saveStatus === 'error' && (
            <span className="text-sm text-red-500">Error saving</span>
          )}
          {globalOverride?.isActive === false && (
            <span className="rounded bg-yellow-500/20 px-2 py-1 text-xs text-yellow-500">
              Overrides disabled
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar tabs */}
        <nav className="w-48 shrink-0 overflow-y-auto border-r border-border-medium bg-surface-primary-alt p-2">
          {EDITABLE_SECTIONS.map((section) => {
            const hasOverride = section.key in overrides;
            return (
              <button
                key={section.key}
                onClick={() => setActiveTab(section.key)}
                className={`mb-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeTab === section.key
                    ? 'bg-surface-active text-text-primary'
                    : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                }`}
              >
                <span>{section.label}</span>
                {hasOverride && (
                  <span className="h-2 w-2 rounded-full bg-blue-500" title="Has override" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Editor panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-medium border-t-text-primary" />
            </div>
          ) : (
            <SectionEditor
              key={activeTab}
              section={activeTab}
              baseValue={baseConfig?.[activeTab] as Record<string, unknown> | undefined}
              overrideValue={overrides[activeTab] as Record<string, unknown> | undefined}
              onSave={(value) => handleSave(activeTab, value)}
              onReset={() => handleReset(activeTab)}
              isSaving={patchMutation.isLoading || deleteMutation.isLoading}
            />
          )}
        </div>
      </div>
    </div>
  );
}
