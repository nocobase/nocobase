// @vitest-environment node
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import enUS from '../../client/locales/en-US.ts';
import zhCN from '../../client/locales/zh-CN.ts';

const require = createRequire(import.meta.url);

/** The projects plugin's titles of what it registers with the authorization plugin, in a language. */
async function projectsAccess(language: string) {
  const root = path.dirname(
    require.resolve('@nocobase/app-plugin-projects/package.json'),
  );
  const file = path.join(root, `shared/locales/access.${language}.ts`);
  return (
    (await import(pathToFileURL(file).href)) as {
      default: { access: { settings: { pm: { workflows: string } } } };
    }
  ).default.access;
}

describe('workflow definitions are called workflow templates', () => {
  it('names the settings menu item and the role editor row so in both languages', async () => {
    expect(enUS['config.nav.workflows']).toBe('Workflow templates');
    expect(zhCN['config.nav.workflows']).toBe('流程模板');
    // The role editor's row is the projects plugin's settings item.
    expect((await projectsAccess('en-US')).settings.pm.workflows).toBe(
      'Workflow templates',
    );
    const zh = (await projectsAccess('zh-CN')).settings.pm.workflows;
    expect(zh).toBe('流程模板');
    expect(zh.includes('工作流')).toBe(false);
  });
});
