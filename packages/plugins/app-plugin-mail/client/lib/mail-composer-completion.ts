import type { MailComposerProps } from '../contracts/composer.js';

function logCompletionFailure(): void {
  // Integration errors may contain message content; never log the error object.
  console.error(
    'Mail completion callback failed. Handle integration errors in onComplete or onCompletionError.',
  );
}

export function reportComposerCompletionError(
  handler: MailComposerProps['onCompletionError'],
  error: unknown,
): void {
  if (!handler) {
    logCompletionFailure();
    return;
  }
  try {
    void Promise.resolve(handler(error)).catch(logCompletionFailure);
  } catch {
    logCompletionFailure();
  }
}

/** Notify once without awaiting application work or letting it enter the send error boundary. */
export function notifyComposerCompletion(
  callback: MailComposerProps['onComplete'],
  handler: MailComposerProps['onCompletionError'],
  ...args: Parameters<MailComposerProps['onComplete']>
): void {
  try {
    void Promise.resolve(callback(...args)).catch((error: unknown) => {
      reportComposerCompletionError(handler, error);
    });
  } catch (error) {
    reportComposerCompletionError(handler, error);
  }
}
