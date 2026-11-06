// @vitest-environment node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { expect, it } from 'vitest';
import * as configuration from '../config.js';
import * as server from '../server/index.js';
import * as indexing from '../server/indexing/index.js';
import * as forms from '../client/indexing/index.js';
import * as clientApi from '../client/api.js';
import * as pages from '../client/pages.js';
import metadata from '../package.json' with { type: 'json' };

const publicNames = {
  './client/api': [
    'KnowledgeIndexingApi',
    'knowledgeIndexingKeys',
    'useKnowledgeIndexingSettings',
    'useKnowledgeIndexingStatus',
    'useKnowledgeIndexingInstances',
    'useKnowledgeEmbeddingModels',
  ],
  './client/pages': [
    'KnowledgeIndexingDialog',
    'KnowledgeIndexingSettings',
    'KnowledgeIndexingEntry',
  ],
  './config': ['defineKnowledgeConfig'],
  './server': ['createKnowledgePlugin', 'registerSettings'],
  './server/indexing': [
    'createKnowledgeIndexing',
    'createKnowledgeIndexingRegistry',
    'KnowledgeIndexingValidationError',
    'pgvectorIndexingExtension',
    'sqliteVecIndexingExtension',
  ],
  './client/indexing': [
    'knowledgeIndexingFormsToken',
    'createIndexingFormRegistry',
    'useIndexingForms',
    'registerBuiltinIndexingForms',
  ],
};
it('exports indexing factories from source without constructing connections or loading native storage', () => {
  for (const [key, module] of Object.entries({
    './client/api': clientApi,
    './client/pages': pages,
    './config': configuration,
    './server': server,
    './server/indexing': indexing,
    './client/indexing': forms,
  })) {
    for (const name of publicNames[key as keyof typeof publicNames])
      expect(module).toHaveProperty(name);
  }
  expect(server).toHaveProperty('createKnowledgeIndexing');
  expect(metadata.exports).toHaveProperty('./shared/indexing');
});
const root = process.env.KNOWLEDGE_TEST_PACKAGE_ROOT;
it.skipIf(!root)(
  'loads the actual packed public JS and ships declarations at every indexing entry',
  async () => {
    const directory = root!;
    const packed = JSON.parse(
      readFileSync(path.join(directory, 'package.json'), 'utf8'),
    );
    expect(packed.version).toBe(metadata.version);
    for (const file of ['README.md', 'database/README.md', 'docs/indexing.md'])
      expect(existsSync(path.join(directory, file))).toBe(true);
    const migration = '202610210010_kb_create_indexing';
    const manifest = JSON.parse(
      readFileSync(
        path.join(directory, 'dist/database/migrations/.manifest.json'),
        'utf8',
      ),
    );
    const artifact = readFileSync(
      path.join(directory, `dist/database/migrations/${migration}.js`),
    );
    const source = readFileSync(
      new URL(`../database/migrations/${migration}.ts`, import.meta.url),
    );
    expect(manifest.files[migration + '.js']).toEqual({
      sourceChecksum: createHash('sha256').update(source).digest('hex'),
      artifactChecksum: createHash('sha256').update(artifact).digest('hex'),
    });
    for (const [entry, names] of Object.entries(publicNames)) {
      const exported = packed.exports[entry];
      expect(exported.import).toMatch(/^\.\/dist\//);
      expect(existsSync(path.join(directory, exported.types))).toBe(true);
      const module = await import(
        pathToFileURL(path.join(directory, exported.import)).href
      );
      for (const name of names) expect(module).toHaveProperty(name);
    }
    for (const entry of ['./server/tokens', './shared/indexing']) {
      const exported = packed.exports[entry];
      expect(existsSync(path.join(directory, exported.types))).toBe(true);
      await import(pathToFileURL(path.join(directory, exported.import)).href);
    }
  },
);
