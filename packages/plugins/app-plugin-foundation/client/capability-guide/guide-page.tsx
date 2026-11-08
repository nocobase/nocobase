import { cn } from 'cn';
import { Search, X } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';

import {
  CAPABILITY_GUIDE_PATH,
  capabilityPath,
  entryContent,
  filterCatalog,
  format,
  readGuideFilter,
  searchableText,
  type CapabilityCatalog,
  type CatalogEntry,
  type GuideContent,
  type GuideSourceFilter,
} from '../../shared/capability-guide/index.js';
import { EntryDetail } from './entry-detail.js';
import { EntryBadges, EntryIcon } from './shared.js';
import { useGuideContent } from './use-guide-content.js';

type GuideFilter = ReturnType<typeof readGuideFilter>;

function guideSearch(filter: GuideFilter): string {
  const params = new URLSearchParams();
  if (filter.source !== 'all') params.set('source', filter.source);
  if (filter.query) params.set('q', filter.query);
  const value = params.toString();
  return value ? `?${value}` : '';
}

const SOURCE_FILTERS: readonly GuideSourceFilter[] = [
  'all',
  'kernel',
  'plugin',
];

/**
 * The full catalog on the left and one entry on the right. On a narrow screen only one of them shows: the list at
 * `/capabilities`, the entry at `/capabilities/:entryId`. The filter lives in the URL, so returning from an entry
 * restores the same tab and keywords.
 */
export function CapabilityGuidePage({
  catalog,
}: {
  readonly catalog: CapabilityCatalog;
}): ReactElement {
  const { entryId } = useParams();
  const [params, setParams] = useSearchParams();
  const { content } = useGuideContent();
  // The URL carries the filter so that leaving for an entry and coming back restores it; this page reads it once when
  // it mounts and then owns it, because the URL lags behind fast typing while the router navigates.
  const [filter, setFilter] = useState(() => readGuideFilter(params));
  const { source: activeSource, query } = filter;
  const search = guideSearch(filter);
  const selected = entryId ? catalog.find(entryId) : undefined;

  const text = (entry: CatalogEntry): string => searchableText(content, entry);
  const visible = filterCatalog(
    catalog.entries,
    { source: activeSource, query },
    text,
  );
  const counts = Object.fromEntries(
    SOURCE_FILTERS.map((source) => [
      source,
      filterCatalog(catalog.entries, { source, query }, text).length,
    ]),
  ) as Record<GuideSourceFilter, number>;

  function update(next: Partial<GuideFilter>): void {
    const merged = { ...filter, ...next };
    setFilter(merged);
    setParams(new URLSearchParams(guideSearch(merged)), { replace: true });
  }

  return (
    <div className='mx-auto flex w-full max-w-7xl flex-col gap-5 p-4 md:p-6'>
      <header
        className={cn('flex flex-col gap-1', entryId && 'hidden lg:flex')}
      >
        <h1 className='font-heading text-2xl font-semibold tracking-tight'>
          {content.page.title}
        </h1>
        <p className='max-w-3xl text-sm leading-6 text-muted-foreground'>
          {content.page.description}
        </p>
      </header>

      <div className='grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]'>
        <section
          className={cn(
            'flex min-w-0 flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-8rem)] lg:self-start',
            entryId && 'hidden lg:flex',
          )}
        >
          <div
            role='tablist'
            aria-label={content.page.columns.source}
            className='flex gap-1 rounded-lg bg-muted p-1'
          >
            {SOURCE_FILTERS.map((source) => (
              <button
                key={source}
                type='button'
                role='tab'
                aria-selected={filter.source === source}
                onClick={() => update({ source })}
                className='flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground aria-selected:bg-background aria-selected:font-medium aria-selected:text-foreground aria-selected:shadow-sm'
              >
                {content.sources[source]}
                <span className='text-xs tabular-nums opacity-70'>
                  {counts[source]}
                </span>
              </button>
            ))}
          </div>
          <label className='relative flex items-center'>
            <Search
              className='pointer-events-none absolute left-3 size-4 text-muted-foreground'
              aria-hidden
            />
            <input
              type='search'
              value={filter.query}
              onChange={(event) => update({ query: event.target.value })}
              placeholder={content.page.search}
              aria-label={content.page.search}
              className='h-9 w-full rounded-lg border bg-background pr-3 pl-9 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50'
            />
          </label>
          <p className='text-xs text-muted-foreground' role='status'>
            {format(content.page.count, {
              shown: visible.length,
              total: catalog.entries.length,
            })}
          </p>
          <CatalogList
            entries={visible}
            content={content}
            selectedId={selected?.id}
            search={search}
          />
          {visible.length === 0 ? (
            <div className='flex flex-col items-start gap-2 rounded-xl border border-dashed p-4 text-sm text-muted-foreground'>
              {content.page.noResults}
              <button
                type='button'
                onClick={() => update({ source: 'all', query: '' })}
                className='inline-flex items-center gap-1 font-medium text-primary hover:underline'
              >
                <X className='size-3.5' aria-hidden />
                {content.page.clear}
              </button>
            </div>
          ) : null}
        </section>

        <div className={cn('min-w-0', !entryId && 'hidden lg:block')}>
          {entryId ? (
            <EntryDetail
              key={entryId}
              entry={selected}
              catalog={catalog}
              content={content}
              backTo={`${CAPABILITY_GUIDE_PATH}${search}`}
              search={search}
            />
          ) : (
            <HowToAsk content={content} />
          )}
        </div>
      </div>
    </div>
  );
}

function CatalogList({
  entries,
  content,
  selectedId,
  search,
}: {
  readonly entries: readonly CatalogEntry[];
  readonly content: GuideContent;
  readonly selectedId?: string;
  readonly search: string;
}): ReactElement {
  return (
    <ol
      aria-label={content.page.title}
      className='flex min-h-0 flex-col divide-y overflow-y-auto rounded-xl border bg-card'
    >
      {entries.map((entry, position) => {
        const text = entryContent(content, entry);
        const current = entry.id === selectedId;
        return (
          <li key={entry.id}>
            <Link
              to={capabilityPath(entry.id, search)}
              aria-current={current ? 'page' : undefined}
              className='flex items-start gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-hover aria-[current=page]:bg-primary/5'
            >
              <span className='w-6 shrink-0 pt-0.5 text-right text-xs text-muted-foreground tabular-nums'>
                {position + 1}
              </span>
              <EntryIcon
                entry={entry}
                className='mt-0.5 size-4 shrink-0 text-primary'
              />
              <span className='flex min-w-0 flex-1 flex-col gap-0.5'>
                <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                  <span className='font-medium'>{text.title}</span>
                  <EntryBadges entry={entry} content={content} />
                </span>
                <code className='truncate font-mono text-xs text-muted-foreground'>
                  {entry.name}
                </code>
                <span className='line-clamp-1 text-xs text-muted-foreground'>
                  {text.summary}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

function HowToAsk({
  content,
}: {
  readonly content: GuideContent;
}): ReactElement {
  const { empty } = content.page;
  return (
    <section className='flex flex-col gap-3 rounded-xl border bg-card p-6'>
      <h2 className='text-base font-semibold'>{empty.title}</h2>
      <p className='text-sm leading-6 text-muted-foreground'>
        {empty.description}
      </p>
      <ol className='flex flex-col gap-2 text-sm leading-6'>
        {empty.parts.map((part, index) => (
          <li key={part} className='flex gap-3'>
            <span className='flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary'>
              {index + 1}
            </span>
            {part}
          </li>
        ))}
      </ol>
    </section>
  );
}

export default CapabilityGuidePage;
