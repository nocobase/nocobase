import {
  useChatPanel,
  useConversationList,
} from '@nocobase/app-plugin-agents/client/chat';
import { useTranslation } from '@nocobase/i18n/client';
import { STUDIO_NAMESPACE } from '../../shared/access.js';
import type { ReactElement } from 'react';
import { Button } from '../components/ui/button.js';
import { LoadError } from '../extensions/nocobase-agent-chat/chat-ui.js';
import { useStudioChat } from './chat-state.js';

export function SubmissionStatus({
  conversationId,
  editorKey,
}: {
  readonly conversationId: string | null;
  readonly editorKey: string;
}): ReactElement | null {
  const { submissions, editors } = useStudioChat();
  const panel = useChatPanel();
  const { t } = useTranslation(STUDIO_NAMESPACE);
  const history = useConversationList({});
  const records = submissions
    .snapshot()
    .filter(
      (record) =>
        (conversationId
          ? record.conversationId === conversationId
          : record.editorKey === editorKey) &&
        !['confirmed', 'rejected'].includes(record.status),
    );
  if (!records.length) return null;
  return (
    <div
      className='max-h-64 shrink-0 space-y-2 overflow-y-auto p-2'
      data-testid='chat-submissions'
    >
      {records.map((record) => (
        <div
          key={record.clientId}
          className='space-y-2 rounded-md border bg-accent/50 p-3 text-sm'
          role='status'
        >
          <p className='whitespace-pre-wrap break-words'>{record.content}</p>
          {record.context ? (
            <p
              className='text-xs text-muted-foreground break-words'
              data-testid='pending-context'
            >
              {[
                record.context.filter?.page,
                ...record.context.items.map(
                  (item) => `${item.kind}:${item.id}`,
                ),
                record.context.selection?.text,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
          {record.attachments.map((file) => (
            <span key={file.id} className='mr-2 text-xs'>
              {file.filename}
            </span>
          ))}
          <p>
            {t(
              record.status === 'unknown'
                ? 'globalChat.unknown'
                : record.status === 'creationUnknown'
                  ? 'globalChat.creationUnknown'
                  : record.status === 'notSubmitted'
                    ? 'globalChat.notSubmitted'
                    : 'globalChat.sending',
            )}
          </p>
          {record.status === 'notSubmitted' ? (
            <>
              <LoadError
                title={t('globalChat.notSubmitted')}
                error={record.error}
              />
              <Button
                variant='outline'
                size='sm'
                onClick={() => {
                  const rejected = submissions.editRejected(record.clientId);
                  if (rejected)
                    editors
                      .get(editorKey)
                      ?.restore(rejected.content, rejected.attachments);
                  panel.focusComposer();
                }}
              >
                {t('globalChat.editRejected')}
              </Button>
            </>
          ) : null}
          {record.status === 'unknown' ? (
            <>
              <p className='text-xs text-muted-foreground'>
                {t('globalChat.unknownHelp')}
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => void submissions.reconcile(record.clientId)}
              >
                {t('globalChat.check')}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={() => {
                  if (record.conversationId)
                    panel.selectConversation(record.conversationId);
                }}
              >
                {t('globalChat.viewConversation')}
              </Button>
            </>
          ) : null}
          {record.status === 'creationUnknown' ? (
            <>
              <p className='text-xs text-muted-foreground'>
                {t('globalChat.creationHelp')}
              </p>
              <Button
                variant='outline'
                size='sm'
                onClick={() => void history.refetch()}
              >
                {t('globalChat.refreshConversations')}
              </Button>
              {history.isError ? (
                <LoadError
                  title={t('globalChat.refreshConversations')}
                  error={history.error}
                  onRetry={() => void history.refetch()}
                />
              ) : null}
              {history.data?.pages
                .flatMap((page) => page.items)
                .map((item) => (
                  <Button
                    key={item.id}
                    variant='ghost'
                    size='sm'
                    className='max-w-full truncate'
                    onClick={() => {
                      if (!submissions.resumeCreation(record.clientId, item.id))
                        return;
                      const editor = editors.get(record.editorKey);
                      const key = `${record.editorKey.split(':')[0]}:${item.id}`;
                      if (editor && !editors.has(key)) editors.set(key, editor);
                      panel.selectConversation(item.id);
                    }}
                  >
                    {t('globalChat.chooseConversation', { title: item.title })}
                  </Button>
                ))}
              {history.hasNextPage ? (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => void history.fetchNextPage()}
                >
                  {t('globalChat.moreConversations')}
                </Button>
              ) : null}
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  submissions.resumeCreation(record.clientId, null)
                }
              >
                {t('globalChat.createAnother')}
              </Button>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
