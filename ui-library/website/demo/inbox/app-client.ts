import type * as AppClient from '@nocobase/app-client';

// The preview's stand-in for the application client, aliased in vite.config.ts: the inbox block asks it for the API
// client, which the demo's source never calls, and for the toaster, which writes to the console.
export class ApiClientError extends Error {
  public readonly status: number = 500;
}

// eslint-disable-next-line @eslint-react/no-unnecessary-use-prefix -- stands in for the hook of the same name
export const useApiClient: typeof AppClient.useApiClient = () =>
  ({}) as AppClient.ApiClient;

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
