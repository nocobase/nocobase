/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord } from '../json';

export function isRecord(value: unknown): value is JsonRecord {
  return Object.prototype.toString.call(value) === '[object Object]';
}

export function getString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getOutputString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : '';
}

export function getRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

export function getRecordArray(value: unknown) {
  return Array.isArray(value) ? value.map(getRecord).filter((record) => Object.keys(record).length) : [];
}

export function getStringArray(value: unknown) {
  return Array.isArray(value) ? value.map(getString).filter(Boolean) : [];
}

export function getNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') {
    return undefined;
  }
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseJsonRecordString(value: unknown) {
  if (typeof value !== 'string') {
    return {};
  }
  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith('{')) {
    return {};
  }
  try {
    return getRecord(JSON.parse(trimmed) as unknown);
  } catch {
    return {};
  }
}

export function getFallbackEventType(type: string, text: string) {
  const normalizedType = type.toLowerCase();
  if (
    normalizedType.includes('reasoning') ||
    normalizedType.includes('thinking') ||
    normalizedType.includes('summary')
  ) {
    return 'agent.reasoning';
  }
  if (
    normalizedType.includes('progress') ||
    normalizedType.includes('status') ||
    normalizedType.includes('log') ||
    normalizedType.includes('event')
  ) {
    return text ? 'agent.progress' : 'agent.raw';
  }
  return text ? 'agent.message' : 'agent.raw';
}

export function getFallbackTextKind(eventType: string) {
  if (eventType === 'agent.reasoning') {
    return 'reasoning';
  }
  if (eventType === 'agent.progress') {
    return 'progress';
  }
  if (eventType === 'agent.raw') {
    return 'raw';
  }
  return 'message';
}
