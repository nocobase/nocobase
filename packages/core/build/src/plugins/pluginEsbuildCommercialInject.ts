/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import fs from 'node:fs'

const pluginEsbuildCommercialInject = {
  name: 'plugin-esbuild-commercial-inject',
  setup(build) {
    build.onLoad({ filter: /src\/server\/index\.ts$/ }, async (args) => {
      let source = fs.readFileSync(args.path, 'utf8');
      const regex = /export\s*\{\s*default\s*\}\s*from\s*(?:'([^']*)'|"([^"]*)");?/; // match: export { default } from './plugin';
      const regex2 = /export\s+default\s+([a-zA-Z_0-9]+)\s*;?/; // match: export default xxx;
      const match = source.match(regex);
      const match2 = source.match(regex2);
      if (match) {
        source = source.replace(regex, ``);
        const moduleName = match[1] || match[2];
        source =
          `
import { withCommercial } from '@nocobase/plugin-commercial/server';
import _plugin from '${moduleName}';
export default withCommercial(_plugin);
${source}
`;
        console.log(`Insert commercial server code success`);
      } else if (match2) {
        source = source.replace(regex2, ``);
        const moduleName = match2[1] || match2[2];
        source =
          `
import { withCommercial } from '@nocobase/plugin-commercial/server';
${source}
export default withCommercial(${moduleName});
`;
        console.log(`Insert commercial server code success`);
      } else {
        console.error(`Insert commercial server code fail`);
      }

      return {
        contents: source,
        loader: 'ts',
      }
    })
  },
};

export default pluginEsbuildCommercialInject