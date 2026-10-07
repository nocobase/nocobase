/**
 * Search test: runs the space's search as the viewer would and shows how each hit was ranked: its place, its
 * relevance (the normalized fused score the minimum relevance compares), its rank with each search provider (keywords,
 * meaning, or any other the application registered; a dash where one did not rank it), the reranker's score when one
 * reordered the hits, its headings, and a link to its lines. The diagnostics come from the search API's `explain`,
 * which only someone who manages the space or the search settings gets; anyone else sees the plain fused score.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { FlaskConicalIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';

import { Badge } from './ui/badge.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog.js';
import { Input } from './ui/input.js';
import { Skeleton } from './ui/skeleton.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { SpaceRef } from '../../shared/knowledge.js';
import { useKnowledgeSearch } from '../api.js';
import { EntryIcon } from './file-pane.js';

const score = (value: number) =>
  value >= 1 || value === 0 ? value.toFixed(2) : value.toPrecision(3);

/** The providers the plugin and its usual application name, worded; any other by its name. */
const KNOWN_PROVIDERS: Readonly<Record<string, string>> = {
  contains: 'knowledge.searchTest.keyword',
  vector: 'knowledge.searchTest.semantic',
};

type Lines = readonly [number, number];

function Results({
  space,
  q,
  onOpen,
}: {
  readonly space: SpaceRef;
  readonly q: string;
  readonly onOpen: (docId: string, lines: Lines | null) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const hits = useKnowledgeSearch(space, q, true);
  if (hits.isPending) return <Skeleton className='h-24 w-full' />;
  const list = hits.data ?? [];
  if (list.length === 0)
    return (
      <p className='text-sm text-muted-foreground'>
        {t('knowledge.search.empty', { q })}
      </p>
    );
  const reranked = list.some((hit) => hit.reranked !== null);
  const explained = list.some((hit) => hit.explain !== undefined);
  // Every provider that ranked something, so a hit one of them missed says so.
  const names = [
    ...new Set(
      list.flatMap((hit) => hit.providers.map((provider) => provider.name)),
    ),
  ];
  const label = (name: string) =>
    KNOWN_PROVIDERS[name] ? t(KNOWN_PROVIDERS[name]) : name;
  return (
    <div className='space-y-2'>
      {explained ? null : (
        <p className='text-sm text-muted-foreground'>
          {t('knowledge.searchTest.notExplained')}
        </p>
      )}
      <ol
        className='divide-y rounded-lg border'
        data-testid='knowledge-search-test-results'
      >
        {list.map((hit, index) => {
          const ranks = new Map(
            hit.providers.map((provider) => [provider.name, provider]),
          );
          return (
            <li
              key={`${hit.docId}#${hit.lines[0]}`}
              className='space-y-1.5 p-3'
            >
              <button
                type='button'
                className='flex w-full min-w-0 items-center gap-2 text-left text-sm font-medium hover:underline'
                onClick={() => onOpen(hit.docId, null)}
              >
                <span className='w-6 shrink-0 text-muted-foreground tabular-nums'>
                  {index + 1}
                </span>
                <EntryIcon entry={{ kind: hit.kind, file: null }} />
                <span className='truncate'>{hit.title}</span>
                {hit.headingPath.length > 0 ? (
                  <span className='truncate font-normal text-muted-foreground'>
                    § {hit.headingPath.join(' › ')}
                  </span>
                ) : null}
              </button>
              <p className='pl-8 text-sm text-muted-foreground wrap-anywhere'>
                {hit.excerpt}
              </p>
              <div className='flex flex-wrap items-center gap-1.5 pl-8 text-xs'>
                <Badge variant='secondary' className='tabular-nums'>
                  {hit.explain
                    ? t('knowledge.searchTest.relevance', {
                        score: hit.explain.normalized.toFixed(2),
                      })
                    : t('knowledge.searchTest.fused', {
                        score: score(hit.score),
                      })}
                </Badge>
                {names.map((name) => {
                  const rank = ranks.get(name);
                  return (
                    <Badge
                      key={name}
                      variant='outline'
                      className='tabular-nums'
                    >
                      {rank
                        ? t('knowledge.searchTest.rank', {
                            name: label(name),
                            rank: rank.rank,
                            score: score(rank.score),
                          })
                        : t('knowledge.searchTest.unranked', {
                            name: label(name),
                          })}
                    </Badge>
                  );
                })}
                {reranked ? (
                  <Badge
                    variant={hit.reranked === null ? 'outline' : 'default'}
                    className='tabular-nums'
                  >
                    {hit.reranked === null
                      ? t('knowledge.searchTest.notReranked')
                      : t('knowledge.searchTest.reranked', {
                          score: score(hit.reranked),
                        })}
                  </Badge>
                ) : null}
                <Button
                  variant='link'
                  size='sm'
                  className='h-auto px-1 text-xs'
                  onClick={() => onOpen(hit.docId, hit.lines)}
                >
                  {t('knowledge.searchTest.lines', {
                    start: hit.lines[0],
                    end: hit.lines[1],
                  })}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function SearchTestDialog({
  open,
  onOpenChange,
  space,
  onOpen,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly space: SpaceRef;
  /** Opens a document, at a hit's lines when given. */
  readonly onOpen: (docId: string, lines: Lines | null) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const [query, setQuery] = useState('');
  const [q, setQ] = useState('');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>{t('knowledge.searchTest.title')}</DialogTitle>
          <DialogDescription>
            {t('knowledge.searchTest.description')}
          </DialogDescription>
        </DialogHeader>
        <form
          className='flex gap-2'
          onSubmit={(event) => {
            event.preventDefault();
            setQ(query.trim());
          }}
        >
          <Input
            type='search'
            autoFocus
            value={query}
            aria-label={t('knowledge.searchTest.query')}
            placeholder={t('knowledge.searchTest.query')}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Button type='submit' disabled={!query.trim()}>
            {t('knowledge.searchTest.run')}
          </Button>
        </form>
        {q ? (
          <div className='-mx-4 min-h-0 flex-1 overflow-y-auto px-4'>
            <Results
              space={space}
              q={q}
              onOpen={(docId, lines) => {
                onOpenChange(false);
                onOpen(docId, lines);
              }}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** The button that opens the search test. */
export function SearchTestButton({
  onClick,
}: {
  readonly onClick: () => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  return (
    <Button
      type='button'
      size='icon'
      variant='ghost'
      aria-label={t('knowledge.searchTest.title')}
      title={t('knowledge.searchTest.title')}
      onClick={onClick}
    >
      <FlaskConicalIcon />
    </Button>
  );
}
