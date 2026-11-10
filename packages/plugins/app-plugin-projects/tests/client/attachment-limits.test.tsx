import files from '@nocobase/app-plugin-file/client';
import { answerApi, renderWithApp } from '@nocobase/app-testing/client';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import projects from '../../client/plugin.js';
import { useAttachmentUploads } from '../../client/hooks/use-attachment-uploads.js';
import { useIssuePageActions } from '../../client/pages/issues/detail/use-issue-page.js';
import type { IssueDetail } from '../../shared/issues.js';

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

describe.each([false, true])('attachment preflight (issue: %s)', (issue) => {
  it.each([20, 50])(
    'allows the exact %s MiB boundary and blocks one byte more',
    async (mb) => {
      const calls: string[] = [];
      let metadataReads = 0;
      const view = await renderWithApp(<Upload issue={issue} />, {
        plugins: [files(), projects({ routes: false, realtime: false })],
        fetch: answerApi((call) => {
          if (call.path === 'file/uploadLimits') {
            metadataReads++;
            return {
              data: {
                default: 'large',
                disks: {
                  large: {
                    disk: 'large',
                    maxFileSizeMb: mb,
                    maxBytes: mb * 1024 * 1024,
                  },
                },
              },
            };
          }
          if (call.method === 'POST' && /attachments$/u.test(call.path)) {
            calls.push(call.path);
            return { data: { id: 'a1' } };
          }
          throw new Error(`Unexpected request: ${call.method} ${call.path}`);
        }),
      });
      const file = (bytes: number) => {
        const value = new File(['a'], 'limit.bin');
        Object.defineProperty(value, 'size', { value: bytes });
        return value;
      };
      fireEvent.change(screen.getByLabelText('Upload'), {
        target: { files: [file(mb * 1024 * 1024)] },
      });
      await waitFor(() =>
        expect(calls).toEqual([
          issue ? 'projects/issues/i1/attachments' : 'projects/attachments',
        ]),
      );
      fireEvent.change(screen.getByLabelText('Upload'), {
        target: { files: [file(mb * 1024 * 1024 + 1)] },
      });
      await waitFor(() =>
        expect(view.toasts().at(-1)?.title).toBe(
          `limit.bin is larger than ${mb} MB.`,
        ),
      );
      expect(calls).toHaveLength(1);
      expect(metadataReads).toBe(1);
    },
  );
});
