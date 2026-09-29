import path from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';
import { parseWorkflowSource } from './source-parser.js';
import { collectWorkflowClientResources } from './client-resources.js';
import {
  discoverWorkflowPackages,
  scanWorkflowPackage,
  workflowClientRevision,
} from './package-scanner.js';

export const WORKFLOW_CLIENT_VIRTUAL_ID =
  'virtual:nocobase-workflow-client-entries';
const RESOLVED_ID = `\0${WORKFLOW_CLIENT_VIRTUAL_ID}`;

export default function workflowVitePlugin(context: {
  appRoot: string;
  environment?: { command: 'build' | 'serve' };
  registration?: { config?: Readonly<Record<string, unknown>> };
}): Plugin {
  // `workflow({ sourceRoot })` in the application's client/plugins.ts. The
  // default matches the `workflow build` and `workflow check` commands, so an
  // application that never configures a source root is consistent across its
  // Vite build, its CLI, and its runtime.
  const configuredSourceRoot =
    context.registration?.config?.sourceRoot ?? 'workflows';
  if (typeof configuredSourceRoot !== 'string')
    throw new Error('Workflow sourceRoot must be a string');
  const sourceRoot = path.resolve(context.appRoot, configuredSourceRoot);
  const isWorkflowSource = (file: string): boolean => {
    const relative = path.relative(sourceRoot, file);
    return (
      relative !== '..' &&
      !relative.startsWith(`..${path.sep}`) &&
      !path.isAbsolute(relative)
    );
  };
  let server: ViteDevServer | undefined;
  return {
    name: 'nocobase-workflow-client',
    configureServer(devServer) {
      server = devServer;
      // New files also change the package revision, even when no browser module imports them.
      server.watcher.add(sourceRoot);
    },
    // The page, not the plugin's client code, loads the source index. Published
    // client code lives in node_modules, where Vite pre-bundles it with esbuild
    // and no Vite plugin can resolve a virtual id; an application that has not
    // registered this plugin must also still build. Injecting the import here
    // keeps the virtual id inside the application's own module graph, and only
    // while a development server is running.
    transformIndexHtml: {
      // Before Vite's own HTML pass, so the inline import is resolved against
      // the configured base like any other module script.
      order: 'pre',
      handler() {
        if (!server) return undefined;
        return [
          {
            tag: 'script',
            attrs: { type: 'module' },
            children: `import ${JSON.stringify(WORKFLOW_CLIENT_VIRTUAL_ID)};`,
            injectTo: 'head',
          },
        ];
      },
    },
    watchChange(file) {
      if (!server || !isWorkflowSource(file)) return;
      const module = server.moduleGraph.getModuleById(RESOLVED_ID);
      if (module) server.moduleGraph.invalidateModule(module);
    },
    hotUpdate({ file, modules }) {
      if (!isWorkflowSource(file)) return;
      const module = this.environment.moduleGraph.getModuleById(RESOLVED_ID);
      if (module) return [...new Set([...modules, module])];
    },
    resolveId(id) {
      return id === WORKFLOW_CLIENT_VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    async load(id) {
      if (id !== RESOLVED_ID) return undefined;
      const entries: Array<{ key: string; source: string; file: string }> = [];
      const roots =
        context.environment?.command === 'build'
          ? []
          : await discoverWorkflowPackages(sourceRoot);
      for (const root of roots) {
        try {
          const checked = await parseWorkflowSource(
            path.join(root, 'workflow.ts'),
            { typecheck: false },
          );
          const resources = await collectWorkflowClientResources(
            root,
            checked.ast,
          );
          const scanned = await scanWorkflowPackage(root);
          for (const entry of scanned.entries)
            this.addWatchFile(path.join(root, entry.path));
          for (const resource of resources) {
            entries.push({
              key: `${path.basename(root)}:${workflowClientRevision(scanned)}`,
              source: resource.source,
              file: resource.file,
            });
          }
        } catch (error) {
          this.error(error instanceof Error ? error.message : String(error));
        }
      }
      const body = entries
        .map(
          (entry) =>
            `  ${JSON.stringify(`${entry.key}:${entry.source}`)}: () => import(${JSON.stringify(entry.file)}),`,
        )
        .join('\n');
      // Keep the exported object across HMR updates: callers may already hold the
      // namespace returned by a dynamic import. Replace its entries, not its identity.
      return `
export const workflowClientEntries = import.meta.hot
  ? (import.meta.hot.data.entries ??= {})
  : {};
for (const key of Object.keys(workflowClientEntries)) delete workflowClientEntries[key];
Object.assign(workflowClientEntries, {\n${body}\n});
if (import.meta.hot) {
  import.meta.hot.accept();
  if (import.meta.hot.data.initialized) {
    globalThis.dispatchEvent(new CustomEvent('nocobase:workflow-source-updated'));
  }
  import.meta.hot.data.initialized = true;
}
`;
    },
  };
}
