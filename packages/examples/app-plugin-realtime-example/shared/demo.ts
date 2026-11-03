export const PERSONAL_TOPIC: string = 'realtime-example:personal';
export const COUNTER_TOPIC: string = 'realtime-example:counter';
export const ROOM_PATTERN: string = 'realtime-example:rooms:{roomId}';
export const UNKNOWN_TOPIC: string = 'realtime-example:undeclared';

export interface CounterSnapshot {
  readonly value: number;
  readonly updatedAt: string;
}

export interface RoomAccess {
  readonly id: string;
  readonly allowed: boolean;
}

export interface DemoState {
  readonly userId: string;
  readonly room: RoomAccess;
}

export interface PublicationReceipt {
  readonly eventId: string;
  readonly topic: string;
}

export interface BurstReceipt {
  readonly published: number;
  readonly lastEventId: string;
}
