/**
 * `SKILL.md` as the Agent Skills specification (https://agentskills.io/specification) defines it: YAML front matter
 * with a required `name` (the skill's directory) and `description`, optional `license`, `compatibility`, `metadata`
 * and `allowed-tools`, then the Markdown body. The browser checks it as it is typed and the server before every save
 * and import, with the same rules and the same field-level reasons. Keys the specification does not name are kept.
 */
import { parseDocument, stringify } from 'yaml';

export const SKILL_NAME_MAX: number = 64;
export const SKILL_DESCRIPTION_MAX: number = 1024;
export const SKILL_COMPATIBILITY_MAX: number = 500;

/** Lower-case letters and digits in words joined by single hyphens. */
const NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const FRONT_MATTER =
  /^\uFEFF?---[ \t]*\r?\n(?:([\s\S]*?)\r?\n)?---[ \t]*(?:\r?\n|$)/u;

export type SkillFrontMatterField =
  | 'frontMatter'
  | 'name'
  | 'description'
  | 'license'
  | 'compatibility'
  | 'metadata'
  | 'allowed-tools';

/**
 * - `missing`: no front matter; `yaml`: it is not valid YAML; `notMapping`: it is not a mapping of keys.
 * - `required`, `empty`, `type`, `tooLong`: a value is absent, blank, not of its type, or over its length.
 * - `pattern`: a name other than lower-case words joined by single hyphens.
 * - `mismatch`: a name other than the folder an archive holds the skill in; `taken`: another skill's name.
 */
export type SkillFrontMatterReason =
  | 'missing'
  | 'yaml'
  | 'notMapping'
  | 'required'
  | 'empty'
  | 'type'
  | 'tooLong'
  | 'pattern'
  | 'mismatch'
  | 'taken';

export interface SkillFrontMatterProblem {
  readonly field: SkillFrontMatterField;
  readonly reason: SkillFrontMatterReason;
  /** In English, for the API and the logs; the browser words it from `field` and `reason`. */
  readonly message: string;
  /** The longest value allowed, for `tooLong`. */
  readonly max?: number;
}

export interface SkillFrontMatter {
  readonly name: string;
  readonly description: string;
  readonly license?: string;
  /** What the skill needs of its environment, such as a product or network access. */
  readonly compatibility?: string;
  readonly metadata?: Readonly<Record<string, string>>;
  /** `allowed-tools`: space-separated tools the skill may use. */
  readonly allowedTools?: string;
}

export interface ParsedSkillMarkdown {
  /** The valid values found; `name` and `description` only when they are valid. */
  readonly frontMatter: Partial<SkillFrontMatter>;
  /** What follows the front matter (the whole text when there is none). */
  readonly body: string;
  readonly problems: readonly SkillFrontMatterProblem[];
}

function problem(
  field: SkillFrontMatterField,
  reason: SkillFrontMatterReason,
  message: string,
  max?: number,
): SkillFrontMatterProblem {
  return { field, reason, message, ...(max === undefined ? {} : { max }) };
}

/** Why `name` cannot name a skill, or null. */
export function skillNameProblem(
  name: unknown,
): SkillFrontMatterProblem | null {
  if (name === undefined || name === null)
    return problem('name', 'required', 'Give the skill a `name`.');
  if (typeof name !== 'string')
    return problem('name', 'type', '`name` must be a string.');
  if (name === '')
    return problem('name', 'required', 'Give the skill a `name`.');
  if (name.length > SKILL_NAME_MAX)
    return problem(
      'name',
      'tooLong',
      `\`name\` is at most ${SKILL_NAME_MAX} characters.`,
      SKILL_NAME_MAX,
    );
  if (!NAME.test(name))
    return problem(
      'name',
      'pattern',
      '`name` uses lower-case letters, digits and single hyphens, and does not start or end with a hyphen.',
    );
  return null;
}

function optionalText(
  field: 'license' | 'compatibility' | 'allowed-tools',
  value: unknown,
  max?: number,
): SkillFrontMatterProblem | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string')
    return problem(field, 'type', `\`${field}\` must be a string.`);
  if (!value.trim())
    return problem(field, 'empty', `\`${field}\` must not be empty.`);
  if (max !== undefined && value.length > max)
    return problem(
      field,
      'tooLong',
      `\`${field}\` is at most ${max} characters.`,
      max,
    );
  return null;
}

/** Splits `SKILL.md` into its front matter and body and checks the front matter against the specification. */
export function parseSkillMarkdown(markdown: string): ParsedSkillMarkdown {
  const match = FRONT_MATTER.exec(markdown);
  if (!match)
    return {
      frontMatter: {},
      body: markdown,
      problems: [
        problem(
          'frontMatter',
          'missing',
          'SKILL.md starts with YAML front matter between `---` lines, holding at least `name` and `description`.',
        ),
      ],
    };
  const body = markdown.slice(match[0].length);
  const document = parseDocument(match[1] ?? '', { uniqueKeys: true });
  if (document.errors.length > 0)
    return {
      frontMatter: {},
      body,
      problems: [
        problem(
          'frontMatter',
          'yaml',
          `The front matter is not valid YAML: ${document.errors[0]?.message.split('\n')[0] ?? ''}`,
        ),
      ],
    };
  const data: unknown = document.toJS() ?? {};
  if (data === null || typeof data !== 'object' || Array.isArray(data))
    return {
      frontMatter: {},
      body,
      problems: [
        problem(
          'frontMatter',
          'notMapping',
          'The front matter is a mapping of keys, such as `name: my-skill`.',
        ),
      ],
    };
  const values = data as Record<string, unknown>;
  const problems: SkillFrontMatterProblem[] = [];
  const found: {
    -readonly [K in keyof SkillFrontMatter]?: SkillFrontMatter[K];
  } = {};

  const nameProblem = skillNameProblem(values.name);
  if (nameProblem) problems.push(nameProblem);
  else found.name = values.name as string;

  const description = values.description;
  if (description === undefined || description === null)
    problems.push(
      problem(
        'description',
        'required',
        'Give the skill a `description`: what it does and when to use it.',
      ),
    );
  else if (typeof description !== 'string')
    problems.push(
      problem('description', 'type', '`description` must be a string.'),
    );
  else if (!description.trim())
    problems.push(
      problem(
        'description',
        'required',
        'Give the skill a `description`: what it does and when to use it.',
      ),
    );
  else if (description.length > SKILL_DESCRIPTION_MAX)
    problems.push(
      problem(
        'description',
        'tooLong',
        `\`description\` is at most ${SKILL_DESCRIPTION_MAX} characters.`,
        SKILL_DESCRIPTION_MAX,
      ),
    );
  else found.description = description.trim();

  const license = optionalText('license', values.license);
  if (license) problems.push(license);
  else if (typeof values.license === 'string') found.license = values.license;

  const compatibility = optionalText(
    'compatibility',
    values.compatibility,
    SKILL_COMPATIBILITY_MAX,
  );
  if (compatibility) problems.push(compatibility);
  else if (typeof values.compatibility === 'string')
    found.compatibility = values.compatibility.trim();

  const tools = optionalText('allowed-tools', values['allowed-tools']);
  if (tools) problems.push(tools);
  else if (typeof values['allowed-tools'] === 'string')
    found.allowedTools = values['allowed-tools'];

  const metadata = values.metadata;
  if (metadata !== undefined && metadata !== null) {
    if (
      typeof metadata !== 'object' ||
      Array.isArray(metadata) ||
      Object.values(metadata).some((value) => typeof value !== 'string')
    )
      problems.push(
        problem(
          'metadata',
          'type',
          '`metadata` is a mapping of keys to string values.',
        ),
      );
    else found.metadata = metadata as Record<string, string>;
  }
  return { frontMatter: found, body, problems };
}

/** `SKILL.md` of front matter (keys in the order given, undefined ones left out) and a body. */
export function composeSkillMarkdown(
  frontMatter: Readonly<Record<string, unknown>>,
  body: string,
): string {
  const values = Object.fromEntries(
    Object.entries(frontMatter).filter(([, value]) => value !== undefined),
  );
  const yaml = stringify(values, { lineWidth: 0 }).trimEnd();
  return `---\n${yaml}\n---\n\n${body.replace(/^\s+/u, '')}`;
}

/** The first problem of each field, for showing beside what it concerns. */
export function problemsByField(
  problems: readonly SkillFrontMatterProblem[],
): ReadonlyMap<SkillFrontMatterField, SkillFrontMatterProblem> {
  const result = new Map<SkillFrontMatterField, SkillFrontMatterProblem>();
  for (const item of problems)
    if (!result.has(item.field)) result.set(item.field, item);
  return result;
}
