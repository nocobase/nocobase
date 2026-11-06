import type { KnowledgeIndexingExtension } from '../../indexing/types.js';
import { createPgvectorBackend } from './backend.js';
import {
  parsePgConfig,
  parsePgSettings,
  pgResourceIdentity,
} from './config.js';
export const pgvectorIndexingExtension: KnowledgeIndexingExtension = {
  type: 'pgvector',
  contractVersion: 1,
  channels: [{ name: 'vector', kind: 'vector' }],
  parseConfig: parsePgConfig,
  parseSettings: parsePgSettings,
  resourceIdentity: pgResourceIdentity,
  create: createPgvectorBackend,
};
