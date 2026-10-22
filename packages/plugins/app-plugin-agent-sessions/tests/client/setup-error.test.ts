import { ApiClientError } from '@nocobase/app-client';
import { expect, it, vi } from 'vitest';
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
import { errorText, suggestionAction } from '../../client/lib/errors.js';
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
