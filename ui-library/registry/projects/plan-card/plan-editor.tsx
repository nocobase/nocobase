/**
 * A plan's rows as an editable table: each new issue's title, project, priority, labels, executor, owner and stage in
 * place, its description below it, indenting a row under the one above it (outdenting lifts it); other rows' fields
 * stacked in their row. Rows are removed, never added; removing a parent hands its sub-issues to its own parent.
 * Edits stay local until "Save changes", which rehearses the plan again (`usePlanMutations().edit`) and shows each
 * failing row's error in place. The fields are `property-fields`.
 */
import {
  canUseSetting,
  executorOf,
  invalidRows,
  useCreateLabel,
  usePlanErrorText,
  usePlanLookup,
  usePlanMutations,
  usePlanRowTitle,
  useViewer,
  type PlanLookup,
} from '@nocobase/app-plugin-projects/client/kit';
import {
  abilitiesOf,
  blockingRefs,
  canIndent,
  canOutdent,
  counts,
  createdTitle,
  decodeProjectTarget,
  editRequest,
  encodeProjectTarget,
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
} from '@nocobase/app-plugin-projects/client/plan-model';
import { PRIORITIES } from '@nocobase/app-plugin-projects/shared/common';
import type { Executor } from '@nocobase/app-plugin-projects/shared/issues';
import type { IntakeRowChange } from '@nocobase/app-plugin-projects/shared/intake-ai';
import type {
  Plan,
  PlanRowCheck,
} from '@nocobase/app-plugin-projects/shared/plans';
import {
  AlertTriangleIcon,
  FileTextIcon,
  IndentDecreaseIcon,
  IndentIncreaseIcon,
  PlayIcon,
  RotateCcwIcon,
  SaveIcon,
  Trash2Icon,
  UserIcon,
} from 'lucide-react';
import { Fragment, useState, type ReactElement, type ReactNode } from 'react';

import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Spinner } from '#components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import { Textarea } from '#components/ui/textarea';
import { cn } from 'cn';

import {
  AgentIcon,
  PersonValue,
  PropertyDate,
  PropertyMultiSelect,
  PropertySelect,
  type PropertyFieldLabels,
  type PropertyOption,
} from '../../components/property-fields.js';
import { usePlanConfirm } from './plan-confirm.js';
import { PlanTag } from './plan-tag.js';
import {
  fieldLabel,
  usePlanCardText,
  usePlanNotify,
  type PlanCardTranslate,
} from './plan-text.js';

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
  /** Rendered between the table and the footer. */
  readonly below?: (state: PlanEditorState) => ReactNode;
  /** Nothing can be edited or decided meanwhile. */
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

/** A row a revision added or changed: a pale wash of the tag's hue, in both themes. */
const MARK_ROW_CLASS: Readonly<Record<IntakeRowChange, string>> = {
  added:
    'bg-[oklch(0.975_0.025_155)] hover:bg-[oklch(0.955_0.04_155)] dark:bg-[oklch(0.65_0.12_155/0.08)] dark:hover:bg-[oklch(0.65_0.12_155/0.14)]',
  changed:
    'bg-[oklch(0.98_0.035_85)] hover:bg-[oklch(0.96_0.05_85)] dark:bg-[oklch(0.75_0.13_75/0.08)] dark:hover:bg-[oklch(0.75_0.13_75/0.14)]',
};

/** A label's colour as a dot. */
const DOT: Readonly<Record<string, string>> = {
  gray: 'bg-muted-foreground/50',
  blue: 'bg-blue-500 dark:bg-blue-400',
  purple: 'bg-violet-500 dark:bg-violet-400',
  yellow: 'bg-amber-500 dark:bg-amber-400',
  green: 'bg-emerald-500 dark:bg-emerald-400',
  red: 'bg-red-500 dark:bg-red-400',
  orange: 'bg-orange-500 dark:bg-orange-400',
};

/** A field's accessible name, for a control whose visible label is its column. */
function HiddenLabel({
  htmlFor,
  children,
}: {
  readonly htmlFor: string;
  readonly children: string;
}): ReactElement {
  return (
    <label htmlFor={htmlFor} className='sr-only'>
      {children}
    </label>
  );
}

const encodeExecutor = (value: unknown): string | null => {
  const executor = executorOf(value);
  return executor ? `${executor.type}:${executor.id}` : null;
};

const decodeExecutor = (value: string | null): Executor | null => {
  if (value === null) return null;
  const separator = value.indexOf(':');
  return { type: value.slice(0, separator), id: value.slice(separator + 1) };
};

/** The words and choices every field of the editor shares. */
interface FieldKit {
  readonly t: PlanCardTranslate;
  readonly lookup: PlanLookup;
  readonly labels: PropertyFieldLabels;
  /** Creates a label by name, answering its id; absent when the viewer may not. */
  readonly createLabel?: (name: string) => Promise<string | undefined>;
}

function ExecutorField({
  id,
  label,
  value,
  disabled,
  kit,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: unknown;
  readonly disabled: boolean;
  readonly kit: FieldKit;
  readonly onChange: (executor: Executor | null) => void;
}): ReactElement {
  const { t, lookup } = kit;
  const options: PropertyOption[] = [
    ...lookup.executors.map((option) => ({
      value: `${option.type}:${option.id}`,
      label: option.name,
      icon: <AgentIcon />,
      ...(option.note ? { note: option.note } : {}),
      ...(option.disabled ? { disabled: true } : {}),
    })),
    ...lookup.members.map((member) => ({
      value: `user:${member.userId}`,
      label: member.name,
      icon: <UserIcon aria-hidden='true' />,
    })),
  ];
  const nameOf = (value: string): string =>
    options.find((option) => option.value === value)?.label ??
    value.slice(value.indexOf(':') + 1);
  return (
    <>
      <HiddenLabel htmlFor={id}>{label}</HiddenLabel>
      <PropertySelect
        id={id}
        options={options}
        value={encodeExecutor(value)}
        noneLabel={t('planCard.noExecutor')}
        disabled={disabled}
        renderValue={(current) => (
          <PersonValue
            name={nameOf(current)}
            agent={!current.startsWith('user:')}
          />
        )}
        onChange={(next) => onChange(decodeExecutor(next))}
      />
    </>
  );
}

function LabelsField({
  id,
  label,
  value,
  disabled,
  kit,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: unknown;
  readonly disabled: boolean;
  readonly kit: FieldKit;
  readonly onChange: (labelIds: string[]) => void;
}): ReactElement {
  const { t, lookup } = kit;
  return (
    <PropertyMultiSelect
      id={id}
      aria-label={label}
      options={lookup.labels.map((item) => ({
        value: item.id,
        label: item.name,
        render: (
          <span className='inline-flex items-center gap-1.5'>
            <span
              aria-hidden
              className={cn('size-2 rounded-full', DOT[item.color])}
            />
            {item.name}
          </span>
        ),
      }))}
      value={Array.isArray(value) ? value.map(String) : []}
      disabled={disabled}
      placeholder={t('planCard.labelsPlaceholder')}
      labels={kit.labels}
      {...(kit.createLabel ? { onCreate: kit.createLabel } : {})}
      onChange={onChange}
    />
  );
}

function PrioritySelect({
  id,
  label,
  value,
  disabled,
  t,
  onChange,
}: {
  readonly id: string;
  readonly label: string;
  readonly value: unknown;
  readonly disabled: boolean;
  readonly t: PlanCardTranslate;
  readonly onChange: (priority: string | null) => void;
}): ReactElement {
  return (
    <>
      <HiddenLabel htmlFor={id}>{label}</HiddenLabel>
      <PropertySelect
        id={id}
        options={PRIORITIES.map((priority) => ({
          value: priority,
          label: t(`planCard.priority.${priority}`),
        }))}
        value={typeof value === 'string' ? value : 'none'}
        disabled={disabled}
        onChange={onChange}
      />
    </>
  );
}

/**
 * The editor of an open plan's rows. Without `onExecuted` it only edits and saves; with it, the footer also executes
 * (or checks a failed or stale plan again).
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
  const { t } = usePlanCardText();
  const notify = usePlanNotify();
  const errors = usePlanErrorText();
  const rowTitle = usePlanRowTitle();
  const viewer = useViewer();
  const lookup = usePlanLookup();
  const createLabel = useCreateLabel();
  const mutations = usePlanMutations();
  const confirm = usePlanConfirm();
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
  const allCreate = views.every((view) => view.row.op === 'issue.create');
  const kit: FieldKit = {
    t,
    lookup,
    labels: {
      saving: t('planCard.saving'),
      createNamed: t('planCard.createNamed'),
      noOptions: t('planCard.noOptions'),
    },
    ...(canUseSetting(viewer, 'pm.labels', 'update')
      ? {
          createLabel: async (name: string) => {
            try {
              return (await createLabel(name)).id;
            } catch (error) {
              notify.error(error, t('planCard.labelCreateFailed'));
              return undefined;
            }
          },
        }
      : {}),
  };

  const edit = (changes: ReadonlyMap<string, RowEdit>) =>
    setEdits((current) => mergeEdits(current, changes));
  const setParams = (
    view: RowView,
    params: Readonly<Record<string, unknown>>,
  ) => edit(new Map([[view.row.id, { params }]]));
  const patch = (view: RowView, values: Readonly<Record<string, unknown>>) =>
    setParams(view, patchParams(view.params, values));

  /** The checks of a refused rehearsal, by row: they follow `rows` in order. */
  const checksOf = (
    rows: readonly RowView[],
    refused: readonly PlanRowCheck[],
  ): ReadonlyMap<string, PlanRowCheck> =>
    new Map(
      rows.flatMap((view, index) => {
        const check = refused[index];
        return check ? [[view.row.id, check] as const] : [];
      }),
    );

  async function save(): Promise<Plan | null> {
    const request = editRequest(plan, edits);
    if (!request) return plan;
    if (total.rows === 0) {
      notify.error(null, t('planCard.nothingLeft'));
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
      setChecks(
        checksOf(
          views.filter((view) => !view.removed),
          rows,
        ),
      );
      notify.error(null, t('planCard.rowsFailed'));
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
                ? t('planCard.executedIssues', { count: total.issues })
                : t('planCard.executed'),
            );
          else notify.error(null, t('planCard.executeFailed'));
          onExecuted?.(next);
        })
        .catch((error: unknown) => notify.error(error));
    });
  }

  async function retry(): Promise<void> {
    try {
      const next = await mutations.act('retry', plan);
      setChecks(new Map());
      notify.success(t('planCard.retried'));
      onSaved?.(next);
    } catch (error) {
      const rows = invalidRows(error);
      if (rows) {
        setChecks(checksOf(views, rows));
        notify.error(null, t('planCard.retryFailed'));
      } else notify.error(error);
    }
  }

  const errorOf = (view: RowView): string | null => {
    const check =
      checks.get(view.row.id) ?? (view.edited ? null : view.row.check);
    return check && !check.ok ? errors.row(check.error) : null;
  };

  return (
    <div className={cn('space-y-3', className)} data-testid='plan-editor'>
      <div className='rounded-md border'>
        {/*
          A cell's min-width does not hold in a table, so in a narrow column the title would be squeezed to a few
          characters. The table keeps its own width instead (in rem on purpose: a layout width that must not shrink
          under a compact preset) and scrolls sideways in its container.
        */}
        <Table className='min-w-[64rem]'>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[18rem]'>
                {t('planCard.columns.title')}
              </TableHead>
              <TableHead className='min-w-36'>
                {t('planCard.columns.project')}
              </TableHead>
              <TableHead className='min-w-32'>
                {t('planCard.columns.priority')}
              </TableHead>
              <TableHead className='min-w-40'>
                {t('planCard.columns.labels')}
              </TableHead>
              <TableHead className='min-w-40'>
                {t('planCard.columns.executor')}
              </TableHead>
              <TableHead className='min-w-36'>
                {t('planCard.columns.owner')}
              </TableHead>
              <TableHead className='w-20'>
                {t('planCard.columns.stage')}
              </TableHead>
              <TableHead className='w-10'>
                <span className='sr-only'>{t('planCard.columns.actions')}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {views.map((view, index) => {
              const title = rowTitle(view, views) || t('planCard.untitled');
              const error = view.removed ? null : errorOf(view);
              const mark = view.row.ref
                ? rowMarks?.get(view.row.ref)
                : undefined;
              const removable =
                abilities.edit &&
                (!view.row.ref || !blocking.has(view.row.ref));
              const disabled = busy || view.removed || !abilities.edit;
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
                        kit={kit}
                        disabled={disabled}
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
                          kit={kit}
                          disabled={disabled}
                          onParams={(params) => setParams(view, params)}
                        />
                      </TableCell>
                    )}
                    <TableCell className='w-10 align-top'>
                      {!abilities.edit ? null : view.removed ? (
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={t('planCard.restoreRow', { title })}
                          disabled={busy}
                          onClick={() =>
                            setEdits((current) =>
                              restoreEdits(current, view.row.id),
                            )
                          }
                        >
                          <RotateCcwIcon />
                        </Button>
                      ) : (
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          aria-label={t('planCard.removeRow', { title })}
                          title={
                            removable ? undefined : t('planCard.referenced')
                          }
                          disabled={busy || !removable}
                          onClick={() => edit(removalEdits(views, view))}
                        >
                          <Trash2Icon />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {view.row.op === 'issue.create' &&
                  describing.has(view.row.id) &&
                  !view.removed ? (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={8} className='pt-0'>
                        <Textarea
                          aria-label={t('planCard.editDescription', { title })}
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
            {t('planCard.unsaved')}
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
                {t('planCard.discardChanges')}
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
                {t('planCard.saveChanges')}
              </Button>
            </>
          ) : null}
          {onDone && !dirty ? (
            <Button variant='outline' disabled={busy} onClick={onDone}>
              {t('planCard.doneEditing')}
            </Button>
          ) : null}
          {onExecuted && abilities.retry && !dirty ? (
            <Button disabled={busy} onClick={() => void retry()}>
              {busy ? (
                <Spinner data-icon='inline-start' />
              ) : (
                <RotateCcwIcon data-icon='inline-start' />
              )}
              {t('planCard.retry')}
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
                ? t('planCard.createIssues', { count: total.issues })
                : dirty
                  ? t('planCard.saveAndExecute')
                  : t('planCard.execute')}
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
  kit,
  disabled,
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
  readonly kit: FieldKit;
  readonly disabled: boolean;
  /** What a revision did to the row. */
  readonly mark: IntakeRowChange | null;
  readonly describing: boolean;
  readonly onDescribe: () => void;
  readonly onPatch: (values: Readonly<Record<string, unknown>>) => void;
  readonly onIndent: () => void;
  readonly onOutdent: () => void;
}): ReactElement {
  const { t, lookup } = kit;
  const { params, row } = view;
  const cell = (name: string) => `plan-${row.id}-${name}`;
  const named = (column: Parameters<typeof columnLabel>[1]) =>
    `${title} ${columnLabel(t, column)}`;
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
        label: createdTitle(other.params) || t('planCard.newProject'),
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
            <PlanTag
              tone={mark === 'added' ? 'green' : 'amber'}
              className='mt-2'
              data-testid={`plan-row-${mark}`}
            >
              {t(`planCard.change.${mark}`)}
            </PlanTag>
          ) : null}
          <Button
            variant='ghost'
            size='icon-xs'
            className='mt-1'
            disabled={disabled || !canOutdent(views, index)}
            aria-label={t('planCard.outdent', { title })}
            onClick={onOutdent}
          >
            <IndentDecreaseIcon />
          </Button>
          <Button
            variant='ghost'
            size='icon-xs'
            className='mt-1'
            disabled={disabled || !canIndent(views, index)}
            aria-label={t('planCard.indent', { title })}
            onClick={onIndent}
          >
            <IndentIncreaseIcon />
          </Button>
          <Textarea
            id={cell('title')}
            value={typeof params.title === 'string' ? params.title : ''}
            rows={1}
            disabled={disabled}
            aria-label={named('title')}
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
            aria-label={t('planCard.editDescription', { title })}
            aria-expanded={describing}
            disabled={view.removed}
            onClick={onDescribe}
          >
            <FileTextIcon />
          </Button>
        </div>
      </TableCell>
      <TableCell className='min-w-36 align-top'>
        <HiddenLabel htmlFor={cell('project')}>{named('project')}</HiddenLabel>
        <PropertySelect
          id={cell('project')}
          options={projects}
          value={encodeProjectTarget(params.projectId)}
          noneLabel={t('planCard.noProject')}
          disabled={disabled}
          onChange={(value) =>
            onPatch({
              projectId:
                value === null ? undefined : decodeProjectTarget(value),
            })
          }
        />
      </TableCell>
      <TableCell className='min-w-32 align-top'>
        <PrioritySelect
          id={cell('priority')}
          label={named('priority')}
          value={params.priority}
          disabled={disabled}
          t={t}
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
          label={named('labels')}
          value={params.labelIds}
          disabled={disabled}
          kit={kit}
          onChange={(labelIds) =>
            onPatch({ labelIds: labelIds.length > 0 ? labelIds : undefined })
          }
        />
      </TableCell>
      <TableCell className='min-w-40 align-top'>
        <ExecutorField
          id={cell('executor')}
          label={named('executor')}
          value={params.executor}
          disabled={disabled}
          kit={kit}
          onChange={(executor) => onPatch({ executor: executor ?? undefined })}
        />
      </TableCell>
      <TableCell className='min-w-36 align-top'>
        <HiddenLabel htmlFor={cell('owner')}>{named('owner')}</HiddenLabel>
        <PropertySelect
          id={cell('owner')}
          options={lookup.members.map((member) => ({
            value: member.userId,
            label: member.name,
          }))}
          value={
            typeof params.ownerUserId === 'string' ? params.ownerUserId : null
          }
          noneLabel={t('planCard.defaultOwner')}
          disabled={disabled}
          onChange={(value) => onPatch({ ownerUserId: value ?? undefined })}
        />
      </TableCell>
      <TableCell className='w-20 align-top'>
        <StageInput
          id={cell('stage')}
          label={named('stage')}
          value={params.stage}
          disabled={disabled || !hasParent}
          onChange={(stage) => onPatch({ stage })}
        />
      </TableCell>
    </>
  );
}

type Column =
  'title' | 'project' | 'priority' | 'labels' | 'executor' | 'owner' | 'stage';

function columnLabel(t: PlanCardTranslate, column: Column): string {
  return t(`planCard.columns.${column}`);
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
  kit,
  disabled,
  onParams,
}: {
  readonly view: RowView;
  readonly title: string;
  readonly kit: FieldKit;
  readonly disabled: boolean;
  readonly onParams: (params: Readonly<Record<string, unknown>>) => void;
}): ReactElement {
  const { t, lookup } = kit;
  const { params, row } = view;
  const id = (name: string) => `plan-${row.id}-${name}`;
  const field = (name: string, control: ReactNode) => (
    <div key={name} className='grid gap-1 text-xs text-muted-foreground'>
      <label htmlFor={id(name)}>{fieldLabel(t, name)}</label>
      {control}
    </div>
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
    const set =
      params.set && typeof params.set === 'object' && !Array.isArray(params.set)
        ? (params.set as Readonly<Record<string, unknown>>)
        : {};
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
          return (
            <div
              key={name}
              className='grid gap-1 text-xs text-muted-foreground'
            >
              <span aria-hidden='true'>{fieldLabel(t, name)}</span>
              <PrioritySelect
                id={id(name)}
                label={fieldLabel(t, name)}
                value={value}
                disabled={disabled}
                t={t}
                onChange={(next) => change({ priority: next ?? 'none' })}
              />
            </div>
          );
        case 'ownerUserId':
          return field(
            name,
            <PropertySelect
              id={id(name)}
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
          return (
            <div
              key={name}
              className='grid gap-1 text-xs text-muted-foreground'
            >
              <span aria-hidden='true'>{fieldLabel(t, name)}</span>
              <ExecutorField
                id={id(name)}
                label={fieldLabel(t, name)}
                value={value}
                disabled={disabled}
                kit={kit}
                onChange={(executor) => change({ executor })}
              />
            </div>
          );
        case 'labelIds':
          return (
            <div
              key={name}
              className='grid gap-1 text-xs text-muted-foreground'
            >
              <span aria-hidden='true'>{fieldLabel(t, name)}</span>
              <LabelsField
                id={id(name)}
                label={fieldLabel(t, name)}
                value={value}
                disabled={disabled}
                kit={kit}
                onChange={(labelIds) => change({ labelIds })}
              />
            </div>
          );
        case 'startDate':
        case 'dueDate':
          return field(
            name,
            <PropertyDate
              id={id(name)}
              value={typeof value === 'string' ? value : null}
              disabled={disabled}
              clearLabel={t('planCard.clearDate')}
              onChange={(next) => change({ [name]: next })}
            />,
          );
        default:
          return (
            <p key={name} className='text-xs'>
              <span className='text-muted-foreground'>
                {fieldLabel(t, name)}:{' '}
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
          {t(`planCard.ops.${row.op}`)} ·{' '}
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
