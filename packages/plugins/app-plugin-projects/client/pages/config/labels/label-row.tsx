import { useTranslation } from '@nocobase/i18n/client';
import {
  CheckIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
  XIcon,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';

import type { Color } from '../../../../shared/common.js';
import { LABEL_NAME_MAX, type Label } from '../../../../shared/labels.js';
import { PmColorSwatches, PmLabelDot } from '../../../components/pm-labels.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/alert-dialog.js';
import { Button } from '../../../components/ui/button.js';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu.js';
import { Input } from '../../../components/ui/input.js';
import { TableCell, TableRow } from '../../../components/ui/table.js';

/** One label in the settings table: inline rename, colour swatches, and delete behind a confirmation. */
export function LabelRow({
  label,
  canEdit,
  busy,
  onRename,
  onRecolor,
  onDelete,
}: {
  readonly label: Label;
  readonly canEdit: boolean;
  readonly busy: boolean;
  readonly onRename: (name: string) => void;
  readonly onRecolor: (color: Color) => void;
  readonly onDelete: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(label.name);
  const [confirming, setConfirming] = useState(false);

  const cancel = (): void => {
    setName(label.name);
    setEditing(false);
  };
  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed && trimmed !== label.name) onRename(trimmed);
    setEditing(false);
  };

  return (
    <TableRow>
      <TableCell className='min-w-48'>
        {editing ? (
          <form onSubmit={submit} className='flex items-center gap-1'>
            <Input
              value={name}
              maxLength={LABEL_NAME_MAX}
              autoFocus
              aria-label={t('config.labels.renameLabel', { name: label.name })}
              className='h-8 w-48'
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') cancel();
              }}
            />
            <Button
              type='submit'
              variant='ghost'
              size='icon-sm'
              aria-label={t('actions.save')}
            >
              <CheckIcon />
            </Button>
            <Button
              type='button'
              variant='ghost'
              size='icon-sm'
              aria-label={t('actions.cancel')}
              onClick={cancel}
            >
              <XIcon />
            </Button>
          </form>
        ) : (
          <span className='inline-flex items-center gap-2 font-medium'>
            <PmLabelDot color={label.color} />
            {label.name}
          </span>
        )}
      </TableCell>
      <TableCell>
        {canEdit ? (
          <PmColorSwatches
            value={label.color}
            label={t('labelColors.for', { name: label.name })}
            disabled={busy}
            onChange={onRecolor}
          />
        ) : (
          <span className='text-sm text-muted-foreground'>
            {t(`colors.${label.color}`)}
          </span>
        )}
      </TableCell>
      {canEdit ? (
        <TableCell>
          <div className='flex justify-end'>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon-sm'
                    disabled={busy}
                    aria-label={t('config.labels.actionsFor', {
                      name: label.name,
                    })}
                  />
                }
              >
                <MoreHorizontalIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto min-w-40'>
                <DropdownMenuItem
                  onClick={() => {
                    setName(label.name);
                    setEditing(true);
                  }}
                >
                  <PencilIcon />
                  {t('config.labels.rename')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onClick={() => setConfirming(true)}
                >
                  <Trash2Icon />
                  {t('config.labels.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <AlertDialog open={confirming} onOpenChange={setConfirming}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('config.labels.deleteTitle', { name: label.name })}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {t('config.labels.deleteDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  variant='destructive'
                  onClick={() => {
                    setConfirming(false);
                    onDelete();
                  }}
                >
                  {t('config.labels.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TableCell>
      ) : null}
    </TableRow>
  );
}
