import { KnowledgeIndexingSettings } from '@nocobase/app-plugin-knowledge/client/pages';
import type { ReactElement } from 'react';

/** Global settings use the settings item's permission, independently of space membership. */
export default function KnowledgeIndexingPage(): ReactElement {
  return <KnowledgeIndexingSettings />;
}
