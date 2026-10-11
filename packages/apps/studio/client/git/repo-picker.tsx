/**
 * Picking an existing repository for a working directory: the repositories a connection reaches, read live from the
 * host and searched by name. Choosing one hands the working directory form its clone URL, default branch, name and
 * binding (the connection, the host's id and `owner/name`). Above the list it says which connection it comes from and
 * that only the repositories authorized for Studio are listed, with a link to where more are authorized on the host
 * (`repositoryAccessUrl`), and a search that finds none says so again. The connection is chosen above the list when there
 * are several, unless the form chooses it (`connectionId`), as the working directory form does for all its locations. A new repository is not created here: the form that asks
 * for one creates it when it is submitted (`projects/code-location`), so leaving the form leaves nothing behind.
 */
import type { ProjectResourceBinding } from '@nocobase/app-plugin-projects/shared/projects';
import { useTranslation } from '@nocobase/i18n/client';
import { LockIcon } from 'lucide-react';
import { useDeferredValue, useState, type ReactElement } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';

import {
  connectionsByAge,
  preferredConnection,
  type GitConnectionChoice,
  type GitRepoChoice,
} from '../../shared/git.js';
import { useGitRepos } from './api.js';
import { readLastConnection, writeLastConnection } from './last-connection.js';

/** What the working directory form takes from a chosen repository. */
export interface PickedRepository {
  readonly url: string;
  readonly defaultRef: string;
  readonly label: string;
  readonly binding: ProjectResourceBinding;
}

function pickedOf(
  connection: GitConnectionChoice,
  repo: GitRepoChoice,
): PickedRepository {
  return {
    url: repo.cloneUrl,
    defaultRef: repo.defaultBranch,
    label: repo.name,
    binding: {
      provider: connection.provider,
      connectionId: connection.id,
      repoId: repo.id,
      fullName: repo.fullName,
    },
  };
}

export function RepositoryPicker({
  connections: listed,
  connectionId: given,
  picked,
  onPick,
}: {
  readonly connections: readonly GitConnectionChoice[];
  /** The connection the form has chosen; without it, the picker offers its own choice when there are several. */
  readonly connectionId?: string;
  /** `owner/name` of the repository chosen, if any. */
  readonly picked: string | null;
  readonly onPick: (picked: PickedRepository | null) => void;
}): ReactElement {
  const { t } = useTranslation();
  const connections = connectionsByAge(listed);
  const [chosenId, setChosenId] = useState(() => readLastConnection());
  // The form's choice, else this picker's: the one last chosen while it exists, else the oldest.
  const connection = preferredConnection(connections, given ?? chosenId);
  const [search, setSearch] = useState('');
  const query = useDeferredValue(search.trim());
  const [pageToken, setPageToken] = useState<string | null>(null);
  const repos = useGitRepos(
    picked ? null : (connection?.id ?? null),
    query,
    pageToken,
  );
  const connectionItems = connections.map((item) => ({
    value: item.id,
    label: [
      item.account ? `${item.name} (${item.account})` : item.name,
      item.demo ? t('studioGit.connections.demo') : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }));

  if (picked)
    return (
      <div className='flex flex-wrap items-center gap-2 text-sm'>
        <span>{t('studioGit.picker.selected', { repo: picked })}</span>
        <Button
          type='button'
          size='sm'
          variant='ghost'
          onClick={() => onPick(null)}
        >
          {t('studioGit.picker.change')}
        </Button>
      </div>
    );

  return (
    <div className='space-y-2' data-repository-picker>
      {given === undefined && connections.length > 1 ? (
        <Field>
          <FieldLabel htmlFor='git-picker-connection'>
            {t('studioGit.picker.connection')}
          </FieldLabel>
          <Select
            items={connectionItems}
            value={connection?.id ?? null}
            onValueChange={(next: string | null) => {
              if (!next) return;
              setChosenId(next);
              writeLastConnection(next);
              setPageToken(null);
            }}
          >
            <SelectTrigger id='git-picker-connection' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
              {connectionItems.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      ) : null}
      {connection ? <RepositoryAccess connection={connection} /> : null}
      <Command shouldFilter={false} className='rounded-md border'>
        <CommandInput
          value={search}
          placeholder={t('studioGit.picker.search')}
          aria-label={t('studioGit.picker.search')}
          onValueChange={(value) => {
            setSearch(value);
            setPageToken(null);
          }}
        />
        <CommandList className='max-h-56'>
          {repos.isPending ? (
            <p className='flex items-center gap-2 p-3 text-sm text-muted-foreground'>
              <Spinner /> {t('studioGit.picker.loading')}
            </p>
          ) : (
            <>
              <CommandEmpty>
                <span className='block'>{t('studioGit.picker.empty')}</span>
                {connection ? (
                  <span className='mt-1 block px-3 text-xs text-muted-foreground'>
                    {t('studioGit.picker.notListed', {
                      connection: connection.name,
                    })}{' '}
                    <AccessLink connection={connection} />
                  </span>
                ) : null}
              </CommandEmpty>
              {connection
                ? repos.data?.items.map((repo) => (
                    <CommandItem
                      key={repo.id}
                      value={String(repo.id)}
                      data-repo={repo.fullName}
                      onSelect={() => onPick(pickedOf(connection, repo))}
                    >
                      <span className='truncate'>{repo.fullName}</span>
                      {repo.private ? (
                        <Badge variant='outline' className='gap-1'>
                          <LockIcon className='size-3' aria-hidden />
                          {t('studioGit.picker.private')}
                        </Badge>
                      ) : null}
                    </CommandItem>
                  ))
                : null}
            </>
          )}
        </CommandList>
      </Command>
      {repos.data?.nextPageToken ? (
        <div className='flex justify-end'>
          <Button
            type='button'
            size='sm'
            variant='ghost'
            onClick={() => setPageToken(repos.data?.nextPageToken ?? null)}
          >
            {t('studioGit.picker.more')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

/** Where more repositories are authorized for Studio on the host; nothing when the connection has no such page. */
function AccessLink({
  connection,
}: {
  readonly connection: GitConnectionChoice;
}): ReactElement | null {
  const { t } = useTranslation();
  if (!connection.repositoryAccessUrl) return null;
  return (
    <a
      href={connection.repositoryAccessUrl}
      target='_blank'
      rel='noreferrer'
      data-repository-access
      className='font-medium text-primary underline-offset-4 hover:underline'
    >
      {t('studioGit.picker.addAccess')}
    </a>
  );
}

/** Which connection the list comes from, and that it holds only the repositories authorized for Studio. */
function RepositoryAccess({
  connection,
}: {
  readonly connection: GitConnectionChoice;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <p className='text-xs text-muted-foreground' data-repository-source>
      {t('studioGit.picker.source', { connection: connection.name })}{' '}
      <AccessLink connection={connection} />
    </p>
  );
}
