import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as React from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  buildWorkflowClientResources,
  type WorkflowClientManifest,
} from '../build/client-build.js';

const roots: string[] = [];
beforeEach(() => {
  vi.stubGlobal('__nocobaseWorkflowReact', React);
  vi.stubGlobal('__nocobaseWorkflowJsxRuntime', jsxRuntime);
  vi.stubGlobal('__nocobaseWorkflowJsxDevRuntime', jsxDevRuntime);
});
afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

async function buildAndLoad(source: string): Promise<Record<string, unknown>> {
  const root = await fs.mkdtemp(
    path.join(os.tmpdir(), 'workflow-react-artifact-'),
  );
  roots.push(root);
  await fs.mkdir(path.join(root, 'client'));
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  await fs.writeFile(
    path.join(root, 'tsconfig.json'),
    '{"compilerOptions":{"jsx":"react-jsx"}}',
  );
  const file = path.join(root, 'client/form.tsx');
  await fs.writeFile(file, source);
  const files = await buildWorkflowClientResources(root, [
    { id: 'workflow.parameterForm', source: './client/form.tsx', file },
  ]);
  const manifest = JSON.parse(
    String(files.get('client/manifest.json')),
  ) as WorkflowClientManifest;
  const output = path.join(root, 'output');
  for (const [name, bytes] of files) {
    const target = path.join(output, name);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
  }
  // Load only the emitted artifact: source modules are unavailable at runtime.
  await fs.rm(path.join(root, 'client'), { recursive: true });
  return (await import(
    pathToFileURL(
      path.join(output, manifest.entries['workflow.parameterForm'].js),
    ).href
  )) as Record<string, unknown>;
}

it.each([
  { specifier: 'react', host: React },
  { specifier: 'react/jsx-runtime', host: jsxRuntime },
  { specifier: 'react/jsx-dev-runtime', host: jsxDevRuntime },
])(
  'preserves the installed $specifier named exports and host identities',
  async ({ specifier, host }) => {
    const loaded = await buildAndLoad(
      `export * from ${JSON.stringify(specifier)}; export default function Form() { return null; }`,
    );
    for (const [name, value] of Object.entries(host)) {
      // These are module-loader interop properties, not React named exports.
      if (['default', '__esModule', 'module.exports'].includes(name)) continue;
      expect(loaded).toHaveProperty(name);
      expect(loaded[name]).toBe(value);
    }
  },
);

it('renders compiled TSX hooks with the host React and consumes a host Context', async () => {
  const loaded = await buildAndLoad(`
    import React, { useContext, useId, useReducer, forwardRef } from 'react';
    import { jsx } from 'react/jsx-runtime';
    import { jsxDEV } from 'react/jsx-dev-runtime';
    export const runtime = { React, forwardRef, jsx, jsxDEV };
    export default function Form({ context }) {
      const id = useId();
      const message = useContext(context);
      const [count] = useReducer((value) => value + 1, 7);
      return <label htmlFor={id}>{message}<input id={id} value={count} readOnly /></label>;
    }
  `);
  expect(loaded.runtime).toEqual({
    React: React.default,
    forwardRef: React.forwardRef,
    jsx: jsxRuntime.jsx,
    jsxDEV: jsxDevRuntime.jsxDEV,
  });
  const MessageContext = React.createContext('missing host context');
  const Form = loaded.default as React.ComponentType<{
    context: React.Context<string>;
  }>;
  const html = renderToStaticMarkup(
    React.createElement(
      MessageContext.Provider,
      { value: 'host context' },
      React.createElement(Form, { context: MessageContext }),
    ),
  );
  expect(html).toContain('host context');
  expect(html).not.toContain('missing host context');
  expect(html).toContain('value="7"');
  const id = /<input id="([^"]+)"/.exec(html)?.[1];
  expect(id).toBeTruthy();
  expect(html).toContain(`for="${id}"`);
});
