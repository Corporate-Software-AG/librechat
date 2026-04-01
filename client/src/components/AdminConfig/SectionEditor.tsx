import { useState, useCallback, useMemo, useEffect, useRef, type ComponentType } from 'react';

export interface SectionFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

interface SectionEditorProps {
  section: string;
  baseValue: Record<string, unknown> | undefined;
  overrideValue: Record<string, unknown> | undefined;
  onSave: (value: unknown) => void;
  onReset: () => void;
  isSaving: boolean;
  FormComponent?: ComponentType<SectionFormProps>;
}

type ViewMode = 'form' | 'json';

export default function SectionEditor({
  section,
  baseValue,
  overrideValue,
  onSave,
  onReset,
  isSaving,
  FormComponent,
}: SectionEditorProps) {
  const hasOverride = overrideValue !== undefined;
  const [viewMode, setViewMode] = useState<ViewMode>(FormComponent ? 'form' : 'json');

  // ── Form state ──
  const [formDraft, setFormDraft] = useState<Record<string, unknown>>(() => {
    if (hasOverride && overrideValue) {
      return { ...overrideValue };
    }
    return baseValue ? { ...baseValue } : {};
  });
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    const source = hasOverride && overrideValue ? overrideValue : (baseValue ?? {});
    setFormDraft({ ...source });
    setFormDirty(false);
  }, [baseValue, overrideValue, hasOverride]);

  const handleFormChange = useCallback((val: Record<string, unknown>) => {
    setFormDraft(val);
    setFormDirty(true);
  }, []);

  const handleFormSave = useCallback(() => {
    onSave(formDraft);
    setFormDirty(false);
  }, [formDraft, onSave]);

  // ── JSON state ──
  const [editorText, setEditorText] = useState(() =>
    hasOverride ? JSON.stringify(overrideValue, null, 2) : '',
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [jsonEditing, setJsonEditing] = useState(hasOverride);

  useEffect(() => {
    if (hasOverride) {
      setEditorText(JSON.stringify(overrideValue, null, 2));
      setJsonEditing(true);
    } else {
      setEditorText('');
      setJsonEditing(false);
    }
  }, [overrideValue, hasOverride]);

  const parsedRef = useRef<{ value: unknown; error: string | null }>({ value: null, error: null });

  parsedRef.current = useMemo(() => {
    if (!editorText.trim()) {
      return { value: null, error: null };
    }
    try {
      return { value: JSON.parse(editorText), error: null };
    } catch (e) {
      return { value: null, error: (e as Error).message };
    }
  }, [editorText]);

  useEffect(() => {
    setParseError(parsedRef.current.error);
  }, [editorText]);

  const parsedValue = parsedRef.current.value;

  const handleJsonSave = useCallback(() => {
    if (parsedValue != null) {
      onSave(parsedValue);
      return;
    }

    // Treat an empty editor (no JSON content, no parse error) as a reset request.
    if (!editorText.trim()) {
      if (window.confirm(`Remove all overrides for "${section}"? The YAML base config will apply.`)) {
        onReset();
        setEditorText('');
        setEditing(false);
      }
    }
  }, [parsedValue, editorText, onSave, onReset, section]);

  const handleReset = useCallback(() => {
    if (window.confirm(`Remove all overrides for "${section}"? The YAML base config will apply.`)) {
      onReset();
      setEditorText('');
      setJsonEditing(false);
      setFormDraft(baseValue ? { ...baseValue } : {});
      setFormDirty(false);
    }
  }, [onReset, section, baseValue]);

  const handleStartJsonEditing = useCallback(() => {
    if (!jsonEditing) {
      setEditorText(baseValue ? JSON.stringify(baseValue, null, 2) : '{\n  \n}');
      setJsonEditing(true);
    }
  }, [jsonEditing, baseValue]);

  const jsonIsDirty = useMemo(() => {
    if (!jsonEditing) {
      return false;
    }
    const current = hasOverride ? JSON.stringify(overrideValue, null, 2) : '';
    return editorText !== current;
  }, [jsonEditing, editorText, hasOverride, overrideValue]);

  // Sync form → JSON when switching views
  const switchToJson = useCallback(() => {
    if (formDirty) {
      setEditorText(JSON.stringify(formDraft, null, 2));
      setJsonEditing(true);
    }
    setViewMode('json');
  }, [formDirty, formDraft]);

  const switchToForm = useCallback(() => {
    // Parse current JSON into form draft
    if (jsonEditing && parsedValue && typeof parsedValue === 'object') {
      setFormDraft(parsedValue as Record<string, unknown>);
    }
    setViewMode('form');
  }, [jsonEditing, parsedValue]);

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary capitalize">{section}</h2>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          {FormComponent && (
            <div className="flex rounded-lg border border-border-medium text-xs">
              <button
                onClick={switchToForm}
                className={`px-3 py-1.5 transition-colors ${
                  viewMode === 'form'
                    ? 'bg-surface-active text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                } rounded-l-lg`}
              >
                Form
              </button>
              <button
                onClick={switchToJson}
                className={`px-3 py-1.5 transition-colors ${
                  viewMode === 'json'
                    ? 'bg-surface-active text-text-primary'
                    : 'text-text-secondary hover:text-text-primary'
                } rounded-r-lg`}
              >
                JSON
              </button>
            </div>
          )}

          {hasOverride && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Reset to YAML
            </button>
          )}

          {/* Save button */}
          {viewMode === 'form' && FormComponent && (
            <button
              onClick={handleFormSave}
              disabled={isSaving || !formDirty}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          )}
          {viewMode === 'json' && jsonEditing && (
            <button
              onClick={handleJsonSave}
              disabled={isSaving || !!parseError || !jsonIsDirty}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Override'}
            </button>
          )}
        </div>
      </div>

      {/* ── Form view ── */}
      {viewMode === 'form' && FormComponent && (
        <FormComponent value={formDraft} onChange={handleFormChange} />
      )}

      {/* ── JSON view ── */}
      {viewMode === 'json' && (
        <>
          {/* Base config (read-only) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
                YAML Base Config {!hasOverride && '(active)'}
              </span>
              {hasOverride && (
                <span className="text-xs text-text-secondary">(overridden)</span>
              )}
            </div>
            <pre
              className={`max-h-64 overflow-auto rounded-lg border border-border-medium bg-surface-primary-alt p-4 text-sm ${
                hasOverride ? 'opacity-50' : ''
              }`}
            >
              <code className="text-text-secondary">
                {baseValue ? JSON.stringify(baseValue, null, 2) : '(not set in YAML)'}
              </code>
            </pre>
          </div>

          {/* Override editor */}
          <div className="space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
              Database Override {hasOverride && '(active)'}
            </span>
            {jsonEditing ? (
              <>
                <textarea
                  value={editorText}
                  onChange={(e) => setEditorText(e.target.value)}
                  className="h-80 w-full resize-y rounded-lg border border-border-medium bg-surface-primary p-4 font-mono text-sm text-text-primary focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  spellCheck={false}
                  placeholder={`{\n  "key": "value"\n}`}
                />
                {parseError && (
                  <p className="text-xs text-red-500">JSON error: {parseError}</p>
                )}
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border-medium p-8 text-center">
                <p className="mb-3 text-sm text-text-secondary">
                  No database override for <strong>{section}</strong>. YAML config is used as-is.
                </p>
                <button
                  onClick={handleStartJsonEditing}
                  className="rounded-lg bg-surface-hover px-4 py-2 text-sm text-text-primary transition-colors hover:bg-surface-active"
                >
                  Add Override
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Info */}
      <p className="text-xs text-text-secondary">
        Database overrides are deep-merged on top of the YAML base config. They take effect within
        60 seconds (config cache TTL). Only the fields you specify are overridden — everything else
        falls through to the YAML config.
      </p>
    </div>
  );
}
