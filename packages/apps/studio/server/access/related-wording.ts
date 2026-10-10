/**
 * Studio's wording of the `related` level where Studio, not the plugin, decides what an action's records relate to:
 * knowledge spaces (`../knowledge/access.ts`) and Apps, which Studio also relates through project links and issue
 * previews (`../releases/links.ts`, `../previews/access.ts`). It replaces the plugin's own wording in the catalog
 * (`catalog.ts`); every other action keeps what its plugin registered.
 */
import { STUDIO_NAMESPACE, type CatalogText } from '../../shared/access.js';

export interface RelatedWording {
  readonly label: CatalogText;
  readonly description: CatalogText;
}

// i18n: roles.related.knowledgeSeen, roles.related.knowledgeSeenHint, roles.related.knowledgeLed,
// i18n: roles.related.knowledgeLedHint, roles.related.appsSeen, roles.related.appsSeenHint, roles.related.appsLed,
// i18n: roles.related.appsLedHint
const wording = (name: string): RelatedWording => ({
  label: { key: `roles.related.${name}`, ns: STUDIO_NAMESPACE },
  description: { key: `roles.related.${name}Hint`, ns: STUDIO_NAMESPACE },
});

const KNOWLEDGE_SEEN = wording('knowledgeSeen');
const KNOWLEDGE_LED = wording('knowledgeLed');
const APPS_SEEN = wording('appsSeen');
const APPS_LED = wording('appsLed');

/** By business action key (`kb.knowledge/read`). */
export const RELATED_WORDING: Readonly<Record<string, RelatedWording>> = {
  'kb.knowledge/read': KNOWLEDGE_SEEN,
  'kb.knowledge/propose': KNOWLEDGE_SEEN,
  'kb.knowledge/edit': KNOWLEDGE_LED,
  'kb.knowledge/manage': KNOWLEDGE_LED,
  'rel.apps/view': APPS_SEEN,
  'rel.apps/read-logs': APPS_SEEN,
  'rel.apps/configure': APPS_LED,
  'rel.apps/upload': APPS_LED,
  'rel.apps/deploy': APPS_LED,
  'rel.apps/deploy-protected': APPS_LED,
  'rel.apps/operate': APPS_LED,
  'rel.apps/delete': APPS_LED,
};
