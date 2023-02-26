import lodash from 'lodash';
import { Restorer } from './restorer';

interface CollectionGroup {
  namespace: string;
  collections: string[];
  function: string;

  dumpable: 'required' | 'optional' | 'skip';
  delayRestore?: any;
}

export class CollectionGroupManager {
  static collectionGroups: CollectionGroup[] = [];

  static registerCollectionGroup(collectionGroup: CollectionGroup) {
    this.collectionGroups.push(collectionGroup);
  }

  static getGroupsCollections(groups: string[] | CollectionGroup[]) {
    if (groups.length == 0) {
      return [];
    }

    if (lodash.isPlainObject(groups[0])) {
      groups = (groups as CollectionGroup[]).map(
        (collectionGroup) => `${collectionGroup.namespace}.${collectionGroup.function}`,
      );
    }

    return this.collectionGroups
      .filter((collectionGroup) => {
        const groupKey = `${collectionGroup.namespace}.${collectionGroup.function}`;
        return (groups as string[]).includes(groupKey);
      })
      .map((collectionGroup) => collectionGroup.collections)
      .flat();
  }

  static classifyCollectionGroups(collectionGroups: CollectionGroup[]) {
    const requiredGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'required');
    const optionalGroups = collectionGroups.filter((collectionGroup) => collectionGroup.dumpable === 'optional');

    return {
      requiredGroups,
      optionalGroups,
    };
  }

  static getDelayRestoreCollectionGroups() {
    return this.collectionGroups.filter((collectionGroup) => collectionGroup.delayRestore);
  }
}

CollectionGroupManager.registerCollectionGroup({
  namespace: 'core',
  function: 'migration',
  collections: ['migrations'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'multi-app-manager',
  function: 'multi apps',
  collections: ['applications'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'collection-manager',
  function: 'collections',
  collections: ['collections', 'fields', 'collectionCategories', 'collectionCategory'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'ui-schema-storage',
  function: 'uiSchemas',
  collections: ['uiSchemas', 'uiSchemaServerHooks', 'uiSchemaTemplates', 'uiSchemaTreePath'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'ui-routes-storage',
  function: 'uiRoutes',
  collections: ['uiRoutes'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'acl',
  function: 'acl',
  collections: ['roles', 'rolesResources', 'rolesResourcesActions', 'rolesResourcesScopes', 'rolesUischemas'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'workflow',
  function: 'workflowConfig',
  collections: ['workflows', 'flow_nodes'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'snapshot-field',
  function: 'snapshot-field',
  collections: ['collectionsHistory', 'fieldsHistory'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'workflow',
  function: 'executionLogs',
  collections: ['executions', 'jobs'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'sequence-field',
  function: 'sequences',
  collections: ['sequences'],
  dumpable: 'required',
  async delayRestore(restorer: Restorer) {
    const app = restorer.app;
    const importedCollections = restorer.importedCollections;

    const sequenceFields = importedCollections
      .map((collection) =>
        [...app.db.getCollection(collection).fields.values()].filter((field) => field.type === 'sequence'),
      )
      .flat()
      .filter(Boolean);

    // a single sequence field refers to a single row in sequences table
    const sequencesAttributes = sequenceFields
      .map((field) => {
        const patterns = field.get('patterns').filter((pattern) => pattern.type === 'integer');

        return patterns.map((pattern) => {
          return {
            collection: field.collection.name,
            field: field.name,
            key: pattern.options.key,
          };
        });
      })
      .flat();

    if (sequencesAttributes.length > 0) {
      await app.db.getRepository('sequences').destroy({
        filter: {
          $or: sequencesAttributes,
        },
      });
    }

    await restorer.importCollection({
      name: 'sequences',
      clear: false,
      rowCondition(row) {
        const results = sequencesAttributes.some((attributes) => {
          return (
            row.collection === attributes.collection && row.field === attributes.field && row.key === attributes.key
          );
        });

        return results;
      },
    });
  },
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'users',
  function: 'users',
  collections: ['users', 'rolesUsers'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'file-manager',
  function: 'storageSetting',
  collections: ['storages'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'file-manager',
  function: 'attachmentRecords',
  collections: ['attachments'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'system-settings',
  function: 'systemSettings',
  collections: ['systemSettings'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'verification',
  function: 'verificationProviders',
  collections: ['verifications_providers'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'verification',
  function: 'verificationData',
  collections: ['verifications'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'oidc',
  function: 'oidcProviders',
  collections: ['oidcProviders'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'saml',
  function: 'samlProviders',
  collections: ['samlProviders'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'map',
  function: 'mapConfiguration',
  collections: ['mapConfiguration'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'audit-logs',
  function: 'auditLogs',
  collections: ['auditLogs', 'auditChanges'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'graph-collection-manager',
  function: 'graphCollectionPositions',
  collections: ['graphPositions'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  namespace: 'iframe-block',
  function: 'iframe html storage',
  collections: ['iframeHtml'],
  dumpable: 'required',
});
