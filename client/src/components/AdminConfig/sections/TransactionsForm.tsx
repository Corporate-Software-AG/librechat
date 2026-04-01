import { Switch } from '@librechat/client';

interface TransactionsFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export default function TransactionsForm({ value, onChange }: TransactionsFormProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-surface-primary-alt p-4">
      <div>
        <p className="text-sm font-medium text-text-primary">Transaction Logging</p>
        <p className="text-xs text-text-secondary">
          Track token usage and cost per request. Required for the analytics dashboard.
        </p>
      </div>
      <Switch
        checked={Boolean(value.enabled ?? false)}
        onCheckedChange={(v) => onChange({ ...value, enabled: v })}
      />
    </div>
  );
}
