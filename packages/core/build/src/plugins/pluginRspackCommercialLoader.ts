/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { LoaderContext } from '@rspack/core';

export default function myLoader(
  this: LoaderContext<Record<string, unknown>>,
  source: string,
) {
  const options = this.getOptions();
  if (!options?.isCommercial) {
    return source;
  }
  const isEntry = this.resourcePath.match(/client\/index\.(ts|tsx)/) && !this.resourcePath.includes('plugin-commercial');

  if (isEntry) {
    const regex = /export\s+default\s+([a-zA-Z_0-9]+)\s*;?/; // match: export default xxx;
    const match = source.match(regex);
    if (match) {
      source = source.replace(regex, ``);
      const moduleName = match[1];
      source =
        `
        import { withCommercial } from '@nocobase/plugin-commercial/client';
        ${source}
        export default withCommercial(${moduleName});
        `;
      console.log(`Insert commercial client code success`);
    } else {
      console.error(`Insert commercial client code fail`);
    }
    return source;
  }
  return source;
}