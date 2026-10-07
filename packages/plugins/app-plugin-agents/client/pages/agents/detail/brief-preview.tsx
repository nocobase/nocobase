/**
 * "Preview full prompt": what a run of this agent would be sent now, rendered by the same code the claim uses on a
 * made-up subject, without queueing anything. A switch picks the scenario among the subject kinds that offer a sample
 * (the vocabulary's `preview`), the application's first by default (for example, a task, or a conversation); the made-up values
 * are marked `[sample]`. It shows the system prompt in one, with the agent's own part marked at its end, and the first
 * message.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';

import { agentsKeys } from '../../../api/keys.js';
import { BriefView } from '../../../components/brief-view.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/dialog.js';
import { Spinner } from '../../../components/ui/spinner.js';
import { Tabs, TabsList, TabsTrigger } from '../../../components/ui/tabs.js';
import { useAgentsApi } from '../../../hooks/use-agents-api.js';
import { errorText } from '../../../hooks/use-notify.js';
import { usePreviewSubjects, useText } from '../../../hooks/use-vocabulary.js';

export function BriefPreviewDialog({
  agentId,
  open,
  onClose,
}: {
  readonly agentId: string;
  readonly open: boolean;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = useAgentsApi();
  const text = useText();
  const scenarios = usePreviewSubjects();
  const [chosen, setChosen] = useState<string | null>(null);
  const scenario =
    scenarios.find((item) => item.kind === chosen)?.kind ??
    scenarios[0]?.kind ??
    null;
  const preview = useQuery({
    queryKey: agentsKeys.briefPreview(agentId, scenario),
    queryFn: () => api.briefPreview(agentId, scenario),
    enabled: open,
    retry: false,
    staleTime: 0,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-4xl'>
        <DialogHeader>
          <DialogTitle>{t('brief.previewTitle')}</DialogTitle>
          <DialogDescription>{t('brief.previewDescription')}</DialogDescription>
        </DialogHeader>
        {scenarios.length > 1 && scenario ? (
          <Tabs
            value={scenario}
            onValueChange={(next) => setChosen(String(next))}
          >
            <TabsList aria-label={t('brief.scenario')}>
              {scenarios.map((item) => (
                <TabsTrigger key={item.kind} value={item.kind}>
                  {text(item.title, item.kind)}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        ) : null}
        <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4'>
          {preview.isError ? (
            <p className='text-sm text-destructive'>
              {errorText(t, preview.error, t('brief.previewFailed'))}
            </p>
          ) : !preview.data ? (
            <div className='flex justify-center py-6'>
              <Spinner />
            </div>
          ) : (
            <div className='flex flex-col gap-3'>
              <p className='text-sm text-muted-foreground'>
                {t('brief.sample', {
                  subject: `${preview.data.subject.key}${preview.data.subject.title ? ` ${preview.data.subject.title}` : ''}`,
                })}
              </p>
              <BriefView brief={preview.data} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
