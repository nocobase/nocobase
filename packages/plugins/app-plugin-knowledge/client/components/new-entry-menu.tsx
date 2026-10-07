/** The items of the "New" menus: write and upload, or propose a file, by what the viewer may do. */
import { useTranslation } from '@nocobase/i18n/client';
import {
  FilePlusIcon,
  FileUpIcon,
  FolderPlusIcon,
  UploadIcon,
} from 'lucide-react';
import type { ReactElement } from 'react';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from './ui/dropdown-menu.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { EntryActions } from '../lib/entry-actions.js';

export function NewEntryMenuContent({
  actions,
  parentId = null,
  align = 'end',
}: {
  readonly actions: EntryActions;
  readonly parentId?: string | null;
  readonly align?: 'start' | 'end';
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <DropdownMenuContent align={align} className='w-52'>
      {actions.access.edit ? (
        <>
          <DropdownMenuItem
            onClick={() => actions.newEntry('article', parentId)}
          >
            <FilePlusIcon />
            {t('knowledge.new.article')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => actions.newEntry('folder', parentId)}
          >
            <FolderPlusIcon />
            {t('knowledge.new.folder')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => actions.upload(parentId)}>
            <UploadIcon />
            {t('knowledge.files.upload')}
          </DropdownMenuItem>
        </>
      ) : (
        <DropdownMenuItem onClick={() => actions.proposeFile()}>
          <FileUpIcon />
          {t('knowledge.files.proposeNew')}
        </DropdownMenuItem>
      )}
    </DropdownMenuContent>
  );
}
