/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

const skill = readFileSync(
  resolve(
    process.cwd(),
    'packages/plugins/@nocobase/plugin-flow-engine/src/ai/ai-employees/nathan/skills/frontend-developer/SKILLS.md',
  ),
  'utf8',
);

describe('Nathan frontend developer workspace workflow', () => {
  it('keeps legacy editor tools and defines the two-phase workspace flow', () => {
    expect(skill).toContain('readJSCode');
    expect(skill).toContain('writeJSCode');
    expect(skill).toContain('patchJSCode');
    expect(skill).toContain('lintAndTestJS');
    expect(skill).toContain('workspaceDescribe');
    expect(skill).toContain('workspacePrepareChanges');
    expect(skill).toContain('workspaceApplyPreparedChanges');
    expect(skill).toContain('workspaceValidateDraft');
    expect(skill).toContain('with only the returned `planId`');
  });

  it('forbids workspace markdown apply, automatic execution, and saving', () => {
    expect(skill).toContain('never use a Markdown code block as the final modification mechanism');
    expect(skill).toContain('never execute preview code or save the workspace automatically');
    expect(skill).toContain('Applied workspace changes remain local and unsaved');
    expect(skill).toContain('read the latest workspace again and prepare a new plan');
  });
});
