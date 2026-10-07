/**
 * Who performed an operation, by name. The plugin stores ids (a user, a key); the assembling application knows whose
 * they are, so it may provide `ReleasesActorNameContext` with a component that shows one (a person by their display
 * name, say). Without it, the id shows as it is (`components/actor-name.tsx`).
 */
import { createContext, type ComponentType, type Context } from 'react';

import type { ActorKind } from '../../shared/releases.js';

export interface ActorNameProps {
  readonly id: string;
  readonly kind: ActorKind;
}

export interface ActorNames {
  readonly Name: ComponentType<ActorNameProps>;
}

export const ReleasesActorNameContext: Context<ActorNames | null> =
  createContext<ActorNames | null>(null);
