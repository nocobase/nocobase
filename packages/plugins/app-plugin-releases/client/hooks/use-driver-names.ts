/** The drivers environments run on, and how to name one in the reader's language. */
import { useTranslation } from '@nocobase/i18n/client';
import { useMemo } from 'react';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { DriverSummary } from '../../shared/releases.js';
import { useDriverForms } from './use-driver-forms.js';
import { useLoad, useReleasesApi, type Loaded } from './use-releases.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface DriverNames {
  readonly drivers: Loaded<readonly DriverSummary[]>;
  /** A driver's title, or what an environment's settings come down to (its run mode) when given them. */
  readonly driverName: (
    kind: string,
    config?: Readonly<Record<string, unknown>>,
  ) => string;
  /** Translates in this plugin's namespace and every driver's. */
  readonly t: Translate;
}

/** The drivers, and how to name one: driver titles live in each driver's namespace. */
export function useDriverNames(): DriverNames {
  const api = useReleasesApi();
  const forms = useDriverForms();
  const drivers = useLoad(
    () => api.list<DriverSummary>('drivers').then((page) => page.items),
    'drivers',
  );
  // The forms' namespace when registered, else the server's title key.
  const namespaceKey = [
    ACCESS_NAMESPACE,
    ...(drivers.data ?? []).map(
      (item) => forms.get(item.kind)?.ns ?? item.title.ns,
    ),
  ].join('\n');
  const namespaces = useMemo(
    () => [...new Set(namespaceKey.split('\n'))],
    [namespaceKey],
  );
  const { t } = useTranslation(namespaces);
  const driverName = (
    kind: string,
    config?: Readonly<Record<string, unknown>>,
  ): string => {
    const form = forms.get(kind);
    const summary = config ? form?.summary?.(config) : null;
    if (form && summary) return t(summary, { ns: form.ns });
    if (form) return t(form.title, { ns: form.ns, defaultValue: kind });
    const driver = drivers.data?.find((item) => item.kind === kind);
    return driver
      ? t(driver.title.key, { ns: driver.title.ns, defaultValue: kind })
      : kind;
  };
  return { drivers, driverName, t };
}
