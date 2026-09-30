import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import enUS from '../client/locales/en-US.js';
import zhCN from '../client/locales/zh-CN.js';

const root = fileURLToPath(new URL('../', import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'dev' ? [] : sourceFiles(filename);
    }
    return /\.tsx?$/.test(entry.name) ? [filename] : [];
  });
}

describe('settings UI ownership', () => {
  it('keeps production management UI independent of Registry UI source', () => {
    // The conversation center shows stored history through the chat's own read-only transcript, so a message looks
    // the same wherever it is read. That one component is the only Registry UI management may render.
    const allowed = new Map([
      [
        'client/components/conversation-details-drawer.tsx',
        ['../../registry/nocobase-ai/components/chat/chat-messages.js'],
      ],
    ]);
    const imports = new Map(
      sourceFiles(path.join(root, 'client')).flatMap((filename) => {
        const specifiers = [
          ...readFileSync(filename, 'utf8').matchAll(
            /from\s+['"]([^'"]*registry\/nocobase-ai\/(?:shared\/ui|components\/chat)\/[^'"]*)['"]/g,
          ),
        ].map((match) => match[1]);
        return specifiers.length
          ? [[path.relative(root, filename), specifiers] as const]
          : [];
      }),
    );
    expect(imports).toEqual(allowed);
  });

  it('uses only router APIs that work under the host BrowserRouter', () => {
    // These throw or return nothing outside a data router, and the host renders a BrowserRouter.
    const dataRouterOnly =
      /\b(?:useBlocker|unstable_usePrompt|useFetchers?|useLoaderData|useActionData|useNavigation|useRevalidator|useMatches|useRouteLoaderData|useSubmit|useRouteError|useAsyncValue|useAsyncError|useFormAction|ScrollRestoration)\b/;
    const violations = sourceFiles(path.join(root, 'client')).flatMap(
      (filename) => {
        const imports = [
          ...readFileSync(filename, 'utf8').matchAll(
            /import\s*(?:type\s*)?\{([^}]*)\}\s*from\s*['"]react-router(?:-dom)?['"]/g,
          ),
        ].map((match) => match[1]);
        return imports.some((names) => dataRouterOnly.test(names))
          ? [path.relative(root, filename)]
          : [];
      },
    );
    expect(violations).toEqual([]);
  });

  it('owns base-nova generation inputs without host runtime aliases', () => {
    const config = JSON.parse(
      readFileSync(path.join(root, 'components.json'), 'utf8'),
    );
    expect(config).toMatchObject({
      style: 'base-nova',
      rsc: false,
      tsx: true,
      tailwind: { css: 'client/styles.css', cssVariables: true },
      aliases: { ui: '@/components/ui', utils: '@/lib/utils' },
    });
    for (const filename of sourceFiles(
      path.join(root, 'client/components/ui'),
    )) {
      expect(
        readFileSync(filename, 'utf8'),
        path.relative(root, filename),
      ).not.toMatch(/from\s+['"]@\//);
    }
  });

  it('translates every conversation center message in both supported languages', () => {
    const english = Object.keys(enUS.conversations).filter(
      (key) => key !== 'count_one',
    );
    expect(Object.keys(zhCN.conversations).sort()).toEqual(english.sort());
    for (const key of english) {
      const value = zhCN.conversations[key as keyof typeof zhCN.conversations];
      expect(value, key).toBeTruthy();
      expect(value, key).not.toBe(
        enUS.conversations[key as keyof typeof enUS.conversations],
      );
    }
  });

  it('translates every usage statistics message in both supported languages', () => {
    const english = Object.keys(enUS.usage);
    expect(Object.keys(zhCN.usage).sort()).toEqual(english.sort());
    for (const key of english) {
      const value = zhCN.usage[key as keyof typeof zhCN.usage];
      expect(value, key).toBeTruthy();
      expect(value, key).not.toBe(enUS.usage[key as keyof typeof enUS.usage]);
    }
  });

  it('owns close and missing-detail translations in both supported languages', () => {
    const keys = [
      'routeOverlay.close',
      'AI employee not found.',
      'Employee settings tab not found.',
      'LLM service not found.',
      'MCP server not found.',
      'Model source',
      'Your changes have not been saved.',
      'skills.detailsNotFound',
      'tools.detailsNotFound',
      'agentPrompt.copy',
      'agentPrompt.copied',
      'agentPrompt.copyFailed',
      'llmServices.emptyTitle',
      'agentPrompt.stepOpen',
      'llmServices.emptyStepSend',
      'llmServices.emptyStepFinish',
      'llmServices.agentPrompt',
      'mcp.emptyTitle',
      'mcp.emptyStepSend',
      'mcp.emptyStepFinish',
      'mcp.agentPrompt',
    ] as const;
    for (const key of keys) {
      expect(enUS[key], key).toBeTruthy();
      expect(zhCN[key], key).toBeTruthy();
      expect(zhCN[key], key).not.toBe(enUS[key]);
    }
  });
});
