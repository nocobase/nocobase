import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { FoundationModuleSources } from '../shared/foundation.js';

export const MODULE_MANIFEST_FILE: string = 'foundation-modules.json';
const manifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    packageName: z.string(),
    sources: z
      .object({
        complete: z.boolean(),
        routes: z
          .array(
            z
              .object({
                packageName: z.string(),
                routeName: z.string(),
                providers: z.array(z.string()),
                apiProviders: z.array(z.string()).optional(),
                complete: z.boolean(),
              })
              .strict(),
          )
          .max(10000),
      })
      .strict(),
  })
  .strict();

/** Deployment metadata contains association evidence only, never source text or filesystem locations. */
export async function readModuleManifest(
  rootDir: string,
  packageName: string,
): Promise<FoundationModuleSources | undefined> {
  const file = path.join(rootDir, 'server', MODULE_MANIFEST_FILE);
  try {
    if ((await stat(file)).size > 5_000_000) return undefined;
    const parsed = manifestSchema.safeParse(
      JSON.parse(await readFile(file, 'utf8')) as unknown,
    );
    if (
      !parsed.success ||
      parsed.data.packageName !== packageName ||
      parsed.data.sources.routes.some(
        (route) => route.packageName !== packageName,
      )
    )
      return undefined;
    return parsed.data.sources;
  } catch {
    return undefined;
  }
}

/** Repeat builds converge on the same bytes; replace the artifact only after a complete write. */
export async function writeModuleManifest(
  rootDir: string,
): Promise<{ readonly routes: number; readonly complete: boolean }> {
  const { collectModuleSources } = await import('./module-sources.js');
  const manifest = JSON.parse(
    await readFile(path.join(rootDir, 'package.json'), 'utf8'),
  ) as { name: string };
  const sources = await collectModuleSources(rootDir);
  const document = manifestSchema.parse({
    schemaVersion: 1,
    packageName: manifest.name,
    sources,
  });
  const file = path.join(rootDir, 'dist', 'server', MODULE_MANIFEST_FILE);
  const contents = JSON.stringify(document) + '\n';
  await mkdir(path.dirname(file), { recursive: true });
  const previous = await readFile(file, 'utf8').catch(() => undefined);
  if (previous !== contents) {
    const temporary = `${file}.${process.pid}.tmp`;
    await writeFile(temporary, contents);
    await rename(temporary, file);
  }
  return { routes: sources.routes.length, complete: sources.complete };
}
