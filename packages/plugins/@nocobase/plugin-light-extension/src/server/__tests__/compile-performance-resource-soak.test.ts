/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import { collectCompilePerformanceResourceSoakEvidence } from './helpers/compilePerformanceResourceSoakCollector';
import {
  parseCompilePerformanceResourceSoakConfig,
  serializeCompilePerformanceResourceSoakEvidence,
} from './helpers/compilePerformanceResourceEvidence';

describe.runIf(process.env.LIGHT_EXTENSION_RESOURCE_SOAK === 'true')(
  'light-extension Session, Worker, and memory resource soak',
  () => {
    it(
      'collects supplemental production resource evidence with automatic gates',
      async () => {
        const config = parseCompilePerformanceResourceSoakConfig(process.env);
        const evidence = await collectCompilePerformanceResourceSoakEvidence(config);
        const outputPath = resolve(config.outputPath);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, serializeCompilePerformanceResourceSoakEvidence(evidence), 'utf8');

        expect(evidence.gate.failures).toEqual([]);
        expect(evidence.gate.passed).toBe(true);
        if (config.requireAcceptanceIterations) {
          expect(evidence.gate.acceptanceReady).toBe(true);
        }
      },
      30 * 60 * 1000,
    );
  },
);
