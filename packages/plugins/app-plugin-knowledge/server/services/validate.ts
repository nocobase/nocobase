/** Checking what people and agents send the knowledge base; each failure is a 400 with its own code. */
import {
  KNOWLEDGE_COMMENT_MAX,
  KNOWLEDGE_CONTENT_MAX,
  KNOWLEDGE_NOTE_MAX,
  KNOWLEDGE_REASON_MAX,
  KNOWLEDGE_SCOPE_PATTERN,
  KNOWLEDGE_SLUG_PATTERN,
  KNOWLEDGE_SUMMARY_MAX,
  KNOWLEDGE_TITLE_MAX,
  type SpaceRef,
} from '../../shared/knowledge.js';
import { invalid } from '../errors.js';

const MAX_SLUG = 64;

export function slugify(title: string): string {
  const slug = title
    .normalize('NFKD')
    .replace(/\p{M}+/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '')
    .slice(0, MAX_SLUG)
    .replace(/-+$/u, '');
  return slug || 'doc';
}

/** `base`, `base-2`, `base-3`… shortened to fit. */
export function slugCandidate(base: string, attempt: number): string {
  const suffix = attempt <= 1 ? '' : `-${attempt}`;
  return `${base.slice(0, MAX_SLUG - suffix.length)}${suffix}`;
}

export function title(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > KNOWLEDGE_TITLE_MAX)
    throw invalid(
      'INVALID_TITLE',
      `title is required (at most ${KNOWLEDGE_TITLE_MAX} characters).`,
      'title',
    );
  return text;
}

export function slug(value: unknown): string {
  if (typeof value !== 'string' || !KNOWLEDGE_SLUG_PATTERN.test(value))
    throw invalid(
      'INVALID_SLUG',
      'slug must be 1–64 lower-case letters, digits or hyphens, not starting with a hyphen.',
      'slug',
    );
  return value;
}

export function summary(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string' || value.length > KNOWLEDGE_SUMMARY_MAX)
    throw invalid(
      'INVALID_SUMMARY',
      `summary must be text of at most ${KNOWLEDGE_SUMMARY_MAX} characters.`,
      'summary',
    );
  return value.trim();
}

export function content(value: unknown): string {
  if (typeof value !== 'string' || value.length > KNOWLEDGE_CONTENT_MAX)
    throw invalid(
      'INVALID_CONTENT',
      `content must be Markdown of at most ${KNOWLEDGE_CONTENT_MAX} characters.`,
      'content',
    );
  return value.replace(/\r\n/gu, '\n');
}

export function note(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > KNOWLEDGE_NOTE_MAX)
    throw invalid(
      'INVALID_NOTE',
      `note must be text of at most ${KNOWLEDGE_NOTE_MAX} characters.`,
      'note',
    );
  return value.trim() || null;
}

export function reason(value: unknown): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > KNOWLEDGE_REASON_MAX)
    throw invalid(
      'INVALID_REASON',
      `reason is required: say why the knowledge should change (at most ${KNOWLEDGE_REASON_MAX} characters).`,
      'reason',
    );
  return text;
}

export function comment(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > KNOWLEDGE_COMMENT_MAX)
    throw invalid(
      'INVALID_COMMENT',
      `comment must be text of at most ${KNOWLEDGE_COMMENT_MAX} characters.`,
      'comment',
    );
  return value.trim() || null;
}

export function version(
  value: unknown,
  code = 'INVALID_VERSION',
  field = 'version',
): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed < 1)
    throw invalid(code, `${field} must be an integer of at least 1.`, field);
  return parsed;
}

/** A space a request names, in the application's normal form; 400 unless the application has it. */
export function space(
  value: { readonly scope?: unknown; readonly scopeId?: unknown },
  known: (space: SpaceRef) => SpaceRef | null,
): SpaceRef {
  const scope = value.scope;
  const scopeId =
    value.scopeId === undefined || value.scopeId === null
      ? ''
      : typeof value.scopeId === 'string'
        ? value.scopeId.trim()
        : null;
  const named =
    typeof scope === 'string' &&
    KNOWLEDGE_SCOPE_PATTERN.test(scope) &&
    scopeId !== null &&
    scopeId.length <= 64
      ? known({ scope, scopeId })
      : null;
  if (!named)
    throw invalid('INVALID_SCOPE', 'No such knowledge space.', 'scope');
  return named;
}

/** A plain object body, or 400. */
export function body(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw invalid('INVALID_BODY', 'The request body must be a JSON object.');
  return value as Record<string, unknown>;
}
