import { useTranslation } from '@nocobase/i18n/client';
import { useState, type ReactElement, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IssueMarkdown } from '../issues/markdown.js';
import { IssueRunTranscript } from './issue-runs.js';
import { RunNavigationContext } from './run-navigation.js';
import { runReturnFocus } from './run-focus.js';

/** Keep the conversation or task list mounted beneath a run, including when switching to a retry. */
export function EmbeddedRuns({
  children,
}: {
  readonly children: ReactNode;
}): ReactElement {
  const { t } = useTranslation();
  const [runId, setRunId] = useState<string | null>(null);
  return (
    <RunNavigationContext.Provider value={setRunId}>
      {children}
      <Dialog
        open={runId !== null}
        onOpenChange={(open) => {
          if (!open) setRunId(null);
        }}
      >
        <DialogContent
          className='flex max-h-[90dvh] flex-col sm:max-w-4xl'
          finalFocus={runReturnFocus}
        >
          <DialogHeader>
            <DialogTitle>{t('issuesPage.detail.runTranscript')}</DialogTitle>
          </DialogHeader>
          <div className='min-h-0 overflow-y-auto overscroll-y-contain'>
            {runId ? (
              <IssueRunTranscript
                key={runId}
                runId={runId}
                onOpenRun={setRunId}
                renderMarkdown={(text) => <IssueMarkdown content={text} />}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </RunNavigationContext.Provider>
  );
}
