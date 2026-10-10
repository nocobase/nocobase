import {
  createApiClient,
  resolveAppUrl,
  type ApiClient,
} from '@nocobase/app-client';

let workflowClient: ApiClient | undefined;

export function configureWorkflowClient(api: ApiClient): ApiClient {
  workflowClient = api;
  return api;
}

export function getWorkflowClient(): ApiClient {
  workflowClient ??= createApiClient({ baseURL: resolveAppUrl('/api') });
  return workflowClient;
}
