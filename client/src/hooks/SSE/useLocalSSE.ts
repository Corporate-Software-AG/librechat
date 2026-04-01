/**
 * useLocalSSE.ts — Local inference SSE hook for Apple Intelligence companion app.
 *
 * Routes chat completions directly from the browser to http://localhost (bypassing
 * the ACA backend). Forces ghost mode — no conversation is persisted server-side.
 *
 * The local companion app exposes an OpenAI-compatible API on localhost:11434.
 * This hook:
 *   1. Converts LibreChat messages → OpenAI format
 *   2. POSTs to localBaseURL/chat/completions with stream: true
 *   3. Parses SSE response (data: {...}\n\n) chunks
 *   4. Updates the messages state as deltas arrive
 *   5. Cleans up on unmount/abort
 *
 * Browser compatibility:
 *   - Chrome/Firefox/Edge: Allow http://localhost from HTTPS (W3C "potentially trustworthy")
 *   - Safari: Blocks mixed content — Phase 2 (loopback TLS or WKWebView wrapper)
 *   - Chrome PNA: Handled by companion app's Access-Control-Allow-Private-Network header
 */
import { useEffect, useRef } from 'react';
import { v4 } from 'uuid';
import { useSetRecoilState } from 'recoil';
import type { TSubmission } from 'librechat-data-provider';
import type { EventHandlerParams } from './useEventHandlers';
import store from '~/store';

type ChatHelpers = Pick<
  EventHandlerParams,
  | 'setMessages'
  | 'getMessages'
  | 'setConversation'
  | 'setIsSubmitting'
  | 'newConversation'
  | 'resetLatestMessage'
>;

export default function useLocalSSE(
  submission: TSubmission | null,
  chatHelpers: ChatHelpers,
  localBaseURL: string | undefined,
  runIndex = 0,
) {
  const {
    setMessages,
    getMessages,
    setIsSubmitting,
    setConversation,
    resetLatestMessage,
  } = chatHelpers;

  const setShowStopButton = useSetRecoilState(store.showStopButtonByIndex(runIndex));
  const setAbortScroll = useSetRecoilState(store.abortScrollFamily(runIndex));
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!submission || !localBaseURL) {
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsSubmitting(true);
    setShowStopButton(true);
    setAbortScroll(false);

    const conversationId =
      submission.conversation?.conversationId || `local-${v4()}`;
    const userMessageId = submission.userMessage?.messageId || v4();

    (async () => {
      try {
        /* ── 1. Build OpenAI messages array ────────────────────────── */
        const chatMessages: { role: string; content: string }[] = [];

        // System message (from endpoint instructions if any)
        const endpointInstructions = (
          submission.endpointOption as Record<string, unknown>
        )?.promptPrefix as string | undefined;
        if (endpointInstructions) {
          chatMessages.push({ role: 'system', content: endpointInstructions });
        }

        // Conversation history
        for (const msg of submission.messages || []) {
          chatMessages.push({
            role: msg.isCreatedByUser ? 'user' : 'assistant',
            content: msg.text || '',
          });
        }

        // Current user message
        chatMessages.push({
          role: 'user',
          content: submission.userMessage?.text || '',
        });

        /* ── 2. Use existing placeholder from submission ─────────── */
        // ask() in useChatFunctions already added initialResponse to messages
        // We just need to find and update it, not add a new one
        const responseMessageId = submission.initialResponse?.messageId || `${userMessageId}_`;

        /* ── 3. POST to local companion app ───────────────────────── */
        const model =
          (submission.endpointOption as Record<string, unknown>)?.model as
          | string
          | undefined ?? 'apple-intelligence';

        const res = await fetch(`${localBaseURL}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: chatMessages,
            stream: true,
            conversation_id: conversationId,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const errBody = await res.json().catch(() => null);
          throw new Error(
            errBody?.error?.message || `Local server error: ${res.status}`,
          );
        }

        /* ── 4. Parse SSE stream ──────────────────────────────────── */
        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullText = '';

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const decoded = decoder.decode(value, { stream: true });
          buffer += decoded;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6);
            if (payload === '[DONE]') continue;

            try {
              const chunk = JSON.parse(payload);
              const delta = chunk.choices?.[0]?.delta?.content;
              if (delta) {
                fullText += delta;

                // Update the response message in-place
                const msgs = getMessages();
                const idx = msgs.findIndex(
                  (m) => m.messageId === responseMessageId,
                );
                if (idx >= 0) {
                  const updated = [...msgs];
                  updated[idx] = {
                    ...updated[idx],
                    text: fullText,
                    // Update content array with proper structure
                    content: [
                      {
                        type: 'text' as const,
                        text: { value: fullText },
                      },
                    ],
                    unfinished: true,
                    submitting: true,
                  };
                  setMessages(updated);
                }
              }
            } catch {
              /* skip malformed SSE lines */
            }
          }
        }

        /* ── 5. Finalize ──────────────────────────────────────────── */
        const msgs = getMessages();
        const idx = msgs.findIndex(
          (m) => m.messageId === responseMessageId,
        );
        if (idx >= 0) {
          const updated = [...msgs];
          updated[idx] = {
            ...updated[idx],
            text: fullText,
            content: [
              {
                type: 'text' as const,
                text: { value: fullText },
              },
            ],
            unfinished: false,
            submitting: false,
            error: false,
          };
          setMessages(updated);
        }

        // Update conversation (local ghost mode — no server persistence)
        setConversation((prev) => ({
          ...prev,
          conversationId,
          endpoint: submission.conversation?.endpoint,
          title: submission.conversation?.title || 'Local Chat',
        }));
      } catch (error: unknown) {
        if ((error as Error).name === 'AbortError') return;

        // Show error in the response message
        const msgs = getMessages();
        const idx = msgs.findIndex(
          (m) => m.messageId === responseMessageId,
        );
        if (idx >= 0) {
          const updated = [...msgs];
          updated[idx] = {
            ...updated[idx],
            text: `⚠️ ${(error as Error).message}\n\nMake sure the Askia Local companion app is running on your Mac.`,
            unfinished: false,
            submitting: false,
            error: true,
          };
          setMessages(updated);
        } else {
          resetLatestMessage();
        }
      } finally {
        setIsSubmitting(false);
        setShowStopButton(false);
      }
    })();

    return () => {
      controller.abort();
      setIsSubmitting(false);
      setShowStopButton(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submission]);
}
