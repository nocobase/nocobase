import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const repo = path.resolve(import.meta.dirname, '..');
const values = ['FormFeedback', 'formFeedbackErrors'];
const types = [
  'FormFeedbackAttempt',
  'FormFeedbackField',
  'FormFeedbackOptions',
];

function exportedNames(file) {
  const runtime = /\.[cm]?js$/.test(file);
  const options = {
    allowJs: true,
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    skipLibCheck: true,
    noEmit: true,
  };
  const host = ts.createCompilerHost(options);
  if (runtime) {
    // TypeScript prefers sibling declarations for .js imports; a runtime check must follow the actual JavaScript.
    const fileExists = host.fileExists;
    host.fileExists = (candidate) =>
      !/\.(?:[cm]?ts|tsx)$/.test(candidate) && fileExists(candidate);
  }
  const program = ts.createProgram([file], options, host);
  const source = program.getSourceFile(file);
  const checker = program.getTypeChecker();
  const symbol = source && checker.getSymbolAtLocation(source);
  return new Set(
    symbol
      ? checker
          .getExportsOfModule(symbol)
          .filter((entry) => {
            const target =
              entry.flags & ts.SymbolFlags.Alias
                ? checker.getAliasedSymbol(entry)
                : entry;
            return (
              (!runtime || target.flags & ts.SymbolFlags.Value) &&
              target.declarations?.some((declaration) =>
                runtime
                  ? /\.[cm]?js$/.test(declaration.getSourceFile().fileName)
                  : declaration.getSourceFile().isDeclarationFile,
              )
            );
          })
          .map((entry) => entry.name)
      : [],
  );
}

function checkRuntimePackage(directory, requiredValues, requiredTypes) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(directory, 'package.json'), 'utf8'),
  );
  const entry = manifest.exports?.['.'];
  const runtime = entry?.import ?? manifest.main;
  const declarations = entry?.types ?? manifest.types;
  if (!runtime || !declarations)
    throw new Error(
      'The runtime package must publish JavaScript and declarations.',
    );
  for (const [file, required] of [
    [runtime, requiredValues],
    [declarations, [...requiredValues, ...requiredTypes]],
  ]) {
    const exported = exportedNames(path.resolve(directory, file));
    const missing = required.filter((name) => !exported.has(name));
    if (missing.length)
      throw new Error(
        `${manifest.name}@${manifest.version} lacks ${missing.join(', ')} in ${file}.`,
      );
  }
  return manifest.version;
}

export function checkFormFeedbackPackage(directory) {
  return checkRuntimePackage(directory, values, types);
}

export function checkPendingFeedbackPackage(directory) {
  return checkRuntimePackage(
    directory,
    ['usePendingFeedback'],
    ['PendingFeedback'],
  );
}

export function checkAvatarInitialsPackage(directory) {
  return checkRuntimePackage(
    directory,
    ['getAvatarInitials'],
    ['AvatarInitialsOptions'],
  );
}

export function runtimeFloor(registry, itemName = 'feedback-form') {
  const item = registry.items.find((entry) => entry.name === itemName);
  const spec = item?.dependencies?.find((value) =>
    value.startsWith('@nocobase/app-client@'),
  );
  const range = spec?.slice('@nocobase/app-client@'.length);
  // Fail closed for unions or ranges whose minimum has not been explicitly checked.
  const floor = range?.match(
    /^(?:\^|~)?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/,
  )?.[1];
  if (!floor)
    throw new Error(
      `${itemName} must declare a single exact, caret or tilde app-client version floor.`,
    );
  return floor;
}

export function checkFormFeedbackPeer(registry, manifest) {
  const item = registry.items.find((entry) => entry.name === 'feedback-form');
  const spec = item?.dependencies?.find((value) =>
    value.startsWith('@nocobase/i18n@'),
  );
  const range = spec?.slice('@nocobase/i18n@'.length);
  const peer = manifest.peerDependencies?.['@nocobase/i18n'];
  // Use the runtime's declared contract verbatim, so installing the item cannot downgrade its translation context.
  if (!peer || range !== peer)
    throw new Error(
      `feedback-form must declare @nocobase/i18n@${peer ?? 'the runtime peer range'}, matching the published runtime.`,
    );
}

function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.status !== 0 || result.error)
    throw new Error(`${command} failed while checking the published runtime.`);
  return result.stdout;
}

export function checkRelease(
  registryUrl = 'https://registry.npmjs.org',
  registry = JSON.parse(
    fs.readFileSync(
      path.join(repo, 'ui-library/registry/components/registry.json'),
      'utf8',
    ),
  ),
) {
  const work = fs.mkdtempSync(
    path.join(os.tmpdir(), 'registry-runtime-release-'),
  );
  try {
    for (const [itemName, checkPackage] of [
      ['feedback-form', checkFormFeedbackPackage],
      ['property-fields', checkAvatarInitialsPackage],
      ['loading', checkPendingFeedbackPackage],
      ['pending-button', checkPendingFeedbackPackage],
    ]) {
      const floor = runtimeFloor(registry, itemName);
      const itemWork = path.join(work, itemName);
      fs.mkdirSync(itemWork);
      try {
        const [packed] = JSON.parse(
          run('npm', [
            'pack',
            `@nocobase/app-client@${floor}`,
            `--registry=${registryUrl}`,
            '--ignore-scripts',
            '--json',
            '--pack-destination',
            itemWork,
            '--cache',
            path.join(work, 'npm-cache'),
          ]),
        );
        run('tar', [
          '-xzf',
          path.join(itemWork, packed.filename),
          '-C',
          itemWork,
        ]);
        const directory = path.join(itemWork, 'package');
        if (itemName === 'feedback-form') {
          checkFormFeedbackPeer(
            registry,
            JSON.parse(
              fs.readFileSync(path.join(directory, 'package.json'), 'utf8'),
            ),
          );
        }
        const version = checkPackage(directory);
        if (version !== floor)
          throw new Error(
            'The downloaded runtime does not match the declared floor.',
          );
        console.log(
          `${itemName} registry release allowed: @nocobase/app-client@${version} (${packed.integrity}).`,
        );
      } catch (error) {
        throw new Error(
          `${itemName} requires a published @nocobase/app-client@${floor}: ${error.message}`,
          { cause: error },
        );
      }
    }
  } finally {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
) {
  try {
    checkRelease();
  } catch (error) {
    console.error(
      `Registry release blocked: ${error.message} Publish the runtime first, then raise the item's runtime dependency floor to that obtainable release before retrying.`,
    );
    process.exitCode = 1;
  }
}
