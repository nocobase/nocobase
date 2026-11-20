import type { AIToolRendererProps } from '@nocobase/app-plugin-agents/client/chat';
import type { WebSearchResult } from '@nocobase/app-plugin-agents/shared/web-search';
import {
  publicSearchResult,
  WebSearchInputSchema,
} from '@nocobase/app-plugin-agents/shared/web-search-results';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  GlobeIcon,
  SearchIcon,
} from 'lucide-react';
import { cn } from 'cn';
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
} from 'react';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { useChatTranslation } from './chat-i18n.js';

// React deduplicates the pending cards' stylesheet without requiring consumer CSS imports.
const searchSkeletonStyles = `
.nb-agent-web-search-skeleton {
  --search-skeleton-base: color-mix(
    in oklab,
    var(--foreground) 10%,
    var(--muted)
  );
  --search-skeleton-shine: var(--background);
}

.dark .nb-agent-web-search-skeleton {
  --search-skeleton-shine: color-mix(
    in oklab,
    var(--foreground) 24%,
    var(--muted)
  );
}

.nb-agent-web-search-skeleton > [data-slot='skeleton'] {
  background-color: var(--search-skeleton-base);
  background-image: linear-gradient(
    105deg,
    var(--search-skeleton-base) 0%,
    var(--search-skeleton-base) 35%,
    var(--search-skeleton-shine) 48%,
    var(--search-skeleton-base) 61%,
    var(--search-skeleton-base) 100%
  );
  background-size: 240% 100%;
  animation: nb-agent-search-sweep 2.2s ease-in-out infinite;
}

@keyframes nb-agent-search-sweep {
  0%,
  12% {
    background-position: 150% 0;
  }
  88%,
  100% {
    background-position: -50% 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nb-agent-web-search-skeleton > [data-slot='skeleton'] {
    animation: none;
    background-image: none;
  }
}
`;
function resultOf(value: unknown): WebSearchResult | null {
  try {
    return publicSearchResult(value);
  } catch {
    return null;
  }
}

function Findings({ text }: { readonly text: string }): ReactElement {
  const { t } = useChatTranslation();
  const id = useId();
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [truncated, setTruncated] = useState(false);
  useLayoutEffect(() => {
    if (expanded) return;
    const element = ref.current;
    if (!element) return;
    const measure = () =>
      setTruncated(element.scrollHeight > element.clientHeight + 1);
    if (typeof ResizeObserver === 'undefined') {
      const frame = requestAnimationFrame(measure);
      return () => cancelAnimationFrame(frame);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded, text]);
  return (
    <div className='min-w-0 rounded-md bg-muted p-3'>
      <p
        ref={ref}
        id={id}
        data-testid='chat-web-search-findings'
        className={cn(
          'text-sm leading-relaxed wrap-anywhere',
          // Four themed line heights keep collapsed previews aligned, including short results.
          expanded
            ? 'whitespace-pre-wrap'
            : 'h-[4lh] line-clamp-4 whitespace-normal',
        )}
      >
        {text}
      </p>
      {truncated || expanded ? (
        <div className='mt-2 flex justify-end'>
          <Button
            type='button'
            variant='ghost'
            size='xs'
            className='text-muted-foreground'
            aria-controls={id}
            aria-expanded={expanded}
            onClick={() => setExpanded(!expanded)}
          >
            {t(expanded ? 'chat.webSearch.collapse' : 'chat.webSearch.expand')}
            {expanded ? (
              <ChevronUpIcon data-icon='inline-end' />
            ) : (
              <ChevronDownIcon data-icon='inline-end' />
            )}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Display only the canonical public tool part. Expanding history never executes a search. */
export function WebSearchCard({
  part,
  context,
}: AIToolRendererProps): ReactElement {
  const { t } = useChatTranslation();
  const input = WebSearchInputSchema.safeParse(part.input);
  const result =
    part.state === 'output-available' ? resultOf(part.output) : null;
  const unfinished =
    part.state === 'input-streaming' || part.state === 'input-available';
  const pending = unfinished && context.streaming;
  const queries =
    result?.results.map((item) => item.query) ??
    (input.success ? input.data.queries : []);
  const unavailable =
    part.state === 'output-denied'
      ? 'cancelled'
      : unfinished
        ? 'interrupted'
        : 'failed';
  return (
    <div
      className='w-full min-w-0 overflow-hidden rounded-lg border bg-card text-card-foreground'
      data-testid='chat-web-search'
      aria-busy={pending}
    >
      <div className='flex min-w-0 items-center gap-2 px-4 pt-3 pb-1'>
        <GlobeIcon
          className={cn(
            'size-4 shrink-0 text-muted-foreground',
            pending && 'animate-pulse motion-reduce:animate-none',
          )}
          aria-hidden={!pending}
          role={pending ? 'status' : undefined}
          aria-label={pending ? t('chat.webSearch.searching') : undefined}
        />
        <span className='text-sm font-medium'>{t('chat.webSearch.title')}</span>
        {queries.length > 0 ? (
          <span className='ml-auto text-xs text-muted-foreground'>
            {t('chat.webSearch.queryCount', { count: queries.length })}
          </span>
        ) : null}
      </div>
      {queries.map((query, index) => {
        const item = result?.results[index];
        return (
          <section
            key={query}
            aria-label={query}
            className={cn('min-w-0 px-4 py-3', index > 0 && 'border-t')}
          >
            <div className='mb-2 flex min-w-0 items-start gap-2'>
              <SearchIcon
                className='mt-0.5 size-3.5 shrink-0 text-muted-foreground'
                aria-hidden='true'
              />
              <h3 className='min-w-0 text-sm font-medium wrap-anywhere'>
                {query}
              </h3>
            </div>
            {item && item.status !== 'failed' ? (
              <>
                <Findings text={item.findings} />
                {item.sources.length > 0 ? (
                  <ul
                    className='mt-2 flex min-w-0 flex-wrap gap-x-3 gap-y-1'
                    aria-label={t('chat.webSearch.sources')}
                  >
                    {item.sources.map((source) => (
                      <li key={source.url} className='min-w-0 max-w-full'>
                        <a
                          href={source.url}
                          target='_blank'
                          rel='noopener noreferrer'
                          className='inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline'
                        >
                          <span className='min-w-0 wrap-anywhere'>
                            {source.title}
                          </span>
                          <ExternalLinkIcon
                            className='size-3 shrink-0'
                            aria-hidden='true'
                          />
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            ) : pending ? (
              <div className='rounded-md bg-muted p-3' aria-hidden='true'>
                <style href='nb-agent-web-search-skeleton' precedence='low'>
                  {searchSkeletonStyles}
                </style>
                <div
                  className='nb-agent-web-search-skeleton grid h-[4lh] grid-rows-4 items-center text-sm leading-relaxed'
                  data-testid='chat-web-search-skeleton'
                >
                  <Skeleton className='h-[0.8em] w-full animate-none rounded' />
                  <Skeleton className='h-[0.8em] w-[95%] animate-none rounded' />
                  <Skeleton className='h-[0.8em] w-full animate-none rounded' />
                  <Skeleton className='h-[0.8em] w-[90%] animate-none rounded' />
                </div>
              </div>
            ) : (
              <p className='rounded-md bg-muted p-3 text-sm text-muted-foreground'>
                {t(
                  `chat.webSearch.${item?.status === 'failed' ? item.reason : unavailable}`,
                )}
              </p>
            )}
          </section>
        );
      })}
      {!queries.length && !pending ? (
        <p className='px-4 py-3 text-sm text-muted-foreground'>
          {t(`chat.webSearch.${unavailable}`)}
        </p>
      ) : null}
    </div>
  );
}
