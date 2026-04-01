import { Switch, Input, Label } from '@librechat/client';

interface InterfaceFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

const TOGGLE_FIELDS = [
  { key: 'endpointsMenu', label: 'Endpoints Menu', description: 'Show endpoint switcher in chat header' },
  { key: 'modelSelect', label: 'Model Select', description: 'Allow model selection within specs' },
  { key: 'parameters', label: 'Parameters', description: 'Show parameter tweaking panel' },
  { key: 'sidePanel', label: 'Side Panel', description: 'Show the side panel' },
  { key: 'multiConvo', label: 'Multi Conversation', description: 'Allow multiple conversations at once' },
  { key: 'bookmarks', label: 'Bookmarks', description: 'Enable bookmarks feature' },
  { key: 'memories', label: 'Memories', description: 'Enable persistent memories' },
  { key: 'presets', label: 'Presets', description: 'Enable conversation presets' },
  { key: 'temporaryChat', label: 'Temporary Chat', description: 'Allow temporary (non-persisted) chats' },
  { key: 'runCode', label: 'Run Code', description: 'Show code interpreter run button' },
  { key: 'webSearch', label: 'Web Search', description: 'Show web search toggle' },
  { key: 'fileSearch', label: 'File Search', description: 'Show file search toggle' },
  { key: 'fileCitations', label: 'File Citations', description: 'Show file citations in responses' },
] as const;

export default function InterfaceForm({ value, onChange }: InterfaceFormProps) {
  const update = (key: string, val: unknown) => {
    onChange({ ...value, [key]: val });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Welcome message */}
      <div className="space-y-1.5">
        <Label htmlFor="customWelcome" className="text-sm font-medium text-text-primary">
          Welcome Message
        </Label>
        <Input
          id="customWelcome"
          value={(value.customWelcome as string) ?? ''}
          onChange={(e) => update('customWelcome', e.target.value || undefined)}
          placeholder="Welcome to LibreChat!"
          className="max-w-lg"
        />
        <p className="text-xs text-text-secondary">
          Shown on the landing page. Supports {'{{user.name}}'} placeholder.
        </p>
      </div>

      {/* Toggle switches */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-text-primary">Feature Toggles</h3>
        <p className="text-xs text-text-secondary">Enable or disable UI features</p>
      </div>
      <div className="divide-y divide-border-medium rounded-lg border border-border-medium">
        {TOGGLE_FIELDS.map((field) => {
          const checked = value[field.key] !== undefined ? Boolean(value[field.key]) : true;
          return (
            <div
              key={field.key}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <span className="text-sm text-text-primary">{field.label}</span>
                <p className="text-xs text-text-secondary">{field.description}</p>
              </div>
              <Switch
                checked={checked}
                onCheckedChange={(v) => update(field.key, v)}
              />
            </div>
          );
        })}
      </div>

      {/* Privacy Policy URL */}
      <div className="space-y-1.5">
        <Label htmlFor="privacyUrl" className="text-sm font-medium text-text-primary">
          Privacy Policy URL
        </Label>
        <Input
          id="privacyUrl"
          value={
            (value.privacyPolicy as Record<string, unknown>)?.externalUrl as string ?? ''
          }
          onChange={(e) =>
            update('privacyPolicy', e.target.value ? { externalUrl: e.target.value, openNewTab: true } : undefined)
          }
          placeholder="https://example.com/privacy"
          className="max-w-lg"
        />
      </div>

      {/* Terms of Service URL */}
      <div className="space-y-1.5">
        <Label htmlFor="termsUrl" className="text-sm font-medium text-text-primary">
          Terms of Service URL
        </Label>
        <Input
          id="termsUrl"
          value={
            (value.termsOfService as Record<string, unknown>)?.externalUrl as string ?? ''
          }
          onChange={(e) =>
            update('termsOfService', e.target.value ? { externalUrl: e.target.value, openNewTab: true } : undefined)
          }
          placeholder="https://example.com/terms"
          className="max-w-lg"
        />
      </div>
    </div>
  );
}
