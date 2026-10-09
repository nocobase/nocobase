import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  createLifecycleHook,
  type UseLifecycleResult,
  type UseRecordLifecycle,
} from '@nocobase/lifecycle/react';

import { LIFECYCLE_ROUTES } from '../../shared/routes.js';
import {
  errorMessage,
  type LifecycleName,
  type RecordDetail,
  type Translate,
} from './api.js';
import { NAMESPACE } from './format.js';

/**
 * The library's record hook, configured once for this plugin's routes. The
 * application's API client is the transport; the library needs nothing else
 * from it.
 */
export const useExampleLifecycle: UseRecordLifecycle = createLifecycleHook({
  useTransport: useApiClient,
  basePath: LIFECYCLE_ROUTES,
});

/** The page's locale as `errorMessage()` reads it. */
export function useTranslate(): Translate {
  const { t } = useTranslation(NAMESPACE);
  return (key, fallback) => t(key, { defaultValue: fallback });
}

export interface ExampleRecord {
  /** The record, what the actor may do, its history and its lifecycle's description. */
  readonly detail: RecordDetail | undefined;
  /** The last load's failure, in the page's language. */
  readonly error: string;
  readonly lifecycle: UseLifecycleResult;
}

/**
 * One record of the example's lifecycles, as the person the page acts as
 * sees it: the hook's view and description merged for the record panel, and
 * its load error translated.
 */
export function useExampleRecord(
  name: LifecycleName,
  id: string | undefined,
  actor: string,
): ExampleRecord {
  const translate = useTranslate();
  const lifecycle = useExampleLifecycle(name, id, { actAs: actor });
  const { view, description } = lifecycle;
  return {
    detail: view && description ? { ...view, ...description } : undefined,
    error: lifecycle.error ? errorMessage(lifecycle.error, translate) : '',
    lifecycle,
  };
}
