import { Input, Label, Switch } from '@librechat/client';

interface BalanceFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export default function BalanceForm({ value, onChange }: BalanceFormProps) {
  const update = (key: string, val: unknown) => {
    onChange({ ...value, [key]: val });
  };

  const enabled = Boolean(value.enabled ?? false);
  const autoRefillEnabled = Boolean(value.autoRefillEnabled ?? false);

  return (
    <div className="flex flex-col gap-6">
      {/* Main toggle */}
      <div className="flex items-center justify-between rounded-lg bg-surface-primary-alt p-4">
        <div>
          <p className="text-sm font-medium text-text-primary">Token Balance</p>
          <p className="text-xs text-text-secondary">
            Enable per-user token credit tracking and spending limits.
          </p>
        </div>
        <Switch checked={enabled} onCheckedChange={(v) => update('enabled', v)} />
      </div>

      {enabled && (
        <>
          {/* Starting balance */}
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Starting Balance (tokens)</Label>
            <Input
              type="number"
              min={0}
              value={String(value.startBalance ?? 0)}
              onChange={(e) => update('startBalance', Number(e.target.value))}
              className="max-w-xs"
            />
            <p className="text-xs text-text-tertiary">
              Token credits given to new users on signup.
            </p>
          </div>

          {/* Auto-refill section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">Auto-Refill</p>
                <p className="text-xs text-text-secondary">
                  Automatically top up user balances on a schedule.
                </p>
              </div>
              <Switch
                checked={autoRefillEnabled}
                onCheckedChange={(v) => update('autoRefillEnabled', v)}
              />
            </div>

            {autoRefillEnabled && (
              <div className="grid grid-cols-3 gap-4 pl-4 border-l-2 border-border-light">
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-secondary">Refill Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    value={String(value.refillAmount ?? 0)}
                    onChange={(e) => update('refillAmount', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-secondary">Interval Value</Label>
                  <Input
                    type="number"
                    min={1}
                    value={String(value.refillIntervalValue ?? 30)}
                    onChange={(e) => update('refillIntervalValue', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-text-secondary">Interval Unit</Label>
                  <select
                    value={String(value.refillIntervalUnit ?? 'days')}
                    onChange={(e) => update('refillIntervalUnit', e.target.value)}
                    className="h-10 w-full rounded-lg border border-border-medium bg-surface-primary px-3 text-sm text-text-primary outline-none focus:border-blue-500"
                  >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
