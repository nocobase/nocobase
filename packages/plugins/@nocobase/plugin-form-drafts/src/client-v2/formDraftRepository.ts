/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { IDBPDatabase } from 'idb';
import { openDB } from 'idb';

const DB_NAME = 'FormDraftsDB';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const NEW_RECORD_KEY = '__new_record__';

export type FormDraftValues = Record<string, unknown>;

export type FormDraft = {
  uid: string;
  values: FormDraftValues;
};

export type FormDraftContext = {
  model: {
    uid: string;
  };
  resource?: {
    getFilterByTk?: () => unknown;
  };
};

export function buildFormDraftUid(ctx: FormDraftContext) {
  return `${ctx.model.uid}:${ctx.resource?.getFilterByTk?.() || NEW_RECORD_KEY}`;
}

export class FormDraftRepository {
  readonly uid: string;
  #db?: IDBPDatabase;
  #disabled = false;

  constructor(ctx: FormDraftContext) {
    this.uid = buildFormDraftUid(ctx);
  }

  disable() {
    this.#disabled = true;
  }

  get disabled() {
    return this.#disabled;
  }

  async connect() {
    if (this.#disabled) {
      return;
    }
    this.#db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'uid' });
      },
    });
  }

  async create() {
    if (this.#disabled) {
      return;
    }
    await this.getDb().put(STORE_NAME, { uid: this.uid, values: {} });
  }

  async get(): Promise<FormDraft | undefined> {
    if (this.#disabled) {
      return;
    }
    return this.getDb().get(STORE_NAME, this.uid);
  }

  async save(values: FormDraftValues) {
    if (this.#disabled) {
      return;
    }
    const safeValues = JSON.parse(JSON.stringify(values)) as FormDraftValues;
    await this.getDb().put(STORE_NAME, { uid: this.uid, values: safeValues });
  }

  async delete() {
    if (this.#disabled) {
      return;
    }
    await this.getDb().delete(STORE_NAME, this.uid);
  }

  private getDb() {
    if (!this.#db) {
      throw new Error('Form draft database is not connected.');
    }
    return this.#db;
  }
}
