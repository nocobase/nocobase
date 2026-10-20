import type {
  MailComposerCompletionCallback,
  MailComposerCompletionDetails,
  MailComposerProps,
} from '@nocobase/app-plugin-mail/client/components';

// Check the real public exports without starting a compiler inside a Vitest worker.
const activities: string[] = [];
const shorthand: MailComposerProps['onComplete'] = (result) =>
  activities.push(result);
const asyncValue: MailComposerCompletionCallback = async (result) => ({
  result,
});
const asyncVoid: MailComposerCompletionCallback = async (
  result,
  _rejected,
  _error,
  details,
) => {
  const snapshot: MailComposerCompletionDetails | undefined = details;
  if (snapshot && snapshot.kind !== 'draft') {
    activities.push(
      snapshot.input.accountId,
      snapshot.submissions[0]?.id ?? result,
    );
  }
};

void [shorthand, asyncValue, asyncVoid];
