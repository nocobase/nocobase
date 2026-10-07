/**
 * The ⌘K search of a space's view: a command dialog over the plugin's search (`GET /api/knowledge/search`), its hits
 * by section with their excerpts. Enter opens the highlighted hit; the last item shows every result on the page
 * (`?q=`). Hits come from the server, so the command list does not filter them again.
 */
import { useTranslation } from '@nocobase/i18n/client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ListIcon } from 'lucide-react';
import { useEffect, useState, type ReactElement } from 'react';

import { Badge } from './ui/badge.js';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command.js';
import { Spinner } from './ui/spinner.js';

import { ACCESS_NAMESPACE } from '../../shared/access.js';
import type { SpaceRef } from '../../shared/knowledge.js';
import { knowledgeKeys, useKnowledgeApi } from '../api.js';
import { EntryIcon } from './file-pane.js';

export function KnowledgeSearchDialog({
  open,
  onOpenChange,
  space,
  inheritedLabel,
  onOpen,
  onAll,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly space: SpaceRef;
  readonly inheritedLabel: string | undefined;
  readonly onOpen: (docId: string) => void;
  /** Shows every result for the words on the page. */
  readonly onAll: (q: string) => void;
}): ReactElement {
  const { t } = useTranslation(ACCESS_NAMESPACE);
  const api = useKnowledgeApi();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(text.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [text]);
  const hits = useQuery({
    queryKey: knowledgeKeys.search(space, query),
    queryFn: ({ signal }) => api.search(space, query, signal),
    enabled: open && query !== '',
    placeholderData: keepPreviousData,
  });
  const close = () => {
    onOpenChange(false);
    setText('');
  };
  const items = query ? (hits.data ?? []) : [];
  return (
    <CommandDialog
      open={open}
      onOpenChange={(next) => (next ? onOpenChange(true) : close())}
      title={t('knowledge.search.label')}
      description={t('knowledge.search.description')}
      className='sm:max-w-xl'
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={text}
          onValueChange={setText}
          placeholder={t('knowledge.search.placeholder')}
          aria-label={t('knowledge.search.label')}
        />
        <CommandList className='max-h-96'>
          {hits.isFetching ? (
            <div className='flex justify-center py-3'>
              <Spinner className='size-4 text-muted-foreground' />
            </div>
          ) : null}
          <CommandEmpty>
            {query ? (
              <span className='block space-y-1'>
                <span className='block'>
                  {t('knowledge.search.empty', { q: query })}
                </span>
                <span className='block text-xs text-muted-foreground'>
                  {t('knowledge.search.emptyHint')}
                </span>
              </span>
            ) : (
              t('knowledge.search.hint')
            )}
          </CommandEmpty>
          {items.length > 0 ? (
            <CommandGroup heading={t('knowledge.search.results')}>
              {items.map((hit) => (
                <CommandItem
                  key={`${hit.docId}#${hit.lines[0]}`}
                  value={`${hit.docId}#${hit.lines[0]}`}
                  onSelect={() => {
                    close();
                    onOpen(hit.docId);
                  }}
                  className='items-start'
                >
                  <EntryIcon
                    entry={{ kind: hit.kind, file: null }}
                    className='mt-0.5'
                  />
                  <span className='min-w-0 flex-1 space-y-0.5'>
                    <span className='flex min-w-0 items-center gap-2'>
                      <span className='truncate font-medium'>{hit.title}</span>
                      {hit.headingPath.length > 0 ? (
                        <span className='truncate text-xs text-muted-foreground'>
                          § {hit.headingPath.join(' › ')}
                        </span>
                      ) : null}
                      {hit.inherited ? (
                        <Badge variant='outline' className='ml-auto shrink-0'>
                          {inheritedLabel ?? t('knowledge.search.inherited')}
                        </Badge>
                      ) : null}
                    </span>
                    <span className='line-clamp-2 block text-xs text-muted-foreground'>
                      {hit.excerpt}
                    </span>
                  </span>
                </CommandItem>
              ))}
              <CommandItem
                value='__all__'
                onSelect={() => {
                  close();
                  onAll(query);
                }}
              >
                <ListIcon />
                {t('knowledge.search.all', { q: query })}
              </CommandItem>
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}
