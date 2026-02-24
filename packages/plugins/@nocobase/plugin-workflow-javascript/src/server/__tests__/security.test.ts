/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import winston from 'winston';

import { JOB_STATUS } from '@nocobase/plugin-workflow';

import { CacheTransport } from '../cache-logger';
import ScriptInstruction from '../ScriptInstruction';

describe('workflow-javascript > security > vm context protections', () => {
  it('should mask constructors exposed to workflow scripts', async () => {
    const transport = new CacheTransport();
    const logger = winston.createLogger({
      transports: [transport],
    });

    const script = `
      console.log('security-check');
      return {
        globalCtor: globalThis.constructor ?? null,
        requireCtor: require.constructor ?? null,
        consoleCtor: console.constructor ?? null,
        consoleLogCtor: console.log.constructor ?? null,
        consoleProtoIsNull: Object.getPrototypeOf(console) === null,
      };
    `;

    const result = await ScriptInstruction.run(script, {}, { logger });

    expect(result.status).toBe(JOB_STATUS.RESOLVED);
    expect(result.result).toEqual({
      globalCtor: null,
      requireCtor: null,
      consoleCtor: null,
      consoleLogCtor: null,
      consoleProtoIsNull: true,
    });
    expect(transport.getLogs()).toContain('security-check\n');
  });
});
