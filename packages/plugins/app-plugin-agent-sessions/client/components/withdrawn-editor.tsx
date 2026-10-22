import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';

import {
  imagePath,
  type PromptContent,
  type Session,
} from '../../shared/api.js';
import type { TranscriptItem } from '../transcript.js';
import { usePrompt, type Mention } from '../api.js';
import { useSubmission } from '../use-submission.js';
import { errorText } from '../lib/errors.js';
import { Composer } from './composer.js';
import { SubmissionNotice } from './submission-notice.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog.js';

/** A separate composer instance never reads or writes the session's current draft. */
export function WithdrawnEditor({
  item,
  session,
  draftKey,
  close,
}: {
  readonly item: Extract<TranscriptItem, { type: 'prompt' }>;
  readonly session: Session;
  readonly draftKey: string;
  readonly close: () => void;
}): ReactElement {
  const api = useApiClient();
  const { t } = useTranslation();
  const toaster = useToaster();
  const prompt = usePrompt(session.id);
  const submission = useSubmission<{
    content: PromptContent[];
    mentions: Mention[];
  }>(draftKey, draftKey, (input) => prompt.mutateAsync(input));
  const content = useQuery({
    queryKey: ['agentSessions', 'reedit', draftKey],
    retry: false,
    queryFn: async ({ signal }): Promise<PromptContent[]> => [
      ...(item.text ? [{ type: 'text' as const, text: item.text }] : []),
      ...(await Promise.all(
        item.images.map(async (image): Promise<PromptContent> => {
          if (image.data)
            return {
              type: 'image',
              mimeType: image.mimeType,
              data: image.data,
            };
          // Re-read through the owner's API client: removed or inaccessible files fail the whole edit visibly.
          const stream = await api.stream({
            // The API client already supplies /api; imagePath also serves browser image URLs.
            path: imagePath(session.id, image.file!).replace(/^\/api\//u, ''),
            signal,
          });
          const blob = await new Response(stream).blob();
          const data = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () =>
              typeof reader.result === 'string'
                ? resolve(reader.result.split(',')[1])
                : reject(new Error('Could not read image data.'));
            reader.onerror = () =>
              reject(reader.error ?? new Error('Could not read image data.'));
            reader.readAsDataURL(blob);
          });
          return { type: 'image', mimeType: image.mimeType, data };
        }),
      )),
    ],
  });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('transcript.prompt.edit')}</DialogTitle>
          <DialogDescription>
            {t('transcript.prompt.editBody')}
          </DialogDescription>
        </DialogHeader>
        {content.isError ? (
          <div role='alert'>
            <p>{t('transcript.prompt.attachmentError')}</p>
            <Button variant='outline' onClick={() => void content.refetch()}>
              {t('transcript.prompt.retry')}
            </Button>
          </div>
        ) : content.data ? (
          <>
            <SubmissionNotice
              pending={submission.pending}
              sending={prompt.isPending}
              retry={submission.retry}
              edit={submission.edit}
            />
            <Composer
              placeholder={t('composer.placeholder')}
              initialContent={content.data}
              draftKey={draftKey}
              disabled={submission.pending}
              sendDisabled={!session.computerOnline}
              sending={prompt.isPending}
              mentions={{ projectId: session.project?.id ?? null }}
              onSend={async (parts, _interrupt, mentions) => {
                try {
                  await submission.send({ content: parts, mentions });
                  close();
                } catch (error) {
                  void toaster.show({
                    type: 'error',
                    title: errorText(error, t('errors.generic')),
                  });
                  throw error;
                }
              }}
            />
          </>
        ) : (
          <p role='status'>{t('transcript.prompt.loading')}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
