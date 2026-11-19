import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { loadTypeScript } from './client-plugins.ts';
import type { PluginUnregistrationPlan } from './plugin-registration.ts';
import { resolveRegisteredPluginNames } from './skills-sync.ts';

/** Check the sources as they would look after removing the three registration entries. */
export async function checkRetainedPluginReferences(
  appRoot: string,
  plan: PluginUnregistrationPlan,
): Promise<void> {
  const { packageName } = plan;
  const blocked: string[] = [];
  const rewritten = new Map([
    [plan.clientPluginsPath, plan.clientPluginsText],
    [plan.serverPluginsPath, plan.serverPluginsText],
    [plan.cliPluginsPath, plan.cliPluginsText],
  ]);
  for (const owner of await resolveRegisteredPluginNames(appRoot)) {
    if (owner === packageName) continue;
    const manifest = JSON.parse(
      await readFile(
        path.join(appRoot, 'node_modules', owner, 'package.json'),
        'utf8',
      ),
    ) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
      peerDependenciesMeta?: Record<string, { optional?: boolean }>;
    };
    if (
      manifest.dependencies?.[packageName] ||
      (manifest.peerDependencies?.[packageName] &&
        !manifest.peerDependenciesMeta?.[packageName]?.optional)
    )
      blocked.push(owner);
  }
  for (const directory of ['client', 'server', 'cli', 'database']) {
    const root = path.join(appRoot, directory);
    if (!existsSync(root)) continue;
    for (const entry of await readdir(root, {
      recursive: true,
      withFileTypes: true,
    })) {
      if (
        !entry.isFile() ||
        !/\.[cm]?[jt]sx?$/.test(entry.name) ||
        entry.name.endsWith('.d.ts')
      )
        continue;
      const file = path.join(entry.parentPath, entry.name);
      const source = rewritten.get(file) ?? (await readFile(file, 'utf8'));
      if (!source.includes(packageName)) continue;
      const ts = await loadTypeScript(appRoot, file);
      const js = ts.transpileModule(source, {
        fileName: file,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          verbatimModuleSyntax: true,
          jsx: ts.JsxEmit.Preserve,
        },
      }).outputText;
      if (
        ts
          .preProcessFile(js, true, true)
          .importedFiles.some(
            ({ fileName }) =>
              fileName === packageName ||
              fileName.startsWith(packageName + '/'),
          )
      )
        blocked.push(path.relative(appRoot, file));
    }
  }
  if (blocked.length)
    throw new Error(
      `Cannot unregister ${packageName}: still referenced by ${blocked.join(', ')}.`,
    );
}
