import { Input, Label } from '@librechat/client';

interface RateLimitsFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

interface RateLimitCategory {
  ipMax?: number;
  ipWindowInMinutes?: number;
  userMax?: number;
  userWindowInMinutes?: number;
}

const CATEGORIES: { key: string; label: string; description: string }[] = [
  {
    key: 'fileUploads',
    label: 'File Uploads',
    description: 'Limits on file upload frequency.',
  },
  {
    key: 'conversationsImport',
    label: 'Conversations Import',
    description: 'Limits on conversation import operations.',
  },
  {
    key: 'tts',
    label: 'Text-to-Speech',
    description: 'Limits on TTS API requests.',
  },
  {
    key: 'stt',
    label: 'Speech-to-Text',
    description: 'Limits on STT API requests.',
  },
];

function CategoryRow({
  category,
  data,
  onChange,
}: {
  category: { key: string; label: string; description: string };
  data: RateLimitCategory;
  onChange: (val: RateLimitCategory) => void;
}) {
  const update = (key: keyof RateLimitCategory, rawVal: string) => {
    const num = rawVal === '' ? undefined : Number(rawVal);
    if (num === undefined || isNaN(num)) {
      const updated = { ...data };
      delete updated[key];
      onChange(updated);
    } else {
      onChange({ ...data, [key]: num });
    }
  };

  return (
    <div className="rounded-lg border border-border-medium p-4 space-y-3">
      <div>
        <p className="text-sm font-medium text-text-primary">{category.label}</p>
        <p className="text-xs text-text-secondary">{category.description}</p>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-text-tertiary">IP Max</Label>
          <Input
            type="number"
            min={0}
            value={String(data.ipMax ?? '')}
            onChange={(e) => update('ipMax', e.target.value)}
            placeholder="—"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-tertiary">IP Window (min)</Label>
          <Input
            type="number"
            min={1}
            value={String(data.ipWindowInMinutes ?? '')}
            onChange={(e) => update('ipWindowInMinutes', e.target.value)}
            placeholder="—"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-tertiary">User Max</Label>
          <Input
            type="number"
            min={0}
            value={String(data.userMax ?? '')}
            onChange={(e) => update('userMax', e.target.value)}
            placeholder="—"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-text-tertiary">User Window (min)</Label>
          <Input
            type="number"
            min={1}
            value={String(data.userWindowInMinutes ?? '')}
            onChange={(e) => update('userWindowInMinutes', e.target.value)}
            placeholder="—"
          />
        </div>
      </div>
    </div>
  );
}

export default function RateLimitsForm({ value, onChange }: RateLimitsFormProps) {
  const updateCategory = (key: string, val: RateLimitCategory) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-text-primary">Rate Limits</h3>
        <p className="text-xs text-text-secondary">
          Configure per-IP and per-user rate limits for different API categories.
          Leave fields empty to use defaults.
        </p>
      </div>
      {CATEGORIES.map((cat) => (
        <CategoryRow
          key={cat.key}
          category={cat}
          data={(value[cat.key] ?? {}) as RateLimitCategory}
          onChange={(v) => updateCategory(cat.key, v)}
        />
      ))}
    </div>
  );
}
