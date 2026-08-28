/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildFormDraftUid, FormDraftRepository, type FormDraftContext } from '../formDraftRepository';

const { db, openDB, store } = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  const db = {
    createObjectStore: vi.fn(),
    put: vi.fn(async (_storeName: string, value: { uid: string }) => {
      store.set(value.uid, value);
    }),
    get: vi.fn(async (_storeName: string, uid: string) => store.get(uid)),
    delete: vi.fn(async (_storeName: string, uid: string) => {
      store.delete(uid);
    }),
  };
  return {
    db,
    openDB: vi.fn(async (_name: string, _version: number, options?: { upgrade?: (database: typeof db) => void }) => {
      options?.upgrade?.(db);
      return db;
    }),
    store,
  };
});

vi.mock('idb', () => ({ openDB }));

function createContext(filterByTk?: unknown): FormDraftContext {
  return {
    model: { uid: 'form-uid' },
    resource:
      typeof filterByTk === 'undefined'
        ? undefined
        : {
            getFilterByTk: () => filterByTk,
          },
  };
}

describe('FormDraftRepository', () => {
  beforeEach(() => {
    store.clear();
    vi.clearAllMocks();
  });

  it('builds draft uid from form uid and record key', () => {
    expect(buildFormDraftUid(createContext(123))).toBe('form-uid:123');
    expect(buildFormDraftUid(createContext())).toBe('form-uid:__new_record__');
  });

  it('creates, saves, reads, and deletes drafts', async () => {
    const repository = new FormDraftRepository(createContext(123));

    await repository.connect();
    await repository.create();
    expect(await repository.get()).toEqual({ uid: 'form-uid:123', values: {} });

    await repository.save({
      title: 'Draft title',
      dropped: undefined,
      nested: { count: 1 },
    });

    expect(await repository.get()).toEqual({
      uid: 'form-uid:123',
      values: {
        title: 'Draft title',
        nested: { count: 1 },
      },
    });

    await repository.delete();
    expect(await repository.get()).toBeUndefined();
    expect(openDB).toHaveBeenCalledWith('FormDraftsDB', 1, { upgrade: expect.any(Function) });
    expect(db.createObjectStore).toHaveBeenCalledWith('drafts', { keyPath: 'uid' });
  });

  it('does nothing when disabled', async () => {
    const repository = new FormDraftRepository(createContext(123));

    repository.disable();
    await repository.connect();
    await repository.create();
    await repository.save({ title: 'ignored' });
    await repository.delete();

    expect(repository.disabled).toBe(true);
    expect(openDB).not.toHaveBeenCalled();
    expect(store.size).toBe(0);
    await expect(repository.get()).resolves.toBeUndefined();
  });
});
