import { describe, expect, it, vi } from 'vitest';
import {
  runAfterCommitNow,
  TransactionCallbacks,
  type TransactionCallbackPhase,
} from '../../../src/database/internal/transaction-callbacks.js';

function reporter(): {
  report: (error: unknown, phase: TransactionCallbackPhase) => void;
  reported: Array<{ error: unknown; phase: TransactionCallbackPhase }>;
} {
  const reported: Array<{ error: unknown; phase: TransactionCallbackPhase }> =
    [];
  return {
    report: (error, phase) => reported.push({ error, phase }),
    reported,
  };
}

describe('TransactionCallbacks', () => {
  it('runs commit callbacks in registration order and awaits each one', async () => {
    const order: string[] = [];
    const callbacks = new TransactionCallbacks(undefined);
    callbacks.afterCommit(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      order.push('first');
    });
    callbacks.afterCommit(() => {
      order.push('second');
    });
    callbacks.afterRollback(() => {
      order.push('rollback');
    });

    await callbacks.commit(reporter().report);

    expect(order).toEqual(['first', 'second']);
  });

  it('reports a failing commit callback and keeps running the rest', async () => {
    const { report, reported } = reporter();
    const order: string[] = [];
    const failure = new Error('realtime is down');
    const callbacks = new TransactionCallbacks(undefined);
    callbacks.afterCommit(() => {
      throw failure;
    });
    callbacks.afterCommit(() => {
      order.push('still runs');
    });

    await expect(callbacks.commit(report)).resolves.toBeUndefined();

    expect(order).toEqual(['still runs']);
    expect(reported).toEqual([{ error: failure, phase: 'afterCommit' }]);
  });

  it('drops commit callbacks and hands the cause to rollback callbacks', async () => {
    const { report, reported } = reporter();
    const commit = vi.fn();
    const rollback = vi.fn();
    const cause = new Error('quota exceeded');
    const callbacks = new TransactionCallbacks(undefined);
    callbacks.afterCommit(commit);
    callbacks.afterRollback(rollback);

    await callbacks.rollback(cause, report);
    await callbacks.commit(report);

    expect(commit).not.toHaveBeenCalled();
    expect(rollback).toHaveBeenCalledExactlyOnceWith(cause);
    expect(reported).toEqual([]);
  });

  it('reports a failing rollback callback with its phase', async () => {
    const { report, reported } = reporter();
    const failure = new Error('logger is down');
    const callbacks = new TransactionCallbacks(undefined);
    callbacks.afterRollback(() => {
      throw failure;
    });

    await callbacks.rollback(new Error('cause'), report);

    expect(reported).toEqual([{ error: failure, phase: 'afterRollback' }]);
  });

  it('moves a released savepoint scope into its parent', async () => {
    const order: string[] = [];
    const outer = new TransactionCallbacks(undefined);
    const inner = new TransactionCallbacks(outer);
    outer.afterCommit(() => {
      order.push('outer');
    });
    inner.afterCommit(() => {
      order.push('inner');
    });
    inner.afterRollback(() => {
      order.push('inner-rollback');
    });

    inner.release();
    await outer.rollback(new Error('outer failed'), reporter().report);

    expect(order).toEqual(['inner-rollback']);
  });

  it('refuses callbacks once the scope has finished', async () => {
    const callbacks = new TransactionCallbacks(undefined);
    await callbacks.commit(reporter().report);

    expect(() => callbacks.afterCommit(() => undefined)).toThrow(
      'This transaction has finished',
    );
    expect(() => callbacks.afterRollback(() => undefined)).toThrow(
      'This transaction has finished',
    );
  });

  it('refuses to release the outermost scope', () => {
    expect(() => new TransactionCallbacks(undefined).release()).toThrow(
      'Only a savepoint scope can be released.',
    );
  });
});

describe('runAfterCommitNow', () => {
  it('starts the callback synchronously', () => {
    const callback = vi.fn();

    runAfterCommitNow(callback, reporter().report);

    expect(callback).toHaveBeenCalledOnce();
  });

  it('reports a rejected callback', async () => {
    const { report, reported } = reporter();
    const failure = new Error('async failure');

    runAfterCommitNow(() => Promise.reject(failure), report);
    await vi.waitFor(() => expect(reported).toHaveLength(1));

    expect(reported).toEqual([{ error: failure, phase: 'afterCommit' }]);
  });
});
