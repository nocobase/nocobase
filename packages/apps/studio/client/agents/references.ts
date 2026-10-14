/**
 * The issues, projects and knowledge documents an agent's message mentions, found for the cards
 * under its replies: issue keys (`PM-12`) and in-app links (`/issues/PM-12`,
 * `/projects/<id>`, a knowledge document's `?doc=<id>`), in order of first mention, each once, at most
 * `MAX_REFERENCES`. Code spans and fenced blocks are skipped.
 */
export type ChatReference =
  | { readonly type: 'issue'; readonly key: string; readonly value: string }
  | { readonly type: 'project'; readonly key: string; readonly value: string }
  | {
      readonly type: 'knowledgeDoc';
      readonly key: string;
      readonly value: string;
    };

export const MAX_REFERENCES = 5;

const IDENTIFIER = /(?<![\w/-])([A-Z][A-Z0-9]{1,9}-\d{1,7})(?![\w-])/gu;
const LINK =
  /(?:^|[\s(<"'[])(?:https?:\/\/[^\s/]+)?(?:\/[\w-]+)*\/(issues|projects)\/([\w-]+)(?=[\s)>"'#?\]]|$)/gmu;
const DOC = /[?&]doc=([\w-]+)/gu;
/** Pages under `/issues` and `/projects` that are not a record. */
const OWN_PAGES: ReadonlySet<string> = new Set(['new', 'intake', 'plans']);

export function referencesIn(content: string): ChatReference[] {
  const text = content
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/`[^`]*`/gu, ' ');
  const found: { index: number; reference: ChatReference }[] = [];
  for (const match of text.matchAll(LINK)) {
    const value = match[2];
    if (!value || OWN_PAGES.has(value)) continue;
    const type = match[1] === 'issues' ? 'issue' : 'project';
    found.push({
      index: match.index,
      reference: { type, key: `${type}:${value}`, value },
    });
  }
  for (const match of text.matchAll(DOC)) {
    const value = match[1];
    if (!value) continue;
    found.push({
      index: match.index,
      reference: {
        type: 'knowledgeDoc',
        key: `knowledgeDoc:${value}`,
        value,
      },
    });
  }
  for (const match of text.matchAll(IDENTIFIER)) {
    const value = match[1];
    if (!value) continue;
    found.push({
      index: match.index,
      reference: { type: 'issue', key: `issue:${value}`, value },
    });
  }
  const seen = new Set<string>();
  const references: ChatReference[] = [];
  for (const { reference } of found.sort((a, b) => a.index - b.index)) {
    if (seen.has(reference.key)) continue;
    seen.add(reference.key);
    references.push(reference);
    if (references.length >= MAX_REFERENCES) break;
  }
  return references;
}
