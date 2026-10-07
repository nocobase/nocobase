/** Text an application words for the view: plain, or a key in its own namespace. */
import type { KnowledgeText } from '../../shared/knowledge.js';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Plain text as it is, or an application's key translated in its namespace. */
export function textOf(t: Translate, text: KnowledgeText): string {
  return typeof text === 'string'
    ? text
    : t(text.key, { ns: text.ns, defaultValue: text.key });
}
