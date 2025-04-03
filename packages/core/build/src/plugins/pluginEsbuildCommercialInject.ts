/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { transform } from 'esbuild';
import * as path from 'path';
import fs from 'node:fs'

const pluginEsbuildCommercialInject = {
  name: 'plugin-esbuild-commercial-inject',
  setup(build) {

    build.onLoad({ filter: /src\/index\.ts$/ }, async (args) => {
      let text = fs.readFileSync(args.path, 'utf8');
      const regex = /export\s*\{\s*default\s*\}\s*from\s*(?:'([^']*)'|"([^"]*)");?/; // match: export { default } from './plugin';
      const match = text.match(regex);
      if (match) {
        text = text.replace(regex, ``);
        const moduleName = match[1] || match[2];
        text = 
`
import { withCommercial } from '@nocobase/plugin-for-commercial/server';
import _plugin from '${moduleName}';
export default withCommercial(_plugin);
${text}
`;
        console.log(`${args.path} insert commercial server code`);
      } else {
        console.error(`${args.path} can't insert commercial code`);
      }

      return {
        contents: text,
        loader: 'ts',
      }
    })
  },
};

export default pluginEsbuildCommercialInject