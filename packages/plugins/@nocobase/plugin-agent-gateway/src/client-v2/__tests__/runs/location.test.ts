/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it } from 'vitest';

import {
  getRunIdFromLocationSearch,
  pushRunIdInLocationSearch,
  pushSkillVersionIdInLocationSearch,
  pushTaskTemplateIdInLocationSearch,
  replaceRunIdInLocationSearch,
} from '../../pages/runs/runLocation';

function traverseHistory(action: () => void) {
  return new Promise<void>((resolve) => {
    window.addEventListener('popstate', () => resolve(), { once: true });
    action();
  });
}

describe('run location state', () => {
  afterEach(() => {
    window.history.replaceState({}, '', '/admin/settings/agent-gateway/runs');
  });

  it('preserves unrelated query and hash state while opening and closing details', () => {
    window.history.replaceState({}, '', '/admin/settings/agent-gateway/runs?source=acceptance#runs');

    pushRunIdInLocationSearch('run-id-1');
    expect(window.location.search).toBe('?source=acceptance&runId=run-id-1');
    expect(window.location.hash).toBe('#runs');

    replaceRunIdInLocationSearch();
    expect(window.location.search).toBe('?source=acceptance');
    expect(window.location.hash).toBe('#runs');
  });

  it('keeps template and skill drawers mutually exclusive', () => {
    window.history.replaceState({}, '', '/admin/settings/agent-gateway/runs?source=acceptance');

    pushTaskTemplateIdInLocationSearch('template-id-1');
    expect(window.location.search).toBe('?source=acceptance&templateId=template-id-1');

    pushSkillVersionIdInLocationSearch('skill-version-id-1');
    expect(window.location.search).toBe('?source=acceptance&skillVersionId=skill-version-id-1');
  });

  it('restores opened run details with browser back and forward navigation', async () => {
    window.history.replaceState({}, '', '/admin/settings/agent-gateway/runs?source=acceptance');
    pushRunIdInLocationSearch('run-id-1');
    expect(getRunIdFromLocationSearch()).toBe('run-id-1');

    await traverseHistory(() => window.history.back());
    expect(getRunIdFromLocationSearch()).toBeUndefined();
    expect(window.location.search).toBe('?source=acceptance');

    await traverseHistory(() => window.history.forward());
    expect(getRunIdFromLocationSearch()).toBe('run-id-1');
    expect(window.location.search).toBe('?source=acceptance&runId=run-id-1');
  });
});
