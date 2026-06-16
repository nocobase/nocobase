/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, expect, test, vi } from 'vitest';
import type SkillsCheck from '../commands/skills/check.js';

const mocks = vi.hoisted(() => ({
  inspectSkillsStatus: vi.fn(),
  printInfo: vi.fn(),
  renderTable: vi.fn(() => 'TABLE'),
}));

vi.mock('../lib/skills-manager.js', () => ({
  inspectSkillsStatus: mocks.inspectSkillsStatus,
}));

vi.mock('../lib/ui.js', () => ({
  printInfo: mocks.printInfo,
  renderTable: mocks.renderTable,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

test('skills check json reports actual installed skills separately from cached package skills', async () => {
  const { default: SkillsCheckCommand } = await import('../commands/skills/check.js');
  const log = vi.fn();
  const command = Object.assign(Object.create(SkillsCheckCommand.prototype), {
    parse: vi.fn(async () => ({
      flags: {
        json: true,
      },
    })),
    log,
  }) as SkillsCheck;

  mocks.inspectSkillsStatus.mockResolvedValue({
    globalRoot: '/tmp/nocobase',
    workspaceRoot: '/tmp/nocobase',
    stateFile: '/tmp/nocobase/skills.json',
    installed: true,
    managedByNb: true,
    sourcePackage: 'nocobase/skills',
    npmPackageName: '@nocobase/skills',
    packageSkillNames: ['nocobase-env-manage', 'nocobase-ui-builder'],
    installedSkillNames: ['nocobase-env-manage'],
    latestVersion: '1.0.5',
    installedVersion: '1.0.4',
    latestRef: '1.0.5',
    installedRef: '1.0.4',
    updateAvailable: true,
  });

  await SkillsCheckCommand.prototype.run.call(command);

  const output = JSON.parse(String(log.mock.calls[0]?.[0])) as {
    packageSkillNames: string[];
    installedSkillNames: string[];
  };
  expect(output.packageSkillNames).toEqual(['nocobase-env-manage', 'nocobase-ui-builder']);
  expect(output.installedSkillNames).toEqual(['nocobase-env-manage']);
});
