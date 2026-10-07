import { useTranslation } from '@nocobase/i18n/client';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { SearchIcon } from 'lucide-react';
import { type ReactElement, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { PmStatusBadge } from './pm-badges.js';
import { Button } from './ui/button.js';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command.js';
import { Kbd } from './ui/kbd.js';
import { Spinner } from './ui/spinner.js';
import { pmKeys } from '../api/keys.js';
import { usePmApi } from '../hooks/use-pm-api.js';

import { isSearchShortcut } from './pm-shortcut-keys.js';
import { useNewIssueShortcut } from './use-new-issue-shortcut.js';

/**
 * The ⌘K issue search: a command dialog over `GET /api/projects/issues?q=`, searching titles and identifiers. Results
 * come from the server, so the command list does not filter them again; Enter opens the highlighted issue.
 */
export function PmSearchDialog({
  open,
  onOpenChange,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}): ReactElement {
  const { t } = useTranslation();
  const api = usePmApi();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(text.trim()), 200);
    return () => window.clearTimeout(timer);
  }, [text]);
  const results = useQuery({
    queryKey: pmKeys.issueSearch(query),
    queryFn: async () => (await api.issuePage({ q: query, limit: 20 })).data,
    enabled: open && query !== '',
    placeholderData: keepPreviousData,
  });

  function select(issueId: string): void {
    onOpenChange(false);
    setText('');
    void navigate(`/issues/${encodeURIComponent(issueId)}`);
  }

  const items = query ? (results.data ?? []) : [];
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('search.title')}
      description={t('search.description')}
    >
      <Command shouldFilter={false}>
        <CommandInput
          value={text}
          onValueChange={setText}
          placeholder={t('search.placeholder')}
          aria-label={t('search.title')}
        />
        <CommandList>
          {results.isFetching ? (
            <div className='flex justify-center py-3'>
              <Spinner
                className='size-4 text-muted-foreground'
                aria-label={t('common.loading')}
              />
            </div>
          ) : null}
          <CommandEmpty>
            {query ? t('search.noResults') : t('search.hint')}
          </CommandEmpty>
          {items.length > 0 ? (
            <CommandGroup heading={t('search.issues')}>
              {items.map((issue) => (
                <CommandItem
                  key={issue.id}
                  value={issue.id}
                  onSelect={() => select(issue.id)}
                >
                  <span className='w-16 shrink-0 font-mono text-xs text-muted-foreground'>
                    {issue.identifier}
                  </span>
                  <span className='min-w-0 flex-1 truncate'>{issue.title}</span>
                  <PmStatusBadge statusKey={issue.statusKey} />
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

/**
 * The keyboard shortcuts of the work pages: `C` creates an issue (`useNewIssueShortcut`), ⌘K / Ctrl+K opens the
 * search. Each top-level page renders one (the pages are siblings, so exactly one listens at a time). `showTrigger`
 * also renders a search button for pointer users.
 */
export function PmShortcuts({
  onCreate,
  showTrigger = false,
  canCreate = true,
}: {
  /** Replaces the default "go to /issues/new", for a page that opens its own create dialog. */
  readonly onCreate?: () => void;
  readonly showTrigger?: boolean;
  readonly canCreate?: boolean;
}): ReactElement {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const anchor = useNewIssueShortcut({
    onCreate: onCreate ?? (() => void navigate('/issues/new')),
    canCreate,
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.defaultPrevented) return;
      if (isSearchShortcut(event)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <span hidden ref={anchor} />
      {showTrigger ? (
        <Button
          variant='outline'
          className='text-muted-foreground'
          onClick={() => setOpen(true)}
        >
          <SearchIcon data-icon='inline-start' />
          {t('search.trigger')}
          <Kbd data-icon='inline-end' aria-hidden='true'>
            ⌘K
          </Kbd>
        </Button>
      ) : null}
      <PmSearchDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
