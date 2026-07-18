/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_VERSION, LIGHT_EXTENSION_ENTRY_KEY_PATTERN } from './contracts';

const entryKeyPattern = new RegExp(LIGHT_EXTENSION_ENTRY_KEY_PATTERN);
const clientAppEntryFields = new Set([
  'schemaVersion',
  'key',
  'title',
  'description',
  'category',
  'icon',
  'tags',
  'sort',
  'entry',
]);

export interface LightExtensionClientAppEntryV1Input {
  schemaVersion: 1;
  key: string;
  title?: string;
  description?: string;
  category?: string;
  icon?: string;
  tags?: string[];
  sort?: number;
  entry?: string;
}

export interface LightExtensionClientAppEntryV1 extends Omit<LightExtensionClientAppEntryV1Input, 'entry'> {
  entry: string;
}

export function parseLightExtensionClientAppEntryV1(value: unknown): LightExtensionClientAppEntryV1 {
  if (!isPlainRecord(value)) {
    throw invalidDescriptor('entry.json must contain a JSON object');
  }

  const unknownField = Object.keys(value).find((key) => !clientAppEntryFields.has(key));
  if (unknownField) {
    throw invalidDescriptor(`entry.json field "${unknownField}" is not supported`);
  }
  if (value.schemaVersion !== LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_VERSION) {
    throw invalidDescriptor(`entry.json schemaVersion must be ${LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_VERSION}`);
  }

  const key = requireSlug(value.key, 'key');
  const title = optionalString(value.title, 'title', 120);
  const description = optionalString(value.description, 'description', 1000);
  const category = typeof value.category === 'undefined' ? undefined : requireSlug(value.category, 'category');
  const icon = optionalString(value.icon, 'icon', 120);
  const tags = optionalTags(value.tags);
  const sort = optionalInteger(value.sort, 'sort');
  const entry = normalizeLightExtensionClientAppEntryPath(value.entry);

  const descriptor: LightExtensionClientAppEntryV1 = {
    schemaVersion: LIGHT_EXTENSION_CLIENT_APP_ENTRY_SCHEMA_VERSION,
    key,
    entry,
  };
  if (typeof title !== 'undefined') descriptor.title = title;
  if (typeof description !== 'undefined') descriptor.description = description;
  if (typeof category !== 'undefined') descriptor.category = category;
  if (typeof icon !== 'undefined') descriptor.icon = icon;
  if (typeof tags !== 'undefined') descriptor.tags = tags;
  if (typeof sort !== 'undefined') descriptor.sort = sort;
  return descriptor;
}

export function parseLightExtensionClientAppEntryV1Json(content: string): LightExtensionClientAppEntryV1 {
  let value: unknown;
  try {
    value = JSON.parse(content);
  } catch (error) {
    throw invalidDescriptor(error instanceof Error ? error.message : 'entry.json is invalid JSON');
  }
  return parseLightExtensionClientAppEntryV1(value);
}

export function normalizeLightExtensionClientAppEntryPath(value: unknown): string {
  if (typeof value === 'undefined') {
    return 'index.html';
  }
  if (typeof value !== 'string' || !value) {
    throw invalidDescriptor('entry.json entry must be a non-empty string');
  }
  if (value.includes('\0')) {
    throw invalidDescriptor('entry.json entry cannot contain a null byte');
  }
  if (value.includes('\\')) {
    throw invalidDescriptor('entry.json entry must use "/" separators');
  }
  if (value.startsWith('/')) {
    throw invalidDescriptor('entry.json entry must be relative to the package root');
  }
  if (
    value.includes('?') ||
    value.includes('#') ||
    /^[A-Za-z][A-Za-z0-9+.-]*:/u.test(value) ||
    value.startsWith('//')
  ) {
    throw invalidDescriptor('entry.json entry must be a package-relative file path, not a URL');
  }

  const segments = value.split('/');
  if (segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    throw invalidDescriptor('entry.json entry contains an invalid path segment');
  }
  if (!/\.html?$/iu.test(segments[segments.length - 1])) {
    throw invalidDescriptor('entry.json entry must point to an .html or .htm file');
  }
  return segments.join('/');
}

export function getLightExtensionClientAppStaticRoot(entry: string): string {
  const normalizedEntry = normalizeLightExtensionClientAppEntryPath(entry);
  const separatorIndex = normalizedEntry.lastIndexOf('/');
  return separatorIndex < 0 ? '' : normalizedEntry.slice(0, separatorIndex);
}

function requireSlug(value: unknown, field: string): string {
  if (typeof value !== 'string' || !entryKeyPattern.test(value)) {
    throw invalidDescriptor(`entry.json ${field} must be a lowercase slug`);
  }
  return value;
}

function optionalString(value: unknown, field: string, maxLength: number): string | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'string' || value.length > maxLength) {
    throw invalidDescriptor(`entry.json ${field} must be a string no longer than ${maxLength} characters`);
  }
  return value;
}

function optionalTags(value: unknown): string[] | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (!Array.isArray(value) || value.length > 20 || value.some((item) => typeof item !== 'string')) {
    throw invalidDescriptor('entry.json tags must be an array of at most 20 strings');
  }
  return [...value];
}

function optionalInteger(value: unknown, field: string): number | undefined {
  if (typeof value === 'undefined') {
    return undefined;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw invalidDescriptor(`entry.json ${field} must be an integer`);
  }
  return value;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function invalidDescriptor(message: string): TypeError {
  return new TypeError(message);
}
