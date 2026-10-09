import { Check, Plus, Tag, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import {
  mailErrorMessage,
  type MailLabel,
  type MailLabelColor,
} from '../mail-client.js';
import { useMailClient } from '../runtime.js';
import { MAIL_PLUGIN_NS } from '../namespace.js';
import { MAIL_LABEL_COLORS, mailLabelColorSwatch } from '../lib/mail-label.js';
import { MailLabelTag } from './mail-label-tag.js';
import { MailManagementFormActions } from './mail-management-form-actions.js';
import { MailManagementListItem } from './mail-management-list-item.js';
import { cn } from '../lib/utils.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Card } from './ui/card.js';
import { Input } from './ui/input.js';

const DEFAULT_LABEL_COLOR: MailLabelColor = 'blue';
const DEFAULT_COLOR_NAMES: Readonly<Record<MailLabelColor, string>> = {
  slate: 'Slate',
  red: 'Red',
  orange: 'Orange',
  amber: 'Amber',
  green: 'Green',
  sky: 'Sky',
  blue: 'Blue',
  violet: 'Violet',
  pink: 'Pink',
};

interface LabelDraft {
  readonly name: string;
  readonly color: MailLabelColor;
}

export function MailLabelManager(): ReactElement {
  const mail = useMailClient();
  const { t } = useTranslation(MAIL_PLUGIN_NS);
  const [labels, setLabels] = useState<readonly MailLabel[]>([]);
  const [draft, setDraft] = useState<LabelDraft>(() => emptyDraft());
  const [editingId, setEditingId] = useState<string>();
  const [labelToDelete, setLabelToDelete] = useState<MailLabel>();
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const showError = useCallback(
    (cause: unknown): void =>
      setError(
        mailErrorMessage(
          cause,
          t('errors.requestFailed', { defaultValue: 'Mail request failed.' }),
        ),
      ),
    [t],
  );

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(undefined);
    void mail
      .listLabels()
      .then((nextLabels) => setLabels([...nextLabels].sort(compareLabels)))
      .catch(showError)
      .finally(() => setLoading(false));
  }, [mail, showError]);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  const resetDraft = (): void => {
    setEditingId(undefined);
    setDraft(emptyDraft());
    setError(undefined);
  };

  const edit = (label: MailLabel): void => {
    setEditingId(label.id);
    setDraft({ name: label.name, color: label.color });
    setError(undefined);
  };

  const save = (): void => {
    const name = draft.name.trim();
    if (!name || busy) return;
    setBusy(true);
    setError(undefined);
    const request = editingId
      ? mail.updateLabel({ id: editingId, name, color: draft.color })
      : mail.createLabel(name, draft.color);
    void request
      .then((label) => {
        setLabels((current) =>
          [...current.filter((item) => item.id !== label.id), label].sort(
            compareLabels,
          ),
        );
        resetDraft();
      })
      .catch(showError)
      .finally(() => setBusy(false));
  };

  const confirmDelete = (): void => {
    const label = labelToDelete;
    if (!label || busy) return;
    setBusy(true);
    setError(undefined);
    void mail
      .deleteLabel(label.id)
      .then(() => {
        setLabels((current) => current.filter((item) => item.id !== label.id));
        if (editingId === label.id) resetDraft();
        setLabelToDelete(undefined);
      })
      .catch(showError)
      .finally(() => setBusy(false));
  };

  const colorName = (color: MailLabelColor): string =>
    t(`labels.colors.${color}`, {
      defaultValue: DEFAULT_COLOR_NAMES[color],
    });

  return (
    <>
      <div className='grid min-h-0 w-full gap-4 lg:h-full lg:grid-cols-[18rem_minmax(0,1fr)]'>
        <Card className='flex min-h-0 flex-col overflow-hidden rounded-2xl bg-background shadow-sm'>
          <div className='flex shrink-0 items-center justify-between gap-3 border-b bg-muted/20 px-4 py-3'>
            <div className='flex min-w-0 items-center gap-2'>
              <span className='grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary'>
                <Tag aria-hidden='true' className='size-4' />
              </span>
              <span className='sr-only'>
                {t('labels.list', { defaultValue: 'Labels' })}
              </span>
            </div>
            <div className='flex items-center gap-2'>
              <span className='inline-flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full border bg-background px-2 text-xs font-semibold'>
                {labels.length}
              </span>
              <Button
                className='h-8 shrink-0 px-3 text-xs'
                disabled={busy}
                onClick={resetDraft}
                type='button'
                variant='outline'
              >
                <Plus aria-hidden='true' className='size-3.5' />
                {t('labels.new', { defaultValue: 'New label' })}
              </Button>
            </div>
          </div>

          {error ? (
            <p className='border-b border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              {error}
            </p>
          ) : null}

          {loading ? (
            <p className='p-4 text-sm text-muted-foreground'>
              {t('labels.loading', { defaultValue: 'Loading labels…' })}
            </p>
          ) : labels.length === 0 ? (
            <div className='grid min-h-48 place-items-center p-4 text-center'>
              <div>
                <span className='mx-auto grid size-10 place-items-center rounded-full bg-muted text-muted-foreground'>
                  <Tag aria-hidden='true' className='size-4' />
                </span>
                <p className='mt-3 text-sm font-medium'>
                  {t('labels.empty', { defaultValue: 'No labels yet.' })}
                </p>
                <p className='mt-1 text-xs text-muted-foreground'>
                  {t('labels.emptyHint', {
                    defaultValue: 'Create one to organize messages visually.',
                  })}
                </p>
              </div>
            </div>
          ) : (
            <div
              aria-label={t('labels.list', { defaultValue: 'Labels' })}
              className='min-h-0 flex-1 divide-y overflow-y-auto overscroll-contain'
              role='region'
            >
              {labels.map((label) => (
                <MailManagementListItem
                  ariaLabel={t('labels.editAction', {
                    name: label.name,
                    defaultValue: `Edit ${label.name}`,
                  })}
                  key={label.id}
                  onSelect={() => edit(label)}
                  selected={editingId === label.id}
                  actions={
                    <Button
                      aria-label={t('labels.deleteAction', {
                        name: label.name,
                        defaultValue: `Delete ${label.name}`,
                      })}
                      className='size-8 p-0'
                      onClick={() => setLabelToDelete(label)}
                      type='button'
                      variant='ghost'
                    >
                      <Trash2 aria-hidden='true' className='size-3.5' />
                    </Button>
                  }
                >
                  <MailLabelTag label={label} size='md' />
                </MailManagementListItem>
              ))}
            </div>
          )}
        </Card>

        <Card className='min-h-0 space-y-5 overflow-y-auto p-5'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <p className='text-xs font-medium tracking-wide text-muted-foreground uppercase'>
                {t('labels.formEyebrow', { defaultValue: 'Label setup' })}
              </p>
              <h2 className='mt-1 font-semibold'>
                {t(editingId ? 'labels.edit' : 'labels.new', {
                  defaultValue: editingId ? 'Edit label' : 'New label',
                })}
              </h2>
            </div>
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium' htmlFor='mail-label-name'>
              {t('labels.name', { defaultValue: 'Label name' })}
            </label>
            <Input
              autoFocus
              disabled={busy}
              id='mail-label-name'
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              onKeyDown={(event) => {
                if (event.key === 'Enter') save();
              }}
              placeholder={t('labels.namePlaceholder', {
                defaultValue: 'e.g. Customers',
              })}
              value={draft.name}
            />
          </div>

          <fieldset>
            <legend className='mb-2 text-sm font-medium'>
              {t('labels.color', { defaultValue: 'Color' })}
            </legend>
            <div className='grid grid-cols-3 gap-2'>
              {MAIL_LABEL_COLORS.map((color) => {
                const selected = draft.color === color;
                return (
                  <Button
                    aria-label={t('labels.colorOption', {
                      color: colorName(color),
                      defaultValue: `Choose ${colorName(color)}`,
                    })}
                    aria-pressed={selected}
                    className={cn(
                      'h-auto justify-start gap-2 rounded-lg border-border px-2.5 py-2 text-left text-xs font-normal hover:bg-muted',
                      selected &&
                        'border-primary bg-primary/5 ring-2 ring-primary/20',
                    )}
                    disabled={busy}
                    key={color}
                    onClick={() =>
                      setDraft((current) => ({ ...current, color }))
                    }
                    type='button'
                    variant='ghost'
                  >
                    <span
                      aria-hidden='true'
                      className={cn(
                        'size-4 shrink-0 rounded-full',
                        mailLabelColorSwatch(color),
                      )}
                    />
                    <span className='min-w-0 flex-1 truncate'>
                      {colorName(color)}
                    </span>
                    {selected ? (
                      <Check
                        aria-hidden='true'
                        className='size-3.5 shrink-0 text-primary'
                      />
                    ) : null}
                  </Button>
                );
              })}
            </div>
          </fieldset>

          <div className='rounded-xl border border-dashed bg-muted/20 p-3'>
            <p className='mb-2 text-xs text-muted-foreground'>
              {t('labels.preview', { defaultValue: 'Preview' })}
            </p>
            <MailLabelTag
              label={{
                name:
                  draft.name.trim() ||
                  t('labels.previewName', { defaultValue: 'Label name' }),
                color: draft.color,
              }}
              size='md'
            />
          </div>

          <MailManagementFormActions
            editing={Boolean(editingId)}
            busy={busy}
            disabled={!draft.name.trim()}
            submitLabel={t(editingId ? 'labels.save' : 'labels.add', {
              defaultValue: editingId ? 'Save label' : 'Add label',
            })}
            savingLabel={t('labels.saving', { defaultValue: 'Saving…' })}
            cancelLabel={t('labels.cancel', { defaultValue: 'Cancel' })}
            onSubmit={save}
            onCancel={resetDraft}
          />
        </Card>
      </div>

      <Dialog
        onOpenChange={(open) => {
          if (!open && !busy) setLabelToDelete(undefined);
        }}
        open={Boolean(labelToDelete)}
      >
        <DialogContent
          closeLabel={t('labels.close', { defaultValue: 'Close' })}
        >
          <DialogHeader>
            <DialogTitle>
              {t('labels.deleteTitle', { defaultValue: 'Delete label?' })}
            </DialogTitle>
            <DialogDescription>
              {t('labels.deleteDescription', {
                defaultValue:
                  'This deletes the label and removes it from all messages. The messages will not be deleted.',
              })}
            </DialogDescription>
          </DialogHeader>
          {labelToDelete ? (
            <div className='mt-4'>
              <MailLabelTag label={labelToDelete} size='md' />
            </div>
          ) : null}
          <DialogFooter>
            <Button
              disabled={busy}
              onClick={() => setLabelToDelete(undefined)}
              type='button'
              variant='outline'
            >
              {t('labels.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              disabled={busy}
              onClick={confirmDelete}
              type='button'
              variant='destructive'
            >
              <Trash2 aria-hidden='true' className='size-4' />
              {busy
                ? t('labels.deleting', { defaultValue: 'Deleting…' })
                : t('labels.delete', { defaultValue: 'Delete label' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function emptyDraft(): LabelDraft {
  return { name: '', color: DEFAULT_LABEL_COLOR };
}

function compareLabels(left: MailLabel, right: MailLabel): number {
  return left.name.localeCompare(right.name);
}
