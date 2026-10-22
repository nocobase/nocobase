import { driveManagerToken } from '@nocobase/app-server/drive';

import { systemCollectionOwner } from '../catalog.js';
import { total, type CollectionSummary, type Probe } from '../inventory.js';
import {
  fact,
  metric,
  NO_DATABASE,
  type CapabilityCollector,
  type CapabilityFindings,
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

/** Catalog facts remain usable when a costly schema or record scan exceeds its deadline. */
export function dataModelingSummary(probe: Probe): CapabilityFindings {
  const own = applicationCollections(probe);
  const tables = own.filter((item) => item.kind === 'table');
  return {
    status: 'active',
    facts: own.length
      ? [
          fact(
            own.length > 5
              ? 'applicationCollectionsPreview'
              : 'applicationCollections',
            {
              count: own.length,
              names: own.slice(0, 5).map((item) => item.title ?? item.name),
            },
          ),
        ]
      : [fact('noApplicationCollections')],
    metrics: [
      metric('businessRecords', null),
      metric('businessCollections', tables.length),
      metric('views', own.length - tables.length),
      metric('fields', null),
      metric('relations', null),
      metric(
        'systemCollections',
        probe.inventory.collections.length - own.length,
      ),
    ],
  };
}

export const dataModeling: CapabilityCollector = {
  key: 'dataModeling',
  packages: [
    '@nocobase/db',
    '@nocobase/repository-input',
    '@nocobase/snowflake',
  ],
  async collect({ probe, countRecords }) {
    if (!probe) return NO_DATABASE;
    const own = applicationCollections(probe);
    // A view reads rows another Collection already holds, so only tables count towards the records.
    const tables = own.filter((collection) => collection.kind === 'table');
    const records = countRecords
      ? total(
          await probe.map(tables, (collection) => probe.count(collection.name)),
        )
      : {
          value: tables.length === 0 ? 0 : null,
          complete: tables.length === 0,
        };
    const definitions = await probe.map(own, (collection) =>
      probe.inventory.definition(collection.name, probe.signal),
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
              fact(
                own.length > 5
                  ? 'applicationCollectionsPreview'
                  : 'applicationCollections',
                {
                  count: own.length,
                  names: own
                    .slice(0, 5)
                    .map((collection) => collection.title ?? collection.name),
                },
              ),
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
    const candidates = await probe.map(
      applicationCollections(probe).filter(
        (collection) => collection.kind === 'table',
      ),
      async (collection) => {
        const names = await probe.fieldNames(collection.name);
        return names !== null &&
          FILE_COLUMNS.every((column) => names.includes(column))
          ? collection
          : undefined;
      },
    );
    const fileCollections = candidates.filter(
      (collection): collection is CollectionSummary => collection !== undefined,
    );
    if (fileCollections.length === 0)
      return { status: 'unused', reason: 'noFileCollection' };
    const counts = total(
      await probe.map(fileCollections, (collection) =>
        probe.count(collection.name),
      ),
    );
    const bytes = total(
      await probe.map(fileCollections, (collection) =>
        probe.sum(collection.name, 'size'),
      ),
    );
    const hasDrive = container.has(driveManagerToken);
    return {
      status: hasDrive ? 'active' : 'needsSetup',
      ...(hasDrive ? {} : { reason: 'noDrive' }),
      facts: [
        fact('fileCollections', {
          count: fileCollections.length,
          names: fileCollections
            .slice(0, 5)
            .map((collection) => collection.title ?? collection.name),
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
