import path from 'node:path';

const CODE = /\.(?:[cm]?[jt]sx?|astro)$/u;
const FORMATTABLE =
  /\.(?:[cm]?[jt]sx?|json5?|jsonc|mdx?|ya?ml|css|scss|less|html|astro)$/u;

/**
 * Directories that lint themselves rather than being covered by the root ESLint configuration, given as
 * repository-relative prefixes. A directory belongs here when it has its own `eslint.config.*` AND its own ESLint
 * dependency, because both halves matter: the root configuration enumerates the package roots it applies to and
 * matches nothing under such a directory, so linting its files from the root silently succeeds without running a
 * single rule, and its configuration loads plugins only it depends on (`docs` lints `.astro` components with
 * `eslint-plugin-astro`), so the binary has to come from there too.
 *
 * Everything under `packages/` is covered by the root configuration and must not be listed.
 */
const SELF_LINTING_DIRECTORIES = ['docs', 'ui-library'];

/**
 * ESLint runs once per package rather than once for every staged file.
 *
 * The type-aware rules build a TypeScript program per file and hold it for the length of the run, so a single process
 * grows with the size of the commit. A repository-wide change — a refactor that moves every package, a dependency bump
 * that rewrites every manifest — exhausts the heap, and the hook dies with an allocation failure rather than a lint
 * result. Splitting by package bounds it: each process exits and frees what it held before the next starts.
 *
 * Grouping costs nothing for an ordinary commit, which touches one or two packages and so produces one or two
 * commands, the same as before.
 *
 * Prettier still takes every staged file in one command. It formats a file at a time with no cross-file analysis, so
 * its memory does not scale with the size of the commit the way ESLint's does. It also needs no per-directory
 * treatment: `docs` inherits the same shared Prettier configuration as everything else, and the root
 * `.prettierignore` — which the command below passes explicitly — is what decides which of its files are skipped.
 */
const groupByPackage = (files) => {
  const groups = new Map();

  for (const file of files) {
    const relative = path.relative(import.meta.dirname, file);
    const segments = relative.split(path.sep);
    // `packages/<category>/<name>` is a package. A self-linting directory is its own group, keyed by its prefix so
    // that the command can be run from inside it. Anything else is grouped as the repository root, which the root
    // ESLint configuration covers.
    const key =
      segments[0] === 'packages' && segments.length > 3
        ? segments.slice(0, 3).join('/')
        : (SELF_LINTING_DIRECTORIES.find(
            (directory) => segments[0] === directory,
          ) ?? '');
    const group = groups.get(key);
    if (group) group.push(file);
    else groups.set(key, [file]);
  }

  return [...groups.entries()];
};

const quote = (values) =>
  values.map((value) => JSON.stringify(value)).join(' ');

export default {
  '*': (files) => {
    const code = files.filter((file) => CODE.test(file));
    const formattable = files.filter((file) => FORMATTABLE.test(file));

    const commands = groupByPackage(code).map(([key, group]) => {
      const lint = `eslint --fix --no-warn-ignored --max-warnings 0 ${quote(group)}`;

      // A self-linting directory needs its own ESLint, resolved from its own node_modules and reading its own
      // configuration. `pnpm --dir` runs the binary there while the paths stay absolute, so they resolve either way.
      return SELF_LINTING_DIRECTORIES.includes(key)
        ? `pnpm --dir ${JSON.stringify(key)} exec ${lint}`
        : lint;
    });

    if (formattable.length > 0) {
      commands.push(
        `prettier --write --ignore-path .prettierignore ${quote(formattable)}`,
      );
    }

    return commands;
  },
};
