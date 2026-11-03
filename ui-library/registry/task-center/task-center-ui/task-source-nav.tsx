import { useTranslation } from '@nocobase/i18n/client';
import { ChevronRight, Search, SearchX } from 'lucide-react';
import { useState, type ReactElement, type ReactNode } from 'react';

import { Button } from '#components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '#components/ui/collapsible';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';
import { cn } from 'cn';

import type { TaskNavSource } from './types.js';

export interface TaskSourceNavProps {
  readonly sources: readonly TaskNavSource[];
  /** The selected source. */
  readonly source: string;
  /** The selected subject; empty or undefined means every subject of the source. */
  readonly subject?: string;
  /** Selecting a source without a subject means all of its subjects. */
  readonly onSelect: (source: string, subject?: string) => void;
  /** Shows the subject search above the sources. Defaults to true. */
  readonly searchable?: boolean;
  readonly className?: string;
}

/**
 * The first two layers of a task center: sources, each with its subjects folded under it. Counts are the page's
 * pending counts. The search filters subjects by name on the client and unfolds every source with a match.
 */
export function TaskSourceNav({
  className,
  onSelect,
  searchable = true,
  source: currentSource,
  sources,
  subject: currentSubject,
}: TaskSourceNavProps): ReactElement {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(
    () => new Set([currentSource]),
  );
  const setOpen = (key: string, open: boolean): void =>
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(key);
      else next.delete(key);
      return next;
    });
  const [query, setQuery] = useState('');
  const keyword = query.trim().toLocaleLowerCase();
  const groups = sources
    .map((source) => ({
      source,
      subjects: source.subjects.filter(
        (item) => !keyword || item.label.toLocaleLowerCase().includes(keyword),
      ),
    }))
    .filter((group) => !keyword || group.subjects.length);

  return (
    <nav
      aria-label={t('taskCenterUi.nav.label', { defaultValue: 'Task sources' })}
      className={cn(
        'flex flex-col gap-3 rounded-xl border bg-card p-3 text-card-foreground',
        className,
      )}
    >
      {searchable ? (
        <InputGroup>
          <InputGroupAddon>
            <Search aria-hidden />
          </InputGroupAddon>
          <InputGroupInput
            type='search'
            value={query}
            aria-label={t('taskCenterUi.nav.search', {
              defaultValue: 'Search task types',
            })}
            placeholder={t('taskCenterUi.nav.search', {
              defaultValue: 'Search task types',
            })}
            onChange={(event) => setQuery(event.target.value)}
          />
        </InputGroup>
      ) : null}
      {keyword && !groups.length ? (
        <div className='flex flex-col items-center gap-2 px-2 py-6 text-center text-sm text-muted-foreground'>
          <SearchX aria-hidden className='size-5' />
          <p>
            {t('taskCenterUi.nav.noMatches', {
              defaultValue: 'No task type matches',
            })}
          </p>
          <Button variant='outline' size='sm' onClick={() => setQuery('')}>
            {t('taskCenterUi.nav.clearSearch', {
              defaultValue: 'Clear search',
            })}
          </Button>
        </div>
      ) : null}
      <ul className='flex flex-col gap-0.5'>
        {groups.map(({ source, subjects }) => {
          const Icon = source.icon;
          const selected = source.key === currentSource;
          const current = selected && !currentSubject;
          const open = Boolean(keyword) || expanded.has(source.key);
          return (
            <li key={source.key}>
              <Collapsible
                open={open}
                onOpenChange={(value) => setOpen(source.key, value)}
              >
                <div
                  className={cn(
                    'group/source flex items-center rounded-lg transition-colors',
                    current ? 'bg-accent' : 'hover:bg-muted',
                  )}
                >
                  <button
                    type='button'
                    aria-current={current ? 'page' : undefined}
                    className='flex min-w-0 flex-1 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'
                    onClick={() => {
                      setOpen(source.key, true);
                      onSelect(source.key);
                    }}
                  >
                    {Icon ? (
                      <span
                        className={cn(
                          'flex size-7 shrink-0 items-center justify-center rounded-md transition-colors',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground group-hover/source:bg-background',
                        )}
                      >
                        <Icon aria-hidden className='size-4' />
                      </span>
                    ) : null}
                    <span
                      className={cn(
                        'flex-1 truncate',
                        selected ? 'font-medium' : 'text-foreground/80',
                      )}
                    >
                      {source.label}
                    </span>
                    <NavCount count={source.count} strong={selected} />
                  </button>
                  {subjects.length && !keyword ? (
                    <CollapsibleTrigger
                      render={
                        <Button
                          variant='ghost'
                          size='icon-sm'
                          className='mr-1 text-muted-foreground hover:bg-transparent hover:text-foreground'
                          aria-label={
                            open
                              ? t('taskCenterUi.nav.collapse', {
                                  name: source.label,
                                  defaultValue: 'Collapse {{name}}',
                                })
                              : t('taskCenterUi.nav.expand', {
                                  name: source.label,
                                  defaultValue: 'Expand {{name}}',
                                })
                          }
                        />
                      }
                    >
                      <ChevronRight
                        className={cn(
                          'transition-transform duration-200',
                          open && 'rotate-90',
                        )}
                      />
                    </CollapsibleTrigger>
                  ) : null}
                </div>
                <CollapsibleContent>
                  <ul
                    aria-label={t('taskCenterUi.nav.subjects', {
                      name: source.label,
                      defaultValue: 'Task types of {{name}}',
                    })}
                    className='my-1 ml-5 flex flex-col gap-0.5 border-l'
                  >
                    {subjects.map((item) => {
                      const active = selected && currentSubject === item.key;
                      return (
                        <li key={item.key}>
                          <button
                            type='button'
                            aria-current={active ? 'page' : undefined}
                            className={cn(
                              '-ml-px flex w-full items-center gap-2 rounded-r-md border-l-2 py-1.5 pr-2 pl-3 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none',
                              active
                                ? 'border-primary bg-accent font-medium text-accent-foreground'
                                : 'border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
                            )}
                            onClick={() => onSelect(source.key, item.key)}
                          >
                            <span className='flex-1 truncate'>
                              <Highlight keyword={keyword} text={item.label} />
                            </span>
                            <NavCount count={item.count} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function NavCount({
  count,
  strong = false,
}: {
  readonly count?: number;
  readonly strong?: boolean;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!count) return null;
  return (
    <span
      aria-label={t('taskCenterUi.nav.pending', {
        count,
        defaultValue: '{{count}} to do',
      })}
      className={cn(
        'min-w-5 rounded-full px-1.5 text-center text-xs leading-5 font-medium tabular-nums',
        strong
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {count}
    </span>
  );
}

/** Marks the part of a subject name that matches the search keyword. */
function Highlight({
  keyword,
  text,
}: {
  readonly keyword: string;
  readonly text: string;
}): ReactNode {
  const index = keyword ? text.toLocaleLowerCase().indexOf(keyword) : -1;
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className='rounded-sm bg-primary/15 text-foreground'>
        {text.slice(index, index + keyword.length)}
      </mark>
      {text.slice(index + keyword.length)}
    </>
  );
}
