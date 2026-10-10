import { I18nRuntime, type Locale, type LocalesModule } from '@nocobase/i18n';

import { WORKFLOW_NS } from '../shared/namespace.js';

export async function createWorkflowI18nRuntime(
  module: LocalesModule,
  locale: Locale = 'en-US',
): Promise<I18nRuntime> {
  const runtime = new I18nRuntime({
    defaultLocale: 'en-US',
    locales: ['en-US', 'zh-CN'],
    applicationNamespace: '@nocobase/app-plugin-dag-flow-test-app',
  });
  runtime.registerNamespace(WORKFLOW_NS, module);
  await runtime.init(locale);
  return runtime;
}
