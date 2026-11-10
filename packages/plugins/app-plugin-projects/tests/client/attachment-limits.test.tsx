import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import {
  api,
  clientMocks,
  publicConfig,
  resetApi,
  toasts,
} from './fake-client.js';
import { renderAt } from './render.js';
import type { IssueDetail } from '../../shared/issues.js';
vi.mock('@nocobase/app-client', () => clientMocks.appClient());
vi.mock('@nocobase/i18n/client', () => clientMocks.i18n());
const { useAttachmentUploads } =
  await import('../../client/hooks/use-attachment-uploads.js');
const { useIssuePageActions } =
  await import('../../client/pages/issues/detail/use-issue-page.js');
function Upload({ issue }: { issue: boolean }) {
  const uploads = useAttachmentUploads();
  const actions = useIssuePageActions({ id: 'i1' } as IssueDetail);
  return (
    <input
      type='file'
      aria-label='Upload'
      onChange={(event) => {
        void (issue ? actions.uploadFiles : uploads.add)([
          ...event.target.files!,
        ]);
      }}
    />
  );
}
afterEach(() => {
  cleanup();
  delete publicConfig['projects.attachments.maxFileSizeMb'];
});
describe.each([false, true])('attachment preflight (issue: %s)', (issue) => {
  it.each([20, 50])(
    'allows the exact %s MiB boundary and blocks one byte more',
    async (mb) => {
      resetApi({
        'POST projects/attachments': () => ({ data: { id: 'a1' } }),
        'POST projects/issues/i1/attachments': () => ({ data: { id: 'a1' } }),
      });
      if (mb === 50) publicConfig['projects.attachments.maxFileSizeMb'] = mb;
      renderAt('/', [{ path: '/', element: <Upload issue={issue} /> }]);
      const file = (bytes: number) => {
        const value = new File(['a'], 'limit.bin');
        Object.defineProperty(value, 'size', { value: bytes });
        return value;
      };
      fireEvent.change(screen.getByLabelText('Upload'), {
        target: { files: [file(mb * 1024 * 1024)] },
      });
      await waitFor(() =>
        expect(api.calls.filter((call) => call.method === 'POST')).toHaveLength(
          1,
        ),
      );
      fireEvent.change(screen.getByLabelText('Upload'), {
        target: { files: [file(mb * 1024 * 1024 + 1)] },
      });
      await waitFor(() => expect(toasts.at(-1)?.title).toContain(`size=${mb}`));
      expect(api.calls.filter((call) => call.method === 'POST')).toHaveLength(
        1,
      );
    },
  );
});
