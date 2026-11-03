import { randomUUID } from 'node:crypto';
import type {
  RealtimeService,
  RealtimeTopicFamily,
  RealtimeUserTopic,
} from '@nocobase/app-server/realtime';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import {
  COUNTER_TOPIC,
  PERSONAL_TOPIC,
  ROOM_PATTERN,
  type BurstReceipt,
  type CounterSnapshot,
  type DemoState,
  type PublicationReceipt,
  type RoomAccess,
} from '../shared/demo.js';

interface DemoAccount {
  readonly userId: string;
  readonly roomId: string;
  allowed: boolean;
  lastUsed: number;
  personal: CounterSnapshot;
  counter: CounterSnapshot;
  room: CounterSnapshot;
}

export class RealtimeExampleError extends Error {
  public constructor(
    public readonly code: 'ROOM_NOT_FOUND' | 'ROOM_FORBIDDEN' | 'DEMO_CAPACITY',
  ) {
    super(code);
  }
}

export interface DemoServiceOptions {
  readonly now?: () => number;
  readonly maxAccounts?: number;
  readonly idleMs?: number;
}

/** Disposable teaching data, isolated by authenticated account rather than client-supplied recipients. */
export class RealtimeExampleService {
  private readonly accounts = new Map<string, DemoAccount>();
  private readonly rooms = new Map<string, DemoAccount>();
  private readonly personalTopic: RealtimeUserTopic<CounterSnapshot>;
  private readonly counterTopic: RealtimeUserTopic<{ changed: true }>;
  private readonly roomTopics: RealtimeTopicFamily<
    { roomId: string },
    { changed: true }
  >;
  private readonly now: () => number;
  private readonly maxAccounts: number;
  private readonly idleMs: number;

  public constructor(
    private readonly realtime: RealtimeService,
    options: DemoServiceOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.maxAccounts = options.maxAccounts ?? 1_000;
    this.idleMs = options.idleMs ?? 60 * 60 * 1_000;
    this.personalTopic = realtime.defineTopic<CounterSnapshot, 'user'>(
      PERSONAL_TOPIC,
      { audience: 'user' },
    );
    this.counterTopic = realtime.defineTopic<{ changed: true }, 'user'>(
      COUNTER_TOPIC,
      { audience: 'user' },
    );
    this.roomTopics = realtime.defineTopicFamily<
      { roomId: string },
      { changed: true }
    >(ROOM_PATTERN, {
      audience: 'public',
      authenticated: true,
      authorize: ({ principal, params }) =>
        !!principal && this.canReadRoom(principal.userId, params.roomId),
    });
  }

  public state(userId: string): DemoState {
    const account = this.account(userId);
    return { userId, room: this.access(account) };
  }

  public personal(userId: string): CounterSnapshot {
    return { ...this.account(userId).personal };
  }

  public counter(userId: string): CounterSnapshot {
    return { ...this.account(userId).counter };
  }

  public async sendPersonal(userId: string): Promise<PublicationReceipt> {
    const account = this.account(userId);
    account.personal = this.increment(account.personal);
    return await this.personalTopic.publishFor(userId, account.personal);
  }

  public async burst(userId: string, count: number): Promise<BurstReceipt> {
    const account = this.account(userId);
    let lastEventId = '';
    for (let i = 0; i < count; i++) {
      account.counter = this.increment(account.counter);
      const receipt = await this.counterTopic.publishFor(userId, {
        changed: true,
      });
      lastEventId = receipt.eventId;
    }
    return { published: count, lastEventId };
  }

  public canReadRoom(userId: string, roomId: string): boolean {
    const account = this.rooms.get(roomId);
    return (
      !!account &&
      !this.expired(account) &&
      account.userId === userId &&
      account.allowed
    );
  }

  public readRoom(userId: string, roomId: string): CounterSnapshot {
    const account = this.ownedRoom(userId, roomId);
    if (!this.canReadRoom(userId, roomId))
      throw new RealtimeExampleError('ROOM_FORBIDDEN');
    return { ...account.room };
  }

  public async setAccess(
    userId: string,
    roomId: string,
    allowed: boolean,
  ): Promise<RoomAccess> {
    const account = this.ownedRoom(userId, roomId);
    account.allowed = allowed;
    // Delivery rechecks the policy, so revocation invalidates an already acknowledged watch.
    await this.roomTopics.publish({ roomId }, { changed: true });
    return this.access(account);
  }

  public async sendRoom(
    userId: string,
    roomId: string,
  ): Promise<PublicationReceipt> {
    const account = this.ownedRoom(userId, roomId);
    if (!this.canReadRoom(userId, roomId))
      throw new RealtimeExampleError('ROOM_FORBIDDEN');
    account.room = this.increment(account.room);
    return await this.roomTopics.publish({ roomId }, { changed: true });
  }

  public async disconnect(userId: string): Promise<number> {
    return await this.realtime.disconnectUser(userId);
  }

  public close(): void {
    this.personalTopic.close();
    this.counterTopic.close();
    this.roomTopics.close();
    this.accounts.clear();
    this.rooms.clear();
  }

  private increment(previous: CounterSnapshot): CounterSnapshot {
    return {
      value: previous.value + 1,
      updatedAt: new Date(this.now()).toISOString(),
    };
  }

  private access(account: DemoAccount): RoomAccess {
    return { id: account.roomId, allowed: account.allowed };
  }

  private expired(account: DemoAccount): boolean {
    return this.now() - account.lastUsed >= this.idleMs;
  }

  private ownedRoom(userId: string, roomId: string): DemoAccount {
    const account = this.rooms.get(roomId);
    // Avoid disclosing another account's room or allowing its access switch to be changed.
    if (!account || this.expired(account) || account.userId !== userId)
      throw new RealtimeExampleError('ROOM_NOT_FOUND');
    account.lastUsed = this.now();
    return account;
  }

  private account(userId: string): DemoAccount {
    for (const account of this.accounts.values()) {
      if (this.expired(account)) {
        this.accounts.delete(account.userId);
        this.rooms.delete(account.roomId);
      }
    }
    let account = this.accounts.get(userId);
    if (!account) {
      if (this.accounts.size >= this.maxAccounts)
        throw new RealtimeExampleError('DEMO_CAPACITY');
      const empty = { value: 0, updatedAt: new Date(this.now()).toISOString() };
      account = {
        userId,
        roomId: randomUUID(),
        allowed: false,
        lastUsed: this.now(),
        personal: empty,
        counter: empty,
        room: empty,
      };
      this.accounts.set(userId, account);
      this.rooms.set(account.roomId, account);
    }
    account.lastUsed = this.now();
    return account;
  }
}

export const realtimeExampleServiceToken: ServiceToken<RealtimeExampleService> =
  createServiceToken<RealtimeExampleService>('realtime-example.service');
