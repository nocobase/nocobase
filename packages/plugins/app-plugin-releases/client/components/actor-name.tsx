/** An operator, requester or decider: the application's rendering (`ReleasesActorNameContext`), else the id. */
import { useContext, type ReactElement } from 'react';

import {
  ReleasesActorNameContext,
  type ActorNameProps,
} from '../lib/actor-names.js';

export function ActorName({ id, kind }: ActorNameProps): ReactElement {
  const names = useContext(ReleasesActorNameContext);
  if (names) return <names.Name id={id} kind={kind} />;
  return <span className='font-mono text-xs'>{id}</span>;
}
