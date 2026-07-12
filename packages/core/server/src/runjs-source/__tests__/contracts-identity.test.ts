/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSRuntimeArtifact as CoreArtifact, RunJSSourceLocator as CoreLocator } from '@nocobase/runjs';
import type { RunJSRuntimeArtifact as ServerArtifact, RunJSSourceLocator as ServerLocator } from '..';

describe('RunJS contracts identity', () => {
  it('re-exports the core locator and artifact contracts from server', () => {
    const coreLocator: CoreLocator = {
      kind: 'workflow.javascript',
      nodeId: 1,
    };
    const serverLocator: ServerLocator = coreLocator;
    const coreArtifact: CoreArtifact = {
      code: 'return 1;',
      version: 'v2',
      diagnostics: [],
      filesHash: 'files',
    };
    const serverArtifact: ServerArtifact = coreArtifact;

    expect(serverLocator).toBe(coreLocator);
    expect(serverArtifact).toBe(coreArtifact);
  });
});
