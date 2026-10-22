import { useState, type ReactElement } from 'react';

import {
  TaskBulkBar,
  TaskBulkConfirm,
  TaskCenterLayout,
  TaskDetailSheet,
  TaskList,
  TaskListEmpty,
  TaskPagination,
  TaskSourceNav,
  TaskStatusTabs,
  matchesTaskStatusTab,
  useTaskSelection,
  type TaskCardData,
  type TaskCenterStatus,
  type TaskCenterStatusTab,
  type TaskNavSource,
} from '#extensions/nocobase-task-center-ui/index';

import {
  BULK_ACTIONS,
  bulkActionApplies,
  type DemoBulkAction,
} from './bulk-actions.js';
import { TaskDetail, TaskSummary } from './contributions.js';
import { NOW, SOURCES, SUBJECTS, TASKS, type DemoTask } from './fixtures.js';

const PAGE_SIZE = 6;

/** Pending tasks sort by arrival, closed ones by when they closed. */
function timeOf(task: DemoTask): string {
  return task.status === 'pending' ? task.createdAt : task.updatedAt;
}

function toCard(task: DemoTask): TaskCardData & { readonly task: DemoTask } {
  const source = SOURCES.find((item) => item.key === task.source);
  const subject = SUBJECTS[task.subject];
  return {
    id: task.id,
    task,
    title: task.title,
    status: task.status,
    statusLabel: source?.statusLabels[task.status] ?? task.status,
    time: timeOf(task),
    subject: task.subject,
    subjectLabel: subject?.label,
    icon: subject?.icon,
    summary: <TaskSummary task={task} />,
  };
}

export function TaskCenterUiDemo(): ReactElement {
  const [tasks, setTasks] = useState<readonly DemoTask[]>(TASKS);
  const [source, setSource] = useState(SOURCES[0].key);
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState<TaskCenterStatusTab>('pending');
  const [page, setPage] = useState(1);
  const [opened, setOpened] = useState<DemoTask>();
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<DemoBulkAction>();
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');

  // Navigation counts are pending counts in every tab.
  const pending = (key: string, subjectKey?: string): number =>
    tasks.filter(
      (task) =>
        task.source === key &&
        (!subjectKey || task.subject === subjectKey) &&
        task.status === 'pending',
    ).length;
  const navigation: TaskNavSource[] = SOURCES.map((item) => ({
    key: item.key,
    label: item.label,
    icon: item.icon,
    count: pending(item.key),
    subjects: Object.entries(SUBJECTS)
      .filter(([key]) =>
        tasks.some((task) => task.source === item.key && task.subject === key),
      )
      .map(([key, value]) => ({
        key,
        label: value.label,
        count: pending(item.key, key),
      })),
  }));

  const scoped = tasks.filter(
    (task) => task.source === source && (!subject || task.subject === subject),
  );
  const matching = scoped
    .filter((task) => matchesTaskStatusTab(task.status, status))
    .sort((a, b) => timeOf(b).localeCompare(timeOf(a)));
  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const cards = matching
    .slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    .map(toCard);

  const actions = BULK_ACTIONS.filter(
    (action) =>
      action.source === source &&
      (!subject || !action.subjects || action.subjects.includes(subject)),
  );
  const selection = useTaskSelection({
    tasks: cards,
    canSelect: (card) =>
      actions.some((action) => bulkActionApplies(action, card.task)),
    scope: JSON.stringify([source, subject, status, currentPage]),
    subjectLabel: (key) => SUBJECTS[key]?.label ?? key,
  });
  const applying = (action: DemoBulkAction): readonly DemoTask[] =>
    selection.selected
      .map((card) => card.task)
      .filter((task) => bulkActionApplies(action, task));

  const update = (ids: ReadonlySet<string>, next?: TaskCenterStatus): void => {
    if (!next) return;
    setTasks((current) =>
      current.map((task) =>
        ids.has(task.id)
          ? { ...task, status: next, updatedAt: NOW.toISOString() }
          : task,
      ),
    );
  };
  const select = (key: string, subjectKey = ''): void => {
    setSource(key);
    setSubject(subjectKey);
    setStatus('pending');
    setPage(1);
  };
  const confirmTasks = confirming ? applying(confirming) : [];

  return (
    <main className='mx-auto flex max-w-6xl flex-col gap-4 p-4 sm:p-6'>
      <header className='flex flex-col gap-1'>
        <h1 className='text-xl font-semibold'>Task center</h1>
        <p className='text-sm text-muted-foreground'>
          Everything waiting for you, by where it comes from.
        </p>
      </header>
      <p role='status' className='min-h-5 text-sm text-muted-foreground'>
        {message}
      </p>
      <TaskCenterLayout
        label={[
          SOURCES.find((item) => item.key === source)?.label,
          subject ? SUBJECTS[subject]?.label : undefined,
        ]
          .filter(Boolean)
          .join(' / ')}
        navigation={
          <TaskSourceNav
            sources={navigation}
            source={source}
            subject={subject}
            onSelect={select}
          />
        }
      >
        <TaskBulkBar
          count={selection.selected.length}
          actions={actions.map((action) => {
            const count = applying(action).length;
            return {
              key: action.key,
              label: action.label(count),
              icon: action.icon,
              primary: action.primary,
              count,
            };
          })}
          onClear={selection.clear}
          onRun={(key) =>
            setConfirming(actions.find((action) => action.key === key))
          }
        >
          <TaskStatusTabs
            value={status}
            counts={{
              pending: scoped.filter((task) => task.status === 'pending')
                .length,
              closed: scoped.filter((task) => task.status !== 'pending').length,
              all: scoped.length,
            }}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </TaskBulkBar>
        {cards.length ? (
          <TaskList
            tasks={cards}
            now={NOW}
            showSubject={!subject}
            selection={selection.list}
            onOpen={(card) =>
              setOpened(tasks.find((task) => task.id === card.id))
            }
          />
        ) : (
          <TaskListEmpty
            status={status}
            onShowAll={status === 'all' ? undefined : () => setStatus('all')}
          />
        )}
        <TaskPagination
          page={currentPage}
          pageCount={pageCount}
          total={matching.length}
          onPageChange={setPage}
        />
      </TaskCenterLayout>
      <TaskBulkConfirm
        open={Boolean(confirming)}
        title={confirming?.confirmTitle(confirmTasks.length) ?? ''}
        description={confirming?.confirmDescription}
        skipped={selection.selected.length - confirmTasks.length}
        tasks={confirmTasks}
        confirmLabel={confirming?.label(confirmTasks.length) ?? ''}
        running={running}
        onCancel={() => setConfirming(undefined)}
        onConfirm={() => {
          if (!confirming) return;
          setRunning(true);
          window.setTimeout(() => {
            update(
              new Set(confirmTasks.map((task) => task.id)),
              confirming.result,
            );
            setMessage(`${confirming.label(confirmTasks.length)}: done`);
            selection.clear();
            setConfirming(undefined);
            setRunning(false);
          }, 700);
        }}
      />
      <TaskDetailSheet
        task={opened ? toCard(opened) : undefined}
        now={NOW}
        busy={busy}
        onClose={() => setOpened(undefined)}
      >
        {opened ? (
          <TaskDetail
            key={opened.id}
            task={opened}
            onBusyChange={setBusy}
            onDone={(text, next) => {
              update(new Set([opened.id]), next);
              setMessage(`${opened.title}: ${text}`);
              setOpened(undefined);
            }}
          />
        ) : null}
      </TaskDetailSheet>
    </main>
  );
}
