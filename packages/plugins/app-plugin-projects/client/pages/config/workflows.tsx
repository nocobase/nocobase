import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChevronRightIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react';
import { type FormEvent, type ReactElement, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';

import {
  WORKFLOW_NAME_MAX,
  type WorkflowListItem,
} from '../../../shared/workflows.js';
import { pmKeys } from '../../api/keys.js';
import {
  PmEmpty,
  PmListSkeleton,
  PmLoadError,
} from '../../components/pm-states.js';
import { PmTag } from '../../components/pm-tag.js';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog.js';
import { Button } from '../../components/ui/button.js';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog.js';
import { Field, FieldLabel } from '../../components/ui/field.js';
import { Input } from '../../components/ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select.js';
import { useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { canUseSetting } from '../../lib/permissions.js';
import { SettingsPageHeader } from './settings-page-header.js';
import { workflowName, workflowPath } from './workflows/workflow-model.js';
import { WorkflowColumns } from './workflows/workflow-diagram.js';

/** The "Start from" choice of the built-in statuses: never a workflow id, which a template's or the database's ids are. */
const BUILT_IN_SOURCE = ':builtIn';

/** A new workflow starts as a copy of the default (or the first) one, or of the built-in statuses when there is none. */
function NewWorkflowDialog({
  open,
  workflows,
  onClose,
}: {
  readonly open: boolean;
  readonly workflows: readonly WorkflowListItem[];
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const fallback = workflows.find((item) => item.isDefault) ?? workflows[0];
  const [copyFrom, setCopyFrom] = useState<string | null>(null);
  const source = copyFrom ?? fallback?.id ?? BUILT_IN_SOURCE;
  const create = useMutation({
    mutationFn: () =>
      api.createWorkflow({
        name,
        copyFrom: source === BUILT_IN_SOURCE ? null : source,
      }),
    onSuccess: (workflow) => {
      notify.success(t('workflows.created', { name: workflow.name }));
      void queryClient.invalidateQueries({ queryKey: pmKeys.workflows });
      setName('');
      onClose();
      void navigate(workflowPath(workflow.id));
    },
    onError: (error) => notify.error(error),
  });
  const submit = (event: FormEvent): void => {
    event.preventDefault();
    if (name.trim() && source) create.mutate();
  };
  const items = [
    ...workflows.map((item) => ({
      value: item.id,
      label: workflowName(t, item),
    })),
    { value: BUILT_IN_SOURCE, label: t('workflows.builtInStatuses') },
  ];
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <form onSubmit={submit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>{t('workflows.newTitle')}</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor='pm-new-workflow-name'>
              {t('workflows.name')}
            </FieldLabel>
            <Input
              id='pm-new-workflow-name'
              value={name}
              maxLength={WORKFLOW_NAME_MAX}
              autoFocus
              onChange={(event) => setName(event.target.value)}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='pm-new-workflow-source'>
              {t('workflows.copyFrom')}
            </FieldLabel>
            <Select
              items={items}
              value={source}
              onValueChange={(value: string | null) => {
                if (value) setCopyFrom(value);
              }}
            >
              <SelectTrigger id='pm-new-workflow-source' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                {items.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              {t('actions.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={!name.trim() || !source || create.isPending}
            >
              {t('common.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A workflow in the list, as the old list drew it: its name (a link to its page), whether it is the default, how many
 * projects use it and how many statuses it has, and its main status line. Whoever may edit workflows also gets
 * "make default" and "delete" on each one that is not the default.
 */
function WorkflowListCard({
  workflow,
  canEdit,
  busy,
  onMakeDefault,
  onDelete,
}: {
  readonly workflow: WorkflowListItem;
  readonly canEdit: boolean;
  readonly busy: boolean;
  readonly onMakeDefault: () => void;
  readonly onDelete: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const name = workflowName(t, workflow);
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle className='flex min-w-0 items-center gap-2'>
          <Link
            to={workflowPath(workflow.id)}
            className='truncate hover:underline focus-visible:underline'
          >
            {name}
          </Link>
          {workflow.isDefault ? (
            <PmTag tone='blue'>{t('workflows.default')}</PmTag>
          ) : null}
        </CardTitle>
        <CardDescription>
          {t('workflows.usedBy', { count: workflow.projectCount })}
          {' · '}
          {t('workflows.statusCount', {
            count: workflow.definition.states.length,
          })}
        </CardDescription>
        <CardAction className='flex items-center gap-1'>
          {canEdit && !workflow.isDefault ? (
            <>
              <Button
                variant='ghost'
                size='icon-sm'
                disabled={busy}
                aria-label={t('workflows.makeDefault', { name })}
                title={t('workflows.makeDefault', { name })}
                onClick={onMakeDefault}
              >
                <StarIcon />
              </Button>
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label={t('workflows.deleteNamed', { name })}
                title={t('workflows.deleteNamed', { name })}
                onClick={onDelete}
              >
                <Trash2Icon />
              </Button>
            </>
          ) : null}
          <ChevronRightIcon
            className='size-4 text-muted-foreground'
            aria-hidden='true'
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <WorkflowColumns definition={workflow.definition} />
      </CardContent>
    </Card>
  );
}

/**
 * `/config/workflows`: every workflow as a card, as the old list showed them — how many projects use it, how many
 * statuses it has and its status line; each opens as the covering page `:id`. Whoever holds `pm.workflows/update` creates one (a copy of another), makes one the default,
 * and deletes one no project uses.
 */
export default function WorkflowsSettingsPage(): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const canEdit = canUseSetting(useViewer(), 'pm.workflows', 'update');
  const workflows = useQuery({
    queryKey: pmKeys.workflows,
    queryFn: () => api.workflows(),
  });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<WorkflowListItem | null>(null);

  const refresh = () =>
    void queryClient.invalidateQueries({ queryKey: pmKeys.workflows });
  const makeDefault = useMutation({
    mutationFn: (workflow: WorkflowListItem) =>
      api.setDefaultWorkflow(workflow.id),
    onSuccess: (workflow) =>
      notify.success(
        t('workflows.madeDefault', { name: workflowName(t, workflow) }),
      ),
    onError: (error) => notify.error(error),
    onSettled: refresh,
  });
  const remove = useMutation({
    mutationFn: (workflow: WorkflowListItem) => api.deleteWorkflow(workflow.id),
    onSuccess: (_, workflow) => {
      notify.success(
        t('workflows.deleted', { name: workflowName(t, workflow) }),
      );
      setDeleting(null);
    },
    onError: (error) => notify.error(error),
    onSettled: refresh,
  });

  const newButton =
    canEdit && workflows.data ? (
      <Button onClick={() => setCreating(true)}>
        <PlusIcon />
        {t('workflows.new')}
      </Button>
    ) : null;

  let content: ReactElement;
  if (workflows.isError && !workflows.data)
    content = (
      <PmLoadError
        title={t('workflows.loadFailed')}
        error={workflows.error}
        onRetry={() => void workflows.refetch()}
      />
    );
  else if (!workflows.data) content = <PmListSkeleton rows={2} />;
  else if (workflows.data.length === 0)
    content = (
      <PmEmpty
        icon={<WorkflowIcon />}
        title={t('workflows.empty')}
        description={t(
          canEdit ? 'workflows.emptyDescription' : 'workflows.emptyReadOnly',
        )}
        action={newButton}
      />
    );
  else
    content = (
      <ul className='grid gap-3 lg:grid-cols-2'>
        {workflows.data.map((workflow) => (
          <li key={workflow.id}>
            <WorkflowListCard
              workflow={workflow}
              canEdit={canEdit}
              busy={makeDefault.isPending}
              onMakeDefault={() => makeDefault.mutate(workflow)}
              onDelete={() => setDeleting(workflow)}
            />
          </li>
        ))}
      </ul>
    );

  return (
    <>
      <section
        className='space-y-4'
        aria-labelledby='pm-config-workflows-heading'
      >
        <SettingsPageHeader
          id='pm-config-workflows-heading'
          title={t('workflows.title')}
          description={t('workflows.description')}
          readOnly={!canEdit}
          actions={
            workflows.data && workflows.data.length > 0 ? newButton : null
          }
        />
        {content}
      </section>
      {workflows.data ? (
        <NewWorkflowDialog
          open={creating}
          workflows={workflows.data}
          onClose={() => setCreating(false)}
        />
      ) : null}
      <AlertDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('workflows.deleteTitle', {
                name: deleting ? workflowName(t, deleting) : '',
              })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleting && deleting.projectCount > 0
                ? t('workflows.deleteInUse', { count: deleting.projectCount })
                : t('workflows.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={
                !deleting || deleting.projectCount > 0 || remove.isPending
              }
              onClick={() => {
                if (deleting) remove.mutate(deleting);
              }}
            >
              {t('workflows.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Outlet />
    </>
  );
}
