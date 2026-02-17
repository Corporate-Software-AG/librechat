import React from 'react';
import { TooltipAnchor } from '@librechat/client';
import { MessageCircleDashed } from 'lucide-react';
import { useRecoilState, useRecoilCallback, useRecoilValue } from 'recoil';
import { useGetEndpointsQuery } from '~/data-provider';
import { useChatContext } from '~/Providers';
import { useLocalize } from '~/hooks';
import { cn } from '~/utils';
import store from '~/store';

export function TemporaryChat() {
  const localize = useLocalize();
  const [isTemporary, setIsTemporary] = useRecoilState(store.isTemporary);
  const { conversation, isSubmitting } = useChatContext();

  // Check if endpoint forces temporary chat (e.g., Apple Intelligence)
  const { data: endpointsConfig } = useGetEndpointsQuery();
  const endpointConfig = endpointsConfig?.[conversation?.endpoint ?? ''];
  const forced = endpointConfig?.temporaryChat === true;

  const temporaryBadge = {
    id: 'temporary',
    atom: store.isTemporary,
    isAvailable: true,
  };

  const handleBadgeToggle = useRecoilCallback(
    () => () => {
      if (forced) {
        return;
      }
      setIsTemporary(!isTemporary);
    },
    [isTemporary, forced],
  );

  if (
    (Array.isArray(conversation?.messages) && conversation.messages.length >= 1) ||
    isSubmitting
  ) {
    return null;
  }

  return (
    <div className="relative flex flex-wrap items-center gap-2">
      <TooltipAnchor
        description={
          forced
            ? localize('com_ui_temporary') + ' (always on)'
            : localize('com_ui_temporary')
        }
        render={
          <button
            onClick={handleBadgeToggle}
            aria-label={localize('com_ui_temporary')}
            aria-pressed={isTemporary || forced}
            disabled={forced}
            className={cn(
              'inline-flex size-10 flex-shrink-0 items-center justify-center rounded-xl border border-border-light text-text-primary transition-all ease-in-out',
              isTemporary || forced
                ? 'bg-surface-active'
                : 'bg-presentation shadow-sm hover:bg-surface-active-alt',
              forced && 'cursor-not-allowed opacity-70',
            )}
          >
            <MessageCircleDashed className="icon-lg" aria-hidden="true" />
          </button>
        }
      />
    </div>
  );
}
