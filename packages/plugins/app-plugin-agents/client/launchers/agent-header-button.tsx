/**
 * The header's Agent button: opens and closes the panel (⌘J / Ctrl+J does the same, its tooltip says so). Eager and
 * small on purpose — it never imports the panel, which loads the first time the panel opens.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { BotIcon } from 'lucide-react';
import type { ComponentProps, ReactElement } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import { modifierKeyLabel } from '../chat/panel-state.js';
import { CHAT_PANEL_ID, useChatPanel } from '../chat/provider.js';
import { Button } from '../components/ui/button.js';
import { Kbd } from '../components/ui/kbd.js';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip.js';

export type AgentHeaderButtonProps = Omit<
  ComponentProps<typeof Button>,
  'onClick' | 'children'
>;

/** Renders nothing where the viewer may not chat (`useChatPanel().available`). */
export function AgentHeaderButton(
  props: AgentHeaderButtonProps,
): ReactElement | null {
  const panel = useChatPanel();
  const { t } = useTranslation(ACCESS_NAMESPACE);
  if (!panel.available) return null;
  const label = panel.open
    ? t('chat.closeLauncher', { defaultValue: 'Close Agent' })
    : t('chat.launcher', { defaultValue: 'Open Agent' });
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              aria-label={label}
              aria-expanded={panel.open}
              aria-controls={CHAT_PANEL_ID}
              aria-keyshortcuts='Meta+J Control+J'
              data-testid='agent-header-button'
              {...props}
              onClick={() => panel.toggleChat()}
            />
          }
        >
          <BotIcon />
        </TooltipTrigger>
        <TooltipContent side='bottom'>
          {label}
          <Kbd className='ml-1.5'>{`${modifierKeyLabel()} J`}</Kbd>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
