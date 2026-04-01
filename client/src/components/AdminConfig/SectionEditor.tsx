import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

interface SectionEditorProps {
  section: string;
  baseValue: Record<string, unknown> | undefined;
  overrideValue: Record<string, unknown> | undefined;
  onSave: (value: unknown) => void;
  onReset: () => void;
  isSaving: boolean;
}

export default function SectionEditor({
  section,
  baseValue,
  overrideValue,
  onSave,
  onReset,
  isSaving,
}: SectionEditorProps) {
  const hasOverride = overrideValue !== undefined;

  const [editorText, setEditorText] = useState(() =>
    hasOverride ? JSON.stringify(overrideValue, null, 2) : '',
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [editing, setEditing] = useState(hasOverride);

  useEffect(() => {
    if (hasOverride) {
      setEditorText(JSON.stringify(overrideValue, null, 2));
      setEditing(true);
    } else {
      setEditorText('');
      setEditing(false);
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

  const handleSave = useCallback(() => {
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
      setEditing(false);
    }
  }, [onReset, section]);

  const handleStartEditing = useCallback(() => {
    if (!editing) {
      setEditorText(
        baseValue ? JSON.stringify(baseValue, null, 2) : '{\n  \n}',
      );
      setEditing(true);
    }
  }, [editing, baseValue]);

  const isDirty = useMemo(() => {
    if (!editing) {
      return false;
    }
    const current = hasOverride ? JSON.stringify(overrideValue, null, 2) : '';
    return editorText !== current;
  }, [editing, editorText, hasOverride, overrideValue]);

  return (
    <div className="space-y-4">
      {/* Section title */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-text-primary capitalize">{section}</h2>
        <div className="flex items-center gap-2">
          {hasOverride && (
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
            >
              Reset to YAML
            </button>
          )}
          {editing && (
            <button
              onClick={handleSave}
              disabled={isSaving || !!parseError || !isDirty}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Override'}
            </button>
          )}
        </div>
      </div>

      {/* Base config (read-only) */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Base Config (from YAML) {!hasOverride && '(active)'}
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
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wide text-text-secondary">
            Database Override {hasOverride && '(active)'}
          </span>
        </div>
        {editing ? (
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
              onClick={handleStartEditing}
              className="rounded-lg bg-surface-hover px-4 py-2 text-sm text-text-primary transition-colors hover:bg-surface-active"
            >
              Add Override
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-xs text-text-secondary">
        Database overrides are deep-merged on top of the YAML base config. They take effect within
        60 seconds (config cache TTL). Only the fields you specify are overridden — everything else
        falls through to the YAML config.
      </p>
    </div>
  );
}
