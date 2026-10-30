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

/** Observed Collections outside the known system catalog; their business ownership is not inferred. */
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
      metric('physicalForeignKeys', null),
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
      probe.definition(collection.name),
    );
    const relations = total(
      definitions.map((definition) =>
        definition === null
          ? null
          : (definition.fields ?? []).filter((field) =>
              RELATION_TYPES.has(field.type),
            ).length,
      ),
    );
    const physicalForeignKeySignatures = new Set<string>();
    let physicalForeignKeysComplete = true;
    let hasReadablePhysicalForeignKeyDefinition = false;
    definitions.forEach((definition, index) => {
      if (definition === null) {
        physicalForeignKeysComplete = false;
        return;
      }
      hasReadablePhysicalForeignKeyDefinition = true;
      const collection = own[index];
      for (const constraint of definition.constraints ?? []) {
        if (constraint.type !== 'foreignKey') continue;
        const columns = constraint.fields
          .map((field, fieldIndex) => [
            field,
            constraint.references.fields?.[fieldIndex] ?? null,
          ])
          .sort((left, right) => {
            const leftKey = JSON.stringify(left);
            const rightKey = JSON.stringify(right);
            return leftKey < rightKey ? -1 : leftKey > rightKey ? 1 : 0;
          });
        physicalForeignKeySignatures.add(
          JSON.stringify([
            collection.name,
            constraint.references.collection,
            columns,
          ]),
        );
      }
    });
    const fields = total(
      definitions.map((definition) =>
        definition === null
          ? null
          : (definition.fields ?? []).filter(
              (field) => !RELATION_TYPES.has(field.type),
            ).length,
      ),
    );
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
              ...(relations.complete &&
              relations.value !== null &&
              relations.value > 0
                ? [fact('relations', { count: relations.value })]
                : []),
            ],
      metrics: [
        metric('businessRecords', records.value, {
          complete: records.complete,
        }),
        metric('businessCollections', tables.length),
        metric('views', own.length - tables.length),
        metric('fields', fields.value, { complete: fields.complete }),
        metric('relations', relations.value, { complete: relations.complete }),
        metric(
          'physicalForeignKeys',
          hasReadablePhysicalForeignKeyDefinition
            ? physicalForeignKeySignatures.size
            : null,
          {
            complete: physicalForeignKeysComplete,
          },
        ),
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
  async collect({ probe, container, report }) {
    if (!probe) return NO_DATABASE;
    const hasDrive = container.has(driveManagerToken);
    const knownFiles: CollectionSummary[] = [];
    const candidates = await probe.map(
      applicationCollections(probe).filter(
        (collection) => collection.kind === 'table',
      ),
      async (collection) => {
        const names = await probe.fieldNames(collection.name);
        if (names === null) return null;
        if (!FILE_COLUMNS.every((column) => names.includes(column)))
          return undefined;
        knownFiles.push(collection);
        report?.({
          status: hasDrive ? 'active' : 'needsSetup',
          ...(hasDrive ? {} : { reason: 'noDrive' }),
          facts: [
            fact('fileCollectionsPartial', {
              count: knownFiles.length,
              names: knownFiles
                .slice(0, 5)
                .map((item) => item.title ?? item.name),
            }),
          ],
          metrics: [
            metric('fileCollections', knownFiles.length, { complete: false }),
            metric('files', null),
            metric('storedBytes', null, { unit: 'bytes' }),
          ],
        });
        return collection;
      },
    );
    const discoveryComplete = candidates.every((item) => item !== null);
    const fileCollections = candidates.filter(
      (collection): collection is CollectionSummary => collection != null,
    );
    if (fileCollections.length === 0)
      return {
        status: discoveryComplete ? 'unused' : null,
        ...(discoveryComplete ? { reason: 'noFileCollection' } : {}),
        metrics: [
          metric('files', discoveryComplete ? 0 : null),
          metric('storedBytes', discoveryComplete ? 0 : null, {
            unit: 'bytes',
          }),
          metric('fileCollections', discoveryComplete ? 0 : null),
        ],
      };
    report?.({
      status: hasDrive ? 'active' : 'needsSetup',
      ...(hasDrive ? {} : { reason: 'noDrive' }),
      facts: [
        fact(discoveryComplete ? 'fileCollections' : 'fileCollectionsPartial', {
          count: fileCollections.length,
          names: fileCollections
            .slice(0, 5)
            .map((item) => item.title ?? item.name),
        }),
      ],
      metrics: [
        metric('fileCollections', fileCollections.length, {
          complete: discoveryComplete,
        }),
      ],
    });
    let countedFiles: number | null = null;
    const counts = total(
      await probe.map(fileCollections, async (collection) => {
        const count = await probe.count(collection.name);
        if (count !== null) countedFiles = (countedFiles ?? 0) + count;
        report?.({
          status: null,
          metrics: [metric('files', countedFiles, { complete: false })],
        });
        return count;
      }),
    );
    report?.({
      status: null,
      metrics: [
        metric('files', counts.value, {
          complete: discoveryComplete && counts.complete,
        }),
      ],
    });
    let countedBytes: number | null = null;
    const bytes = total(
      await probe.map(fileCollections, async (collection) => {
        const bytes = await probe.sum(collection.name, 'size');
        if (bytes !== null) countedBytes = (countedBytes ?? 0) + bytes;
        report?.({
          status: null,
          metrics: [
            metric('storedBytes', countedBytes, {
              unit: 'bytes',
              complete: false,
            }),
          ],
        });
        return bytes;
      }),
    );
    return {
      status: hasDrive ? 'active' : 'needsSetup',
      ...(hasDrive ? {} : { reason: 'noDrive' }),
      facts: [
        fact(discoveryComplete ? 'fileCollections' : 'fileCollectionsPartial', {
          count: fileCollections.length,
          names: fileCollections
            .slice(0, 5)
            .map((collection) => collection.title ?? collection.name),
        }),
      ],
      metrics: [
        metric('files', counts.value, {
          complete: discoveryComplete && counts.complete,
        }),
        metric('storedBytes', bytes.value, {
          unit: 'bytes',
          complete: discoveryComplete && bytes.complete,
        }),
        metric('fileCollections', fileCollections.length, {
          complete: discoveryComplete,
        }),
      ],
    };
  },
};
