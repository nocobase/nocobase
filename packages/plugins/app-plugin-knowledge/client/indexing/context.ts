import { useService } from '@nocobase/app-client';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
import type { IndexingFormRegistry } from './types.js';

export const knowledgeIndexingFormsToken: ServiceToken<IndexingFormRegistry> =
  createServiceToken<IndexingFormRegistry>(
    '@nocobase/app-plugin-knowledge/indexing-forms',
  );
export function useIndexingForms(): IndexingFormRegistry {
  return useService(knowledgeIndexingFormsToken);
}
