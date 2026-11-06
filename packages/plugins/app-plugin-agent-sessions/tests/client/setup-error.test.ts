import { ApiClientError } from '@nocobase/app-client';
import { expect, it, vi } from 'vitest';
import { errorText, suggestionAction } from '../../client/lib/errors.js';

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
it('prefers the localized message and navigates the setup action', () => {
  const failure = error('/agents');
  const navigate = vi.fn();
  expect(errorText(failure, 'Failed')).toBe('Enable a team Agent');
  suggestionAction(failure, 'Configure', navigate).action?.onClick();
  expect(navigate).toHaveBeenCalledWith('/agents');
});
it.each(['https://other.test', '//other.test', '/\\other.test'])(
  'rejects an external suggestion %s',
  (href) => {
    expect(suggestionAction(error(href), 'Configure', vi.fn())).toEqual({});
  },
);

it.each([
  new TypeError('Failed to fetch'),
  new ApiClientError('Internal Server Error', {
    status: 500,
    reason: 'INTERNAL_ERROR',
    method: 'POST',
    url: '/api/discover',
  }),
])(
  'keeps the localized fallback when no localized message is supplied (%s)',
  (failure) => {
    expect(errorText(failure, '无法加载智能体设置。')).toBe(
      '无法加载智能体设置。',
    );
  },
);

it('preserves localized discovery failures and their field detail', () => {
  const detail =
    'discovery.choices.4.options.1.description: Too big: expected string to have <=1000 characters';
  const localized = `无法加载智能体设置。 ${detail}`;
  const failure = new ApiClientError('Could not load agent settings.', {
    status: 400,
    reason: 'AGENT_SESSIONS_DISCOVERY_FAILED',
    method: 'POST',
    url: '/api/discover',
    payload: {
      error: { localizedMessage: { locale: 'zh-CN', message: localized } },
    },
  });
  expect(errorText(failure, '请求失败。')).toBe(localized);
});
