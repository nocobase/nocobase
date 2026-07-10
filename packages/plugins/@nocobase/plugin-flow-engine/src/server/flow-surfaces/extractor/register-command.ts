/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';

type FlowSurfaceExtractorCliCommandOptions = {
  plugin?: string;
  allEnabled?: boolean;
  dryRun?: boolean;
  failOnWarning?: boolean;
  json?: boolean;
  out?: string;
  preferMode?: string;
};

export function registerFlowSurfaceExtractorCommand(app: Application) {
  const command = (app.findCommand('flow-surfaces') || app.command('flow-surfaces')) as ReturnType<
    Application['command']
  >;
  command
    .command('extract-capabilities')
    .option('--plugin <packageName>', 'extract one plugin package')
    .option('--all-enabled', 'extract every enabled plugin package')
    .option('--out <dir>', 'snapshot output directory')
    .option('--json', 'print a machine-readable summary')
    .option('--dry-run', 'do not write snapshot files')
    .option('--fail-on-warning', 'return a failing exit code when warnings are produced')
    .option('--prefer-mode <mode>', 'prefer source or dist client-v2 entries')
    .action(async (options: FlowSurfaceExtractorCliCommandOptions) => {
      const { formatFlowSurfaceExtractorCliSummary, runFlowSurfaceExtractorCommand } =
        require('./cli') as typeof import('./cli');
      const summary = await runFlowSurfaceExtractorCommand(app, options);
      process.stdout.write(formatFlowSurfaceExtractorCliSummary(summary, { json: !!options.json }));
      process.exitCode = summary.exitCode;
    });
}
