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

it('preserves an unlocalized discovery error and its field detail', () => {
  const detail =
    'discovery.choices.4.options.1.description: Too big: expected string to have <=1000 characters';
  expect(errorText(new Error(detail), 'Failed')).toBe(detail);
  expect(
    errorText(
      new ApiClientError(detail, {
        status: 400,
        reason: 'AGENT_SESSIONS_DISCOVERY_FAILED',
        method: 'POST',
        url: '/api/discover',
      }),
      'Failed',
    ),
  ).toBe(detail);
});
