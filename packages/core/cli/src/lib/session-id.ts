/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export interface SessionIdentity {
  id: string;
}

export function resolveSessionIdentity(): SessionIdentity | undefined {
  const sessionId = String(process.env.NB_SESSION_ID ?? '').trim();
  if (sessionId) {
    return {
      id: sessionId,
    };
  }

  return undefined;
}
