// Checks that the v1/v2 workflow entries on v3-develop still mirror the manual workflows on main. v3-develop carries
// one thin entry per v1/v2 `workflow_dispatch` workflow (same filename, same `name`, same inputs) so that the manual
// workflows stay runnable once v3-develop becomes the default branch; this check catches main adding, removing or
// renaming such a workflow, or changing its name or inputs, without the entry following. See
// .agents/rules/workflows-and-release.md ("V2 workflow entries on v3-develop"). It needs the `yaml` package only.
//
// Usage:
//   node scripts/check-v2-workflow-entries.mjs --main <dir> --entries <dir> [--mismatch warn|error]
//
//   --main     main's .github/workflows directory
//   --entries  v3-develop's .github/workflows directory
//   --mismatch severity of the findings that compare an entry with main (default: error). A pull request on
//              v3-develop passes `warn`, because an entry may legitimately land before the change on main. Structural
//              findings about an entry itself are always errors.
//
// Exit codes: 0 without errors (warnings allowed), 1 with errors, 2 on bad usage or an unreadable directory.
import {
  appendFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

import { parse } from 'yaml';

/**
 * Manual workflows on main that deliberately have no entry on v3-develop because they have never run. Adding an entry
 * for one of them is reported, so remove it from this set in the same change.
 */
export const EXCLUDED = new Set([
  'build-docker.yml',
  'build-internal-image.yml',
  'create-branch.yml',
  'manual-build-pr-docker-image.yml',
  'manual-e2e.yml',
]);

const BRANCH_GUARD = "github.ref == 'refs/heads/v3-develop'";

const UPDATE_ORDER =
  'The entry on v3-develop must match the workflow on main. To change a v2 workflow name or its inputs, update the entry on v3-develop first, then main.';

/**
 * Escapes text for a GitHub Actions workflow command, which ends at the first line break.
 * @param {string} text
 * @returns {string}
 */
function command(text) {
  return text
    .replace(/%/gu, '%25')
    .replace(/\r/gu, '%0D')
    .replace(/\n/gu, '%0A');
}

/**
 * @param {string} directory
 * @returns {string[]} The v1/v2 workflow filenames in the directory, those that do not start with `v3-`.
 */
function listWorkflows(directory) {
  return readdirSync(directory)
    .filter((file) => /\.ya?ml$/u.test(file) && !file.startsWith('v3-'))
    .sort();
}

/**
 * @param {string} file
 * @returns {{ doc: any } | { error: string }}
 */
function load(file) {
  try {
    const doc = parse(readFileSync(file, 'utf8'));
    if (doc === null || typeof doc !== 'object')
      return { error: 'is not a YAML mapping' };
    return { doc };
  } catch (error) {
    return { error: `cannot be parsed: ${error.message}` };
  }
}

/**
 * The trigger names of a workflow's `on`, whichever of its three YAML shapes it uses.
 * @param {any} doc
 * @returns {string[]}
 */
function triggers(doc) {
  const on = doc?.on;
  if (typeof on === 'string') return [on];
  if (Array.isArray(on)) return on.map(String);
  if (on && typeof on === 'object') return Object.keys(on);
  return [];
}

/** @param {any} doc */
function dispatchInputs(doc) {
  return doc?.on?.workflow_dispatch?.inputs ?? {};
}

/**
 * @typedef {{ file: string, message: string }} Finding
 */

/**
 * Compares the entries directory with main's workflows directory.
 * @param {{ main: string, entries: string, mismatch?: 'warn' | 'error' }} options
 * @returns {{ errors: Finding[], warnings: Finding[], checked: number }}
 */
export function checkEntries({ main, entries, mismatch = 'error' }) {
  /** @type {Finding[]} */ const errors = [];
  /** @type {Finding[]} */ const warnings = [];
  const mismatchTarget = mismatch === 'warn' ? warnings : errors;
  const relative = (file) => `.github/workflows/${file}`;

  /** @type {Map<string, any>} */
  const mainDispatch = new Map();
  const mainFiles = new Set(listWorkflows(main));
  const mainUnreadable = new Set();
  for (const file of mainFiles) {
    const loaded = load(path.join(main, file));
    if ('error' in loaded) {
      mainUnreadable.add(file);
      errors.push({
        file: relative(file),
        message: `${file} on main ${loaded.error}.`,
      });
      continue;
    }
    if (triggers(loaded.doc).includes('workflow_dispatch'))
      mainDispatch.set(file, loaded.doc);
  }

  const entryFiles = listWorkflows(entries);
  const entrySet = new Set(entryFiles);

  for (const file of mainDispatch.keys()) {
    if (EXCLUDED.has(file) || entrySet.has(file)) continue;
    mismatchTarget.push({
      file: relative(file),
      message: `${file} on main has a workflow_dispatch trigger but v3-develop has no entry for it. Add a thin entry named ${file} on v3-develop (copy an existing one such as manual-release.yml). If the workflow has never run, add it to EXCLUDED in scripts/check-v2-workflow-entries.mjs instead. ${UPDATE_ORDER}`,
    });
  }

  for (const file of EXCLUDED) {
    if (entrySet.has(file)) {
      mismatchTarget.push({
        file: relative(file),
        message: `${file} is listed in EXCLUDED in scripts/check-v2-workflow-entries.mjs but v3-develop has an entry for it. Remove it from EXCLUDED, or delete the entry.`,
      });
    }
    if (!mainFiles.has(file)) {
      warnings.push({
        file: relative(file),
        message: `${file} is listed in EXCLUDED in scripts/check-v2-workflow-entries.mjs but no longer exists on main. Remove it from EXCLUDED.`,
      });
    }
  }

  for (const file of entryFiles) {
    const loaded = load(path.join(entries, file));
    if ('error' in loaded) {
      errors.push({
        file: relative(file),
        message: `Entry ${file} ${loaded.error}.`,
      });
      continue;
    }
    const entry = loaded.doc;

    // Structural checks: the entry must be a pure dispatcher of the same file on main.
    const entryTriggers = triggers(entry);
    const extra = entryTriggers.filter(
      (trigger) => trigger !== 'workflow_dispatch',
    );
    if (!entryTriggers.includes('workflow_dispatch') || extra.length) {
      errors.push({
        file: relative(file),
        message: `Entry ${file} must declare workflow_dispatch as its only trigger${extra.length ? ` but also declares ${extra.join(', ')}` : ''}. Other triggers of a v1/v2 workflow stay on main and need no entry.`,
      });
    }
    const guarded = Object.values(entry.jobs ?? {}).filter(
      (job) =>
        typeof job?.if === 'string' &&
        job.if.replace(/\s+/gu, ' ').includes(BRANCH_GUARD),
    );
    if (!guarded.length) {
      errors.push({
        file: relative(file),
        message: `Entry ${file} has no job guarded by \`if: \${{ ${BRANCH_GUARD} }}\`. The entry must only run on v3-develop, otherwise a manual run on another branch would dispatch main instead of that branch's own file.`,
      });
    } else {
      const steps = guarded.flatMap((job) =>
        Array.isArray(job.steps) ? job.steps : [],
      );
      const workflowFiles = steps
        .map((step) => step?.env?.WORKFLOW_FILE)
        .filter((value) => value !== undefined);
      if (!workflowFiles.includes(file)) {
        errors.push({
          file: relative(file),
          message: `Entry ${file} must set env WORKFLOW_FILE to its own filename (${file}) in the step that dispatches${workflowFiles.length ? `, but it sets ${workflowFiles.join(', ')}` : ''}.`,
        });
      }
      if (
        !steps.some(
          (step) =>
            typeof step?.run === 'string' && /ref:\s*"main"/u.test(step.run),
        )
      ) {
        errors.push({
          file: relative(file),
          message: `Entry ${file} must dispatch ref "main" (a run script containing ref: "main"): the v1/v2 implementation lives on main and is never copied.`,
        });
      }
    }

    // Comparison with main.
    if (mainUnreadable.has(file)) continue;
    if (!mainFiles.has(file)) {
      mismatchTarget.push({
        file: relative(file),
        message: `Entry ${file} has no counterpart on main. If main renamed or deleted the workflow, rename or delete the entry. ${UPDATE_ORDER}`,
      });
      continue;
    }
    const counterpart = mainDispatch.get(file);
    if (!counterpart) {
      mismatchTarget.push({
        file: relative(file),
        message: `Entry ${file} has a counterpart on main that no longer has a workflow_dispatch trigger. Delete the entry. ${UPDATE_ORDER}`,
      });
      continue;
    }
    if (entry.name !== counterpart.name) {
      mismatchTarget.push({
        file: relative(file),
        message: `Entry ${file} has name ${JSON.stringify(entry.name)} but main has ${JSON.stringify(counterpart.name)}. ${UPDATE_ORDER}`,
      });
    }
    if (
      !isDeepStrictEqual(dispatchInputs(entry), dispatchInputs(counterpart))
    ) {
      mismatchTarget.push({
        file: relative(file),
        message: `The workflow_dispatch inputs of entry ${file} differ from main. Copy the on.workflow_dispatch.inputs block of ${file} on main into the entry. ${UPDATE_ORDER}`,
      });
    }
  }

  return { errors, warnings, checked: entryFiles.length };
}

/**
 * The Markdown report written to the job summary.
 * @param {ReturnType<typeof checkEntries>} result
 * @returns {string}
 */
function summary(result) {
  const lines = [
    `### V2 workflow entries: ${result.errors.length ? 'needs changes' : 'ok'}`,
    '',
  ];
  lines.push(`Checked ${result.checked} entries.`);
  for (const error of result.errors)
    lines.push(`- ❌ \`${error.file}\`: ${error.message}`);
  for (const warning of result.warnings)
    lines.push(`- ⚠️ \`${warning.file}\`: ${warning.message}`);
  return `${lines.join('\n')}\n`;
}

/** @param {string[]} argv */
function parseArgs(argv) {
  const options = { mismatch: 'error' };
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (
      value === undefined ||
      !['--main', '--entries', '--mismatch'].includes(flag)
    )
      return null;
    options[flag.slice(2)] = value;
  }
  if (
    !options.main ||
    !options.entries ||
    !['warn', 'error'].includes(options.mismatch)
  )
    return null;
  return options;
}

function main(argv) {
  const options = parseArgs(argv);
  if (!options) {
    console.error(
      'Usage: node scripts/check-v2-workflow-entries.mjs --main <dir> --entries <dir> [--mismatch warn|error]',
    );
    return 2;
  }
  for (const directory of [options.main, options.entries]) {
    if (!existsSync(directory) || !statSync(directory).isDirectory()) {
      console.error(`Not a directory: ${directory}`);
      return 2;
    }
  }
  const result = checkEntries(options);
  for (const { file, message } of result.errors)
    console.log(`::error file=${command(file)}::${command(message)}`);
  for (const { file, message } of result.warnings)
    console.log(`::warning file=${command(file)}::${command(message)}`);
  if (!result.errors.length && !result.warnings.length) {
    console.log(`All ${result.checked} v2 workflow entries match main.`);
  }
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(result));
    } catch (error) {
      console.log(
        `::warning::Cannot write the job summary: ${command(error.message)}`,
      );
    }
  }
  return result.errors.length ? 1 : 0;
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  process.exitCode = main(process.argv.slice(2));
}
