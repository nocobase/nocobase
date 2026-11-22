import type { ClientApplication } from '@nocobase/app-client';
import { ServiceProvider } from '@nocobase/service-provider';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { ComponentType } from 'react';

import type { DistributedStatus } from '../shared/types.js';

/** Where on the status page a block appears: after the summary, the shared services, ID generation or the checklist. */
export type DistributedStatusSlot =
  'overview' | 'services' | 'idGeneration' | 'checklist';

export interface DistributedStatusBlockProps {
  /** The status the page loaded, including `extensions` other plugins added on the server. */
  readonly status: DistributedStatus;
}

export interface DistributedStatusBlock {
  readonly slot: DistributedStatusSlot;
  /** Unique among blocks, such as `@nocobase/app-plugin-snowflake-worker:instances`. */
  readonly id: string;
  /** Lower comes first; defaults to 0. */
  readonly order?: number;
  /** Loaded only when the page renders, so registering a block costs the application nothing until then. */
  readonly load: () => Promise<{
    default: ComponentType<DistributedStatusBlockProps>;
  }>;
}

/**
 * Where other plugins insert blocks into the status page. Register in a client service provider's `boot()` after
 * checking `container.has()`, so the plugin still works in an application without this one.
 */
export interface DistributedStatusSlots {
  /** Adds a block; returns a function that removes it. */
  register(block: DistributedStatusBlock): () => void;
  list(slot: DistributedStatusSlot): readonly DistributedStatusBlock[];
}

const SLOTS: ReadonlySet<string> = new Set([
  'overview',
  'services',
  'idGeneration',
  'checklist',
]);

export function createDistributedStatusSlots(): DistributedStatusSlots {
  const blocks = new Map<string, DistributedStatusBlock>();
  return {
    register(block) {
      if (!block || typeof block.id !== 'string' || !block.id.trim())
        throw new TypeError('A distributed status block needs a non-empty id.');
      if (!SLOTS.has(block.slot))
        throw new TypeError(
          `Distributed status block "${block.id}" names an unknown slot.`,
        );
      if (typeof block.load !== 'function')
        throw new TypeError(
          `Distributed status block "${block.id}" needs load().`,
        );
      if (blocks.has(block.id))
        throw new Error(
          `Distributed status block "${block.id}" is already registered.`,
        );
      blocks.set(block.id, block);
      return () => {
        if (blocks.get(block.id) === block) blocks.delete(block.id);
      };
    },
    list(slot) {
      return [...blocks.values()]
        .filter((block) => block.slot === slot)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    },
  };
}

export const distributedStatusSlotsToken: ServiceToken<DistributedStatusSlots> =
  createServiceToken<DistributedStatusSlots>(
    '@nocobase/app-plugin-distributed/status-slots',
  );

export class DistributedStatusSlotsProvider extends ServiceProvider<ClientApplication> {
  public readonly name: string =
    '@nocobase/app-plugin-distributed/status-slots';

  public override register(): void {
    this.app.container.singleton(distributedStatusSlotsToken, () =>
      createDistributedStatusSlots(),
    );
  }
}
