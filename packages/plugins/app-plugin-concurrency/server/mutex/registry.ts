import { Mutex } from 'async-mutex';
import type { BackendContext } from '@nocobase/concurrency/backend';

interface Holder {
  token: string;
  expiresAt: number;
}
interface Ticket {
  readonly version: number;
  readonly token: string;
  cancelled: boolean;
  cancel?: () => void;
}
export interface ResourceState {
  readonly key: string;
  readonly gate: Mutex;
  references: number;
  effects: number;
  version: number;
  holder?: Holder;
  timer?: Ticket;
}
/** Internal state gate: transitions are synchronous and external effects run after unlock. */
export class LocalResourceRegistry {
  private readonly resources = new Map<string, ResourceState>();
  private readonly operations = new Set<Promise<unknown>>();
  private readonly rollbackByEffects = new WeakMap<
    (() => void)[],
    () => Promise<void>
  >();
  private readonly pendingRollbacks = new Set<() => Promise<void>>();
  async drain(): Promise<void> {
    while (this.operations.size) await Promise.allSettled([...this.operations]);
    for (const rollback of [...this.pendingRollbacks]) await rollback();
  }
  transition<T>(
    key: string,
    change: (state: ResourceState, effects: (() => void)[]) => T,
    existing?: ResourceState,
  ): Promise<T | undefined> {
    const work = this.perform(key, change, existing);
    this.operations.add(work);
    void work.then(
      () => {
        this.operations.delete(work);
      },
      () => {
        this.operations.delete(work);
      },
    );
    return work;
  }
  constructor(private readonly context: BackendContext) {}
  get size(): number {
    return this.resources.size;
  }
  private collect(state: ResourceState): void {
    if (
      !state.holder &&
      !state.references &&
      !state.timer &&
      !state.effects &&
      this.resources.get(state.key) === state
    )
      this.resources.delete(state.key);
  }
  private async perform<T>(
    key: string,
    change: (state: ResourceState, effects: (() => void)[]) => T,
    existing?: ResourceState,
  ): Promise<T | undefined> {
    if (existing && this.resources.get(key) !== existing) return undefined;
    let state = this.resources.get(key);
    if (!state) {
      state = { key, gate: new Mutex(), references: 0, effects: 0, version: 0 };
      this.resources.set(key, state);
    }
    // Pin before awaiting the real async-mutex gate; isLocked() alone is insufficient.
    state.references++;
    const effects: (() => void)[] = [];
    try {
      const unlock = await state.gate.acquire();
      let result!: T;
      let failed = false;
      let failure: unknown;
      try {
        result = change(state, effects);
        if (result instanceof Promise)
          throw new Error('State transitions must be synchronous');
      } catch (error) {
        failed = true;
        failure = error;
      } finally {
        state.effects += effects.length;
        unlock();
      }
      // Neither scheduler calls nor abort/listener notifications happen under the gate.
      for (const effect of effects) {
        try {
          effect();
        } catch (error) {
          if (!failed) {
            failed = true;
            failure = error;
          }
        } finally {
          state.effects--;
        }
      }
      if (failed) {
        const rollback = this.rollbackByEffects.get(effects);
        if (rollback) {
          this.pendingRollbacks.add(rollback);
          try {
            await rollback();
          } catch {
            /* Retain cleanup for drain retry without masking the original failure. */
          }
        }
        throw failure;
      }
      return result;
    } finally {
      this.rollbackByEffects.delete(effects);
      state.references--;
      this.collect(state);
    }
  }
  purge(state: ResourceState, effects: (() => void)[]): void {
    if (state.holder && this.context.clock.now() >= state.holder.expiresAt)
      this.clear(state, effects);
  }
  clear(state: ResourceState, effects: (() => void)[]): void {
    state.holder = undefined;
    const ticket = state.timer;
    state.timer = undefined;
    if (ticket) {
      ticket.cancelled = true;
      effects.push(() => {
        ticket.cancel?.();
      });
    }
  }
  grant(
    state: ResourceState,
    token: string,
    expiresAt: number,
    effects: (() => void)[],
  ): void {
    state.holder = { token, expiresAt };
    const ticket: Ticket = {
      token,
      version: ++state.version,
      cancelled: false,
    };
    state.timer = ticket;
    const rollback = async (): Promise<void> => {
      await this.transition(
        state.key,
        (current, cleanup) => {
          if (
            current.timer === ticket &&
            current.version === ticket.version &&
            current.holder?.token === token
          )
            this.clear(current, cleanup);
        },
        state,
      );
      this.pendingRollbacks.delete(rollback);
    };
    this.rollbackByEffects.set(effects, rollback);
    const schedule = (): void => {
      const fire = (): void => {
        if (ticket.cancelled) return;
        // Observe timer work. Lazy checks remain authoritative if a gate operation fails.
        void this.transition(
          state.key,
          (current, nextEffects) => {
            if (
              current.timer !== ticket ||
              current.version !== ticket.version ||
              current.holder?.token !== token
            )
              return;
            this.purge(current, nextEffects);
            if (current.timer === ticket) nextEffects.push(schedule);
          },
          state,
        ).catch(() => {});
      };
      ticket.cancel = this.context.scheduler.setTimer(
        fire,
        Math.max(0, Math.ceil(expiresAt - this.context.clock.now())),
      );
      if (ticket.cancelled) ticket.cancel();
    };
    effects.push(schedule);
  }
}
