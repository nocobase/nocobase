/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { createAclSnippetAllow } from '../createAclSnippetAllow';

describe('createAclSnippetAllow', () => {
  it('allows wildcard and empty snippet by default', () => {
    const allow = createAclSnippetAllow([]);

    expect(allow()).toBe(true);
    expect(allow('*')).toBe(true);
  });

  it('matches positive snippets', () => {
    const allow = createAclSnippetAllow(['ui.*', 'pm']);

    expect(allow('ui.*')).toBe(true);
    expect(allow('pm')).toBe(true);
    expect(allow('pm.*')).toBe(false);
  });

  it('respects negative snippets', () => {
    const allow = createAclSnippetAllow(['ui.*', '!pm.*']);

    expect(allow('ui.*')).toBe(true);
    expect(allow('pm.*')).toBe(false);
  });

  it('allows everything when allowAll is true', () => {
    const allow = createAclSnippetAllow(['!ui.*'], true);

    expect(allow('ui.*')).toBe(true);
    expect(allow('pm.*')).toBe(true);
  });
});
