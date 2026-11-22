// @vitest-environment node

import { describe, expect, it } from 'vitest';

import { listCliPluginRegistrations } from '../src/plugins/index.js';

describe('listCliPluginRegistrations', () => {
  it('lists the array members in order, from the source and the compiled file alike', () => {
    const source = `import { defineCliPlugins, type AppCliPlugins } from '@nocobase/app-cli';
import foundation from '@nocobase/app-plugin-foundation/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';

// Array order is command registration order.
const cliPlugins: AppCliPlugins = defineCliPlugins([
  scheduler,
  foundation,
]);

export default cliPlugins;
`;
    const compiled = `import { defineCliPlugins } from '@nocobase/app-cli';
import foundation from '@nocobase/app-plugin-foundation/cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
// Array order is command registration order.
const cliPlugins = defineCliPlugins([scheduler, foundation]);
export default cliPlugins;
//${'#'} sourceMappingURL=plugins.js.map
`;
    const expected = [
      '@nocobase/app-plugin-scheduler',
      '@nocobase/app-plugin-foundation',
    ];
    expect(listCliPluginRegistrations(source)).toEqual(expected);
    expect(listCliPluginRegistrations(compiled)).toEqual(expected);
  });

  it('ignores an import the array does not pass', () => {
    expect(
      listCliPluginRegistrations(`import { defineCliPlugins } from '@nocobase/app-cli';
import scheduler from '@nocobase/app-plugin-scheduler/cli';
export default defineCliPlugins([]);
`),
    ).toEqual([]);
  });

  it('ignores imports and members inside comments, but not comment-like text in strings', () => {
    expect(
      listCliPluginRegistrations(`import { defineCliPlugins } from '@nocobase/app-cli';
// import scheduler from '@nocobase/app-plugin-scheduler/cli';
/* import mail from '@nocobase/app-plugin-mail/cli'; */
import agents from '@nocobase/app-plugin-agents/cli';
const note = 'http://example.com /* not a comment */';
export default defineCliPlugins([
  // scheduler,
  /* mail, */ agents,
]);
`),
    ).toEqual(['@nocobase/app-plugin-agents']);
  });

  it('registers nothing without a defineCliPlugins call or through a non-CLI import', () => {
    expect(
      listCliPluginRegistrations(
        `import scheduler from '@nocobase/app-plugin-scheduler/cli';\nexport default [scheduler];\n`,
      ),
    ).toEqual([]);
    expect(
      listCliPluginRegistrations(
        `import { defineCliPlugins } from '@nocobase/app-cli';\nimport mail from '@nocobase/app-plugin-mail/server';\nexport default defineCliPlugins([mail]);\n`,
      ),
    ).toEqual([]);
  });
});
