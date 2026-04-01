import { isAssistantsEndpoint } from 'librechat-data-provider';
import type { TSubmission, TEndpointsConfig } from 'librechat-data-provider';
import type { EventHandlerParams } from './useEventHandlers';
import { useGetEndpointsQuery } from '~/data-provider';
import useResumableSSE from './useResumableSSE';
import useLocalSSE from './useLocalSSE';
import useSSE from './useSSE';

type ChatHelpers = Pick<
  EventHandlerParams,
  | 'setMessages'
  | 'getMessages'
  | 'setConversation'
  | 'setIsSubmitting'
  | 'newConversation'
  | 'resetLatestMessage'
>;

/**
 * Adaptive SSE hook that switches between standard, resumable, and local modes.
 * Routes to: local inference (useLocalSSE), assistants (useSSE), or resumable SSE (default).
 *
 * Note: All hooks are always called to comply with React's Rules of Hooks.
 * We pass null submission to the inactive one.
 */
export default function useAdaptiveSSE(
  submission: TSubmission | null,
  chatHelpers: ChatHelpers,
  isAddedRequest = false,
  runIndex = 0,
) {
  const { data: endpointsConfig = {} as TEndpointsConfig } = useGetEndpointsQuery();

  const endpoint = submission?.conversation?.endpoint;
  const endpointType = submission?.conversation?.endpointType;
  const actualEndpoint = endpointType ?? endpoint;
  const isAssistants = isAssistantsEndpoint(actualEndpoint);

  // Check if this endpoint is configured for local inference
  const endpointConfig = endpointsConfig?.[endpoint ?? ''];
  const isLocal = endpointConfig?.localInference === true;
  const localBaseURL = endpointConfig?.localBaseURL;

  const resumableEnabled = !isAssistants && !isLocal;

  useSSE(resumableEnabled ? null : isAssistants ? submission : null, chatHelpers, isAddedRequest, runIndex);

  const { streamId } = useResumableSSE(
    resumableEnabled ? submission : null,
    chatHelpers,
    isAddedRequest,
    runIndex,
  );

  useLocalSSE(
    isLocal ? submission : null,
    chatHelpers,
    localBaseURL,
    runIndex,
  );

  return { streamId, resumableEnabled };
}
