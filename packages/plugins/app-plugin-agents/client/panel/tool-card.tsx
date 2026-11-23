/**
 * The card a tool call shows when no renderer is registered for it (`agents.toolRenderers.add`): its name, input and
 * output, and, while it waits for the person, the confirmation. Both are replaceable (`ToolCard`, `ConfirmationCard`).
 */
import type { ComponentType, ReactElement } from 'react';

import type {
  AIToolPart,
  AIToolRendererContext,
  AIToolRendererProps,
  AppUIMessage,
} from '../chat.js';
import { Button } from '../components/ui/button.js';
import { replaceable } from '../ui-slots.js';
import { useChatTranslation } from './chat-i18n.js';

export interface ConfirmationCardProps {
  readonly toolName: string;
  readonly part: Readonly<AIToolPart>;
  readonly message: Readonly<AppUIMessage>;
  /** Approve or deny the call (`respond`), and whether that is possible now. */
  readonly approval: AIToolRendererContext['approval'];
}

/** What a tool call waiting for the person asks: approve or deny. */
export function DefaultConfirmationCard({
  approval,
}: ConfirmationCardProps): ReactElement {
  const { t } = useChatTranslation();
  return (
    <div className='space-y-2' data-chat-part='confirmation'>
      <p>{t('chat.approval.request')}</p>
      <div className='flex gap-2'>
        <Button
          size='sm'
          disabled={approval.disabled}
          onClick={() => void approval.respond(true)}
        >
          {t('chat.approval.approve')}
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={approval.disabled}
          onClick={() => void approval.respond(false)}
        >
          {t('chat.approval.deny')}
        </Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- wrapped once at load, so replacements follow it
export const ConfirmationCard: ComponentType<ConfirmationCardProps> =
  replaceable('ConfirmationCard', DefaultConfirmationCard);

/** The props of a registered tool renderer. */
export type ToolCardProps = AIToolRendererProps;

/** A tool call with no renderer of its own: name, input, output or error, and the confirmation while it waits. */
export function DefaultToolCard({
  toolName,
  part,
  message,
  context,
}: ToolCardProps): ReactElement {
  const { t } = useChatTranslation();
  return (
    <div
      className='my-1 space-y-2 rounded-md border bg-background/60 p-3 text-sm'
      data-chat-part='tool'
      data-tool-call={part.toolCallId}
    >
      <p className='font-medium'>{toolName}</p>
      {part.input !== undefined ? (
        <pre className='overflow-auto whitespace-pre-wrap text-xs'>
          {JSON.stringify(part.input, null, 2)}
        </pre>
      ) : null}
      {part.state === 'approval-requested' ? (
        <ConfirmationCard
          toolName={toolName}
          part={part}
          message={message}
          approval={context.approval}
        />
      ) : null}
      {part.state === 'output-available' ? (
        <pre className='overflow-auto whitespace-pre-wrap text-xs'>
          {JSON.stringify(part.output, null, 2)}
        </pre>
      ) : null}
      {part.state === 'output-denied' ? (
        <p>{t('chat.approval.denied')}</p>
      ) : null}
      {part.state === 'output-error' ? (
        <p role='alert'>{part.errorText}</p>
      ) : null}
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- wrapped once at load, so replacements follow it
export const ToolCard: ComponentType<ToolCardProps> = replaceable(
  'ToolCard',
  DefaultToolCard,
);
