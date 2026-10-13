/**
 * Choosing a folder on one of the viewer's computers without typing its path: the computer's bridge lists the folders
 * in a directory, and the person opens them one by one, never above the directories `within` allows.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import {
  ArrowUpIcon,
  ChevronRightIcon,
  FolderIcon,
  FolderOpenIcon,
} from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Skeleton } from './ui/skeleton.js';

import type { Computer } from '../../shared/api.js';
import { useFolders } from '../api.js';
import { errorText } from '../lib/errors.js';
import { displayPath, isWithin, joinPath, parentOf } from '../lib/paths.js';

export function FolderBrowser({
  computer,
  start,
  within,
  title,
  onPick,
  onClose,
}: {
  readonly computer: Computer;
  /** Where to open; the first of `within` by default. */
  readonly start?: string | undefined;
  /** The directories the person may choose in. */
  readonly within: readonly string[];
  readonly title: string;
  readonly onPick: (folder: string) => void;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [dir, setDir] = useState(() =>
    start && isWithin(within, start) ? start : within[0],
  );
  const listing = useFolders(computer.id, dir);
  const current = listing.data?.path ?? dir;
  const parent = current ? parentOf(current) : undefined;
  const canGoUp = parent !== undefined && isWithin(within, parent);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className='flex max-h-[85vh] flex-col gap-3 sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='text-base'>{title}</DialogTitle>
          <DialogDescription className='text-xs'>
            {t('folders.hint', { computer: computer.name })}
          </DialogDescription>
        </DialogHeader>
        {within.length > 1 && (
          <div className='flex flex-wrap gap-1.5'>
            {within.map((root) => (
              <button
                key={root}
                type='button'
                onClick={() => setDir(root)}
                className={cn(
                  'inline-flex h-7.5 max-w-full items-center rounded-full border px-2.5 font-mono text-[11px]',
                  current && isWithin([root], current)
                    ? 'bg-accent text-accent-foreground border-transparent'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <span className='truncate'>
                  {displayPath(root, computer.home)}
                </span>
              </button>
            ))}
          </div>
        )}
        <div className='bg-muted flex min-w-0 items-center gap-2 rounded-md px-2.5 py-2'>
          <FolderOpenIcon className='text-muted-foreground size-4 shrink-0' />
          <code className='min-w-0 flex-1 truncate text-xs'>
            {current ? displayPath(current, computer.home) : '…'}
          </code>
          <button
            type='button'
            disabled={!canGoUp}
            onClick={() => parent && setDir(parent)}
            className='text-muted-foreground hover:bg-background hover:text-foreground inline-flex h-7 shrink-0 items-center gap-1 rounded px-2 text-xs disabled:opacity-40'
          >
            <ArrowUpIcon className='size-3.5' />
            {t('folders.up')}
          </button>
        </div>
        <div className='-mx-1 min-h-48 flex-1 overflow-y-auto'>
          {listing.isPending ? (
            <div className='flex flex-col gap-1.5 px-1'>
              {[0, 1, 2, 3].map((row) => (
                <Skeleton key={row} className='h-8' />
              ))}
            </div>
          ) : listing.isError ? (
            <p className='text-destructive px-2 py-3 text-[13px]'>
              {errorText(listing.error, t('folders.failed'))}
            </p>
          ) : listing.data.folders.length === 0 ? (
            <p className='text-muted-foreground px-2 py-3 text-[13px]'>
              {t('folders.empty')}
            </p>
          ) : (
            <ul className='px-1'>
              {listing.data.folders.map((name) => (
                <li key={name}>
                  <button
                    type='button'
                    onClick={() => setDir(joinPath(listing.data.path, name))}
                    className='hover:bg-muted flex w-full min-w-0 items-center gap-2.5 rounded-md px-2 py-2 text-left text-[13px]'
                  >
                    <FolderIcon className='text-muted-foreground size-4 shrink-0' />
                    <span className='min-w-0 flex-1 truncate'>{name}</span>
                    <ChevronRightIcon className='text-muted-foreground size-4 shrink-0' />
                  </button>
                </li>
              ))}
              {listing.data.truncated && (
                <li className='text-muted-foreground px-2 py-2 text-xs'>
                  {t('folders.truncated')}
                </li>
              )}
            </ul>
          )}
        </div>
        <DialogFooter className='gap-2'>
          <Button variant='outline' className='font-normal' onClick={onClose}>
            {t('actions.cancel')}
          </Button>
          <Button
            disabled={!listing.data}
            onClick={() => listing.data && onPick(listing.data.path)}
          >
            {t('folders.choose')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
