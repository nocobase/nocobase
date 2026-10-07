import { ApiClientError, usePageBreadcrumb } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PencilIcon } from 'lucide-react';
import { type ReactElement, type ReactNode, useState } from 'react';
import { Link, useParams } from 'react-router';

import {
  WORKFLOW_NAME_MAX,
  type WorkflowListItem,
  type WorkflowPreview,
  type WorkflowStatusConflict,
  type WorkflowValidationIssue,
} from '../../../shared/workflows.js';
import { pmKeys } from '../../api/keys.js';
import { PageContainer } from '../../components/page-container.js';
import { PageHeader } from '../../components/page-header.js';
import { PmDetailSkeleton, PmLoadError } from '../../components/pm-states.js';
import { PmTag } from '../../components/pm-tag.js';
import { RouteChildPage } from '../../components/route-child-page.js';
import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from '../../components/ui/alert.js';
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
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card.js';
import { Input } from '../../components/ui/input.js';
import { errorMetadata, useNotify } from '../../hooks/use-notify.js';
import { usePmApi } from '../../hooks/use-pm-api.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { canUseSetting } from '../../lib/permissions.js';
import { WorkflowFlowEditor } from './workflows/flow-editor.js';
import { TransitionsMatrix } from './workflows/transitions-matrix.js';
import {
  WORKFLOWS_PATH,
  placeIssues,
  sameDraft,
  validationIssuesOf,
  workflowName,
  type WorkflowDraft,
} from './workflows/workflow-model.js';
import { WorkflowDiagram } from './workflows/workflow-diagram.js';
import { useStatusName } from './workflows/use-status-name.js';
import { RulePhrase, WorkflowRules } from './workflows/workflow-views.js';

type Attention = WorkflowPreview['attention'];

/**
 * Before a save that makes entering a status wake someone without anybody confirming it (an agent run, say), the
 * rules that would, each under its status; the save goes ahead only once confirmed.
 */
function WakeConfirm({
  attention,
  definition,
  pending,
  onConfirm,
  onCancel,
}: {
  readonly attention: Attention | null;
  readonly definition: WorkflowDraft['definition'];
  readonly pending: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const name = useStatusName(definition);
  return (
    <AlertDialog
      open={attention !== null}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('workflows.wakeConfirm.title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('workflows.wakeConfirm.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ul className='divide-y rounded-lg border text-sm'>
          {(attention ?? []).map((entry) => {
            const status = definition.states.find(
              (state) => state.key === entry.statusKey,
            );
            return (
              <li
                key={`${entry.statusKey}:${entry.rule.type}`}
                className='flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2'
                data-wake={entry.statusKey}
              >
                <span className='font-medium'>
                  {t('workflows.wakeConfirm.entering', {
                    status: name(entry.statusKey),
                  })}
                </span>
                {status ? (
                  <RulePhrase
                    rule={entry.rule}
                    status={status}
                    statusName={name(entry.statusKey)}
                  />
                ) : (
                  <span>{entry.summary}</span>
                )}
              </li>
            );
          })}
        </ul>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction disabled={pending} onClick={onConfirm}>
            {t('workflows.wakeConfirm.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** `details.conflicts` of a 409 `WORKFLOW_STATUS_CONFLICT`. */
function conflictsOf(
  metadata: Readonly<Record<string, unknown>> | undefined,
): WorkflowStatusConflict['conflicts'] {
  const conflicts = metadata?.conflicts;
  return Array.isArray(conflicts)
    ? (conflicts as WorkflowStatusConflict['conflicts'])
    : [];
}

/** One of the page's three cards; `id` names its title for the card's label. */
function WorkflowCard({
  id,
  title,
  description,
  children,
}: {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Card role='region' aria-labelledby={id}>
      <CardHeader>
        <CardTitle id={id}>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function WorkflowBody({
  workflow,
  canEdit,
}: {
  readonly workflow: WorkflowListItem;
  readonly canEdit: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const notify = useNotify();
  const queryClient = useQueryClient();
  const saved: WorkflowDraft = {
    name: workflowName(t, workflow),
    definition: workflow.definition,
  };
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<WorkflowDraft>(saved);
  const [issues, setIssues] = useState<readonly WorkflowValidationIssue[]>([]);
  const [conflicts, setConflicts] = useState<
    WorkflowStatusConflict['conflicts']
  >([]);
  const [confirming, setConfirming] = useState<Attention | null>(null);
  const dirty = !sameDraft(draft, saved);
  const placed = placeIssues(draft.definition, issues);
  const usedBy = t('workflows.usedBy', { count: workflow.projectCount });

  const failed = (error: Error) => {
    if (error instanceof ApiClientError) {
      if (error.reason === 'INVALID_WORKFLOW') {
        setIssues(validationIssuesOf(errorMetadata(error)));
        return;
      }
      if (error.reason === 'WORKFLOW_STATUS_CONFLICT')
        setConflicts(conflictsOf(errorMetadata(error)));
      if (error.reason === 'REVISION_CONFLICT')
        void queryClient.invalidateQueries({ queryKey: pmKeys.workflows });
    }
    notify.error(error);
  };

  const save = useMutation({
    mutationFn: () =>
      api.updateWorkflow(workflow.id, {
        revision: workflow.revision,
        ...(draft.name === saved.name ? {} : { name: draft.name }),
        definition: draft.definition,
      }),
    // The page remounts on the new revision, back in view mode.
    onSuccess: (next) => {
      notify.success(t('workflows.saved', { name: workflowName(t, next) }));
      void queryClient.invalidateQueries({ queryKey: pmKeys.workflows });
      void queryClient.invalidateQueries({ queryKey: ['pm', 'statuses'] });
    },
    onError: (error) => failed(error),
  });
  /** Saves at once, unless the change makes a status wake someone it did not before: that is confirmed first. */
  const check = useMutation({
    mutationFn: () => api.previewWorkflow(workflow.id, draft.definition),
    onSuccess: (preview) => {
      const added = preview.attention.filter((entry) => entry.isNew);
      if (added.length > 0) setConfirming(added);
      else save.mutate();
    },
    onError: (error) => failed(error),
  });
  const change = (
    update: (
      definition: WorkflowDraft['definition'],
    ) => WorkflowDraft['definition'],
  ) =>
    setDraft((current) => ({
      ...current,
      definition: update(current.definition),
    }));

  let actions: ReactElement | undefined;
  if (editing)
    actions = (
      <>
        <Button
          variant='outline'
          disabled={save.isPending}
          onClick={() => {
            setDraft(saved);
            setIssues([]);
            setConflicts([]);
            setEditing(false);
          }}
        >
          {t('workflows.discard')}
        </Button>
        <Button
          disabled={
            !dirty || !draft.name.trim() || save.isPending || check.isPending
          }
          onClick={() => {
            setIssues([]);
            setConflicts([]);
            check.mutate();
          }}
        >
          {t('workflows.save')}
        </Button>
      </>
    );
  else if (canEdit)
    actions = (
      <Button variant='outline' onClick={() => setEditing(true)}>
        <PencilIcon data-icon='inline-start' />
        {t('workflows.edit')}
      </Button>
    );

  return (
    <>
      <PageHeader
        title={
          <span className='inline-flex flex-wrap items-center gap-3'>
            {editing ? (
              <Input
                aria-label={t('workflows.name')}
                value={draft.name}
                maxLength={WORKFLOW_NAME_MAX}
                className='h-9 w-72 font-heading text-xl font-semibold md:text-xl'
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            ) : (
              workflowName(t, workflow)
            )}
            {workflow.isDefault ? (
              <PmTag tone='blue'>{t('workflows.default')}</PmTag>
            ) : null}
          </span>
        }
        description={
          canEdit ? usedBy : `${usedBy} · ${t('workflows.readOnly')}`
        }
        actions={actions}
      />
      {placed.general.length > 0 ? (
        <Alert variant='destructive'>
          <AlertTitle>{t('workflows.invalid')}</AlertTitle>
          <AlertDescription>
            <ul className='list-disc pl-4'>
              {placed.general.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      {conflicts.length > 0 ? (
        <Alert variant='destructive'>
          <AlertTitle>{t('workflows.conflictTitle')}</AlertTitle>
          <AlertDescription>
            <ul className='list-disc pl-4'>
              {conflicts.map((entry) => (
                <li key={`${entry.projectId}:${entry.statusKey}`}>
                  {t('workflows.conflictLine', {
                    count: entry.count,
                    status: entry.statusKey,
                    project: entry.projectName ?? t('workflows.noProject'),
                  })}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <WorkflowCard
        id='pm-workflow-flow'
        title={t('workflows.flowTitle')}
        description={
          editing ? t('workflows.statusesHint') : t('workflows.flowDescription')
        }
      >
        {editing ? (
          <WorkflowFlowEditor
            definition={draft.definition}
            problems={placed.byStatus}
            onChange={change}
          />
        ) : (
          <WorkflowDiagram definition={workflow.definition} />
        )}
      </WorkflowCard>
      <WorkflowCard
        id='pm-workflow-matrix'
        title={t('workflows.matrix')}
        description={
          editing
            ? t('workflows.transitionsHint')
            : t('workflows.matrixDescription')
        }
      >
        {editing ? (
          <TransitionsMatrix
            definition={draft.definition}
            readOnly={false}
            problems={placed.transitions}
            onChange={change}
          />
        ) : (
          <TransitionsMatrix definition={workflow.definition} readOnly />
        )}
      </WorkflowCard>
      <WorkflowCard
        id='pm-workflow-rules'
        title={t('workflows.rulesTitle')}
        description={t('workflows.rulesDescription')}
      >
        {editing ? (
          <WorkflowRules definition={draft.definition} onChange={change} />
        ) : (
          <WorkflowRules definition={workflow.definition} />
        )}
      </WorkflowCard>
      <WakeConfirm
        attention={confirming}
        definition={draft.definition}
        pending={save.isPending}
        onCancel={() => setConfirming(null)}
        onConfirm={() => {
          setConfirming(null);
          save.mutate();
        }}
      />
    </>
  );
}

/**
 * `/config/workflows/:workflowId`: one workflow as a covering page, laid out as the old workflow page — the status
 * flow, the transition matrix and the rules, and how many projects use it. Whoever holds `pm.workflows/update` gets
 * an Edit button; edit mode keeps the same layout and makes it operable in place (the name in the header, the status
 * statuses on the flow strip, the matrix's cells, each status's rules). The whole change is saved at once; the server
 * validates it and refuses to drop a status issues are in.
 */
export default function WorkflowDetailPage(): ReactElement {
  const { workflowId = '' } = useParams();
  const { t } = useTranslation();
  const api = usePmApi();
  const viewer = useViewer();
  const workflows = useQuery({
    queryKey: pmKeys.workflows,
    queryFn: () => api.workflows(),
  });
  const workflow = workflows.data?.find((item) => item.id === workflowId);
  const back = (
    <Button
      variant='outline'
      size='sm'
      nativeButton={false}
      render={<Link to={WORKFLOWS_PATH} />}
    >
      {t('workflows.backToList')}
    </Button>
  );

  // The header's trail (the shell renders it): the templates, then this one.
  usePageBreadcrumb([
    { label: t('workflows.title'), to: WORKFLOWS_PATH },
    {
      label: workflow ? workflowName(t, workflow) : t('workflows.breadcrumb'),
    },
  ]);
  let body: ReactElement;
  if (workflows.isError && !workflows.data)
    body = (
      <PmLoadError
        title={t('workflows.loadFailed')}
        error={workflows.error}
        action={back}
      />
    );
  else if (!workflows.data || !viewer) body = <PmDetailSkeleton />;
  else if (!workflow)
    body = (
      <Alert>
        <AlertTitle>{t('workflows.notFound')}</AlertTitle>
        <AlertAction>{back}</AlertAction>
      </Alert>
    );
  else
    body = (
      <WorkflowBody
        key={`${workflow.id}:${workflow.revision}`}
        workflow={workflow}
        canEdit={canUseSetting(viewer, 'pm.workflows', 'update')}
      />
    );

  return (
    <RouteChildPage>
      <PageContainer>{body}</PageContainer>
    </RouteChildPage>
  );
}
