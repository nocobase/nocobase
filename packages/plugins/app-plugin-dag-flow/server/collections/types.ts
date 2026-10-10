import type { CollectionDefinitionBuilder } from '@nocobase/db';

import type { WorkflowCollectionName } from './names.js';

export interface WorkflowCollectionSchema {
  name: WorkflowCollectionName;
  define: (collection: CollectionDefinitionBuilder) => void;
}
