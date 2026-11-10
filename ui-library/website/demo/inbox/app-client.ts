export { apiClientToken } from '../../../../packages/app/app-client/src/application.js';
export { ClientApplicationContext } from '../../../../packages/app/app-client/src/application-context.js';
export { useSubmission } from '../../../../packages/app/app-client/src/submission.js';
export { usePendingFeedback } from '../../../../packages/app/app-client/src/pending-feedback.js';
export { resolveListState } from '../../../../packages/app/app-client/src/list-state.js';
import type * as AppClient from '@nocobase/app-client';
import { removeDemoLink } from '../agents/agents-chat-client.js';

// The preview's stand-in for the application client, aliased in vite.config.ts: the inbox block asks it for the API
// client, which the demo's source never calls, and for the toaster, which writes to the console.
export class ApiClientError extends Error {
  public readonly status: number = 500;
}

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- stands in for the hook of the same name
export const useApiClient: typeof AppClient.useApiClient = () =>
  ({
    // The linked chat panel's unlink is the one request a demo makes; it changes the sample conversation in memory.
    request: async ({ path, method }: { path: string; method?: string }) => {
      const unlink = /conversations\/([^/]+)\/links\/([^/]+)$/u.exec(path);
      if (method === 'DELETE' && unlink)
        removeDemoLink(
          decodeURIComponent(unlink[1]),
          decodeURIComponent(unlink[2]),
        );
      return { data: null };
    },
  }) as unknown as AppClient.ApiClient;

const toaster: AppClient.Toaster = {
  show(options) {
    console.info('[toast]', options.title);
    return 'toast';
  },
  close() {
    // Nothing to close.
  },
};

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- stands in for the hook of the same name
export const useToaster: typeof AppClient.useToaster = () => toaster;

// Reuse the real browser capability boundary; only application services are mocked.
export { copyText } from '../../../../packages/app/app-client/src/copy-text.js';

// Form feedback is a real browser controller; only application services are mocked above.
export {
  FormFeedback,
  formFeedbackErrors,
} from '../../../../packages/app/app-client/src/form-feedback.js';

export { getAvatarInitials } from '../../../../packages/app/app-client/src/avatar-initials.js';

// Registry demos run at their own website routes rather than an application's configured base path.
export const resolveAppUrl: typeof AppClient.resolveAppUrl = (href) =>
  href ?? '/';
