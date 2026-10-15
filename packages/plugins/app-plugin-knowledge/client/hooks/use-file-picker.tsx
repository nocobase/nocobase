import { useCallback, useRef, useState, type ReactElement } from 'react';
import type { SpaceRef } from '../../shared/knowledge.js';

/**
 * A hidden file input to pick files with, and `open(parentId)` to show it: the files picked go to `onFiles` with the
 * parent it was opened for.
 */
export function useFilePicker(
  label: string,
  onFiles: (
    files: readonly File[],
    parentId: string | null,
    space?: SpaceRef,
  ) => void,
): {
  readonly open: (parentId: string | null, space?: SpaceRef) => void;
  readonly input: ReactElement;
} {
  const inputRef = useRef<HTMLInputElement>(null);
  const [parent, setParent] = useState<string | null>(null);
  const [space, setSpace] = useState<SpaceRef | undefined>();
  const open = useCallback((parentId: string | null, target?: SpaceRef) => {
    setParent(parentId);
    setSpace(target);
    inputRef.current?.click();
  }, []);
  const input = (
    <input
      ref={inputRef}
      type='file'
      multiple
      className='hidden'
      aria-label={label}
      onChange={(event) => {
        const files = Array.from(event.currentTarget.files ?? []);
        event.currentTarget.value = '';
        onFiles(files, parent, space);
      }}
    />
  );
  return { open, input };
}
