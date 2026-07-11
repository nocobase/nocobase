/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context } from '@nocobase/actions';

import { JsonRecord, getRecord, getString } from './utils';

const INGEST_ID_PATTERN = /^[0-9]+$/;
const CURSOR_INGEST_ID_WIDTH = 20;
const MAX_INGEST_ID = 9_223_372_036_854_775_807n;

type CursorDirection = 'before' | 'after';
export type CursorField = 'ingestId' | 'sessionIngestId';

interface CursorPayload {
  version: 2;
  scope: string;
  direction: CursorDirection;
  cursorField: CursorField;
  ingestId: string;
}

export interface CursorPageRow {
  get(name: string): unknown;
}

export interface CursorPage<Row extends CursorPageRow> {
  rows: Row[];
  pageSize: number;
  beforeCursor?: string;
  afterCursor?: string;
  hasMoreBefore: boolean;
  hasMoreAfter: boolean;
}

export interface CursorPageFindOptions {
  filter: JsonRecord;
  sort: string[];
  limit: number;
}

interface FindCursorPageOptions<Row extends CursorPageRow> {
  ctx: Context;
  filter: JsonRecord;
  scope: string;
  cursorField: CursorField;
  defaultPageSize: number;
  maxPageSize: number;
  findRows(options: CursorPageFindOptions): Promise<Row[]>;
}

function getQueryValue(ctx: Context, key: string) {
  const value = getRecord(ctx.query)[key];
  return Array.isArray(value) ? value[0] : value;
}

export function getBoundedPositiveIntegerQuery(
  ctx: Context,
  key: string,
  defaultValue: number,
  maxValue: number,
  fallbackKey?: string,
) {
  const rawValue = getQueryValue(ctx, key) ?? (fallbackKey ? getQueryValue(ctx, fallbackKey) : undefined);
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return defaultValue;
  }
  const value = typeof rawValue === 'number' ? rawValue : Number(rawValue);
  if (!Number.isInteger(value) || value <= 0 || value > maxValue) {
    ctx.throw(400, `${key} must be an integer between 1 and ${maxValue}`);
  }
  return value;
}

function normalizeIngestId(value: unknown) {
  const ingestId = typeof value === 'bigint' ? value.toString() : String(value ?? '').trim();
  if (
    ingestId.length > CURSOR_INGEST_ID_WIDTH ||
    !INGEST_ID_PATTERN.test(ingestId) ||
    BigInt(ingestId) <= 0n ||
    BigInt(ingestId) > MAX_INGEST_ID
  ) {
    throw new Error('Event cursor ingest id is unavailable');
  }
  return BigInt(ingestId).toString().padStart(CURSOR_INGEST_ID_WIDTH, '0');
}

function encodeCursor(cursor: CursorPayload) {
  return Buffer.from(
    JSON.stringify({
      version: cursor.version,
      scope: cursor.scope,
      direction: cursor.direction,
      cursorField: cursor.cursorField,
      ingestId: cursor.ingestId,
    }),
    'utf8',
  ).toString('base64url');
}

function decodeCursor(
  ctx: Context,
  rawValue: unknown,
  direction: CursorDirection,
  scope: string,
  cursorField: CursorField,
): CursorPayload | null {
  const value = getString(rawValue);
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as unknown;
    const record = getRecord(parsed);
    const ingestId = normalizeIngestId(record.ingestId);
    if (
      record.version !== 2 ||
      record.direction !== direction ||
      record.scope !== scope ||
      record.cursorField !== cursorField
    ) {
      ctx.throw(400, `${direction}Cursor is invalid`);
    }
    return {
      version: 2,
      direction,
      scope,
      cursorField,
      ingestId,
    };
  } catch (error) {
    if (error && typeof error === 'object' && 'status' in error) {
      throw error;
    }
    ctx.throw(400, `${direction}Cursor is invalid`);
  }
}

function getBoundaryCursor<Row extends CursorPageRow>(
  rows: Row[],
  direction: CursorDirection,
  scope: string,
  cursorField: CursorField,
  fallback: CursorPayload | null,
) {
  const boundaryRow = direction === 'before' ? rows[0] : rows[rows.length - 1];
  if (!boundaryRow) {
    return fallback ? encodeCursor(fallback) : undefined;
  }
  const ingestId = normalizeIngestId(boundaryRow.get(cursorField));
  return encodeCursor({
    version: 2,
    scope,
    direction,
    cursorField,
    ingestId,
  });
}

export async function findCursorPage<Row extends CursorPageRow>({
  ctx,
  filter,
  scope,
  cursorField,
  defaultPageSize,
  maxPageSize,
  findRows,
}: FindCursorPageOptions<Row>): Promise<CursorPage<Row>> {
  const pageSize = getBoundedPositiveIntegerQuery(ctx, 'pageSize', defaultPageSize, maxPageSize, 'limit');
  const rawBeforeCursor = getQueryValue(ctx, 'beforeCursor');
  const rawAfterCursor = getQueryValue(ctx, 'afterCursor');
  if (getString(rawBeforeCursor) && getString(rawAfterCursor)) {
    ctx.throw(400, 'beforeCursor and afterCursor cannot be used together');
  }
  const beforeCursor = decodeCursor(ctx, rawBeforeCursor, 'before', scope, cursorField);
  const afterCursor = decodeCursor(ctx, rawAfterCursor, 'after', scope, cursorField);
  const activeCursor = beforeCursor || afterCursor;
  const direction = afterCursor ? 'after' : 'before';
  const cursorFilter = activeCursor
    ? {
        [cursorField]: {
          [direction === 'after' ? '$gt' : '$lt']: activeCursor.ingestId,
        },
      }
    : null;
  const descending = !afterCursor;
  const foundRows = await findRows({
    filter: cursorFilter ? { $and: [filter, cursorFilter] } : filter,
    sort: descending ? [`-${cursorField}`] : [cursorField],
    limit: pageSize + 1,
  });
  const hasExtra = foundRows.length > pageSize;
  const selectedRows = foundRows.slice(0, pageSize);
  const rows = descending ? selectedRows.reverse() : selectedRows;

  return {
    rows,
    pageSize,
    beforeCursor: getBoundaryCursor(rows, 'before', scope, cursorField, beforeCursor),
    afterCursor: getBoundaryCursor(rows, 'after', scope, cursorField, afterCursor),
    hasMoreBefore: afterCursor ? true : hasExtra,
    hasMoreAfter: afterCursor ? hasExtra : Boolean(beforeCursor),
  };
}
