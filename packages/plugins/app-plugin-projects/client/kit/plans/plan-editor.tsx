import { useTranslation } from '@nocobase/i18n/client';
import {
  AlertTriangleIcon,
  FileTextIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  PlayIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
} from 'lucide-react';
import { Fragment, useState, type ReactElement, type ReactNode } from 'react';

import { PRIORITIES } from '../../../shared/common.js';
import type { IntakeRowChange } from '../../../shared/intake-ai.js';
import type { Plan, PlanRowCheck } from '../../../shared/plans.js';
import { PmTag } from '../../components/pm-tag.js';
import { PmExecutorSelect } from '../../components/pm-executor-select.js';
import {
  LabelsField,
  PropertySelect,
} from '../../components/pm-property-fields.js';
import { Button } from '../../components/ui/button.js';
import { Input } from '../../components/ui/input.js';
import { Spinner } from '../../components/ui/spinner.js';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table.js';
import { Textarea } from '../../components/ui/textarea.js';
import { useNotify } from '../../hooks/use-notify.js';
import { useViewer } from '../../hooks/use-viewer.js';
import { canUseSetting } from '../../lib/permissions.js';
import { cn } from 'cn';
import { executorOf, usePlanLookup, type PlanLookup } from './lookup.js';
import {
  abilitiesOf,
  asRecord,
  blockingRefs,
  canIndent,
  canOutdent,
  counts,
  createdTitle,
  decodeProjectTarget as decodeProject,
  editRequest,
  encodeProjectTarget as encodeProject,
  indentParams,
  mergeEdits,
  outdentParams,
  patchParams,
  removalEdits,
  restoreEdits,
  rowViews,
  type PlanEdits,
  type RowEdit,
  type RowView,
} from './model.js';
import { usePlanConfirm } from './plan-confirm.js';
import { rowTitle, useRowError } from './plan-text.js';
import { invalidRows, usePlanMutations } from './use-plan.js';

/** What the editor lends to what is rendered below its table (`below`). */
export interface PlanEditorState {
  /** Unsaved edits are waiting. */
  readonly dirty: boolean;
  readonly busy: boolean;
  /** Saves the edits; answers the rehearsed plan, or null when a row failed or the save did. */
  readonly save: () => Promise<Plan | null>;
}

export interface PlanEditorProps {
  readonly plan: Plan;
  /** Rows to highlight, by their `ref`: what a revision added or changed. */
  readonly rowMarks?: ReadonlyMap<string, IntakeRowChange>;
  /** Rendered between the table and the footer (the AI draft tab's "Ask AI to revise"). */
  readonly below?: (state: PlanEditorState) => ReactNode;
  /** Nothing can be edited or decided meanwhile (AI is revising the plan's rows). */
  readonly locked?: boolean;
  /** After a save that passed its rehearsal. */
  readonly onSaved?: (plan: Plan) => void;
  /**
   * Shows the execute button in the footer ("Create N issues" when every row creates an issue). Unsaved edits are
   * saved first; risky rows are confirmed once more. Called with the plan the execution answered: executed, stale or
   * failed.
   */
  readonly onExecuted?: (plan: Plan) => void;
  /** Shows a "Done" button that leaves the editor. */
  readonly onDone?: () => void;
  /** More buttons for the footer, before the editor's own. */
  readonly actions?: ReactNode;
  readonly className?: string;
}

const NO_EDITS: PlanEdits = new Map();

/** A row a revision added or changed: a pale wash of the tag's hue (`pm-tones.ts`), in both themes. */
const MARK_ROW_CLASS: Readonly<Record<IntakeRowChange, string>> = {
  added:
    'bg-[oklch(0.975_0.025_155)] hover:bg-[oklch(0.955_0.04_155)] dark:bg-[oklch(0.65_0.12_155/0.08)] dark:hover:bg-[oklch(0.65_0.12_155/0.14)]',
  changed:
    'bg-[oklch(0.98_0.035_85)] hover:bg-[oklch(0.96_0.05_85)] dark:bg-[oklch(0.75_0.13_75/0.08)] dark:hover:bg-[oklch(0.75_0.13_75/0.14)]',
};

/**
 * A plan's rows as an editable table (`shared/plans.ts`): each new issue's title, project, priority, labels, executor,
 * owner and stage in place, its description below it, indenting a row under the one above it (outdenting lifts it);
 * other rows' fields stacked in their row. Rows are removed, never added; removing a parent hands its sub-issues to
 * its own parent. Edits stay local until "Save changes" (`PATCH /plans/:id`), which rehearses the plan again and shows
 * each failing row's error in place.
 */
export function PlanEditor({
  plan,
  rowMarks,
  below,
  locked = false,
  onSaved,
  onExecuted,
  onDone,
  actions,
  className,
}: PlanEditorProps): ReactElement {
  const { t } = useTranslation();
  const notify = useNotify();
  const viewer = useViewer();
  const lookup = usePlanLookup();
  const mutations = usePlanMutations();
  const confirm = usePlanConfirm();
  const rowError = useRowError();
  const [edits, setEdits] = useState<PlanEdits>(NO_EDITS);
  const [checks, setChecks] = useState<ReadonlyMap<string, PlanRowCheck>>(
    () => new Map(),
  );
  const [describing, setDescribing] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const views = rowViews(plan.rows, edits);
  const abilities = abilitiesOf(plan, viewer?.userId ?? null);
  const dirty = edits.size > 0;
  const total = counts(views);
  const busy = mutations.busy || locked;
  const blocking = blockingRefs(views);
  const canCreateLabels = canUseSetting(viewer, 'pm.labels', 'update');
  const allCreate = views.every((view) => view.row.op === 'issue.create');

  const edit = (changes: ReadonlyMap<string, RowEdit>) =>
    setEdits((current) => mergeEdits(current, changes));
  const setParams = (
    view: RowView,
    params: Readonly<Record<string, unknown>>,
  ) => edit(new Map([[view.row.id, { params }]]));
  const patch = (view: RowView, values: Readonly<Record<string, unknown>>) =>
    setParams(view, patchParams(view.params, values));
  const remove = (view: RowView) => edit(removalEdits(views, view));
  const restore = (view: RowView) =>
    setEdits((current) => restoreEdits(current, view.row.id));

  /** Saves the edits; answers the rehearsed plan, or null when a row failed or the save did. */
  async function save(): Promise<Plan | null> {
    const request = editRequest(plan, edits);
    if (!request) return plan;
    if (total.rows === 0) {
      notify.error(null, t('plans.nothingLeft'));
      return null;
    }
    try {
      const next = await mutations.edit(plan, request);
      setEdits(NO_EDITS);
      setChecks(new Map());
      onSaved?.(next);
      return next;
    } catch (error) {
      const rows = invalidRows(error);
      if (!rows) {
        notify.error(error);
        return null;
      }
      // The checks follow the rows kept, in order.
      const kept = views.filter((view) => !view.removed);
      setChecks(
        new Map(
          kept.flatMap((view, index) => {
            const check = rows[index];
            return check ? [[view.row.id, check] as const] : [];
          }),
        ),
      );
      notify.error(null, t('plans.rowsFailed'));
      return null;
    }
  }

  async function execute(): Promise<void> {
    const saved = dirty ? await save() : plan;
    if (!saved) return;
    if (saved.status !== 'pending') return;
    confirm.execute(saved, () => {
      void mutations
        .act('execute', saved)
        .then((next) => {
          if (next.status === 'executed')
            notify.success(
              allCreate
                ? t('plans.executedIssues', { count: total.issues })
                : t('plans.executed'),
            );
          else notify.error(null, t('plans.executeFailed'));
          onExecuted?.(next);
        })
        .catch((error: unknown) => notify.error(error));
    });
  }

  async function retry(): Promise<void> {
    try {
      const next = await mutations.act('retry', plan);
      setChecks(new Map());
      notify.success(t('plans.retried'));
      onSaved?.(next);
    } catch (error) {
      const rows = invalidRows(error);
      if (rows) {
        setChecks(
          new Map(
            views.flatMap((view, index) => {
              const check = rows[index];
              return check ? [[view.row.id, check] as const] : [];
            }),
          ),
        );
        notify.error(null, t('plans.retryFailed'));
      } else notify.error(error);
    }
  }

  const errorOf = (view: RowView): string | null => {
    const check =
      checks.get(view.row.id) ?? (view.edited ? null : view.row.check);
    return check && !check.ok ? rowError(check.error) : null;
  };

  return (
    <div className={cn('space-y-3', className)} data-testid='plan-editor'>
      <div className='rounded-md border'>
        {/*
          A cell's min-width does not hold in a table, so with the chat panel docked the title column was squeezed to a
          few characters and the last columns clipped. The table keeps its own width instead (in rem on purpose: it is a
          layout width that must not shrink under the compact preset) and scrolls sideways in its container below it.
        */}
        <Table className='min-w-[64rem]'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[18rem]'>
                {t('plans.columns.title')}
              </TableHead>
              <TableHead className='min-w-36'>
                {t('plans.columns.project')}
              </TableHead>
              <TableHead className='min-w-32'>
                {t('plans.columns.priority')}
              </TableHead>
              <TableHead className='min-w-40'>
                {t('plans.columns.labels')}
              </TableHead>
              <TableHead className='min-w-40'>
                {t('plans.columns.executor')}
              </TableHead>
              <TableHead className='min-w-36'>
                {t('plans.columns.owner')}
              </TableHead>
              <TableHead className='w-20'>{t('plans.columns.stage')}</TableHead>
              <TableHead className='w-10'>
                <span className='sr-only'>{t('plans.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view, index) => {
              const title = rowTitle(view, views, t) || t('plans.untitled');
              const error = view.removed ? null : errorOf(view);
              const mark = view.row.ref
                ? rowMarks?.get(view.row.ref)
                : undefined;
              const removable =
                abilities.edit &&
                (!view.row.ref || !blocking.has(view.row.ref));
              const rowActions = (
                <TableCell className='w-10 align-top'>
                  {!abilities.edit ? null : view.removed ? (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={t('plans.restoreRow', { title })}
                      disabled={busy}
                      onClick={() => restore(view)}
                    >
                      <RotateCcwIcon />
                    </Button>
                  ) : (
                    <Button
                      variant='ghost'
                      size='icon-sm'
                      aria-label={t('plans.removeRow', { title })}
                      title={removable ? undefined : t('plans.referenced')}
                      disabled={busy || !removable}
                      onClick={() => remove(view)}
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </TableCell>
              );
              return (
                <Fragment key={view.row.id}>
                  <TableRow
                    data-plan-row={view.row.position}
                    data-invalid={error ? true : undefined}
                    data-change={mark ?? undefined}
                    className={cn(
                      view.removed && 'opacity-50',
                      mark && !view.edited && MARK_ROW_CLASS[mark],
                    )}
                  >
                    {view.row.op === 'issue.create' ? (
                      <CreateCells
                        view={view}
                        views={views}
                        index={index}
                        title={title}
                        lookup={lookup}
                        disabled={busy || view.removed || !abilities.edit}
                        canCreateLabels={canCreateLabels}
                        mark={mark ?? null}
                        describing={describing.has(view.row.id)}
                        onDescribe={() =>
                          setDescribing((current) => {
                            const next = new Set(current);
                            if (next.has(view.row.id)) next.delete(view.row.id);
                            else next.add(view.row.id);
                            return next;
                          })
                        }
                        onPatch={(values) => patch(view, values)}
                        onIndent={() => {
                          const params = indentParams(views, index);
                          if (params) setParams(view, params);
                        }}
                        onOutdent={() => {
                          const params = outdentParams(views, index);
                          if (params) setParams(view, params);
                        }}
                      />
                    ) : (
                      <TableCell colSpan={7} className='align-top'>
                        <OtherRow
                          view={view}
                          title={title}
                          lookup={lookup}
                          disabled={busy || view.removed || !abilities.edit}
                          canCreateLabels={canCreateLabels}
                          onParams={(params) => setParams(view, params)}
                        />
                      </TableCell>
                    )}
                    {rowActions}
                  </TableRow>
                  {view.row.op === 'issue.create' &&
                  describing.has(view.row.id) &&
                  !view.removed ? (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={8} className='pt-0'>
                        <Textarea
                          aria-label={t('plans.editDescription', { title })}
                          value={
                            typeof view.params.description === 'string'
                              ? view.params.description
                              : ''
                          }
                          rows={3}
                          disabled={busy || !abilities.edit}
                          onChange={(event) =>
                            patch(view, {
                              description: event.target.value || undefined,
                            })
                          }
                          style={{
                            marginInlineStart: `${view.depth * 1.25 + 3.5}rem`,
                          }}
                          className='min-h-16 w-auto max-w-2xl'
                        />
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {error ? (
                    <TableRow className='border-0 hover:bg-transparent'>
                      <TableCell colSpan={8} className='pt-0 pb-2'>
                        <p
                          role='alert'
                          className='flex items-start gap-1 text-xs text-destructive'
                          style={{
                            marginInlineStart: `${view.depth * 1.25}rem`,
                          }}
                        >
                          <AlertTriangleIcon
                            className='mt-0.5 size-3.5 shrink-0'
                            aria-hidden='true'
                          />
                          {error}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {below?.({ dirty, busy, save })}
      <div className='flex flex-wrap items-center gap-2'>
        {dirty ? (
          <span className='text-xs text-muted-foreground'>
            {t('plans.unsaved')}
          </span>
        ) : null}
        <div className='ml-auto flex flex-wrap items-center gap-2'>
          {actions}
          {dirty ? (
            <>
              <Button
                variant='ghost'
                disabled={busy}
                onClick={() => {
                  setEdits(NO_EDITS);
                  setChecks(new Map());
                }}
              >
                {t('plans.discardChanges')}
              </Button>
              <Button
                variant='outline'
                disabled={busy}
                onClick={() => void save()}
              >
                {busy ? (
                  <Spinner data-icon='inline-start' />
                ) : (
                  <SaveIcon data-icon='inline-start' />
                )}
                {t('plans.saveChanges')}
              </Button>
            </>
          ) : null}
          {onDone && !dirty ? (
            <Button variant='outline' disabled={busy} onClick={onDone}>
              {t('plans.doneEditing')}
            </Button>
          ) : null}
          {onExecuted && abilities.retry && !dirty ? (
            <Button disabled={busy} onClick={() => void retry()}>
              {busy ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <RotateCcwIcon data-icon='inline-start' />
              )}
              {t('plans.retry')}
            </Button>
          ) : null}
          {onExecuted && (abilities.execute || (abilities.retry && dirty)) ? (
            <Button
              disabled={busy || total.rows === 0}
              onClick={() => void execute()}
              data-testid='plan-editor-execute'
            >
              {busy ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <PlayIcon data-icon='inline-start' />
              )}
              {allCreate
                ? t('plans.createIssues', { count: total.issues })
                : dirty
                  ? t('plans.saveAndExecute')
                  : t('plans.execute')}
            </Button>
          ) : null}
        </div>
      </div>
      {confirm.dialog}
    </div>
  );
}

function CreateCells({
  view,
  views,
  index,
  title,
  lookup,
  disabled,
  canCreateLabels,
  mark,
  describing,
  onDescribe,
  onPatch,
  onIndent,
  onOutdent,
}: {
  readonly view: RowView;
  readonly views: readonly RowView[];
  readonly index: number;
  readonly title: string;
  readonly lookup: PlanLookup;
  readonly disabled: boolean;
  readonly canCreateLabels: boolean;
  /** What a revision did to the row. */
  readonly mark: IntakeRowChange | null;
  readonly describing: boolean;
  readonly onDescribe: () => void;
  readonly onPatch: (values: Readonly<Record<string, unknown>>) => void;
  readonly onIndent: () => void;
  readonly onOutdent: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const { params, row } = view;
  const cell = (name: string) => `plan-${row.id}-${name}`;
  const hasParent =
    params.parentIssueId !== undefined && params.parentIssueId !== null;
  const projects = [
    ...lookup.projects.map((project) => ({
      value: project.id,
      label: project.name,
    })),
    ...views
      .slice(0, index)
      .filter((other) => other.row.op === 'project.create' && other.row.ref)
      .map((other) => ({
        value: `ref:${other.row.ref ?? ''}`,
        label: createdTitle(other.params) || t('plans.newProject'),
      })),
  ];
  const description =
    typeof params.description === 'string' && params.description !== '';
  return (
    <>
      <TableCell className='min-w-72 align-top'>
        <div
          className='flex items-start gap-1'
          style={{ paddingInlineStart: `${view.depth * 1.25}rem` }}
        >
          <span className='w-5 shrink-0 text-right text-xs leading-8 text-muted-foreground tabular-nums'>
            {row.position + 1}
          </span>
          {mark ? (
            <PmTag
              tone={mark === 'added' ? 'green' : 'amber'}
              className='mt-2'
              data-testid={`plan-row-${mark}`}
            >
              {t(`plans.change.${mark}`)}
            </PmTag>
          ) : null}
          <Button
            variant='ghost'
            size='icon-xs'
            className='mt-1'
            disabled={disabled || !canOutdent(views, index)}
            aria-label={t('plans.outdent', { title })}
            onClick={onOutdent}
          >
            <IndentDecreaseIcon />
          </Button>
          <Button
            variant='ghost'
            size='icon-xs'
            className='mt-1'
            disabled={disabled || !canIndent(views, index)}
            aria-label={t('plans.indent', { title })}
            onClick={onIndent}
          >
            <IndentIncreaseIcon />
          </Button>
          <Textarea
            id={cell('title')}
            value={typeof params.title === 'string' ? params.title : ''}
            rows={1}
            disabled={disabled}
            aria-label={`${title} ${t('plans.columns.title')}`}
            className={cn(
              'min-h-8 resize-none py-1 wrap-anywhere',
              view.removed && 'line-through',
            )}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.nativeEvent.isComposing)
                event.preventDefault();
            }}
            onChange={(event) =>
              onPatch({ title: event.target.value.replace(/\s*\n\s*/gu, ' ') })
            }
          />
          <Button
            variant='ghost'
            size='icon-xs'
            className={cn('mt-1', description && 'text-primary')}
            aria-label={t('plans.editDescription', { title })}
            aria-expanded={describing}
            disabled={view.removed}
            onClick={onDescribe}
          >
            <FileTextIcon />
          </Button>
        </div>
      </TableCell>
      <TableCell className='min-w-36 align-top'>
        <PropertySelect
          id={cell('project')}
          aria-label={`${title} ${t('plans.columns.project')}`}
          options={projects}
          value={encodeProject(params.projectId)}
          noneLabel={t('plans.noProject')}
          disabled={disabled}
          onChange={(value) =>
            onPatch({
              projectId: value === null ? undefined : decodeProject(value),
            })
          }
        />
      </TableCell>
      <TableCell className='min-w-32 align-top'>
        <PropertySelect
          id={cell('priority')}
          aria-label={`${title} ${t('plans.columns.priority')}`}
          options={PRIORITIES.map((value) => ({
            value,
            label: t(`priority.${value}`),
          }))}
          value={typeof params.priority === 'string' ? params.priority : 'none'}
          disabled={disabled}
          onChange={(value) =>
            onPatch({
              priority: value === null || value === 'none' ? undefined : value,
            })
          }
        />
      </TableCell>
      <TableCell className='min-w-40 align-top'>
        <LabelsField
          id={cell('labels')}
          labels={lookup.labels}
          value={
            Array.isArray(params.labelIds) ? params.labelIds.map(String) : []
          }
          disabled={disabled}
          canCreate={canCreateLabels}
          onChange={(labelIds) =>
            onPatch({ labelIds: labelIds.length > 0 ? labelIds : undefined })
          }
        />
      </TableCell>
      <TableCell className='min-w-40 align-top'>
        <PmExecutorSelect
          id={cell('executor')}
          aria-label={`${title} ${t('plans.columns.executor')}`}
          value={executorOf(params.executor)}
          members={lookup.members}
          others={lookup.executors}
          disabled={disabled}
          onChange={(executor) => onPatch({ executor: executor ?? undefined })}
        />
      </TableCell>
      <TableCell className='min-w-36 align-top'>
        <PropertySelect
          id={cell('owner')}
          aria-label={`${title} ${t('plans.columns.owner')}`}
          options={lookup.members.map((member) => ({
            value: member.userId,
            label: member.name,
          }))}
          value={
            typeof params.ownerUserId === 'string' ? params.ownerUserId : null
          }
          noneLabel={t('plans.defaultOwner')}
          disabled={disabled}
          onChange={(value) => onPatch({ ownerUserId: value ?? undefined })}
        />
      </TableCell>
      <TableCell className='w-20 align-top'>
        <StageInput
          id={cell('stage')}
          label={`${title} ${t('plans.columns.stage')}`}
          value={params.stage}
          disabled={disabled || !hasParent}
          onChange={(stage) => onPatch({ stage })}
        />
      </TableCell>
    </>
  );
}

function StageInput({
  id,
  label,
  value,
  disabled,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: unknown;
  readonly disabled: boolean;
  readonly onChange: (stage: number | undefined) => void;
}): ReactElement {
  const [text, setText] = useState(
    typeof value === 'number' ? String(value) : '',
  );
  return (
    <Input
      id={id}
      value={disabled && typeof value !== 'number' ? '' : text}
      inputMode='numeric'
      aria-label={label}
      disabled={disabled}
      className='h-8 w-16'
      onChange={(event) => {
        setText(event.target.value);
        const trimmed = event.target.value.trim();
        onChange(/^\d{1,4}$/u.test(trimmed) ? Number(trimmed) : undefined);
      }}
    />
  );
}

/** A row that is not a new issue: its kind and subject, and the fields it sets, stacked. */
function OtherRow({
  view,
  title,
  lookup,
  disabled,
  canCreateLabels,
  onParams,
}: {
  readonly view: RowView;
  readonly title: string;
  readonly lookup: PlanLookup;
  readonly disabled: boolean;
  readonly canCreateLabels: boolean;
  readonly onParams: (params: Readonly<Record<string, unknown>>) => void;
}): ReactElement {
  const { t } = useTranslation();
  const { params, row } = view;
  const id = (name: string) => `plan-${row.id}-${name}`;
  const field = (name: string, control: ReactNode) => (
    <label key={name} className='grid gap-1 text-xs text-muted-foreground'>
      {t(`plans.fields.${name}`, { defaultValue: name })}
      {control}
    </label>
  );
  let fields: ReactNode = null;
  if (row.op === 'comment.create')
    fields = field(
      'content',
      <Textarea
        id={id('content')}
        rows={3}
        disabled={disabled}
        value={typeof params.content === 'string' ? params.content : ''}
        onChange={(event) =>
          onParams({ ...params, content: event.target.value })
        }
      />,
    );
  else if (row.op === 'project.create')
    fields = (
      <>
        {field(
          'name',
          <Input
            id={id('name')}
            disabled={disabled}
            value={typeof params.name === 'string' ? params.name : ''}
            onChange={(event) =>
              onParams({ ...params, name: event.target.value })
            }
          />,
        )}
        {field(
          'description',
          <Textarea
            id={id('description')}
            rows={2}
            disabled={disabled}
            value={
              typeof params.description === 'string' ? params.description : ''
            }
            onChange={(event) =>
              onParams({ ...params, description: event.target.value })
            }
          />,
        )}
      </>
    );
  else if (row.op === 'issue.update') {
    const set = asRecord(params.set);
    const change = (values: Readonly<Record<string, unknown>>) =>
      onParams({ ...params, set: { ...set, ...values } });
    fields = Object.keys(set).map((name) => {
      const value = set[name];
      switch (name) {
        case 'title':
          return field(
            name,
            <Input
              id={id(name)}
              disabled={disabled}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => change({ title: event.target.value })}
            />,
          );
        case 'description':
          return field(
            name,
            <Textarea
              id={id(name)}
              rows={2}
              disabled={disabled}
              value={typeof value === 'string' ? value : ''}
              onChange={(event) => change({ description: event.target.value })}
            />,
          );
        case 'priority':
          return field(
            name,
            <PropertySelect
              id={id(name)}
              size='default'
              options={PRIORITIES.map((priority) => ({
                value: priority,
                label: t(`priority.${priority}`),
              }))}
              value={typeof value === 'string' ? value : 'none'}
              disabled={disabled}
              onChange={(next) => change({ priority: next ?? 'none' })}
            />,
          );
        case 'ownerUserId':
          return field(
            name,
            <PropertySelect
              id={id(name)}
              size='default'
              options={lookup.members.map((member) => ({
                value: member.userId,
                label: member.name,
              }))}
              value={typeof value === 'string' ? value : null}
              disabled={disabled}
              onChange={(next) => {
                if (next) change({ ownerUserId: next });
              }}
            />,
          );
        case 'executor':
          return field(
            name,
            <PmExecutorSelect
              id={id(name)}
              value={executorOf(value)}
              members={lookup.members}
              others={lookup.executors}
              disabled={disabled}
              onChange={(executor) => change({ executor })}
            />,
          );
        case 'labelIds':
          return field(
            name,
            <LabelsField
              id={id(name)}
              labels={lookup.labels}
              value={Array.isArray(value) ? value.map(String) : []}
              disabled={disabled}
              canCreate={canCreateLabels}
              onChange={(labelIds) => change({ labelIds })}
            />,
          );
        default:
          return (
            <p key={name} className='text-xs'>
              <span className='text-muted-foreground'>
                {t(`plans.fields.${name}`, { defaultValue: name })}:{' '}
              </span>
              {typeof value === 'string' || typeof value === 'number'
                ? String(value)
                : JSON.stringify(value)}
            </p>
          );
      }
    });
  }
  return (
    <div className='space-y-2'>
      <p className='text-sm'>
        <span className='text-muted-foreground'>
          {t(`plans.ops.${row.op}`)} ·{' '}
        </span>
        <span className={cn('font-medium', view.removed && 'line-through')}>
          {title}
        </span>
      </p>
      {fields && !view.removed ? (
        <div className='grid max-w-2xl gap-2 sm:grid-cols-2'>{fields}</div>
      ) : null}
    </div>
  );
}
