/**
 * The split view of the issue lists (`?view=split`): the grouped tasks on the left (`task-list.tsx`), the selected
 * task on the right (`detail-pane.tsx`), so moving between tasks never leaves the page. The selection is in the URL
 * (`?issue=PM-386`, replaced as it changes), so a refresh, a shared link and the browser's Back come back to it; the
 * full page opens over the list, which keeps its selection and scroll for the way back.
 *
 * The keyboard, outside text fields and menus: J / K or ↓ / ↑ move through the list in its order, S follows or
 * unfollows, Enter opens the full page, / goes to the search and Esc back to the list. The divider between the two
 * drags (or takes ← and →) to set the list's width, which is remembered.
 */
import type { IssueFilters } from '@nocobase/app-plugin-projects/client/issues';
import {
  PmEmpty,
  PmListSkeleton,
  PmLoadError,
} from '@nocobase/app-plugin-projects/client/kit';
import { useTranslation } from '@nocobase/i18n/client';
import { ListTodoIcon } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react';
import { useLocation, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { cn } from 'cn';

import { isRecoverable } from './api.js';
import { typingIn } from './keys.js';
import type { DetailTab } from './detail-model.js';
import { TaskDetailPane } from './detail-pane.js';
import { LIST_WIDTH, useListWidth } from './prefs.js';
import { TaskGroupCard, TaskRow } from './task-list.js';
import { useTaskList, type TaskListState } from './use-task-list.js';

export function SplitIssuesView({
  filters,
  filtered,
  follow,
  pageKey,
  selectedParam,
  onSelect,
  listPath,
  searchRef,
  onClearFilters,
  empty,
}: {
  readonly filters: IssueFilters;
  readonly filtered: boolean;
  readonly follow: 'all' | 'scope';
  readonly pageKey: string;
  readonly selectedParam: string | null;
  readonly onSelect: (id: string | null) => void;
  /** The list page's address; an issue's full page is under it. */
  readonly listPath: string;
  readonly searchRef: RefObject<HTMLInputElement | null>;
  readonly onClearFilters: () => void;
  readonly empty: { title: string; description: string; action?: ReactNode };
}): ReactElement {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const list = useTaskList({
    filters,
    follow,
    pageKey,
    selectedParam,
    onSelect,
  });
  const [tab, setTab] = useState<DetailTab>('feed');
  const [width, setWidth] = useListWidth();
  const listRef = useRef<HTMLDivElement>(null);
  const issuePath = (identifier: string) =>
    `${listPath}/${encodeURIComponent(identifier)}`;

  const focusSelected = useCallback(() => {
    const row = listRef.current?.querySelector<HTMLElement>(
      '[role=option][aria-selected=true]',
    );
    (
      row ?? listRef.current?.querySelector<HTMLElement>('[role=option]')
    )?.focus();
  }, []);

  // Keep the selected row in view as J and K move through the list, and the focus on it while the list has it.
  useEffect(() => {
    const row = list.selectedId
      ? listRef.current?.querySelector<HTMLElement>(
          `[data-task-id="${CSS.escape(list.selectedId)}"]`,
        )
      : null;
    row?.scrollIntoView({ block: 'nearest' });
    if (row && listRef.current?.contains(document.activeElement)) row.focus();
  }, [list.selectedId]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      )
        return;
      if (event.key === 'Escape') {
        if (
          !typingIn(event.target) ||
          listRef.current?.contains(event.target as Node)
        )
          focusSelected();
        return;
      }
      if (typingIn(event.target)) return;
      const key = event.key;
      if (key === 'j' || key === 'ArrowDown') {
        event.preventDefault();
        list.step(1);
      } else if (key === 'k' || key === 'ArrowUp') {
        event.preventDefault();
        list.step(-1);
      } else if (key === 's' && list.selected) {
        event.preventDefault();
        list.toggleFollow(list.selected);
      } else if (key === 'Enter' && list.selected) {
        // Enter on a button or link inside the detail keeps its own meaning.
        const target = event.target as HTMLElement | null;
        if (target?.closest('button,a') && !target.closest('[role=option]'))
          return;
        event.preventDefault();
        void navigate({
          pathname: issuePath(list.selected.issue.identifier),
          search: location.search,
        });
      } else if (key === '/') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!list.data) {
    if (list.query.isError)
      return (
        <PmLoadError
          title={t('taskGroups.loadFailed')}
          error={list.query.error}
          {...(isRecoverable(list.query.error)
            ? { onRetry: () => void list.query.refetch() }
            : {})}
        />
      );
    return <PmListSkeleton />;
  }
  if (list.empty && !filtered && list.groups.every((g) => g.group === 'follow'))
    return (
      <PmEmpty
        icon={<ListTodoIcon />}
        title={empty.title}
        description={empty.description}
        action={empty.action}
      />
    );

  const index = list.selectedId ? list.order.indexOf(list.selectedId) : -1;
  // A task named in the address shows even when the list does not hold it, such as one finished long ago.
  const shownId = list.selected?.issue.id ?? selectedParam;
  return (
    <div className='flex h-full min-h-0' data-testid='split-view'>
      <div
        style={{ width }}
        className='flex min-h-0 shrink-0 flex-col'
        data-testid='split-list'
      >
        <TaskListBody
          list={list}
          listRef={listRef}
          locale={i18n.language}
          filtered={filtered}
          onClearFilters={onClearFilters}
        />
        <div className='flex shrink-0 flex-wrap gap-x-3 gap-y-1 pt-2 pr-2 text-xs text-muted-foreground max-lg:hidden'>
          <span>
            <Kbd>J</Kbd> <Kbd>K</Kbd> {t('taskGroups.keys.switch')}
          </span>
          <span>
            <Kbd>S</Kbd> {t('taskGroups.keys.follow')}
          </span>
          <span>
            <Kbd>Enter</Kbd> {t('taskGroups.keys.open')}
          </span>
          <span>
            <Kbd>/</Kbd> {t('taskGroups.keys.search')}
          </span>
        </div>
      </div>
      <Divider width={width} onWidth={setWidth} />
      <div className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-card'>
        {shownId ? (
          <TaskDetailPane
            key={shownId}
            issueId={shownId}
            variant='split'
            issuePath={issuePath(list.selected?.issue.identifier ?? shownId)}
            issueSearch={location.search}
            tab={tab}
            onTabChange={setTab}
            onGoto={(id) => list.select(id)}
            following={list.query.data?.following}
            nav={{
              index: index + 1,
              total: list.order.length,
              onPrevious: index > 0 ? () => list.step(-1) : undefined,
              onNext:
                index < list.order.length - 1 ? () => list.step(1) : undefined,
            }}
            className='flex-1'
          />
        ) : (
          <p className='m-auto p-6 text-sm text-muted-foreground'>
            {t('taskGroups.detail.empty')}
          </p>
        )}
      </div>
    </div>
  );
}

/** The groups as cards over the list's grey; a listbox the keyboard moves through. */
export function TaskListBody({
  list,
  listRef,
  locale,
  filtered,
  onClearFilters,
  phone = false,
}: {
  readonly list: TaskListState;
  readonly listRef?: RefObject<HTMLDivElement | null>;
  readonly locale: string;
  readonly filtered: boolean;
  readonly onClearFilters: () => void;
  readonly phone?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const nothing = list.groups.every((group) => group.items.length === 0);
  return (
    <div
      ref={listRef}
      role='listbox'
      data-task-list
      aria-label={t('taskGroups.listLabel')}
      aria-activedescendant={
        list.selectedId ? `task-option-${list.selectedId}` : undefined
      }
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-y-contain',
        // The split view's list sits flush with the page; the phone's fills a grey band of its own.
        phone ? 'p-3' : 'pr-2',
      )}
    >
      {list.groups.map((group) => {
        const folded = list.isFolded(group.group);
        return (
          <TaskGroupCard
            key={group.group}
            group={group}
            folded={folded}
            onToggle={() => list.toggleGroup(group.group)}
            phone={phone}
          >
            {group.items.length === 0 ? null : (
              <div className='divide-y'>
                {group.items.map((item) => (
                  <TaskRow
                    key={`${group.group}:${item.issue.id}`}
                    item={item}
                    selected={item.issue.id === list.selectedId}
                    onSelect={list.select}
                    onToggleFollow={list.toggleFollow}
                    workingAgent={list.working.get(item.issue.id) ?? null}
                    phone={phone}
                    locale={locale}
                  />
                ))}
                {(group.showMore ?? Boolean(group.nextCursor)) ? (
                  <div className='px-3 py-2'>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='w-full'
                      disabled={list.query.isFetching || !group.nextCursor}
                      onClick={() => list.loadMore(group.group)}
                    >
                      {t('taskGroups.loadMore')}
                    </Button>
                  </div>
                ) : null}
              </div>
            )}
          </TaskGroupCard>
        );
      })}
      {nothing && filtered ? (
        <div className='flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground'>
          <span>{t('taskGroups.noResults')}</span>
          <Button variant='outline' size='sm' onClick={onClearFilters}>
            {t('issuesPage.clearFilters')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** The draggable line between the list and the task, also moved with ← and →. */
function Divider({
  width,
  onWidth,
}: {
  readonly width: number;
  readonly onWidth: (width: number) => void;
}): ReactElement {
  const { t } = useTranslation();
  const startRef = useRef<{ x: number; width: number } | null>(null);
  return (
    <div
      role='separator'
      aria-orientation='vertical'
      aria-label={t('taskGroups.resize')}
      aria-valuemin={LIST_WIDTH.min}
      aria-valuemax={LIST_WIDTH.max}
      aria-valuenow={width}
      tabIndex={0}
      data-testid='split-divider'
      className='group/divider relative mx-1 w-1 shrink-0 cursor-col-resize rounded-full outline-none after:absolute after:inset-y-0 after:-inset-x-1.5 after:content-[""] hover:bg-border focus-visible:bg-primary'
      onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        startRef.current = { x: event.clientX, width };
      }}
      onPointerMove={(event: ReactPointerEvent<HTMLDivElement>) => {
        if (!startRef.current) return;
        onWidth(startRef.current.width + event.clientX - startRef.current.x);
      }}
      onPointerUp={() => {
        startRef.current = null;
      }}
      onKeyDown={(event: ReactKeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'ArrowLeft') onWidth(width - 16);
        else if (event.key === 'ArrowRight') onWidth(width + 16);
        else return;
        event.preventDefault();
        event.stopPropagation();
      }}
    />
  );
}
