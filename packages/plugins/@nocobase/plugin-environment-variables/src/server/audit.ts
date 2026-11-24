/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AuditLog } from '@nocobase/server';

function variableDetails(record: unknown) {
  if (!record || typeof record !== 'object') {
    return {};
  }
  return {
    name: 'name' in record && typeof record.name === 'string' ? record.name : undefined,
    type: 'type' in record && typeof record.type === 'string' ? record.type : undefined,
  };
}

function auditRecords(records: unknown) {
  return Array.isArray(records) ? records.map(variableDetails) : variableDetails(records);
}

export function sanitizeVariableAuditMetadata({ request, response, status }: NonNullable<AuditLog['metadata']>) {
  const filterByTk = request.query?.filterByTk;
  return {
    status,
    request: {
      path: request.path,
      headers: request.headers,
      query: typeof filterByTk === 'string' ? { filterByTk } : {},
      body: auditRecords(request.body),
    },
    response: {
      body: response.body?.data == null ? null : { data: auditRecords(response.body.data) },
    },
  };
}
