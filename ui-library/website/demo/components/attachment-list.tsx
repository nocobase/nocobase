import { useState, type ReactElement } from 'react';

import {
  AttachmentPanel,
  PendingAttachments,
  type AttachmentFile,
} from '@/components/attachment-list';

const IMAGE =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" fill="%2393c5fd"/></svg>';

const FILES: readonly AttachmentFile[] = [
  {
    id: 'f1',
    name: 'wireframe.png',
    size: 48_200,
    url: IMAGE,
    downloadUrl: IMAGE,
    image: true,
    canRemove: true,
  },
  {
    id: 'f2',
    name: 'requirements.pdf',
    size: 1_250_000,
    url: '#',
    downloadUrl: '#',
    image: false,
    canRemove: true,
  },
];

export function AttachmentListDemo(): ReactElement {
  const [files, setFiles] = useState(FILES);
  return (
    <div className='max-w-2xl space-y-6 p-6'>
      <AttachmentPanel
        files={files}
        hint='Drop or paste files here, up to 20 MB each'
        onUpload={() => undefined}
        onRemove={(file) => {
          setFiles((current) => current.filter((item) => item.id !== file.id));
          return Promise.resolve();
        }}
      />
      <AttachmentPanel files={[]} onUpload={() => undefined} />
      <PendingAttachments
        files={[
          {
            key: 'p1',
            name: 'screenshot.png',
            size: 82_000,
            done: true,
            thumbnailUrl: IMAGE,
          },
          { key: 'p2', name: 'log.txt', size: 4_000, done: false },
        ]}
        onRemove={() => undefined}
      />
    </div>
  );
}
