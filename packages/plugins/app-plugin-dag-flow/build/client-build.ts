import { build, type Plugin } from 'vite';
import path from 'node:path';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import type { WorkflowClientResource } from './client-resources.js';

export const WORKFLOW_CLIENT_ABI = 1;

export interface WorkflowClientManifest {
  readonly formatVersion: 1;
  readonly hostAbi: number;
  readonly entries: Record<string, { js: string; css: string[] }>;
  readonly files: string[];
}
type OutputChunk = {
  type: 'chunk';
  fileName: string;
  code: string;
  isEntry: boolean;
  facadeModuleId: string | null;
  imports: string[];
  dynamicImports: string[];
  viteMetadata?: { importedCss?: Set<string> };
};
type OutputAsset = {
  type: 'asset';
  fileName: string;
  source: string | Uint8Array;
};
type BuildOutput = { output: Array<OutputChunk | OutputAsset> };

function hostReactPlugin(): Plugin {
  const modules = new Map<string, { exports: object; global: string }>([
    ['react', { exports: React, global: '__nocobaseWorkflowReact' }],
    [
      'react/jsx-runtime',
      { exports: jsxRuntime, global: '__nocobaseWorkflowJsxRuntime' },
    ],
    [
      'react/jsx-dev-runtime',
      { exports: jsxDevRuntime, global: '__nocobaseWorkflowJsxDevRuntime' },
    ],
  ]);
  const prefix = '\0workflow-host:';
  return {
    name: 'workflow-host-react',
    enforce: 'pre',
    resolveId(id) {
      return modules.has(id) ? `${prefix}${id}` : undefined;
    },
    load(id) {
      if (!id.startsWith(prefix)) return undefined;
      const module = modules.get(id.slice(prefix.length));
      if (!module) return undefined;
      // Discover the installed peer's exports, but bind every value to the
      // host instance. Bundling another React would break hooks and Context.
      // Ignore ESM/CJS interop markers rather than maintaining an API allowlist.
      const names = Object.keys(module.exports)
        .filter(
          (name) =>
            name !== 'default' &&
            name !== '__esModule' &&
            /^[A-Za-z_$][\w$]*$/.test(name),
        )
        .sort();
      return [
        `const value = globalThis[${JSON.stringify(module.global)}];`,
        `if (!value) throw new Error(${JSON.stringify(`Workflow host ${id.slice(prefix.length)} is unavailable`)});`,
        'export default value.default ?? value;',
        ...names.map(
          (name) => `export const ${name} = value[${JSON.stringify(name)}];`,
        ),
      ].join('\n');
    },
  };
}

function browserBoundaryPlugin(root: string): Plugin {
  const packagePrefix = `${path.resolve(root)}${path.sep}`;
  const clientPrefix = `${path.resolve(root, 'client')}${path.sep}`;
  return {
    name: 'workflow-client-boundary',
    generateBundle() {
      for (const id of this.getModuleIds()) {
        const file = id.split('?')[0];
        if (file.startsWith(packagePrefix) && !file.startsWith(clientPrefix))
          this.error(
            `Workflow browser resource imports a private package module: ${path.relative(root, file)}`,
          );
      }
    },
  };
}

export async function buildWorkflowClientResources(
  root: string,
  resources: readonly WorkflowClientResource[],
): Promise<ReadonlyMap<string, string | Uint8Array>> {
  if (!resources.length) return new Map();
  const input = Object.fromEntries(
    resources.map((resource, index) => [`entry${index}`, resource.file]),
  );
  const result = await build({
    root,
    base: './',
    configFile: false,
    logLevel: 'error',
    plugins: [hostReactPlugin(), browserBoundaryPlugin(root)],
    build: {
      write: false,
      manifest: false,
      cssCodeSplit: true,
      rollupOptions: {
        input,
        preserveEntrySignatures: 'strict',
        output: {
          entryFileNames: '[name]-[hash].js',
          chunkFileNames: 'chunk-[hash].js',
          assetFileNames: 'asset-[hash][extname]',
        },
      },
    },
  });
  const output = Array.isArray(result)
    ? (result as BuildOutput[]).flatMap((item) => item.output)
    : (result as BuildOutput).output;
  const chunks = output.filter(
    (item): item is OutputChunk => item.type === 'chunk',
  );
  const assets = output.filter(
    (item): item is OutputAsset => item.type === 'asset',
  );
  const files = new Map<string, string | Uint8Array>();
  for (const item of [...chunks, ...assets])
    files.set(
      `client/${item.fileName}`,
      item.type === 'chunk'
        ? item.code
        : typeof item.source === 'string'
          ? item.source
          : new Uint8Array(item.source),
    );
  const entries: WorkflowClientManifest['entries'] = {};
  for (const [index, resource] of resources.entries()) {
    const entry = chunks.find(
      (chunk) =>
        chunk.isEntry &&
        path.resolve(chunk.facadeModuleId ?? '') ===
          path.resolve(resource.file),
    );
    if (!entry)
      throw new Error(
        `No browser output for workflow client resource ${resource.id}`,
      );
    const css = new Set<string>();
    const visit = (chunk: OutputChunk): void => {
      for (const name of chunk.viteMetadata?.importedCss ?? [])
        css.add(`client/${name}`);
      for (const name of [...chunk.imports, ...chunk.dynamicImports]) {
        const dependency = chunks.find(
          (candidate) => candidate.fileName === name,
        );
        if (dependency) visitOnce(dependency);
      }
    };
    const visited = new Set<string>();
    const visitOnce = (chunk: OutputChunk): void => {
      if (visited.has(chunk.fileName)) return;
      visited.add(chunk.fileName);
      visit(chunk);
    };
    visitOnce(entry);
    entries[resources[index].id] = {
      js: `client/${entry.fileName}`,
      css: [...css].sort(),
    };
  }
  const manifest: WorkflowClientManifest = {
    formatVersion: 1,
    hostAbi: WORKFLOW_CLIENT_ABI,
    entries,
    files: [...files.keys()].sort(),
  };
  files.set('client/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  return files;
}
