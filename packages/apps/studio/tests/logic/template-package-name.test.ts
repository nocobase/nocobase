// @vitest-environment node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appRoot = path.resolve(
  fileURLToPath(new URL('.', import.meta.url)),
  '../..',
);

interface AppPackageJson {
  readonly name: string;
  readonly nocobase?: { readonly templatePackage?: string };
}

const appPackage = JSON.parse(
  readFileSync(path.join(appRoot, 'package.json'), 'utf8'),
) as AppPackageJson;
const applicationName = appPackage.name;
const originalTemplateName =
  appPackage.nocobase?.templatePackage ?? applicationName;
const isGeneratedApplication = originalTemplateName !== applicationName;

/**
 * Sources present in this template that `create-app` rewrites, from `PACKAGE_NAME_SOURCES` in
 * `packages/tools/create-app/src/lib/scaffold.ts`.
 */
const REWRITTEN_SOURCES = ['client/runtime.ts', 'client/service-provider.ts'];

/** Source trees shipped to a generated application, per the `files` field. */
const SHIPPED_SOURCE_DIRECTORIES = ['client', 'server', 'database', 'cli'];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.js']);

function sourceFilesIn(directory: string): string[] {
  const absolute = path.join(appRoot, directory);

  return readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules') return [];

    const relative = path.join(directory, entry.name);

    if (entry.isDirectory()) return sourceFilesIn(relative);
    if (!SOURCE_EXTENSIONS.has(path.extname(entry.name))) return [];

    return [relative];
  });
}

describe('template package name', () => {
  /**
   * `create-app` rewrites this name to the application's in a fixed list of files. A source that embeds it but is not
   * on that list ships the template's name into every generated application, where the client would then declare an
   * i18n namespace the server does not share.
   *
   * When this fails, either rewrite the new occurrence to derive the name at runtime, or add the file to
   * `PACKAGE_NAME_SOURCES` in `packages/tools/create-app/src/lib/scaffold.ts` and to `REWRITTEN_SOURCES` above.
   */
  it('keeps the original template name only where create-app rewrites it', () => {
    const offenders = SHIPPED_SOURCE_DIRECTORIES.filter((directory) =>
      statSync(path.join(appRoot, directory), { throwIfNoEntry: false }),
    )
      .flatMap((directory) => sourceFilesIn(directory))
      .filter(
        (relative) =>
          isGeneratedApplication || !REWRITTEN_SOURCES.includes(relative),
      )
      .filter((relative) =>
        readFileSync(path.join(appRoot, relative), 'utf8').includes(
          originalTemplateName,
        ),
      );

    expect(offenders).toEqual([]);
  });

  /** The rewrite list is only correct while every file on it exists and carries the current application name. */
  it('uses the application name in every source create-app rewrites', () => {
    for (const relative of REWRITTEN_SOURCES) {
      expect(
        readFileSync(path.join(appRoot, relative), 'utf8'),
        `${relative} does not contain ${applicationName}`,
      ).toContain(applicationName);
    }
  });
});
