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

    build.onLoad({ filter: /src\/index\.ts$/ }, async (args) => {
      let source = fs.readFileSync(args.path, 'utf8');
      const regex = /export\s*\{\s*default\s*\}\s*from\s*(?:'([^']*)'|"([^"]*)");?/; // match: export { default } from './plugin';
      const match = source.match(regex);
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