import type { I18nRuntime } from '@nocobase/i18n';
import {
  TestI18nProvider,
  createTestI18nRuntime,
  type CreateTestI18nRuntimeOptions,
} from '@nocobase/i18n/testing';
import type { ComponentType, ReactNode } from 'react';

import type { Translate } from '../../client/i18n.js';
import locales from '../../client/locales/index.js';
import { AUTHORIZATION_NAMESPACE } from '../../shared.js';

/**
 * A real runtime with this plugin's shipped catalogues registered under its own
 * namespace, plus any other namespace a test renders.
 */
export function createAuthorizationI18n(
  options: CreateTestI18nRuntimeOptions = {},
): Promise<I18nRuntime> {
  return createTestI18nRuntime({
    ...options,
    namespaces: { [AUTHORIZATION_NAMESPACE]: locales, ...options.namespaces },
  });
}

/**
 * A `render` wrapper mounting `runtime` the way an application does, scoped to
 * `namespace` for a page rendered under that package's routes.
 */
export function i18nWrapper(
  runtime: I18nRuntime,
  namespace?: string,
): ComponentType<{ readonly children: ReactNode }> {
  return function I18n({ children }) {
    return (
      <TestI18nProvider runtime={runtime} namespace={namespace}>
        {children}
      </TestI18nProvider>
    );
  };
}

const runtime = await createAuthorizationI18n();

/** This plugin's English translator, for helpers that take a `t` outside React. */
const english = runtime.getFixedT(AUTHORIZATION_NAMESPACE);
export const translate: Translate = (key, options) =>
  english(key, options as Parameters<typeof english>[1]);
