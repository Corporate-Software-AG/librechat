import { useState, useCallback } from 'react';
import { Input, Label, Tag, Button } from '@librechat/client';

interface ModelSpecsFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

interface ModelSpec {
  name: string;
  label: string;
  description?: string;
  default?: boolean;
  preset: {
    endpoint: string | null;
    model?: string;
    [key: string]: unknown;
  };
  iconURL?: string;
  webSearch?: boolean;
  fileSearch?: boolean;
  executeCode?: boolean;
  mcpServers?: string[];
  [key: string]: unknown;
}

function ModelSpecCard({
  spec,
  onEdit,
  onRemove,
}: {
  spec: ModelSpec;
  onEdit: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-border-medium p-4 transition-colors hover:border-border-heavy">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-text-primary">{spec.label || spec.name}</span>
          {spec.default && (
            <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-xs text-green-500">
              default
            </span>
          )}
        </div>
        {spec.description && (
          <p className="mt-1 text-xs text-text-secondary line-clamp-2">{spec.description}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {spec.preset?.endpoint && (
            <Tag label={`Endpoint: ${spec.preset.endpoint}`} />
          )}
          {spec.preset?.model && (
            <Tag label={`Model: ${spec.preset.model}`} />
          )}
          {spec.webSearch && <Tag label="Web Search" />}
          {spec.fileSearch && <Tag label="File Search" />}
          {spec.executeCode && <Tag label="Code" />}
        </div>
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
  );
}

function ModelSpecEditor({
  spec,
  onSave,
  onCancel,
}: {
  spec: ModelSpec | null;
  onSave: (spec: ModelSpec) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<ModelSpec>(
    spec ?? {
      name: '',
      label: '',
      description: '',
      preset: { endpoint: '', model: '' },
    },
  );
  const [newMcpServer, setNewMcpServer] = useState('');

  const update = (key: string, val: unknown) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  };

  const updatePreset = (key: string, val: unknown) => {
    setDraft((prev) => ({
      ...prev,
      preset: { ...prev.preset, [key]: val },
    }));
  };

  const addMcpServer = () => {
    if (newMcpServer.trim()) {
      update('mcpServers', [...(draft.mcpServers ?? []), newMcpServer.trim()]);
      setNewMcpServer('');
    }
  };

  const removeMcpServer = (idx: number) => {
    update(
      'mcpServers',
      (draft.mcpServers ?? []).filter((_, i) => i !== idx),
    );
  };

  const handleSave = () => {
    if (!draft.name.trim() || !draft.label.trim()) {
      return;
    }
    onSave(draft);
  };

  return (
    <div className="space-y-4 rounded-lg border border-blue-500/30 bg-surface-primary-alt p-4">
      <h4 className="text-sm font-medium text-text-primary">
        {spec ? 'Edit Model Spec' : 'New Model Spec'}
      </h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Name (unique ID)</Label>
          <Input
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="gpt-4o"
            disabled={!!spec}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Display Label</Label>
          <Input
            value={draft.label}
            onChange={(e) => update('label', e.target.value)}
            placeholder="GPT-4o"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-text-secondary">Description</Label>
        <Input
          value={draft.description ?? ''}
          onChange={(e) => update('description', e.target.value || undefined)}
          placeholder="Optional description"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Endpoint</Label>
          <Input
            value={(draft.preset?.endpoint as string) ?? ''}
            onChange={(e) => updatePreset('endpoint', e.target.value || null)}
            placeholder="Foundry"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-text-secondary">Model</Label>
          <Input
            value={draft.preset?.model ?? ''}
            onChange={(e) => updatePreset('model', e.target.value || undefined)}
            placeholder="gpt-4o"
          />
        </div>
      </div>

      {/* Tool defaults */}
      <div className="space-y-2">
        <Label className="text-xs text-text-secondary">Default Tool Toggles</Label>
        <div className="flex flex-wrap gap-3">
          {(['webSearch', 'fileSearch', 'executeCode'] as const).map((tool) => (
            <label key={tool} className="flex items-center gap-1.5 text-xs text-text-primary">
              <input
                type="checkbox"
                checked={Boolean(draft[tool])}
                onChange={(e) => update(tool, e.target.checked || undefined)}
                className="accent-blue-500"
              />
              {tool === 'webSearch' ? 'Web Search' : tool === 'fileSearch' ? 'File Search' : 'Code'}
            </label>
          ))}
        </div>
      </div>

      {/* MCP Servers */}
      <div className="space-y-2">
        <Label className="text-xs text-text-secondary">MCP Servers</Label>
        <div className="flex flex-wrap gap-1.5">
          {(draft.mcpServers ?? []).map((server, idx) => (
            <Tag key={idx} label={server} onRemove={() => removeMcpServer(idx)} />
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={newMcpServer}
            onChange={(e) => setNewMcpServer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addMcpServer();
              }
            }}
            placeholder="Add MCP server name"
            className="max-w-xs"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addMcpServer}
            disabled={!newMcpServer.trim()}
          >
            Add
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!draft.name.trim() || !draft.label.trim()}
        >
          {spec ? 'Update' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

export default function ModelSpecsForm({ value, onChange }: ModelSpecsFormProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const list = ((value.list ?? []) as ModelSpec[]);
  const enforce = Boolean(value.enforce ?? false);
  const prioritize = Boolean(value.prioritize ?? true);

  const updateList = useCallback(
    (newList: ModelSpec[]) => {
      onChange({ ...value, list: newList });
    },
    [value, onChange],
  );

  const handleRemove = useCallback(
    (idx: number) => {
      if (window.confirm(`Remove model spec "${list[idx]?.label}"?`)) {
        updateList(list.filter((_, i) => i !== idx));
      }
    },
    [list, updateList],
  );

  const handleSaveEdit = useCallback(
    (idx: number, spec: ModelSpec) => {
      const newList = [...list];
      newList[idx] = spec;
      updateList(newList);
      setEditingIdx(null);
    },
    [list, updateList],
  );

  const handleAdd = useCallback(
    (spec: ModelSpec) => {
      updateList([...list, spec]);
      setAdding(false);
    },
    [list, updateList],
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Options */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={enforce}
            onChange={(e) => onChange({ ...value, enforce: e.target.checked })}
            className="accent-blue-500"
          />
          Enforce (lock UI to specs only)
        </label>
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={prioritize}
            onChange={(e) => onChange({ ...value, prioritize: e.target.checked })}
            className="accent-blue-500"
          />
          Prioritize (show specs first)
        </label>
      </div>

      {/* Model spec list */}
      <div className="space-y-2">
        {list.map((spec, idx) =>
          editingIdx === idx ? (
            <ModelSpecEditor
              key={spec.name}
              spec={spec}
              onSave={(s) => handleSaveEdit(idx, s)}
              onCancel={() => setEditingIdx(null)}
            />
          ) : (
            <ModelSpecCard
              key={spec.name}
              spec={spec}
              onEdit={() => setEditingIdx(idx)}
              onRemove={() => handleRemove(idx)}
            />
          ),
        )}
      </div>

      {/* Add new */}
      {adding ? (
        <ModelSpecEditor
          spec={null}
          onSave={handleAdd}
          onCancel={() => setAdding(false)}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full rounded-lg border border-dashed border-border-medium p-3 text-sm text-text-secondary transition-colors hover:border-border-heavy hover:text-text-primary"
        >
          + Add Model Spec
        </button>
      )}

      {list.length === 0 && !adding && (
        <p className="text-xs text-text-secondary">
          No model specs configured. The default model list from each endpoint will be shown.
        </p>
      )}
    </div>
  );
}
