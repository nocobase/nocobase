import { useTranslation } from '@nocobase/i18n/client';
import { TriangleAlertIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { PermissionDraftChange } from '#components/permission-editor-model';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#components/ui/dialog';

const TABS = ['menus', 'objects', 'settings'] as const;

/**
 * The review before a role is saved: every change, by tab, with high-risk ones marked. Members are not listed: they
 * change at once in their own tab.
 */
export function RoleReview({
  changes,
  notes,
  busy,
  onCancel,
  onConfirm,
}: {
  readonly changes: readonly PermissionDraftChange[];
  /** Changes outside the permission tabs, such as a new name, one sentence each. */
  readonly notes: readonly string[];
  readonly busy: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const risky = changes.filter((change) => change.risk === 'high').length;
  const count = changes.length + notes.length;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('settings.review.title')}</DialogTitle>
          <DialogDescription>
            {t('settings.review.description', { count })}
          </DialogDescription>
        </DialogHeader>
        {risky > 0 && (
          <p
            role='alert'
            className='flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive'
          >
            <TriangleAlertIcon className='mt-0.5 size-4 shrink-0' />
            {t('settings.review.highRisk', { count: risky })}
          </p>
        )}
        <div className='flex max-h-96 flex-col gap-4 overflow-y-auto'>
          {notes.length > 0 && (
            <section className='flex flex-col gap-1.5'>
              <h3 className='text-sm font-medium'>
                {t('settings.review.role')}
              </h3>
              {notes.map((note) => (
                <p key={note} className='text-sm text-muted-foreground'>
                  {note}
                </p>
              ))}
            </section>
          )}
          {TABS.map((tab) => {
            const items = changes.filter((change) => change.tab === tab);
            if (!items.length) return null;
            return (
              <section key={tab} className='flex flex-col gap-1.5'>
                <h3 className='text-sm font-medium'>
                  {t(`settings.review.tabs.${tab}`)}
                </h3>
                <ul className='flex flex-col gap-1'>
                  {items.map((change) => (
                    <li
                      key={`${change.kind}:${change.owner ?? ''}:${change.label}`}
                      data-risk={change.risk}
                      className='flex flex-wrap items-center gap-2 text-sm'
                    >
                      <Badge
                        variant={
                          change.kind === 'removed' ? 'outline' : 'secondary'
                        }
                      >
                        {t(`settings.review.${change.kind}`)}
                      </Badge>
                      <span>
                        {change.owner
                          ? t('settings.review.ownerAction', {
                              owner: change.owner,
                              action: change.label,
                            })
                          : change.label}
                      </span>
                      {change.risk === 'high' && (
                        <Badge variant='destructive'>
                          {t('settings.permissionEditor.highRisk')}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            disabled={busy}
            onClick={onCancel}
          >
            {t('settings.review.back')}
          </Button>
          <Button type='button' disabled={busy} onClick={onConfirm}>
            {t(busy ? 'settings.saving' : 'settings.review.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
