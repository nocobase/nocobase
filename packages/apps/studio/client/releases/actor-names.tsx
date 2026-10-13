/**
 * Release management stores who deployed, requested or decided as ids; Studio shows a person by name and avatar
 * (`ReleasesActorNameContext`). People are read from the projects plugin's members, the list the rest of the pages
 * use, and an organization's API keys by the key's name, marked with the API key tag. The id is a user's whatever the
 * kind: a person's API key or an upload ticket acts as the person who made it, so it shows that person too; anyone
 * else keeps their id.
 */
import {
  pmKeys,
  PmApiKeyTag,
  useApiKeyActors,
  usePmApi,
} from '@nocobase/app-plugin-projects/client/kit';
import {
  ReleasesActorNameContext,
  type ActorNameProps,
} from '@nocobase/app-plugin-releases/client';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, ReactNode } from 'react';

function StudioActorName({ id }: ActorNameProps): ReactElement {
  const api = usePmApi();
  const members = useQuery({
    queryKey: pmKeys.members,
    queryFn: () => api.members(),
    staleTime: 60_000,
  });
  const apiKeys = useApiKeyActors();
  const name = members.data?.find((member) => member.userId === id)?.name;
  const keyName = apiKeys.get(id);
  if (keyName)
    return (
      <span className='inline-flex items-center gap-1.5'>
        <span className='truncate'>{keyName}</span>
        <PmApiKeyTag />
      </span>
    );
  if (!name) return <span className='font-mono text-xs'>{id}</span>;
  return <span className='truncate'>{name}</span>;
}

const names = { Name: StudioActorName };

export function ReleaseActorNames({
  children,
}: {
  readonly children?: ReactNode;
}): ReactElement {
  return (
    <ReleasesActorNameContext.Provider value={names}>
      {children}
    </ReleasesActorNameContext.Provider>
  );
}
