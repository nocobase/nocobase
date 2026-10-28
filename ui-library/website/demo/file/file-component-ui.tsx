import { useState, type ReactElement } from 'react';
import type {
  ClientFileRepository,
  FileRecord,
} from '@nocobase/app-plugin-file/client';
import { FileList } from '#extensions/nocobase-file-component-ui/components/file-list';
import { FileUploadField } from '#extensions/nocobase-file-component-ui/components/file-upload-field';

const initial: FileRecord = {
  id: 'example',
  filename: 'release-notes.txt',
  mimeType: 'text/plain',
  ext: 'txt',
  size: 42,
  disk: 'demo',
  key: 'release-notes.txt',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
  contentUrl: new URL('./release-notes.txt?no-inline', import.meta.url).href,
};

// A static preview implements only the repository operations the upload field calls.
const repository: Pick<ClientFileRepository, 'uploadOne' | 'deleteOne'> = {
  uploadOne: async ({ file: selected }) => {
    return {
      createdTargets: [],
      record: {
        ...initial,
        id: selected.name,
        filename: selected.name,
        mimeType: selected.type,
        size: selected.size,
      },
    };
  },
  deleteOne: async () => ({ deleted: true }),
};

export function FileComponentUiDemo(): ReactElement {
  const [files, setFiles] = useState<readonly FileRecord[]>([initial]);
  return (
    <div className='mx-auto max-w-3xl space-y-6 p-6'>
      <FileUploadField
        repository={repository}
        value={files}
        onChange={setFiles}
        multiple
      />
      <FileList
        files={files}
        onRemove={(file) =>
          setFiles(files.filter((item) => item.id !== file.id))
        }
      />
    </div>
  );
}
