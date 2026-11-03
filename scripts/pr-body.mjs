// Reads a v3 pull request's title and description the way the PR template (`.github/pull_request_template.md`) lays
// them out: the type checked under "This is a ...", the module from the title's conventional-commit scope, and the
// English and Chinese changelog sentences. Pure functions with no I/O and node builtins only, shared by the CI check
// (`check-pr-body.mjs`) and the release changelog writer (`changelog.mjs`).
//
// Parsing is deliberately section-scoped: the type comes only from the checkboxes of the "This is a ..." section and
// the changelog only from the table of the "Changelog" section, so a checked box or a table row anywhere else in the
// description (a checklist, a quoted template, a code block) never changes the result. That also accepts the v2
// template GitHub offers from the default branch `main`, whose type list and Changelog table have the same shape.
import scopes from './changelog-scopes.json' with { type: 'json' };

/** The types a PR can be, in the template's order. `Others` never reaches the changelog. */
export const TYPES = ['New feature', 'Improvement', 'Bug fix', 'Others'];

/** Cell values that only stand in for a sentence someone still has to write. */
export const PLACEHOLDER =
  /^(?:todo|tbd|tba|n\/?a|none|null|-+|—+|\.+|…|无|暂无|待定|待补充)[.。!！]?$/iu;

const CHECKBOX = /^\s*[-*+]\s+\[([ xX])\]\s+(.+?)\s*$/u;

const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/u;

const FENCE = /^\s{0,3}(`{3,}|~{3,})/u;

/**
 * Removes HTML comments, including one left unterminated at the end, so the template's guidance never counts as
 * content.
 * @param {string} text
 * @returns {string}
 */
export function stripComments(text) {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/gu, '');
}

/**
 * Splits a Markdown body into its level 1 to 3 sections. Headings inside fenced code blocks are content, and deeper
 * headings stay inside the section that holds them.
 * @param {string} body
 * @returns {{ heading: string, lines: string[] }[]} the sections in order; text before the first heading is dropped
 */
export function splitSections(body) {
  const sections = [];
  let current = null;
  let fence = null;
  for (const line of body.split('\n')) {
    const fenceMatch = FENCE.exec(line);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length)
        fence = null;
    } else if (!fence) {
      const heading = HEADING.exec(line);
      if (heading && heading[1].length <= 3) {
        current = { heading: heading[2].trim(), lines: [] };
        sections.push(current);
        continue;
      }
    }
    current?.lines.push(line);
  }
  return sections;
}

/**
 * The conventional-commit scope of a PR title, `type(scope): subject`; with several scopes, `a,b`, the first.
 * @param {string} title
 * @returns {{ conventional: boolean, scope: string | null }}
 */
export function parseTitle(title) {
  const match = /^\s*[a-z]+(?:\(([^)]*)\))?!?:\s*\S/iu.exec(title ?? '');
  if (!match) return { conventional: false, scope: null };
  const scope = (match[1] ?? '').split(',')[0].trim().toLowerCase();
  return { conventional: true, scope: scope || null };
}

/**
 * The key of `scopeMap` a scope names. A package's directory name works as well as its short name, so
 * `app-plugin-demo-mode` and `@nocobase/app-plugin-demo-mode` find `demo-mode`.
 * @param {string | null} scope
 * @param {Record<string, unknown>} scopeMap
 * @returns {string | null}
 */
export function resolveScope(scope, scopeMap = scopes) {
  if (!scope) return null;
  for (const candidate of [
    scope,
    scope.replace(/^@nocobase\//u, ''),
    scope.replace(/^(?:@nocobase\/)?app-plugin-/u, ''),
  ]) {
    if (Object.hasOwn(scopeMap, candidate)) return candidate;
  }
  return null;
}

/**
 * The changelog cell of a language's row in a Markdown table, or `null` when the table has no such row.
 * @param {string[]} lines
 * @param {string} language `English` or `Chinese`
 * @returns {string | null}
 */
function tableCell(lines, language) {
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;
    const cells = trimmed.replace(/^\|/u, '').replace(/\|$/u, '').split('|');
    if (cells.length < 2) continue;
    const label = cells[0].replace(/[^\p{L}\s]/gu, '').trim();
    if (label.toLowerCase() !== language.toLowerCase()) continue;
    return cells.slice(1).join('|').trim();
  }
  return null;
}

/**
 * Parses a pull request against the v3 PR template.
 * @param {{ title: string, body: string | null | undefined }} pullRequest
 * @param {{ scopes?: Record<string, { en: string, zh: string }> }} [options] the scope map, `changelog-scopes.json` by
 *   default
 * @returns {{
 *   type: 'New feature' | 'Improvement' | 'Bug fix' | 'Others' | null,
 *   scope: string | null,
 *   changelog: { en: string, zh: string },
 *   errors: string[],
 *   warnings: string[],
 * }}
 */
export function parsePullRequest({ title, body }, options = {}) {
  const scopeMap = options.scopes ?? scopes;
  const errors = [];
  const warnings = [];
  const sections = splitSections(
    stripComments((body ?? '').replace(/\r\n?/gu, '\n')),
  );
  const find = (pattern) =>
    sections.find((section) => pattern.test(section.heading));

  let type = null;
  const typeSection = find(/^this is an?\b/iu);
  if (!typeSection) {
    errors.push(
      'The description has no "### This is a ..." section; start from the PR template.',
    );
  } else {
    const checked = [];
    for (const line of typeSection.lines) {
      const box = CHECKBOX.exec(line);
      if (box && box[1] !== ' ') checked.push(box[2]);
    }
    if (checked.length === 0) {
      errors.push(
        'No type is checked under "This is a ...": check exactly one of New feature, Improvement, Bug fix, Others.',
      );
    } else if (checked.length > 1) {
      errors.push(
        `${checked.length} types are checked under "This is a ..." (${checked.join(', ')}): check exactly one.`,
      );
    } else {
      type =
        TYPES.find((name) => name.toLowerCase() === checked[0].toLowerCase()) ??
        null;
      if (!type)
        errors.push(
          `"${checked[0]}" is not a type; check one of ${TYPES.join(', ')}.`,
        );
    }
  }

  const changelogSection = find(/^changelog\b/iu);
  const changelog = {
    en: changelogSection
      ? (tableCell(changelogSection.lines, 'English') ?? '')
      : '',
    zh: changelogSection
      ? (tableCell(changelogSection.lines, 'Chinese') ?? '')
      : '',
  };

  const { conventional, scope } = parseTitle(title);
  if (type && type !== 'Others') {
    if (!changelogSection)
      errors.push(
        'The description has no "### Changelog" section; start from the PR template.',
      );
    for (const [key, language] of [
      ['en', 'English'],
      ['zh', 'Chinese'],
    ]) {
      const text = changelog[key];
      if (!text)
        errors.push(
          `The ${language} changelog is empty: write one user-facing sentence, or check Others.`,
        );
      else if (PLACEHOLDER.test(text))
        errors.push(
          `The ${language} changelog "${text}" is a placeholder: write one user-facing sentence.`,
        );
    }
    if (!conventional) {
      warnings.push(
        'The title is not `type(scope): subject`; the entry is listed under General.',
      );
    } else if (!scope) {
      warnings.push(
        'The title has no scope; the entry is listed under General.',
      );
    } else if (!resolveScope(scope, scopeMap)) {
      const near = nearestScope(scope, scopeMap);
      warnings.push(
        `The scope "${scope}" is not in scripts/changelog-scopes.json, so the entry is listed under General. ${near ? `Did you mean "${near}"? ` : ''}Replace it with a scope from the list that covers the change; add a scope only when none does (.agents/rules/pull-requests-and-changesets.md).`,
      );
    }
  }

  return { type, scope, changelog, errors, warnings };
}

/**
 * The known scope closest to a misspelled one (`notifications` for `notificatons`), or null when none is within two
 * edits.
 * @param {string} scope
 * @param {Record<string, unknown>} scopeMap
 * @returns {string | null}
 */
export function nearestScope(scope, scopeMap = scopes) {
  let best = null;
  let bestDistance = 3;
  for (const known of Object.keys(scopeMap)) {
    const distance = editDistance(scope, known);
    if (distance < bestDistance) {
      best = known;
      bestDistance = distance;
    }
  }
  return best;
}

/** Levenshtein distance between two short strings. */
function editDistance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * The display name of a scope's module in each language, `General` / `通用` when the scope is missing or unknown.
 * @param {string | null} scope
 * @param {Record<string, { en: string, zh: string }>} [scopeMap]
 * @returns {{ en: string, zh: string }}
 */
export function moduleOf(scope, scopeMap = scopes) {
  const key = resolveScope(scope, scopeMap);
  if (key) return scopeMap[key];
  return { en: 'General', zh: '通用' };
}
