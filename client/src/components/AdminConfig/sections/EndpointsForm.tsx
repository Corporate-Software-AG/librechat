import { useState, useCallback } from 'react';
import { Input, Label, Tag, Button, Switch } from '@librechat/client';

interface EndpointsFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

interface CustomEndpoint {
  name: string;
  apiKey: string;
  baseURL: string;
  models: {
    default: (string | { name: string; description?: string })[];
    fetch?: boolean;
    userIdQuery?: boolean;
  };
  modelDisplayLabel?: string;
  iconURL?: string;
  summarize?: boolean;
  summaryModel?: string;
  titleConvo?: boolean;
  titleModel?: string;
  dropParams?: string[];
  addParams?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  [key: string]: unknown;
}

function ModelListEditor({
  models,
  onChange,
}: {
  models: (string | { name: string; description?: string })[];
  onChange: (models: (string | { name: string; description?: string })[]) => void;
}) {
  const [newModel, setNewModel] = useState('');

  const addModel = () => {
    const trimmed = newModel.trim();
    if (trimmed && !models.some((m) => (typeof m === 'string' ? m : m.name) === trimmed)) {
      onChange([...models, trimmed]);
      setNewModel('');
    }
  };

  const removeModel = (idx: number) => {
    onChange(models.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {models.map((model, idx) => {
          const name = typeof model === 'string' ? model : model.name;
          return <Tag key={idx} label={name} onRemove={() => removeModel(idx)} />;
        })}
        {models.length === 0 && (
          <span className="text-xs text-text-tertiary italic">No models configured</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={newModel}
          onChange={(e) => setNewModel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addModel();
            }
          }}
          placeholder="Add model name (e.g. gpt-4o)"
          className="max-w-xs"
        />
        <Button variant="outline" size="sm" onClick={addModel} disabled={!newModel.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}

function EndpointCard({
  endpoint,
  onEdit,
  onRemove,
}: {
  endpoint: CustomEndpoint;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const modelNames = endpoint.models?.default?.map((m) =>
    typeof m === 'string' ? m : m.name,
  ) ?? [];

  return (
    <div className="rounded-lg border border-border-medium p-4 transition-colors hover:border-border-heavy">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">
              {endpoint.modelDisplayLabel || endpoint.name}
            </span>
            {endpoint.models?.fetch && (
              <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-xs text-blue-400">
                auto-fetch
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-secondary truncate max-w-md">
            {endpoint.baseURL || '(no URL)'}
          </p>
          {modelNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {modelNames.slice(0, 6).map((name) => (
                <span
                  key={name}
                  className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-text-secondary"
                >
                  {name}
                </span>
              ))}
              {modelNames.length > 6 && (
                <span className="rounded-full bg-surface-hover px-2 py-0.5 text-xs text-text-tertiary">
                  +{modelNames.length - 6} more
                </span>
              )}
            </div>
          )}
        </div>
        <div className="ml-4 flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            className="rounded-md px-2.5 py-1.5 text-xs text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            Edit
          </button>
          <button
            onClick={onRemove}
            className="rounded-md px-2.5 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function EndpointEditor({
  endpoint,
  onSave,
  onCancel,
}: {
  endpoint: CustomEndpoint | null;
  onSave: (ep: CustomEndpoint) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<CustomEndpoint>(
    endpoint ?? {
      name: '',
      apiKey: '${PLACEHOLDER_KEY}',
      baseURL: '',
      models: { default: [], fetch: false },
    },
  );

  const update = (key: string, val: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const updateModels = (key: string, val: unknown) => {
    setDraft((prev) => ({
      ...prev,
      models: { ...prev.models, [key]: val },
    }));
  };

  const handleSave = () => {
    if (!draft.name.trim() || !draft.baseURL.trim()) {
      return;
    }
    // Ensure at least one model when fetch is off
    if (!draft.models.fetch && draft.models.default.length === 0) {
      return;
    }
    onSave(draft);
  };

  return (
    <div className="space-y-4 rounded-lg border border-blue-500/30 bg-surface-primary-alt p-4">
      <h4 className="text-sm font-medium text-text-primary">
        {endpoint ? 'Edit Endpoint' : 'New Custom Endpoint'}
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Name</Label>
          <Input
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="My Endpoint"
            disabled={!!endpoint}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Display Label</Label>
          <Input
            value={draft.modelDisplayLabel ?? ''}
            onChange={(e) => update('modelDisplayLabel', e.target.value || undefined)}
            placeholder="Optional display name"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-text-secondary">Base URL</Label>
        <Input
          value={draft.baseURL}
          onChange={(e) => update('baseURL', e.target.value)}
          placeholder="https://api.example.com/v1"
        />
        <p className="text-xs text-text-tertiary">
          Supports {'${ENV_VAR}'} syntax for environment variable substitution.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-text-secondary">API Key</Label>
        <Input
          value={draft.apiKey}
          onChange={(e) => update('apiKey', e.target.value)}
          placeholder="${MY_API_KEY}"
        />
      </div>

      {/* Models */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-text-secondary">Models</Label>
          <label className="flex items-center gap-1.5 text-xs text-text-secondary">
            <Switch
              checked={Boolean(draft.models.fetch)}
              onCheckedChange={(v) => updateModels('fetch', v)}
            />
            Auto-fetch from API
          </label>
        </div>
        <ModelListEditor
          models={draft.models.default}
          onChange={(models) => updateModels('default', models)}
        />
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Icon URL</Label>
          <Input
            value={draft.iconURL ?? ''}
            onChange={(e) => update('iconURL', e.target.value || undefined)}
            placeholder="https://..."
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Summary Model</Label>
          <Input
            value={draft.summaryModel ?? ''}
            onChange={(e) => update('summaryModel', e.target.value || undefined)}
            placeholder="gpt-4o-mini"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-1.5 text-xs text-text-primary">
          <input
            type="checkbox"
            checked={Boolean(draft.summarize)}
            onChange={(e) => update('summarize', e.target.checked || undefined)}
            className="accent-blue-500"
          />
          Summarize conversations
        </label>
        <label className="flex items-center gap-1.5 text-xs text-text-primary">
          <input
            type="checkbox"
            checked={Boolean(draft.titleConvo)}
            onChange={(e) => update('titleConvo', e.target.checked || undefined)}
            className="accent-blue-500"
          />
          Auto-title conversations
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={handleSave} disabled={!draft.name.trim() || !draft.baseURL.trim()}>
          {endpoint ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

export default function EndpointsForm({ value, onChange }: EndpointsFormProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const customEndpoints = ((value.custom ?? []) as CustomEndpoint[]);

  const updateCustom = useCallback(
    (newList: CustomEndpoint[]) => {
      onChange({ ...value, custom: newList });
    },
    [value, onChange],
  );

  const handleRemove = useCallback(
    (idx: number) => {
      if (window.confirm(`Remove endpoint "${customEndpoints[idx]?.name}"?`)) {
        updateCustom(customEndpoints.filter((_, i) => i !== idx));
      }
    },
    [customEndpoints, updateCustom],
  );

  const handleSaveEdit = useCallback(
    (idx: number, ep: CustomEndpoint) => {
      const newList = [...customEndpoints];
      newList[idx] = ep;
      updateCustom(newList);
      setEditingIdx(null);
    },
    [customEndpoints, updateCustom],
  );

  const handleAdd = useCallback(
    (ep: CustomEndpoint) => {
      updateCustom([...customEndpoints, ep]);
      setAdding(false);
    },
    [customEndpoints, updateCustom],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Agents config note */}
      {value.agents && (
        <div className="rounded-lg bg-surface-primary-alt p-3 text-xs text-text-secondary">
          <strong>Agents endpoint</strong> is configured via YAML. Use the JSON view to override agent-specific settings.
        </div>
      )}

      {/* Custom endpoints */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-text-primary">Custom Endpoints</h3>
        <p className="text-xs text-text-secondary">
          Add, edit, or remove custom API endpoints. Changes override the YAML config.
        </p>
      </div>

      <div className="space-y-2">
        {customEndpoints.map((ep, idx) =>
          editingIdx === idx ? (
            <EndpointEditor
              key={ep.name}
              endpoint={ep}
              onSave={(e) => handleSaveEdit(idx, e)}
              onCancel={() => setEditingIdx(null)}
            />
          ) : (
            <EndpointCard
              key={ep.name}
              endpoint={ep}
              onEdit={() => setEditingIdx(idx)}
              onRemove={() => handleRemove(idx)}
            />
          ),
        )}
      </div>

      {adding ? (
        <EndpointEditor
          endpoint={null}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-border-medium p-3 text-sm text-text-secondary transition-colors hover:border-border-heavy hover:text-text-primary"
        >
          + Add Custom Endpoint
        </button>
      )}
    </div>
  );
}
