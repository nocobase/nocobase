/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs';
import path from 'node:path';

const PACKAGE_ROOT = path.resolve(__dirname, '../../..');
const REPO_ROOT = path.resolve(PACKAGE_ROOT, '../../../..');
const AI_DOCS_META_PATH = path.resolve(PACKAGE_ROOT, 'src/ai/docs/meta.json');
const LEGACY_DOCS_ROOT = path.resolve(PACKAGE_ROOT, 'src/docs');

describe('plugin-flow-engine ai docs', () => {
  it('should publish runjs docs through the ai docs manifest', () => {
    expect(fs.existsSync(AI_DOCS_META_PATH)).toBe(true);

    const entries = JSON.parse(fs.readFileSync(AI_DOCS_META_PATH, 'utf-8')) as Array<{
      module: string;
      description: string;
      source: string;
    }>;
    const runjsEntry = entries.find((entry) => entry.module === 'runjs');

    expect(runjsEntry).toBeDefined();
    expect(runjsEntry?.description).toContain('RunJS');
    expect(runjsEntry?.source).toBe('docs/docs/en/runjs');

    const sourceDir = path.resolve(REPO_ROOT, runjsEntry!.source);
    expect(fs.existsSync(sourceDir)).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, 'index.md'))).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, '_meta.json'))).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, 'context', 'render.md'))).toBe(true);
    expect(fs.existsSync(path.join(sourceDir, 'context', 'init-resource.md'))).toBe(true);
  });

  it('should no longer depend on removed legacy flow-surfaces markdown docs', () => {
    expect(fs.existsSync(path.join(LEGACY_DOCS_ROOT, 'skill.md'))).toBe(false);
    expect(fs.existsSync(path.join(LEGACY_DOCS_ROOT, 'flow-surfaces-ai-playbook.md'))).toBe(false);
    expect(fs.existsSync(path.join(LEGACY_DOCS_ROOT, 'flow-surfaces-ai-js-models.md'))).toBe(false);
  });
});
