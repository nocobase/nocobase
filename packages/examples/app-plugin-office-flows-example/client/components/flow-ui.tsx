import { useState, type ReactElement, type ReactNode } from 'react';
import { useTranslation } from '@nocobase/i18n/client';

import { PEOPLE, personName } from '../../shared/people.js';
import type {
  Available,
  Config,
  Plain,
  ProcessingLevel,
  RecordView,
} from '../lib/api.js';
import { CREATE_TRANSITION, list } from '../lib/api.js';
import { NAMESPACE, names } from '../lib/format.js';
import { stateLabel, TASK_LIFECYCLE } from '../lib/labels.js';
import { cn } from '../lib/utils.js';
import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.js';
import { Input } from './ui/input.js';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.js';
import { text } from '../../shared/text.js';

export function PersonaSelect({
  value,
  onChange,
}: {
  readonly value: string;
  readonly onChange: (id: string) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const items = PEOPLE.map((person) => ({
    value: person.id,
    label: `${person.name} · ${person.title}`,
  }));
  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm text-muted-foreground'>{t('common.actAs')}</span>
      <Select
        items={items}
        value={value}
        onValueChange={(next) => {
          if (typeof next === 'string') onChange(next);
        }}
      >
        <SelectTrigger aria-label={t('common.actAs')} className='min-w-56'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function Section({
  title,
  actions,
  children,
  className,
}: {
  readonly title: ReactNode;
  readonly actions?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <Card className={cn('min-w-0', className)}>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <CardTitle>{title}</CardTitle>
          {actions}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>{children}</CardContent>
    </Card>
  );
}

export function Field({
  label,
  required,
  error,
  children,
  wide,
}: {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string | undefined;
  readonly children: ReactNode;
  readonly wide?: boolean;
}): ReactElement {
  return (
    // A group named by its label, so every control inside it is announced
    // with the question it answers.
    <div
      role='group'
      aria-label={label}
      className={cn('min-w-0 space-y-1.5', wide && 'sm:col-span-2')}
    >
      <div className='text-sm font-medium'>
        {label}
        {required ? <span className='ml-0.5 text-destructive'>*</span> : null}
      </div>
      {children}
      {error ? <p className='text-xs text-destructive'>{error}</p> : null}
    </div>
  );
}

export function ReadField({
  label,
  value,
  wide,
}: {
  readonly label: string;
  readonly value: ReactNode;
  readonly wide?: boolean;
}): ReactElement {
  return (
    <div className={cn('min-w-0', wide && 'sm:col-span-2')}>
      <div className='text-xs text-muted-foreground'>{label}</div>
      <div className='text-sm break-words whitespace-pre-wrap'>
        {value || '—'}
      </div>
    </div>
  );
}

export function TextArea({
  value,
  onChange,
  disabled,
  label,
}: {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly label: string;
}): ReactElement {
  return (
    <textarea
      aria-label={label}
      className='min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60'
      maxLength={4000}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

/** A single choice shown as a row of buttons, so every option is visible. */
export function Choice<T extends string | number | boolean>({
  options,
  value,
  onChange,
  disabled,
}: {
  readonly options: readonly { readonly value: T; readonly label: string }[];
  readonly value: T | null | '';
  readonly onChange: (value: T) => void;
  readonly disabled?: boolean;
}): ReactElement {
  return (
    <div className='flex flex-wrap gap-1.5' role='radiogroup'>
      {options.map((option) => (
        <Button
          key={text(option.value)}
          type='button'
          size='sm'
          role='radio'
          aria-checked={value === option.value}
          variant={value === option.value ? 'default' : 'outline'}
          disabled={disabled}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function MultiChoice({
  options,
  values,
  onChange,
  disabled,
}: {
  readonly options: readonly string[];
  readonly values: readonly string[];
  readonly onChange: (values: string[]) => void;
  readonly disabled?: boolean;
}): ReactElement {
  return (
    <div className='flex flex-wrap gap-1.5'>
      {options.map((option) => {
        const on = values.includes(option);
        return (
          <Button
            key={option}
            type='button'
            size='sm'
            aria-pressed={on}
            variant={on ? 'default' : 'outline'}
            disabled={disabled}
            onClick={() =>
              onChange(
                on
                  ? values.filter((item) => item !== option)
                  : [...values, option],
              )
            }
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

/**
 * Attachments as file names. The example keeps the names only; a real
 * application stores the files through the file plugin.
 */
export function FilesField({
  value,
  onChange,
  disabled,
  label,
}: {
  readonly value: readonly string[];
  readonly onChange: (value: string[]) => void;
  readonly disabled?: boolean;
  readonly label: string;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  return (
    <div className='space-y-1.5'>
      <div className='flex flex-wrap gap-1.5'>
        {value.map((name) => (
          <Badge key={name} variant='secondary'>
            {name}
            {disabled ? null : (
              <button
                type='button'
                className='ml-1 text-muted-foreground hover:text-foreground'
                aria-label={t('common.remove', { name })}
                onClick={() => onChange(value.filter((item) => item !== name))}
              >
                ×
              </button>
            )}
          </Badge>
        ))}
        {!value.length && disabled ? (
          <span className='text-sm text-muted-foreground'>—</span>
        ) : null}
      </div>
      {disabled ? null : (
        <input
          type='file'
          multiple
          aria-label={label}
          className='text-sm file:mr-2 file:rounded-md file:border file:border-input file:bg-transparent file:px-2 file:py-1 file:text-sm'
          onChange={(event) => {
            const picked = [...(event.target.files ?? [])].map(
              (file) => file.name,
            );
            onChange([...new Set([...value, ...picked])]);
            event.target.value = '';
          }}
        />
      )}
    </div>
  );
}

/** The lifecycle's states in order, the current one marked. */
export function StateBar({
  lifecycle,
  view,
}: {
  readonly lifecycle: string;
  readonly view: RecordView;
}): ReactElement {
  return (
    <ol className='flex flex-wrap gap-1.5'>
      {view.description.states.map((state) => (
        <li
          key={state}
          aria-current={state === view.record.status ? 'step' : undefined}
          className={cn(
            'rounded-full border px-2.5 py-0.5 text-xs',
            state === view.record.status
              ? 'border-primary bg-primary text-primary-foreground'
              : 'text-muted-foreground',
          )}
        >
          {stateLabel(lifecycle, state)}
        </li>
      ))}
    </ol>
  );
}

/**
 * The transitions the record's state allows; those the persona may not fire
 * stay visible but disabled. Transitions listed in `needsReason` take the
 * text in the box as their `reason`.
 */
export function Actions({
  available,
  busy,
  needsReason = [],
  hidden = [],
  onFire,
}: {
  readonly available: readonly Available[];
  readonly busy: boolean;
  readonly needsReason?: readonly string[];
  readonly hidden?: readonly string[];
  readonly onFire: (transition: string, input: Plain) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const [reason, setReason] = useState('');
  const shown = available.filter((item) => !hidden.includes(item.name));
  const wantsReason = shown.some(
    (item) => item.allowed && needsReason.includes(item.name),
  );
  if (!shown.length)
    return <p className='text-sm text-muted-foreground'>{t('common.final')}</p>;
  return (
    <div className='space-y-2'>
      {wantsReason ? (
        <Input
          aria-label={t('common.reason')}
          placeholder={t('common.reason')}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      ) : null}
      <div className='flex flex-wrap gap-2'>
        {shown.map((item) => (
          <Button
            key={item.name}
            variant='secondary'
            disabled={busy || !item.allowed}
            title={item.allowed ? undefined : t('common.notAllowed')}
            onClick={() => {
              onFire(
                item.name,
                needsReason.includes(item.name) ? { reason } : {},
              );
              setReason('');
            }}
          >
            {item.title}
          </Button>
        ))}
      </div>
    </div>
  );
}

function time(value: unknown): string {
  const date = new Date(text(value));
  return Number.isNaN(date.getTime())
    ? text(value)
    : date.toLocaleString('zh-CN', { hour12: false });
}

/** Transitions with the effects they caused, and the record's traces, newest first. */
export function History({
  lifecycle,
  view,
}: {
  readonly lifecycle: string;
  readonly view: RecordView;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const titles = new Map(
    view.description.transitions.map((item) => [item.name, item.title]),
  );
  const entries = [
    ...view.history.transitions.map((entry) => ({
      key: `t${entry.id}`,
      at: entry.at,
      node: (
        <div className='space-y-1'>
          <p className='text-sm'>
            <span className='font-medium'>
              {entry.transition === CREATE_TRANSITION
                ? t('common.created')
                : (titles.get(entry.transition) ?? entry.transition)}
            </span>{' '}
            <span className='text-muted-foreground'>
              {entry.from === null
                ? ''
                : `${stateLabel(lifecycle, entry.from)} → `}
              {stateLabel(lifecycle, entry.to)}
            </span>
          </p>
          <p className='text-xs text-muted-foreground'>
            {personName(entry.actorId)} · {time(entry.at)}
            {Object.keys(entry.input).filter((key) => key !== 'rowIds').length
              ? ` · ${JSON.stringify(
                  Object.fromEntries(
                    Object.entries(entry.input).filter(
                      ([key]) => key !== 'rowIds',
                    ),
                  ),
                )}`
              : ''}
          </p>
          {view.history.effectRuns
            .filter((run) => run.transitionId === entry.id)
            .map((run) => (
              <p key={run.id} className='text-xs'>
                <code className='font-mono'>{run.effect}</code>{' '}
                <Badge
                  variant={run.status === 'failed' ? 'destructive' : 'outline'}
                >
                  {t(`runs.${run.status}`)}
                </Badge>{' '}
                {run.error ? (
                  <span className='text-destructive'>{run.error}</span>
                ) : null}
              </p>
            ))}
        </div>
      ),
    })),
    ...view.traces.map((trace) => ({
      key: `r${trace.id}`,
      at: trace.at,
      node: (
        <div className='space-y-1 rounded-md bg-muted/60 px-3 py-2'>
          <p className='text-sm font-medium'>{trace.action}</p>
          <p className='text-xs text-muted-foreground'>
            {personName(trace.actorId)} · {time(trace.at)}
          </p>
          <TraceDetail detail={trace.detail} />
        </div>
      ),
    })),
  ].sort((left, right) => text(right.at).localeCompare(text(left.at)));
  if (!entries.length)
    return (
      <p className='text-sm text-muted-foreground'>{t('common.noHistory')}</p>
    );
  return (
    <ol className='space-y-3 border-l pl-4'>
      {entries.map((entry) => (
        <li key={entry.key}>{entry.node}</li>
      ))}
    </ol>
  );
}

function TraceDetail({ detail }: { readonly detail: Plain }): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const departments = list(detail.departments);
  const groups = list(detail.groups);
  return (
    <div className='space-y-0.5 text-xs'>
      {departments.length ? (
        <p>
          {t('trace.departments')}：{departments.join('、')}
          {list(detail.numbers).length
            ? `（${list(detail.numbers).join('、')}）`
            : ''}
        </p>
      ) : null}
      {groups.length ? (
        <p>
          {t('trace.groups')}：{groups.join('、')}
        </p>
      ) : null}
      <p>
        {t('trace.notified')}：{names(detail.notified)}
      </p>
      {list(detail.skipped).length ? (
        <p className='text-muted-foreground'>
          {t('trace.skipped')}：{names(detail.skipped)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Distribution rows: a department, its people as the row's checkboxes
 * chose them from the department configuration, and whether it went out.
 */
export function RowsTable({
  rows,
  config,
  editable,
  allowAssist,
  dispatchLabel,
  onAdd,
  onRemove,
  onDispatch,
  busy,
}: {
  readonly rows: readonly Plain[];
  readonly config: Config | undefined;
  readonly editable: boolean;
  readonly allowAssist?: boolean;
  readonly dispatchLabel: string;
  readonly onAdd: (row: Plain) => void;
  readonly onRemove: (rowId: string) => void;
  readonly onDispatch: () => void;
  readonly busy: boolean;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const [department, setDepartment] = useState('');
  const [heads, setHeads] = useState(false);
  const [leaders, setLeaders] = useState(false);
  const [assist, setAssist] = useState(false);
  const pending = rows.filter((row) => !row.dispatched).length;
  const departments = (config?.departments ?? []).map((item) => ({
    value: item.name,
    label: item.name,
  }));
  return (
    <div className='space-y-3'>
      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-xs text-muted-foreground'>
            <tr>
              <th className='px-3 py-2 font-medium'>{t('rows.department')}</th>
              <th className='px-3 py-2 font-medium'>{t('rows.clerks')}</th>
              <th className='px-3 py-2 font-medium'>{t('rows.heads')}</th>
              <th className='px-3 py-2 font-medium'>{t('rows.leaders')}</th>
              <th className='px-3 py-2 font-medium'>{t('rows.dispatched')}</th>
              <th className='px-3 py-2' />
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={text(row.id)} className='border-t'>
                  <td className='px-3 py-2'>
                    {text(row.departmentName)}
                    {row.origin ? (
                      <span className='ml-1 text-xs text-muted-foreground'>
                        {t('rows.assist')}
                      </span>
                    ) : null}
                  </td>
                  <td className='px-3 py-2'>{names(row.assignees)}</td>
                  <td className='px-3 py-2'>{names(row.ccHeads)}</td>
                  <td className='px-3 py-2'>{names(row.ccLeaders)}</td>
                  <td className='px-3 py-2'>
                    <Badge variant={row.dispatched ? 'default' : 'outline'}>
                      {row.dispatched ? t('rows.yes') : t('rows.no')}
                    </Badge>
                  </td>
                  <td className='px-3 py-2 text-right'>
                    {editable && !row.dispatched ? (
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => onRemove(text(row.id))}
                      >
                        {t('common.delete')}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className='px-3 py-4 text-center text-muted-foreground'
                >
                  {t('rows.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {editable ? (
        <div className='flex flex-wrap items-end gap-3 rounded-lg border border-dashed p-3'>
          <div className='space-y-1'>
            <div className='text-xs text-muted-foreground'>
              {t('rows.department')}
            </div>
            <Select
              items={departments}
              value={department}
              onValueChange={(next) => {
                if (typeof next === 'string') setDepartment(next);
              }}
            >
              <SelectTrigger
                aria-label={t('rows.department')}
                className='min-w-36'
              >
                <SelectValue placeholder={t('rows.pickDepartment')} />
              </SelectTrigger>
              <SelectContent>
                {departments.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex flex-wrap gap-1.5'>
            <Button size='sm' variant='default' aria-pressed disabled>
              {t('rows.clerks')}
            </Button>
            <Button
              size='sm'
              aria-pressed={heads}
              variant={heads ? 'default' : 'outline'}
              onClick={() => setHeads(!heads)}
            >
              {t('rows.heads')}
            </Button>
            <Button
              size='sm'
              aria-pressed={leaders}
              variant={leaders ? 'default' : 'outline'}
              onClick={() => setLeaders(!leaders)}
            >
              {t('rows.leaders')}
            </Button>
            {allowAssist ? (
              <Button
                size='sm'
                aria-pressed={assist}
                variant={assist ? 'default' : 'outline'}
                onClick={() => setAssist(!assist)}
              >
                {t('rows.assistOther')}
              </Button>
            ) : null}
          </div>
          <Button
            size='sm'
            variant='secondary'
            disabled={!department || busy}
            onClick={() => {
              onAdd({
                departmentName: department,
                includeClerks: true,
                includeHeads: heads,
                includeLeaders: leaders,
                assistOther: assist,
              });
              setDepartment('');
              setAssist(false);
            }}
          >
            {assist ? t('rows.addAssist') : t('rows.add')}
          </Button>
          <Button size='sm' disabled={!pending || busy} onClick={onDispatch}>
            {dispatchLabel}（{pending}）
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * 处理列表: per level, the opinion its tasks answered, each department's
 * feedback, and the tasks themselves.
 */
export function Processing({
  levels,
  onOpen,
}: {
  readonly levels: readonly ProcessingLevel[];
  readonly onOpen?: (kind: string, id: string) => void;
}): ReactElement {
  const { t } = useTranslation(NAMESPACE);
  const [index, setIndex] = useState(0);
  const level = levels[Math.min(index, levels.length - 1)];
  if (!level) return <></>;
  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-1.5' role='tablist'>
        {levels.map((item, position) => (
          <Button
            key={item.title}
            size='sm'
            role='tab'
            aria-selected={position === index}
            variant={position === index ? 'default' : 'outline'}
            onClick={() => setIndex(position)}
          >
            {item.title}（{item.tasks.length}）
          </Button>
        ))}
      </div>
      <ReadField label={level.opinionLabel} value={level.opinion} />
      <div className='overflow-x-auto rounded-lg border'>
        <table className='w-full text-sm'>
          <thead className='bg-muted/50 text-left text-xs text-muted-foreground'>
            <tr>
              <th className='px-3 py-2 font-medium'>
                {t('processing.number')}
              </th>
              <th className='px-3 py-2 font-medium'>{t('processing.node')}</th>
              <th className='px-3 py-2 font-medium'>
                {t('processing.assignees')}
              </th>
              <th className='px-3 py-2 font-medium'>{t('rows.department')}</th>
              <th className='px-3 py-2 font-medium'>
                {t('processing.feedback')}
              </th>
              <th className='px-3 py-2 font-medium'>
                {t('processing.attachments')}
              </th>
            </tr>
          </thead>
          <tbody>
            {level.tasks.length ? (
              level.tasks.map((task) => (
                <tr key={text(task.id)} className='border-t align-top'>
                  <td className='px-3 py-2 font-mono text-xs'>
                    {onOpen ? (
                      <button
                        type='button'
                        className='text-primary underline-offset-2 hover:underline'
                        onClick={() => onOpen(level.kind, text(task.id))}
                      >
                        {text(task.number)}
                      </button>
                    ) : (
                      text(task.number)
                    )}
                  </td>
                  <td className='px-3 py-2'>
                    {stateLabel(TASK_LIFECYCLE[level.kind], task.status)}
                  </td>
                  <td className='px-3 py-2'>{names(task.assignees)}</td>
                  <td className='px-3 py-2'>{text(task.departmentName)}</td>
                  <td className='px-3 py-2 whitespace-pre-wrap'>
                    {text(task.feedback ?? '') || '—'}
                  </td>
                  <td className='px-3 py-2'>
                    {list(task.attachments).join('、') || '—'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className='px-3 py-4 text-center text-muted-foreground'
                >
                  {t('processing.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** A list of records to pick from: number, a summary and the current state. */
export function RecordList({
  records,
  lifecycle,
  selected,
  summarize,
  onSelect,
  empty,
}: {
  readonly records: readonly Plain[];
  readonly lifecycle: string;
  readonly selected: string | undefined;
  readonly summarize: (record: Plain) => string;
  readonly onSelect: (id: string) => void;
  readonly empty: string;
}): ReactElement {
  if (!records.length)
    return <p className='text-sm text-muted-foreground'>{empty}</p>;
  return (
    <ul className='space-y-1'>
      {records.map((record) => (
        <li key={text(record.id)}>
          <button
            type='button'
            onClick={() => onSelect(text(record.id))}
            className={cn(
              'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring',
              selected === text(record.id) && 'bg-muted',
            )}
          >
            <span className='min-w-0'>
              <span className='block font-mono text-xs text-muted-foreground'>
                {text(record.number)}
              </span>
              <span className='block truncate'>{summarize(record)}</span>
            </span>
            <Badge variant='secondary'>
              {stateLabel(lifecycle, record.status)}
            </Badge>
          </button>
        </li>
      ))}
    </ul>
  );
}
