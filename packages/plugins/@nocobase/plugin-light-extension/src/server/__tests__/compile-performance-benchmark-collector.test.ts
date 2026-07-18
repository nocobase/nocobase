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

import { collectCompilePerformanceBenchmarkEvidence } from './helpers/compilePerformanceBenchmarkCollector';
import {
  parseCompilePerformanceBenchmarkCollectorConfig,
  serializeCompilePerformanceBenchmarkEvidence,
} from './helpers/compilePerformanceBenchmarkEvidence';

describe.runIf(process.env.LIGHT_EXTENSION_BENCHMARK_COLLECT === 'true')(
  'light-extension real compile performance benchmark collector',
  () => {
    it(
      'collects the fixed matrix from real Save operations and writes jq-gateable evidence',
      async () => {
        const config = parseCompilePerformanceBenchmarkCollectorConfig(process.env);
        const evidence = await collectCompilePerformanceBenchmarkEvidence(config);
        const outputPath = resolve(config.outputPath);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, serializeCompilePerformanceBenchmarkEvidence(evidence), 'utf8');

        expect(evidence.gate.failures).toEqual([]);
        expect(evidence.gate.passed).toBe(true);
        if (config.requireAcceptanceRuns) {
          expect(evidence.gate.acceptanceReady).toBe(true);
        }
      },
      30 * 60 * 1000,
    );
  },
);
