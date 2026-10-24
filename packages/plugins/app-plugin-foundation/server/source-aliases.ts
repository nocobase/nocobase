import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import ts from 'typescript';

/** Read JSONC declarations only; never load a config package or execute a build configuration. */
export async function sourceAliases(
  root: string,
): Promise<ReadonlyMap<string, string | undefined>> {
  const seen = new Set<string>();
  type Config = {
    aliases: Map<string, string | undefined>;
    base: string;
    valid: boolean;
  };
  const read = async (file: string): Promise<Config | undefined> => {
    if (seen.size >= 8 || !inside(root, file)) return undefined;
    try {
      const resolved = await realpath(file);
      if (
        !inside(root, resolved) ||
        seen.has(resolved) ||
        path.relative(root, resolved).split(path.sep).includes('node_modules')
      )
        return undefined;
      seen.add(resolved);
      if ((await stat(resolved)).size > 512_000) return undefined;
      const text = await readFile(resolved, 'utf8');
      const parsed = ts.parseConfigFileTextToJson(resolved, text);
      if (parsed.error || !record(parsed.config)) return undefined;
      const config = parsed.config;
      let inherited: Config | undefined;
      let valid = !duplicateKeys(ts.parseJsonText(resolved, text));
      if (
        typeof config.extends === 'string' &&
        config.extends.startsWith('.')
      ) {
        const target = path.resolve(path.dirname(resolved), config.extends);
        inherited = await read(
          path.extname(target) ? target : target + '.json',
        );
        valid &&= inherited?.valid ?? false;
      } else if (
        config.extends !== undefined &&
        typeof config.extends !== 'string'
      )
        valid = false;
      // External presets are not traversed. Only this package's explicit declarations are used.
      const options = record(config.compilerOptions)
        ? config.compilerOptions
        : {};
      valid &&=
        (options.paths === undefined || record(options.paths)) &&
        (options.baseUrl === undefined || typeof options.baseUrl === 'string');
      const own = record(options.paths) ? options.paths : undefined;
      const base =
        typeof options.baseUrl === 'string'
          ? path.resolve(path.dirname(resolved), options.baseUrl)
          : (inherited?.base ?? path.dirname(resolved));
      const aliases = own
        ? new Map<string, string | undefined>()
        : new Map(inherited?.aliases);
      // Re-basing inherited paths is deliberately unsupported rather than guessing a different target.
      if (
        !own &&
        inherited &&
        options.baseUrl !== undefined &&
        base !== inherited.base
      )
        valid = false;
      const entries = Object.entries(own ?? {});
      if (own)
        for (const [key, value] of entries) {
          const stars = (key.match(/\*/g) ?? []).length;
          const target =
            Array.isArray(value) &&
            value.length === 1 &&
            typeof value[0] === 'string'
              ? value[0]
              : undefined;
          const supported =
            entries.length <= 128 &&
            key.length <= 256 &&
            target !== undefined &&
            target.length <= 1024 &&
            stars <= 1 &&
            (target.match(/\*/g) ?? []).length === stars &&
            !path.isAbsolute(target);
          aliases.set(key, supported ? path.resolve(base, target) : undefined);
        }
      if (!valid) for (const key of aliases.keys()) aliases.set(key, undefined);
      return { aliases, base, valid };
    } catch {
      return undefined;
    }
  };
  return (await read(path.join(root, 'tsconfig.json')))?.aliases ?? new Map();
}

export function aliasMatches(
  alias: string,
  specifier: string,
): string | undefined {
  const star = alias.indexOf('*');
  if (star < 0) return alias === specifier ? '' : undefined;
  const prefix = alias.slice(0, star),
    suffix = alias.slice(star + 1);
  return specifier.length >= prefix.length + suffix.length &&
    specifier.startsWith(prefix) &&
    specifier.endsWith(suffix)
    ? specifier.slice(prefix.length, specifier.length - suffix.length)
    : undefined;
}
function inside(root: string, file: string): boolean {
  const relative = path.relative(root, file);
  return (
    relative !== '..' &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function duplicateKeys(node: ts.Node, depth = 0): boolean {
  if (depth > 32) return true;
  if (ts.isObjectLiteralExpression(node)) {
    const names = node.properties.map((p) =>
      p.name && (ts.isStringLiteralLike(p.name) || ts.isIdentifier(p.name))
        ? p.name.text
        : '',
    );
    if (new Set(names).size !== names.length) return true;
  }
  let duplicate = false;
  ts.forEachChild(node, (child) => {
    if (duplicateKeys(child, depth + 1)) duplicate = true;
  });
  return duplicate;
}
