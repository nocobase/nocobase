/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LoaderContext } from '@rspack/core';
import { describe, expect, test } from 'vitest';

import pluginRspackCommercialLoader from '../plugins/pluginRspackCommercialLoader';

type LoaderStub = Pick<LoaderContext<Record<string, unknown>>, 'getOptions' | 'resourcePath'>;

function runLoader(resourcePath: string, source: string, isCommercial = true) {
  const context: LoaderStub = {
    getOptions: () => ({ isCommercial }),
    resourcePath,
  };

  return pluginRspackCommercialLoader.call(context as LoaderContext<Record<string, unknown>>, source);
}

describe('pluginRspackCommercialLoader', () => {
  test('injects commercial wrapper into v1 client index entry', () => {
    const source = `
      class PluginFoo {}
      export default PluginFoo;
    `;

    const transformed = runLoader('/repo/packages/foo/src/client/index.tsx', source);

    expect(transformed).toContain(`import { withCommercial } from '@nocobase/plugin-commercial/client';`);
    expect(transformed).toContain('export default withCommercial(PluginFoo);');
  });

  test('injects commercial wrapper into v2 client plugin entry', () => {
    const source = `
      class PluginFooV2 {}
      export default PluginFooV2;
    `;

    const transformed = runLoader('/repo/packages/foo/src/client-v2/plugin.tsx', source);

    expect(transformed).toContain(`import { withCommercial } from '@nocobase/plugin-commercial/client-v2';`);
    expect(transformed).toContain('export default withCommercial(PluginFooV2);');
  });

  test('does not inject into v2 bridge index entry', () => {
    const source = `export { default } from './plugin';`;

    const transformed = runLoader('/repo/packages/foo/src/client-v2/index.tsx', source);

    expect(transformed).toBe(source);
  });
});
