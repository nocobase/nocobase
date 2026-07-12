/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { JsonRecord } from './json';

export interface ProviderEventInput {
  rawLine?: string;
  event?: unknown;
  source?: string;
}

export interface NormalizedAgentEvent {
  eventType: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  providerEventId?: string | null;
  correlationId?: string | null;
  confidence?: number | null;
  message?: string | null;
  payloadJson?: JsonRecord;
  rawLine?: string | null;
  rawEvent?: JsonRecord | null;
}
