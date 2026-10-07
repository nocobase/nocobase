import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TagIcon } from 'lucide-react';
import type { ReactElement } from 'react';

import type { Color } from '../../../shared/common.js';
import type { Label } from '../../../shared/labels.js';
import { pmKeys } from '../../api/keys.js';
import {
  PmEmpty,
  PmListSkeleton,
  PmLoadError,
} from '../../components/pm-states.js';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { canUseSetting } from '../../lib/permissions.js';
import { CreateLabelForm } from './labels/create-label-form.js';
import { LabelRow } from './labels/label-row.js';
import { SettingsPageHeader } from './settings-page-header.js';

/**
 * `/config/labels`: every label with its colour. Whoever may update `pm.labels` creates, renames, recolours
 * and deletes (delete asks first and takes the label off its issues); everyone else sees the list read-only.
 */
export default function LabelsSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const viewer = useViewer();
  const canEdit = canUseSetting(viewer, 'pm.labels', 'update');
  const labels = useQuery({
    queryKey: pmKeys.labels,
    queryFn: () => api.labels(),
  });

  const settled = (): void => {
    void queryClient.invalidateQueries({ queryKey: pmKeys.labels });
    void queryClient.invalidateQueries({ queryKey: pmKeys.issues });
    void queryClient.invalidateQueries({ queryKey: ['pm', 'issue'] });
  };
  const failed = (error: unknown): void => notify.error(error);

  const create = useMutation({
    mutationFn: (input: { name: string; color: Color }) =>
      api.createLabel(input),
    onSuccess: (label) =>
      notify.success(t('config.labels.created', { name: label.name })),
    onError: failed,
    onSettled: settled,
  });
  const update = useMutation({
    mutationFn: ({
      label,
      changes,
    }: {
      label: Label;
      changes: { name?: string; color?: Color };
    }) => api.updateLabel(label.id, changes),
    onSuccess: (_, { label, changes }) =>
      notify.success(
        changes.name
          ? t('config.labels.renamed', { name: changes.name })
          : t('config.labels.recolored', { name: label.name }),
      ),
    onError: failed,
    onSettled: settled,
  });
  const remove = useMutation({
    mutationFn: (label: Label) => api.deleteLabel(label.id),
    onSuccess: (_, label) =>
      notify.success(t('config.labels.deleted', { name: label.name })),
    onError: failed,
    onSettled: settled,
  });
  const busy = create.isPending || update.isPending || remove.isPending;

  let content: ReactElement;
  if (labels.isError && !labels.data)
    content = (
      <PmLoadError
        title={t('config.labels.loadFailed')}
        error={labels.error}
        onRetry={() => void labels.refetch()}
      />
    );
  else if (!labels.data || !viewer) content = <PmListSkeleton rows={4} />;
  else if (labels.data.length === 0)
    content = (
      <PmEmpty
        icon={<TagIcon />}
        title={t('config.labels.emptyTitle')}
        description={t(
          canEdit
            ? 'config.labels.emptyDescription'
            : 'config.labels.emptyNoAccess',
        )}
      />
    );
  else
    content = (
      <div className='overflow-hidden rounded-lg border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('config.labels.columns.name')}</TableHead>
              <TableHead>{t('config.labels.columns.color')}</TableHead>
              {canEdit ? (
                <TableHead className='w-24'>
                  <span className='sr-only'>
                    {t('config.labels.columns.actions')}
                  </span>
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {labels.data.map((label) => (
              <LabelRow
                key={label.id}
                label={label}
                canEdit={canEdit}
                busy={busy}
                onRename={(name) => update.mutate({ label, changes: { name } })}
                onRecolor={(color) =>
                  update.mutate({ label, changes: { color } })
                }
                onDelete={() => remove.mutate(label)}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    );

  return (
    <section className='space-y-4' aria-labelledby='pm-config-labels-heading'>
      <SettingsPageHeader
        id='pm-config-labels-heading'
        title={t('config.labels.title')}
        description={t('config.labels.description')}
        readOnly={!canEdit}
      />
      {canEdit ? (
        <CreateLabelForm
          pending={create.isPending}
          onCreate={(input) => create.mutate(input)}
        />
      ) : null}
      {content}
    </section>
  );
}
