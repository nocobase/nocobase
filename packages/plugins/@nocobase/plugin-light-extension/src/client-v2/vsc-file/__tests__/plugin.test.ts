/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RunJSEditorRegistry } from '@nocobase/client-v2';
import { afterEach, describe, expect, it } from 'vitest';

import { installRunJSStudioClientV2 } from '../plugin';
import { runJSStudioProvider } from '../runjs-studio';

describe('installRunJSStudioClientV2', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
  });

  it('registers and disposes the Studio provider', () => {
    const dispose = installRunJSStudioClientV2();

    expect(RunJSEditorRegistry.getProviders()).toContainEqual(runJSStudioProvider);

    dispose();

    expect(RunJSEditorRegistry.getProviders()).not.toContainEqual(runJSStudioProvider);
  });

  it('keeps the newer installation when the previous lane disposes', () => {
    const disposePreviousLane = installRunJSStudioClientV2();
    const disposeCurrentLane = installRunJSStudioClientV2();

    disposePreviousLane();

    expect(RunJSEditorRegistry.getProviders()).toContainEqual(runJSStudioProvider);

    disposeCurrentLane();

    expect(RunJSEditorRegistry.getProviders()).not.toContainEqual(runJSStudioProvider);
  });
});
