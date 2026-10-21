import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  SearchX,
  Table2,
  X,
} from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';
import type {
  FoundationCollectionPage,
  FoundationFact,
} from '../../shared/foundation.js';
import { formatNumber } from './format.js';
import { useFoundationTranslation } from './foundation-translation.js';
import { Button } from './ui/button.js';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog.js';
import { Input } from './ui/input.js';

/** Keep the overview compact; fetch the full catalog only in this temporary browser. */
export function CollectionsBrowser({
  summary,
}: {
  readonly summary: FoundationFact;
}): ReactElement {
  const { t, text, locale } = useFoundationTranslation();
  const api = useApiClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [input, setInput] = useState('');
  const [composing, setComposing] = useState(false);
  const [offset, setOffset] = useState(0);
  const total =
    typeof summary.params?.count === 'number' ? summary.params.count : 0;
  const names = summary.params?.names;
  const preview =
    typeof names === 'object' ? [...new Set(names.slice(0, 5).map(text))] : [];

  useEffect(() => {
    if (composing || input.trim() === search) return;
    const timer = setTimeout(() => {
      setOffset(0);
      setSearch(input.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [input, composing, search]);

  const query = useQuery({
    queryKey: ['foundation', 'collections', search, offset],
    enabled: open,
    placeholderData: keepPreviousData,
    retry: false,
    queryFn: async (): Promise<FoundationCollectionPage> => {
      const { data, meta } = await api.request<{
        data: FoundationCollectionPage['items'];
        meta: { total: number };
      }>({ path: 'foundation/collections', query: { search, offset } });
      return { items: data, total: meta.total };
    },
  });
  const searching = composing || input.trim() !== search || query.isFetching;
  const denied =
    query.error instanceof ApiClientError &&
    [401, 403].includes(query.error.status);
  const number = (value: number): string => formatNumber(value, locale);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div className='flex min-w-0 flex-col gap-2.5 rounded-lg bg-muted/40 p-3'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <p className='flex items-center gap-1.5 text-xs font-medium text-muted-foreground'>
            <Table2 className='size-3.5' aria-hidden />
            {t('detail.collectionCount', { count: number(total) })}
          </p>
          <DialogTrigger
            render={
              <Button
                size='xs'
                variant='ghost'
                className='text-muted-foreground'
              />
            }
          >
            {t('detail.viewCollections')}
            <ChevronRight aria-hidden />
          </DialogTrigger>
        </div>
        <ul
          aria-label={t('detail.collectionPreview')}
          className='flex min-w-0 flex-wrap items-center gap-1.5'
        >
          {preview.map((name) => (
            <li
              key={name}
              className='max-w-full truncate rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground sm:max-w-48'
            >
              {name}
            </li>
          ))}
          {total > preview.length ? (
            <li className='px-1 text-xs tabular-nums text-muted-foreground'>
              +{number(total - preview.length)}
            </li>
          ) : null}
        </ul>
      </div>

      <DialogContent
        showCloseButton={false}
        className='flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg'
      >
        <DialogHeader className='shrink-0 gap-1 px-5 pt-5 pr-12 pb-4'>
          <DialogTitle>{t('detail.collectionsTitle')}</DialogTitle>
          <DialogDescription>
            {t('detail.collectionCount', { count: number(total) })}
          </DialogDescription>
        </DialogHeader>
        <form
          className='shrink-0 px-5 pb-4'
          onSubmit={(event) => {
            event.preventDefault();
            if (!composing) {
              setOffset(0);
              setSearch(input.trim());
            }
          }}
        >
          <div className='relative'>
            <Search
              className='pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden
            />
            <Input
              aria-label={t('detail.searchCollections')}
              placeholder={t('detail.searchCollections')}
              className='pl-9'
              value={input}
              maxLength={200}
              onChange={(event) => setInput(event.target.value)}
              onCompositionStart={() => setComposing(true)}
              onCompositionEnd={() => setComposing(false)}
            />
          </div>
        </form>
        <div
          className='h-80 min-h-0 flex-1 overflow-y-auto border-y'
          aria-busy={searching}
        >
          {query.isPending ? (
            <div
              role='status'
              className='flex h-full items-center justify-center gap-2 p-6 text-sm text-muted-foreground'
            >
              <LoaderCircle className='size-4 animate-spin' aria-hidden />
              {t('page.loading')}
            </div>
          ) : query.isError ? (
            <div
              role='alert'
              className='flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm'
            >
              <p>{t(denied ? 'page.forbidden' : 'page.loadFailed')}</p>
              {!denied ? (
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void query.refetch()}
                >
                  {t('page.retry')}
                </Button>
              ) : null}
            </div>
          ) : query.data.items.length === 0 ? (
            <div
              role='status'
              className='flex h-full flex-col items-center justify-center gap-2 p-6 text-center'
            >
              <SearchX
                className='mb-1 size-6 text-muted-foreground'
                aria-hidden
              />
              <p className='text-sm font-medium'>
                {t('detail.noCollectionMatches')}
              </p>
              <p className='text-xs text-muted-foreground'>
                {t('detail.noCollectionMatchesHint')}
              </p>
            </div>
          ) : (
            <ul
              aria-label={t('detail.collectionsTitle')}
              className={`divide-y ${searching ? 'opacity-50' : ''}`}
            >
              {query.data.items.map((item) => (
                <li
                  key={item.name}
                  className='flex min-w-0 items-center gap-3 px-5 py-2.5'
                >
                  <Table2
                    className='size-4 shrink-0 text-muted-foreground'
                    aria-hidden
                  />
                  <div className='min-w-0'>
                    <p className='truncate text-sm'>
                      {item.title || item.name}
                    </p>
                    {item.title && item.title !== item.name ? (
                      <p className='truncate font-mono text-xs text-muted-foreground'>
                        {item.name}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className='flex shrink-0 items-center justify-between gap-3 px-5 py-3'>
          <p
            role='status'
            className='min-w-0 text-xs tabular-nums text-muted-foreground'
          >
            {query.data && !query.isError
              ? t('detail.collectionRange', {
                  from: number(query.data.total ? offset + 1 : 0),
                  to: number(offset + query.data.items.length),
                  total: number(query.data.total),
                })
              : null}
          </p>
          <div className='flex items-center gap-1'>
            {searching ? (
              <LoaderCircle
                className='mr-2 size-3.5 animate-spin text-muted-foreground'
                aria-label={t('detail.searchCollections')}
              />
            ) : null}
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('detail.previousPage')}
              disabled={offset === 0 || searching || query.isError}
              onClick={() => setOffset(Math.max(0, offset - 50))}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={t('detail.nextPage')}
              disabled={
                !query.data ||
                offset + 50 >= query.data.total ||
                searching ||
                query.isError
              }
              onClick={() => setOffset(offset + 50)}
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </div>
        <DialogClose
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              className='absolute top-3 right-3'
              aria-label={t('detail.closeCollections')}
            />
          }
        >
          <X aria-hidden />
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
