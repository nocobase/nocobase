import type { KnowledgeIndexingExtension } from '../../indexing/types.js';
import { sha256 } from '../../indexing/vector.js';
import { createSqliteVecBackend } from './backend.js';
import { parseSqliteConfig, parseSqliteSettings } from './config.js';

export const sqliteVecIndexingExtension: KnowledgeIndexingExtension = {
  type: 'sqlite-vec',
  contractVersion: 1,
  channels: [{ name: 'vector', kind: 'vector' }],
  parseConfig: parseSqliteConfig,
  parseSettings: parseSqliteSettings,
  resourceIdentity: (config) => sha256(JSON.stringify({ file: config.file })),
  create: createSqliteVecBackend,
};
