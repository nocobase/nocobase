/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export type WorkspaceCodingTargetMetadata = {
  type: 'workspace';
  surfaceId: string;
  kind: string;
  title: string;
};

const WORKSPACE_CODING_TARGET_KEYS = new Set(['type', 'surfaceId', 'kind', 'title']);
const MAX_WORKSPACE_CODING_TARGET_STRING_LENGTH = 512;

const isNonEmptyBoundedString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= MAX_WORKSPACE_CODING_TARGET_STRING_LENGTH;

export const parseWorkspaceCodingTargetMetadata = (value: unknown): WorkspaceCodingTargetMetadata | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !WORKSPACE_CODING_TARGET_KEYS.has(key))) {
    return undefined;
  }
  if (
    record.type !== 'workspace' ||
    !isNonEmptyBoundedString(record.surfaceId) ||
    !isNonEmptyBoundedString(record.kind) ||
    !isNonEmptyBoundedString(record.title)
  ) {
    return undefined;
  }
  return {
    type: 'workspace',
    surfaceId: record.surfaceId,
    kind: record.kind,
    title: record.title,
  };
};

export const isSameWorkspaceCodingTargetMetadata = (
  left: WorkspaceCodingTargetMetadata,
  right: WorkspaceCodingTargetMetadata,
): boolean => left.surfaceId === right.surfaceId && left.kind === right.kind;
