import { Input, Label, Switch } from '@librechat/client';

interface SpeechFormProps {
  value: Record<string, unknown>;
  onChange: (value: Record<string, unknown>) => void;
}

export default function SpeechForm({ value, onChange }: SpeechFormProps) {
  const speechTab = (value.speechTab ?? {}) as Record<string, unknown>;
  const tts = (value.tts ?? {}) as Record<string, unknown>;
  const stt = (value.stt ?? {}) as Record<string, unknown>;

  const updateSpeechTab = (key: string, val: unknown) => {
    onChange({ ...value, speechTab: { ...speechTab, [key]: val } });
  };

  const updateTts = (key: string, val: unknown) => {
    onChange({ ...value, tts: { ...tts, [key]: val } });
  };

  const updateStt = (key: string, val: unknown) => {
    onChange({ ...value, stt: { ...stt, [key]: val } });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Speech tab toggles */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-text-primary">Speech Tab Defaults</h3>
        <p className="text-xs text-text-secondary">
          Controls initial visibility of speech features for new users.
        </p>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-lg bg-surface-primary-alt p-3">
          <div>
            <p className="text-sm text-text-primary">Speech-to-Text</p>
            <p className="text-xs text-text-secondary">Microphone input for voice dictation.</p>
          </div>
          <Switch
            checked={speechTab.speechToText !== false}
            onCheckedChange={(v) => updateSpeechTab('speechToText', v)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-surface-primary-alt p-3">
          <div>
            <p className="text-sm text-text-primary">Text-to-Speech</p>
            <p className="text-xs text-text-secondary">Read-aloud button on assistant messages.</p>
          </div>
          <Switch
            checked={speechTab.textToSpeech !== false}
            onCheckedChange={(v) => updateSpeechTab('textToSpeech', v)}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg bg-surface-primary-alt p-3">
          <div>
            <p className="text-sm text-text-primary">Conversation Mode</p>
            <p className="text-xs text-text-secondary">
              Auto-transcribe → auto-send → auto-playback loop.
            </p>
          </div>
          <Switch
            checked={Boolean(speechTab.conversationMode)}
            onCheckedChange={(v) => updateSpeechTab('conversationMode', v)}
          />
        </div>
      </div>

      {/* TTS config */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">Text-to-Speech Provider</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Backend</Label>
            <select
              value={String(tts.backend ?? 'browser')}
              onChange={(e) => updateTts('backend', e.target.value)}
              className="h-10 w-full rounded-lg border border-border-medium bg-surface-primary px-3 text-sm text-text-primary outline-none focus:border-blue-500"
            >
              <option value="browser">Browser Native</option>
              <option value="openai">OpenAI</option>
              <option value="azure">Azure</option>
              <option value="elevenlabs">ElevenLabs</option>
              <option value="localai">LocalAI</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Voice</Label>
            <Input
              value={String(tts.voice ?? '')}
              onChange={(e) => updateTts('voice', e.target.value || undefined)}
              placeholder="e.g. alloy, shimmer"
            />
          </div>
        </div>
      </div>

      {/* STT config */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-text-primary">Speech-to-Text Provider</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Backend</Label>
            <select
              value={String(stt.backend ?? 'browser')}
              onChange={(e) => updateStt('backend', e.target.value)}
              className="h-10 w-full rounded-lg border border-border-medium bg-surface-primary px-3 text-sm text-text-primary outline-none focus:border-blue-500"
            >
              <option value="browser">Browser Native</option>
              <option value="openai">OpenAI (Whisper)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-text-secondary">Language</Label>
            <Input
              value={String(stt.language ?? '')}
              onChange={(e) => updateStt('language', e.target.value || undefined)}
              placeholder="e.g. en, de, fr"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
