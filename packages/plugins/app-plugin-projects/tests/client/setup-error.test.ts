import { ApiClientError } from '@nocobase/app-client';
import { expect, it, vi } from 'vitest';
import { errorText, suggestionAction } from '../../client/hooks/use-notify.js';

function error(href: string) {
  return new ApiClientError('Missing model', {
    status: 400,
    reason: 'PROJECT_MANAGER_NOT_STARTED',
    method: 'POST',
    url: '/api/start',
    payload: {
      error: {
        localizedMessage: { locale: 'en-US', message: 'Enable a team Agent' },
        metadata: { reason: 'managerNotConfigured', suggestions: [{ href }] },
      },
    },
  });
}
const t = (key: string, options?: Record<string, unknown>) =>
  key === 'errors.PROJECT_MANAGER_NOT_STARTED.managerNotConfigured'
    ? 'Choose a model'
    : String(options?.defaultValue ?? key);
it('prefers a detailed translated reason', () => {
  expect(errorText(t, error('/agents/project-manager'), 'Failed')).toBe(
    'Choose a model',
  );
});
it('navigates a configuration suggestion through the host router', () => {
  const navigate = vi.fn();
  suggestionAction(
    error('/agents/project-manager'),
    t,
    navigate,
  ).action?.onClick();
  expect(navigate).toHaveBeenCalledWith('/agents/project-manager');
});
it.each(['https://other.test', '//other.test', '/\\other.test'])(
  'rejects an external suggestion %s',
  (href) => {
    expect(suggestionAction(error(href), t, vi.fn())).toEqual({});
  },
);

it('uses the host’s administrator guidance when there is no configuration action', () => {
  const failure = new ApiClientError('Missing model', {
    status: 400,
    reason: 'PROJECT_MANAGER_NOT_STARTED',
    method: 'POST',
    url: '/api/start',
    payload: {
      error: {
        metadata: {
          reason: 'managerNotConfigured',
          suggestions: [{ message: 'Ask an administrator' }],
        },
      },
    },
  });
  const translate = (key: string, options?: Record<string, unknown>) =>
    key.endsWith('.suggestion')
      ? 'Contact your administrator'
      : t(key, options);
  expect(errorText(translate, failure, 'Failed')).toBe(
    'Choose a model Contact your administrator',
  );
  expect(suggestionAction(failure, t, vi.fn())).toEqual({});
});

it.each(['denied', 'unavailable'])(
  'does not append setup advice to %s errors',
  (reason) => {
    const failure = new ApiClientError(
      'Contact the administrator for permission.',
      {
        status: 400,
        reason: 'PROJECT_MANAGER_NOT_STARTED',
        method: 'POST',
        url: '/api/start',
        payload: {
          error: {
            metadata: { reason, suggestions: [{ message: 'Administrator' }] },
          },
        },
      },
    );
    const translate = (key: string, options?: Record<string, unknown>) =>
      key.endsWith('.suggestion')
        ? 'Configure a model'
        : key.endsWith(`.${reason}`)
          ? 'Contact the administrator for permission.'
          : String(options?.defaultValue ?? key);
    expect(errorText(translate, failure, 'Failed')).toBe(
      'Contact the administrator for permission.',
    );
  },
);
