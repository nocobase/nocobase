import { ApiClientError } from '@nocobase/app-client';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { expect, it } from 'vitest';

import { errorText } from '../../client/hooks/use-notify.js';
import locales from '../../client/locales/index.js';
import { ACCESS_NAMESPACE } from '../../shared/access.js';

it.each([
  ['en-US', 'The relationship changed. Reload and retry.'],
  ['zh-CN', '任务关联已发生变化，请刷新后重试。'],
])(
  'translates a stale relationship conflict in %s',
  async (locale, expected) => {
    const runtime = await createTestI18nRuntime({
      locale,
      namespaces: { [ACCESS_NAMESPACE]: locales },
    });
    const error = new ApiClientError(
      'The relationship was changed meanwhile. Reload and retry.',
      {
        status: 409,
        reason: 'DEPENDENCY_CHANGED',
        method: 'PATCH',
        url: '/api/projects/issues/PM-1/dependencies/link',
      },
    );
    expect(
      errorText(runtime.getFixedT(ACCESS_NAMESPACE), error, 'Request failed'),
    ).toBe(expected);
  },
);
