// Which packages an application's CLI composition root registers.
//
// `plugin inspect`, the App Foundation plugins page and `pnpm build` all answer it here, so they never disagree. A
// source checkout's `cli/plugins.ts` is parsed with the application's own TypeScript compiler: the members of the
// array passed to `defineCliPlugins([...])`, each traced to the `<package>/cli` default import it names. A deployment
// has no TypeScript and no `cli/plugins.ts`, so `pnpm build` writes the answer for the source into
// `dist/cli/plugins.json`, which a deployment reads instead.
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type ts from 'typescript';

/** The registration list `pnpm build` writes beside the compiled CLI, relative to the deployment's root. */
export const CLI_PLUGIN_REGISTRATIONS_FILE = 'cli/plugins.json';

/** What `cli/plugins.json` holds. */
export interface CliPluginRegistrationsManifest {
  /** The packages `cli/plugins.ts` registers, in registration order. */
  readonly plugins: readonly string[];
}

const CLI_SUFFIX = '/cli';
const REGISTER_CALL = 'defineCliPlugins';

/**
 * The packages `sourceText`, a `cli/plugins.ts`, passes to `defineCliPlugins([...])`, in array order, parsed with the
 * TypeScript compiler the application at `appRoot` depends on. An import the array does not use registers nothing,
 * and neither does anything inside a comment, a string, a template literal or a regular expression.
 */
export async function listCliPluginRegistrations(
  sourceText: string,
  options: { readonly appRoot: string },
): Promise<string[]> {
  const typescript = await loadTypeScript(options.appRoot);
  const sourceFile = typescript.createSourceFile(
    'plugins.ts',
    sourceText,
    typescript.ScriptTarget.Latest,
    true,
    typescript.ScriptKind.TS,
  );
  const imports = new Map<string, string>();
  for (const statement of sourceFile.statements) {
    if (
      typescript.isImportDeclaration(statement) &&
      typescript.isStringLiteral(statement.moduleSpecifier) &&
      statement.importClause?.name
    )
      imports.set(
        statement.importClause.name.text,
        statement.moduleSpecifier.text,
      );
  }
  const registered: string[] = [];
  for (const element of registrationArray(typescript, sourceFile)?.elements ??
    []) {
    if (!typescript.isIdentifier(element)) continue;
    const specifier = imports.get(element.text);
    if (!specifier?.endsWith(CLI_SUFFIX)) continue;
    const packageName = specifier.slice(0, -CLI_SUFFIX.length);
    if (!registered.includes(packageName)) registered.push(packageName);
  }
  return registered;
}

/**
 * The packages the application at `appRoot` registers in its CLI: parsed from `cli/plugins.ts` in a source checkout,
 * read from the `cli/plugins.json` a build wrote in a deployment, and none when it has neither.
 */
export async function readCliPluginRegistrations(
  appRoot: string,
): Promise<string[]> {
  const source = path.join(appRoot, 'cli', 'plugins.ts');
  if (existsSync(source))
    return listCliPluginRegistrations(await readFile(source, 'utf8'), {
      appRoot,
    });
  const manifest = path.join(appRoot, CLI_PLUGIN_REGISTRATIONS_FILE);
  if (!existsSync(manifest)) return [];
  const parsed: unknown = JSON.parse(await readFile(manifest, 'utf8'));
  const plugins = (parsed as Partial<CliPluginRegistrationsManifest> | null)
    ?.plugins;
  if (
    !Array.isArray(plugins) ||
    !plugins.every((name) => typeof name === 'string')
  )
    throw new Error(`${manifest} must hold { "plugins": [package names] }.`);
  return [...plugins];
}

/** The first `defineCliPlugins([...])` argument array, the one `plugin register` edits. */
function registrationArray(
  typescript: typeof ts,
  sourceFile: ts.SourceFile,
): ts.ArrayLiteralExpression | undefined {
  let found: ts.ArrayLiteralExpression | undefined;
  const visit = (node: ts.Node): void => {
    if (found) return;
    if (
      typescript.isCallExpression(node) &&
      typescript.isIdentifier(node.expression) &&
      node.expression.text === REGISTER_CALL &&
      node.arguments.length === 1 &&
      typescript.isArrayLiteralExpression(node.arguments[0])
    ) {
      found = node.arguments[0];
      return;
    }
    typescript.forEachChild(node, visit);
  };
  typescript.forEachChild(sourceFile, visit);
  return found;
}

const compilers = new Map<string, Promise<typeof ts>>();

/**
 * The TypeScript the application depends on, loaded once per application. A source checkout has it, since it builds
 * its own TypeScript; nothing here adds a second copy to the application or one to a deployment.
 */
function loadTypeScript(appRoot: string): Promise<typeof ts> {
  let pending = compilers.get(appRoot);
  if (!pending) {
    pending = (async () => {
      let entry: string;
      try {
        entry = createRequire(path.join(appRoot, 'package.json')).resolve(
          'typescript',
        );
      } catch (cause) {
        throw new Error(
          `TypeScript is not installed in ${appRoot}, so cli/plugins.ts cannot be read.`,
          { cause },
        );
      }
      const loaded = (await import(pathToFileURL(entry).href)) as Record<
        string,
        unknown
      >;
      // TypeScript is CommonJS: its API is the namespace itself or its `default`, depending on how Node hoists it.
      return (
        typeof loaded.createSourceFile === 'function' ? loaded : loaded.default
      ) as typeof ts;
    })();
    pending.catch(() => compilers.delete(appRoot));
    compilers.set(appRoot, pending);
  }
  return pending;
}
