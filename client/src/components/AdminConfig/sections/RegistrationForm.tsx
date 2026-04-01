import { useState } from 'react';
import { Input, Label, Tag, Switch } from '@librechat/client';

interface RegistrationFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

function TagListEditor({
  label,
  description,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  description: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const [newItem, setNewItem] = useState('');

  const add = () => {
    const trimmed = newItem.trim().toLowerCase();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
      setNewItem('');
    }
  };

  return (
    <div className="space-y-2">
      <div>
        <Label className="text-xs text-text-secondary">{label}</Label>
        <p className="text-xs text-text-tertiary">{description}</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <Tag key={item} label={item} onRemove={() => onChange(items.filter((i) => i !== item))} />
        ))}
        {items.length === 0 && (
          <span className="text-xs text-text-tertiary italic">None configured</span>
        )}
      </div>
      <div className="flex gap-2">
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className="max-w-xs"
        />
      </div>
    </div>
  );
}

export default function RegistrationForm({ value, onChange }: RegistrationFormProps) {
  const update = (key: string, val: unknown) => {
    onChange({ ...value, [key]: val });
  };

  const socialLogins = (value.socialLogins ?? []) as string[];
  const allowedDomains = (value.allowedDomains ?? []) as string[];

  return (
    <div className="flex flex-col gap-6">
      {/* Social logins */}
      <TagListEditor
        label="Social Login Providers"
        description="Allowed OAuth/OIDC providers for user registration."
        items={socialLogins}
        onChange={(v) => update('socialLogins', v)}
        placeholder="e.g. google, github, openid"
      />

      {/* Allowed domains */}
      <TagListEditor
        label="Allowed Email Domains"
        description="Restrict registration to specific email domains. Leave empty to allow all."
        items={allowedDomains}
        onChange={(v) => update('allowedDomains', v)}
        placeholder="e.g. company.com"
      />

      {/* Allow registration toggle */}
      <div className="flex items-center justify-between rounded-lg bg-surface-primary-alt p-4">
        <div>
          <p className="text-sm font-medium text-text-primary">Allow Registration</p>
          <p className="text-xs text-text-secondary">
            Enable new user self-registration via the signup page.
          </p>
        </div>
        <Switch
          checked={value.allowedRegistration !== false}
          onCheckedChange={(v) => update('allowedRegistration', v)}
        />
      </div>
    </div>
  );
}
