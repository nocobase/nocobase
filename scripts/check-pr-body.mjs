// Checks a v3 pull request's description against the PR template before it merges, so every user-visible change
// arrives at release time with a type, a module and a sentence in English, Chinese and Japanese. The `PR description`
// job of v3-pr-description.yml runs it without installing dependencies, so it uses node builtins only; so does
// nocobase/nocobase3-pro's, with `--no-module`, since its changes are not listed by the modules of
// `changelog-scopes.json`.
//
// Usage:
//   node scripts/check-pr-body.mjs [--no-module] <file>   # <file> is JSON { "title": string, "body": string }
//
// Exit codes: 0 without errors (warnings allowed), 1 with errors, 2 on bad usage or an unreadable file.
import { appendFileSync, readFileSync } from 'node:fs';
import process from 'node:process';

import { moduleOf, parsePullRequest } from './pr-body.mjs';

/** What to do about a failing description, printed after its errors. */
export const GUIDANCE =
  'This pull request description does not follow the v3 PR template (.github/pull_request_template.md on v3-develop): check exactly one type, and unless it is Others write one English, one Chinese and one Japanese changelog sentence. Editing the title or description runs this check again.';

/** The guidance for another repository's pull request, `--no-module`, which follows that repository's own template. */
export const OTHER_REPOSITORY_GUIDANCE = GUIDANCE.replace(
  'the v3 PR template (.github/pull_request_template.md on v3-develop)',
  "the PR template (this repository's .github/pull_request_template.md)",
);

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
 * The Markdown report written to the job summary.
 * @param {ReturnType<typeof parsePullRequest>} result
 * @param {boolean} withModule
 * @returns {string}
 */
function summary(result, withModule) {
  const lines = [
    `### PR description: ${result.errors.length ? 'needs changes' : 'ok'}`,
    '',
  ];
  if (result.type) {
    const module = moduleOf(result.scope);
    lines.push(`- Type: ${result.type}`);
    if (result.type !== 'Others') {
      if (withModule)
        lines.push(`- Module: ${module.en} / ${module.zh} / ${module.ja}`);
      lines.push(`- 🇺🇸 ${result.changelog.en || '(empty)'}`);
      lines.push(`- 🇨🇳 ${result.changelog.zh || '(empty)'}`);
      lines.push(`- 🇯🇵 ${result.changelog.ja || '(empty)'}`);
    }
  }
  for (const error of result.errors) lines.push(`- ❌ ${error}`);
  for (const warning of result.warnings) lines.push(`- ⚠️ ${warning}`);
  if (result.errors.length)
    lines.push('', withModule ? GUIDANCE : OTHER_REPOSITORY_GUIDANCE);
  return `${lines.join('\n')}\n`;
}

function main(argv) {
  const withModule = !argv.includes('--no-module');
  const files = argv.filter((arg) => arg !== '--no-module');
  if (files.length !== 1 || files[0].startsWith('--')) {
    console.error('Usage: node scripts/check-pr-body.mjs [--no-module] <file>');
    return 2;
  }
  const [file] = files;
  let pullRequest;
  try {
    pullRequest = JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`Cannot read ${file}: ${error.message}`);
    return 2;
  }
  if (typeof pullRequest?.title !== 'string') {
    console.error(
      `${file} must hold JSON { "title": string, "body": string }.`,
    );
    return 2;
  }
  const result = parsePullRequest(
    { title: pullRequest.title, body: pullRequest.body ?? '' },
    withModule ? {} : { scopes: null },
  );
  for (const error of result.errors) console.log(`::error::${command(error)}`);
  if (result.errors.length)
    console.log(
      `::error::${command(withModule ? GUIDANCE : OTHER_REPOSITORY_GUIDANCE)}`,
    );
  for (const warning of result.warnings)
    console.log(`::warning::${command(warning)}`);
  if (!result.errors.length)
    console.log(
      `PR description ok: ${result.type}${result.type === 'Others' || !withModule ? '' : `, ${moduleOf(result.scope).en}`}.`,
    );
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        summary(result, withModule),
      );
    } catch (error) {
      console.log(
        `::warning::Cannot write the job summary: ${command(error.message)}`,
      );
    }
  }
  return result.errors.length ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));
