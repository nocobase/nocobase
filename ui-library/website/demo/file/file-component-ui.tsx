import { useEffect, useState, type ReactElement } from 'react';
import type {
  ClientFileRepository,
  FileRecord,
} from '@nocobase/app-plugin-file/client';
import { FileList } from '#extensions/nocobase-file-component-ui/components/file-list';
import { FileUploadField } from '#extensions/nocobase-file-component-ui/components/file-upload-field';
import { Button } from '#components/ui/button';

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

type Held = {
  readonly resolve: () => void;
  readonly reject: (error: Error) => void;
};
// Uploads wait for the demo's own buttons, so a slow, failed or cancelled
// upload can be tried without a timer pretending to make progress.
const held = new Set<Held>();
const holders = new Set<() => void>();
const notify = (): void => holders.forEach((listener) => listener());

// A static preview implements only the repository operations the upload field calls.
const repository: Pick<ClientFileRepository, 'uploadOne' | 'deleteOne'> = {
  uploadOne: async ({ file: selected }, options) => {
    await new Promise<void>((resolve, reject) => {
      const entry: Held = {
        resolve: () => {
          held.delete(entry);
          notify();
          resolve();
        },
        reject: (error) => {
          held.delete(entry);
          notify();
          reject(error);
        },
      };
      held.add(entry);
      notify();
      options?.signal?.addEventListener('abort', () =>
        entry.reject(new DOMException('Cancelled', 'AbortError')),
      );
    });
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

function useHeldCount(): number {
  const [count, setCount] = useState(held.size);
  useEffect(() => {
    const listener = (): void => setCount(held.size);
    holders.add(listener);
    return () => {
      holders.delete(listener);
    };
  }, []);
  return count;
}

export function FileComponentUiDemo(): ReactElement {
  const [files, setFiles] = useState<readonly FileRecord[]>([initial]);
  const waiting = useHeldCount();
  return (
    <div className='mx-auto max-w-3xl space-y-6 p-6'>
      <div className='flex flex-wrap gap-2'>
        <Button
          variant='outline'
          disabled={!waiting}
          onClick={() => [...held].forEach((entry) => entry.resolve())}
        >
          Finish uploads
        </Button>
        <Button
          variant='outline'
          disabled={!waiting}
          onClick={() =>
            [...held].forEach((entry) =>
              entry.reject(new Error('The storage service did not respond.')),
            )
          }
        >
          Fail uploads
        </Button>
      </div>
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
