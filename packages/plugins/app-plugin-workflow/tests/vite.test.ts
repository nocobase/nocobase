import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, expect, it, vi } from 'vitest';
import { build, createServer } from 'vite';
import workflowVitePlugin, {
  WORKFLOW_CLIENT_VIRTUAL_ID,
} from '../build/vite.js';
import {
  scanWorkflowPackage,
  workflowClientRevision,
} from '../build/package-scanner.js';

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(
    roots
      .splice(0)
      .map((root) => fs.rm(root, { recursive: true, force: true })),
  );
});

it.each([false, true])(
  'refreshes the development form index after edits, additions and deletions without restarting Vite (HMR: %s)',
  async (hmr) => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-vite-dev-'));
    roots.push(root);
    const workflow = path.join(root, 'workflows/example');
    await fs.mkdir(path.join(workflow, 'client'), { recursive: true });
    await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
    const definition = path.join(workflow, 'workflow.ts');
    const form = path.join(workflow, 'client/inputForm.ts');
    await fs.writeFile(
      definition,
      `export default {
    title: 'Example', nodes: [], client: { inputForm: './client/inputForm.ts' }
  };`,
    );
    await fs.writeFile(
      form,
      'export default function Form() { return "old"; }',
    );
    const server = await createServer({
      root,
      configFile: false,
      logLevel: 'silent',
      plugins: [
        workflowVitePlugin({
          appRoot: root,
          environment: { command: 'serve' },
        }),
      ],
      server: { middlewareMode: true, hmr: hmr ? { port: 0 } : false },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    try {
      await expect
        .poll(() => server.watcher.getWatched()[path.join(workflow, 'client')])
        .toContain('inputForm.ts');
      const url = WORKFLOW_CLIENT_VIRTUAL_ID;
      let revision = workflowClientRevision(
        await scanWorkflowPackage(workflow),
      );
      expect((await server.transformRequest(url))?.code).toContain(
        `example:${revision}:./client/inputForm.ts`,
      );
      const send = vi.spyOn(server.environments.client.hot, 'send');
      const expectUpdatedIndex = async (
        mutate: () => Promise<void>,
      ): Promise<void> => {
        const previous = revision;
        send.mockClear();
        await mutate();
        revision = workflowClientRevision(await scanWorkflowPackage(workflow));
        expect(revision).not.toBe(previous);
        await expect
          .poll(async () => (await server.transformRequest(url))?.code)
          .toContain(`example:${revision}:./client/inputForm.ts`);
        expect((await server.transformRequest(url))?.code).not.toContain(
          `example:${previous}:`,
        );
        if (hmr) {
          await expect
            .poll(() => send.mock.calls)
            .toEqual(
              expect.arrayContaining([
                [
                  expect.objectContaining({
                    type: 'update',
                    updates: expect.arrayContaining([
                      expect.objectContaining({
                        path: expect.stringContaining(
                          WORKFLOW_CLIENT_VIRTUAL_ID,
                        ),
                      }),
                    ]),
                  }),
                ],
              ]),
            );
          expect(send.mock.calls).not.toEqual(
            expect.arrayContaining([
              [expect.objectContaining({ type: 'full-reload' })],
            ]),
          );
        }
      };
      await expectUpdatedIndex(() =>
        fs.writeFile(form, 'export default function Form() { return "new"; }'),
      );
      expect(
        (
          await server.transformRequest(
            '/workflows/example/client/inputForm.ts',
          )
        )?.code,
      ).toContain('"new"');
      // The revision covers the whole package, even files outside the browser import graph.
      const resource = path.join(workflow, 'notes.txt');
      await expectUpdatedIndex(() => fs.writeFile(resource, 'first'));
      await expectUpdatedIndex(() => fs.writeFile(resource, 'second'));
      await expectUpdatedIndex(() => fs.unlink(resource));
      await fs.writeFile(
        definition,
        `export default { title: 'Example', nodes: [] };`,
      );
      await expect
        .poll(async () => (await server.transformRequest(url))?.code)
        .not.toContain('example:');
    } finally {
      await server.close();
    }
  },
);

it('builds client entries for custom instructions, skips helper directories and changes identity with source', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-vite-'));
  roots.push(root);
  const workflow = path.join(root, 'workflows/example');
  await fs.mkdir(path.join(workflow, 'client'), { recursive: true });
  await fs.mkdir(path.join(root, 'workflows/helpers'), {
    recursive: true,
  });
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  await fs.writeFile(
    path.join(workflow, 'workflow.ts'),
    `export default {
    title: 'Custom', nodes: [{ key: 'custom', type: 'application-custom', config: {} }],
    client: { parameterForm: './client/form.ts' }
  };`,
  );
  await fs.writeFile(
    path.join(workflow, 'client/form.ts'),
    'export default function Form() { return "old"; }',
  );
  await fs.writeFile(
    path.join(root, 'entry.js'),
    `export { workflowClientEntries } from 'virtual:nocobase-workflow-client-entries';`,
  );
  const revision = workflowClientRevision(await scanWorkflowPackage(workflow));
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [workflowVitePlugin({ appRoot: root })],
    build: {
      write: false,
      minify: false,
      rollupOptions: {
        input: path.join(root, 'entry.js'),
        preserveEntrySignatures: 'strict',
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  expect(
    'output' in output &&
      output.output.some(
        (chunk) =>
          chunk.type === 'chunk' &&
          chunk.code.includes(`example:${revision}:./client/form.ts`),
      ),
  ).toBe(true);
  await fs.writeFile(
    path.join(workflow, 'client/form.ts'),
    'export default function Form() { return "new"; }',
  );
  expect(workflowClientRevision(await scanWorkflowPackage(workflow))).not.toBe(
    revision,
  );
});

it('watches the source root the application registered the plugin with', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-vite-root-'));
  roots.push(root);
  const workflow = path.join(root, 'flows/example');
  await fs.mkdir(path.join(workflow, 'client'), { recursive: true });
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  await fs.writeFile(
    path.join(workflow, 'workflow.ts'),
    `export default {
  title: 'Example', nodes: [], client: { inputForm: './client/inputForm.ts' }
};`,
  );
  await fs.writeFile(
    path.join(workflow, 'client/inputForm.ts'),
    'export default function Form() { return "custom-root"; }',
  );
  const server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [
      workflowVitePlugin({
        appRoot: root,
        environment: { command: 'serve' },
        // `workflow({ sourceRoot: 'flows' })` in the application's client/plugins.ts.
        registration: { config: { sourceRoot: 'flows' } },
      }),
    ],
    server: { middlewareMode: true, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    await expect
      .poll(() => server.watcher.getWatched()[path.join(workflow, 'client')])
      .toContain('inputForm.ts');
    const revision = workflowClientRevision(
      await scanWorkflowPackage(workflow),
    );
    expect(
      (await server.transformRequest(WORKFLOW_CLIENT_VIRTUAL_ID))?.code,
    ).toContain(`example:${revision}:./client/inputForm.ts`);
  } finally {
    await server.close();
  }
});

it('rejects a source root that is not a string', () => {
  expect(() =>
    workflowVitePlugin({
      appRoot: '/tmp',
      environment: { command: 'serve' },
      registration: { config: { sourceRoot: 42 } },
    }),
  ).toThrow('Workflow sourceRoot must be a string');
});

it('loads the source index from the development page under the application base', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-vite-html-'));
  roots.push(root);
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  const page = '<!doctype html><html><head></head><body></body></html>';
  await fs.writeFile(path.join(root, 'index.html'), page);
  const server = await createServer({
    root,
    base: '/main/',
    configFile: false,
    logLevel: 'silent',
    plugins: [
      workflowVitePlugin({ appRoot: root, environment: { command: 'serve' } }),
    ],
    server: { middlewareMode: true, hmr: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  });
  try {
    const html = await server.transformIndexHtml('/index.html', page);
    const proxy = /<script type="module" src="([^"]+html-proxy[^"]+)"/.exec(
      html,
    )?.[1];
    expect(proxy).toMatch(/^\/main\//);
    const code = (await server.transformRequest(proxy!.slice('/main'.length)))
      ?.code;
    expect(code).toContain(`/main/@id/__x00__${WORKFLOW_CLIENT_VIRTUAL_ID}`);
  } finally {
    await server.close();
  }
});

it('adds nothing to a production page', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'workflow-vite-page-'));
  roots.push(root);
  await fs.writeFile(path.join(root, 'package.json'), '{"type":"module"}');
  await fs.writeFile(
    path.join(root, 'index.html'),
    '<!doctype html><html><head></head><body><script type="module" src="./main.js"></script></body></html>',
  );
  await fs.writeFile(path.join(root, 'main.js'), 'console.log("app");');
  const result = await build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [
      workflowVitePlugin({ appRoot: root, environment: { command: 'build' } }),
    ],
    build: { write: false, minify: false },
  });
  const output = Array.isArray(result) ? result[0] : result;
  const files = 'output' in output ? output.output : [];
  const page = files.find((file) => file.fileName === 'index.html');
  expect(page?.type === 'asset' && String(page.source)).not.toContain(
    'nocobase-workflow-client-entries',
  );
  expect(
    files.some(
      (file) =>
        file.type === 'chunk' &&
        file.code.includes('nocobase-workflow-client-entries'),
    ),
  ).toBe(false);
});
