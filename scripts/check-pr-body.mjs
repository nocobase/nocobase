// Checks a v3 pull request's description against the PR template before it merges, so every user-visible change
// arrives at release time with a type, a module and a sentence in English and Chinese. The `PR description` job of
// v3-pr-description.yml runs it without installing dependencies, so it uses node builtins only.
//
// Usage:
//   node scripts/check-pr-body.mjs <file>   # <file> is JSON { "title": string, "body": string }
//
// Exit codes: 0 without errors (warnings allowed), 1 with errors, 2 on bad usage or an unreadable file.
import { appendFileSync, readFileSync } from 'node:fs';
import process from 'node:process';

import { moduleOf, parsePullRequest } from './pr-body.mjs';

/** What to do about a failing description, printed after its errors. */
export const GUIDANCE =
  'This pull request description does not follow the v3 PR template (.github/pull_request_template.md on v3-develop): check exactly one type, and unless it is Others write one English and one Chinese changelog sentence. Editing the title or description runs this check again.';

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
 * @returns {string}
 */
function summary(result) {
  const lines = [
    `### PR description: ${result.errors.length ? 'needs changes' : 'ok'}`,
    '',
  ];
  if (result.type) {
    const module = moduleOf(result.scope);
    lines.push(`- Type: ${result.type}`);
    if (result.type !== 'Others') {
      lines.push(`- Module: ${module.en} / ${module.zh}`);
      lines.push(`- 🇺🇸 ${result.changelog.en || '(empty)'}`);
      lines.push(`- 🇨🇳 ${result.changelog.zh || '(empty)'}`);
    }
  }
  for (const error of result.errors) lines.push(`- ❌ ${error}`);
  for (const warning of result.warnings) lines.push(`- ⚠️ ${warning}`);
  if (result.errors.length) lines.push('', GUIDANCE);
  return `${lines.join('\n')}\n`;
}

function main(argv) {
  if (argv.length !== 1) {
    console.error('Usage: node scripts/check-pr-body.mjs <file>');
    return 2;
  }
  let pullRequest;
  try {
    pullRequest = JSON.parse(readFileSync(argv[0], 'utf8'));
  } catch (error) {
    console.error(`Cannot read ${argv[0]}: ${error.message}`);
    return 2;
  }
  if (typeof pullRequest?.title !== 'string') {
    console.error(
      `${argv[0]} must hold JSON { "title": string, "body": string }.`,
    );
    return 2;
  }
  const result = parsePullRequest({
    title: pullRequest.title,
    body: pullRequest.body ?? '',
  });
  for (const error of result.errors) console.log(`::error::${command(error)}`);
  if (result.errors.length) console.log(`::error::${command(GUIDANCE)}`);
  for (const warning of result.warnings)
    console.log(`::warning::${command(warning)}`);
  if (!result.errors.length)
    console.log(
      `PR description ok: ${result.type}${result.type === 'Others' ? '' : `, ${moduleOf(result.scope).en}`}.`,
    );
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

process.exitCode = main(process.argv.slice(2));
