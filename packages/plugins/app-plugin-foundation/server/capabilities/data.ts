import { driveManagerToken } from '@nocobase/app-server/drive';

import { systemCollectionOwner } from '../catalog.js';
import { total, type CollectionSummary, type Probe } from '../inventory.js';
import {
  fact,
  metric,
  NO_DATABASE,
  type CapabilityCollector,
} from './types.js';

const RELATION_TYPES = new Set([
  'belongsTo',
  'hasOne',
  'hasMany',
  'belongsToMany',
]);

/** The Collections that hold the application's own data rather than a NocoBase package's. */
export function applicationCollections(
  probe: Probe,
): readonly CollectionSummary[] {
  return probe.inventory.collections.filter(
    (collection) => systemCollectionOwner(collection.name) === undefined,
  );
}

export const dataModeling: CapabilityCollector = {
  key: 'dataModeling',
  packages: [
    '@nocobase/db',
    '@nocobase/repository-input',
    '@nocobase/snowflake',
  ],
  async collect({ probe }) {
    if (!probe) return NO_DATABASE;
    const own = applicationCollections(probe);
    // A view reads rows another Collection already holds, so only tables count towards the records.
    const tables = own.filter((collection) => collection.kind === 'table');
    const records = total(
      await Promise.all(
        tables.map((collection) => probe.count(collection.name)),
      ),
    );
    const definitions = await Promise.all(
      own.map((collection) => probe.inventory.definition(collection.name)),
    );
    const fields = definitions.flatMap(
      (definition) => definition?.fields ?? [],
    );
    const relations = fields.filter((field) => RELATION_TYPES.has(field.type));
    return {
      status: 'active',
      facts:
        own.length === 0
          ? [fact('noApplicationCollections')]
          : [
              fact('applicationCollections', {
                count: own.length,
                names: own.map(
                  (collection) => collection.title ?? collection.name,
                ),
              }),
              ...(relations.length > 0
                ? [fact('relations', { count: relations.length })]
                : []),
            ],
      metrics: [
        metric('businessRecords', records.value, {
          complete: records.complete,
        }),
        metric('businessCollections', tables.length),
        metric('views', own.length - tables.length),
        metric('fields', fields.length - relations.length),
        metric('relations', relations.length),
        metric(
          'systemCollections',
          probe.inventory.collections.length - own.length,
        ),
      ],
    };
  },
};

/** The columns the file plugin requires of a file Collection (`FILE_COLUMNS` in `@nocobase/app-plugin-file`). */
const FILE_COLUMNS = [
  'disk',
  'key',
  'filename',
  'ext',
  'mimeType',
  'size',
] as const;

export const files: CapabilityCollector = {
  key: 'files',
  packages: ['@nocobase/app-plugin-file', '@nocobase/drive'],
  async collect({ probe, container }) {
    if (!probe) return NO_DATABASE;
    const candidates = await Promise.all(
      applicationCollections(probe)
        .filter((collection) => collection.kind === 'table')
        .map(async (collection) => {
          const names = await probe.fieldNames(collection.name);
          return names !== null &&
            FILE_COLUMNS.every((column) => names.includes(column))
            ? collection
            : undefined;
        }),
    );
    const fileCollections = candidates.filter(
      (collection): collection is CollectionSummary => collection !== undefined,
    );
    if (fileCollections.length === 0)
      return { status: 'unused', reason: 'noFileCollection' };
    const counts = total(
      await Promise.all(
        fileCollections.map((collection) => probe.count(collection.name)),
      ),
    );
    const bytes = total(
      await Promise.all(
        fileCollections.map((collection) => probe.sum(collection.name, 'size')),
      ),
    );
    const hasDrive = container.has(driveManagerToken);
    return {
      status: hasDrive ? 'active' : 'needsSetup',
      ...(hasDrive ? {} : { reason: 'noDrive' }),
      facts: [
        fact('fileCollections', {
          count: fileCollections.length,
          names: fileCollections.map(
            (collection) => collection.title ?? collection.name,
          ),
        }),
      ],
      metrics: [
        metric('files', counts.value, { complete: counts.complete }),
        metric('storedBytes', bytes.value, {
          unit: 'bytes',
          complete: bytes.complete,
        }),
        metric('fileCollections', fileCollections.length),
      ],
    };
  },
};
