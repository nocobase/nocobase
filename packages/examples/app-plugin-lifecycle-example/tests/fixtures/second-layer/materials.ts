// A test fixture: it runs only on the memory store, through the `MemoryRows`
// handle a memory transaction hands out, and is not part of the published
// plugin. A real plugin keeps a second layer's rows in tables of its own,
// created by a migration and written through the transaction's Repository.

import {
  defineLifecycle,
  type Lifecycle,
  type LifecycleActor,
  type LifecycleRecord,
  type LifecycleRuntime,
  type LifecycleTransaction,
  type RecordId,
} from '@nocobase/lifecycle';

import {
  isActor,
  rowsOf,
  SecondLayerError,
  text,
  type Row,
  type SecondLayerServices,
} from './rows.js';

// Scenario 26's material exchange as a hand-written second layer, without
// the approval layer: what design step 5 asks for. A visa officer asks for
// material; the applicant and the officer then go back and forth, a request,
// a submission, a review, for as many rounds as it takes. Every round is a
// row of the exchange: the visa waits in `supplementing`, its version and
// its clock untouched, until the officer finds the material complete — the
// one conclusion that moves it back to `reviewing`, in the same transaction
// as the review that says so.

export type VisaState =
  | 'draft'
  | 'reviewing'
  | 'supplementing'
  | 'approved'
  | 'rejected'
  | 'withdrawn';

export interface Visa extends LifecycleRecord {
  readonly applicantId: string;
  readonly officerId: string;
  readonly status: VisaState;
}

export interface VisaTypes {
  record: Visa;
  state: VisaState;
  services: SecondLayerServices;
}

export const VISAS = 'twoLayerVisas';
/** One row per request, submission and review of the exchange. */
export const VISA_EXCHANGES = 'twoLayerVisaExchanges';

type ExchangeKind = 'request' | 'submission' | 'review';

export interface Exchange {
  readonly id: string;
  readonly visaId: string;
  /** The stay it belongs to: the visa's version when it entered `supplementing`. */
  readonly enteredVersion: number;
  readonly round: number;
  readonly kind: ExchangeKind;
  /** Whose turn it is, for a request or a review still open. */
  readonly to: string;
  readonly status: 'open' | 'answered' | 'void';
  readonly text: string | null;
  readonly files: readonly string[];
  readonly rowVersion: number;
}

function toExchange(row: Row): Exchange {
  return {
    id: String(row.id),
    visaId: String(row.visaId),
    enteredVersion: Number(row.enteredVersion),
    round: Number(row.round),
    kind: row.kind as ExchangeKind,
    to: String(row.to),
    status: row.status as Exchange['status'],
    text: (row.text ?? null) as string | null,
    files: (row.files ?? []) as string[],
    rowVersion: Number(row.rowVersion),
  };
}

function exchanges(handle: unknown, visaId: string): Promise<Exchange[]> {
  return rowsOf(handle)
    .find(VISA_EXCHANGES, { visaId })
    .then((rows) => rows.map(toExchange));
}

function insert(
  handle: unknown,
  values: Omit<Exchange, 'id' | 'rowVersion' | 'status' | 'files'> &
    Partial<Pick<Exchange, 'status' | 'files'>>,
): Promise<Row> {
  return rowsOf(handle).insert(VISA_EXCHANGES, {
    status: 'open',
    files: [],
    rowVersion: 0,
    ...values,
  });
}

export const visaLifecycle: Lifecycle<VisaTypes> = defineLifecycle<VisaTypes>({
  name: VISAS,
  initial: 'draft',
  states: [
    'draft',
    'reviewing',
    'supplementing',
    { name: 'approved', final: true },
    { name: 'rejected', final: true },
    { name: 'withdrawn', final: true },
  ],
  transitions: {
    submit: {
      from: 'draft',
      to: 'reviewing',
      guard: ({ record, actor }) =>
        isActor(actor, record.applicantId, 'Only the applicant submits.'),
    },
    // Simple single-person handling needs no second layer: the officer fires.
    approve: {
      from: 'reviewing',
      to: 'approved',
      guard: ({ record, actor }) =>
        isActor(actor, record.officerId, 'Only the officer decides.'),
    },
    reject: {
      from: 'reviewing',
      to: 'rejected',
      guard: ({ record, actor }) =>
        isActor(actor, record.officerId, 'Only the officer decides.'),
    },
    askMaterials: {
      from: 'reviewing',
      to: 'supplementing',
      guard: ({ record, actor }) =>
        isActor(actor, record.officerId, 'Only the officer asks.'),
      validate: (input) =>
        text(input.request) ? null : 'Say what material is needed.',
    },
    // The exchange's one conclusion: only its own service fires it.
    materialsComplete: {
      from: 'supplementing',
      to: 'reviewing',
      manual: false,
    },
    withdraw: {
      from: ['reviewing', 'supplementing'],
      to: 'withdrawn',
      guard: ({ record, actor }) =>
        isActor(actor, record.applicantId, 'Only the applicant withdraws.'),
    },
  },
  onEnterState: {
    supplementing: async ({ record, input, tx }) => {
      await insert(tx.handle, {
        visaId: String(record.id),
        enteredVersion: Number(record.lifecycleVersion),
        round: 1,
        kind: 'request',
        to: record.applicantId,
        text: text(input.request),
      });
    },
  },
  onLeaveState: {
    // Leaving ends the exchange: nothing of it stays open to act on.
    supplementing: async ({ record, tx }) => {
      const rows = rowsOf(tx.handle);
      for (const row of await exchanges(tx.handle, String(record.id)))
        if (row.status === 'open')
          await rows.update(
            VISA_EXCHANGES,
            row.id,
            { status: 'open', rowVersion: row.rowVersion },
            { status: 'void', rowVersion: row.rowVersion + 1 },
          );
    },
  },
});

/**
 * The exchange's operations. Each locks the open row it answers — the
 * serialization point between two events of the exchange — and only the
 * review that finds the material complete touches the visa, at the version
 * its stay began at.
 */
export class VisaMaterials {
  public constructor(private readonly runtime: LifecycleRuntime) {}

  private async turn(
    tx: LifecycleTransaction,
    visaId: RecordId,
    kind: ExchangeKind,
    actor: LifecycleActor,
  ): Promise<{ visa: Visa; open: Exchange }> {
    const visa = (await tx.read(VISAS, visaId)) as Visa | undefined;
    if (!visa || visa.status !== 'supplementing')
      throw new SecondLayerError(
        'STALE',
        'This visa is not waiting for material.',
      );
    const open = (await exchanges(tx.handle, String(visaId))).find(
      (row) =>
        row.kind === kind &&
        row.status === 'open' &&
        row.enteredVersion === Number(visa.lifecycleVersion),
    );
    if (!open)
      throw new SecondLayerError('NOT_YOUR_TURN', `No ${kind} is waiting.`);
    if (open.to !== actor.id)
      throw new SecondLayerError('NOT_ASSIGNEE', 'It is not your turn.');
    const answered = await rowsOf(tx.handle).update(
      VISA_EXCHANGES,
      open.id,
      { status: 'open', rowVersion: open.rowVersion },
      { status: 'answered', rowVersion: open.rowVersion + 1 },
    );
    if (!answered)
      throw new SecondLayerError('CONFLICT', 'Someone answered it meanwhile.');
    return { visa, open };
  }

  /** The applicant sends material: written to the exchange alone. */
  public submit(input: {
    readonly visaId: RecordId;
    readonly actor: LifecycleActor;
    readonly files: readonly string[];
    readonly note?: string;
  }): Promise<void> {
    return this.runtime.transaction(async (tx) => {
      const { visa, open } = await this.turn(
        tx,
        input.visaId,
        'request',
        input.actor,
      );
      const base = {
        visaId: String(visa.id),
        enteredVersion: open.enteredVersion,
        round: open.round,
      };
      await insert(tx.handle, {
        ...base,
        kind: 'submission',
        to: visa.officerId,
        status: 'answered',
        text: input.note ?? null,
        files: input.files,
      });
      await insert(tx.handle, {
        ...base,
        kind: 'review',
        to: visa.officerId,
        text: null,
      });
    });
  }

  /**
   * The officer reviews what came: more is needed, which opens the next
   * round, or it is complete, which moves the visa back to review.
   */
  public review(input: {
    readonly visaId: RecordId;
    readonly actor: LifecycleActor;
    readonly complete: boolean;
    readonly note: string;
  }): Promise<'nextRound' | 'complete'> {
    return this.runtime.transaction(async (tx) => {
      const { visa, open } = await this.turn(
        tx,
        input.visaId,
        'review',
        input.actor,
      );
      if (!input.complete) {
        await insert(tx.handle, {
          visaId: String(visa.id),
          enteredVersion: open.enteredVersion,
          round: open.round + 1,
          kind: 'request',
          to: visa.applicantId,
          text: input.note,
        });
        return 'nextRound';
      }
      await tx.fire(VISAS, visa.id, 'materialsComplete', {
        actor: input.actor,
        input: { rounds: open.round, note: input.note },
        expect: { version: open.enteredVersion },
      });
      return 'complete';
    });
  }

  public history(visaId: RecordId): Promise<Exchange[]> {
    return this.runtime.transaction((tx) =>
      exchanges(tx.handle, String(visaId)),
    );
  }
}
