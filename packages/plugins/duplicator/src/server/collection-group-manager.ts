import lodash from 'lodash';

interface CollectionGroup {
  pluginName: string;
  collections: string[];
  function: string;

  dumpable: 'required' | 'optional' | 'skip';
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
        (collectionGroup) => `${collectionGroup.pluginName}.${collectionGroup.function}`,
      );
    }

    return this.collectionGroups
      .filter((collectionGroup) => {
        const groupKey = `${collectionGroup.pluginName}.${collectionGroup.function}`;
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
}

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'collection-manager',
  function: 'collections',
  collections: ['collections', 'fields'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'ui-schema-storage',
  function: 'uiSchemas',
  collections: ['uiSchemas', 'uiSchemaServerHooks', 'uiSchemaTemplates', 'uiSchemaTreePath'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'ui-routes-storage',
  function: 'uiRoutes',
  collections: ['uiRoutes'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'acl',
  function: 'acl',
  collections: ['roles', 'rolesResources', 'rolesResourcesActions', 'rolesResourcesScopes'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'workflow',
  function: 'workflowConfig',
  collections: ['workflows', 'flow_nodes'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'workflow',
  function: 'executionLogs',
  collections: ['executions', 'jobs'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'sequence-field',
  function: 'sequences',
  collections: ['sequences'],
  dumpable: 'required',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'users',
  function: 'users',
  collections: ['users', 'rolesUsers'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'file-manager',
  function: 'storageSetting',
  collections: ['storages'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'file-manager',
  function: 'attachmentRecords',
  collections: ['attachments'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'system-settings',
  function: 'systemSettings',
  collections: ['systemSettings'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'verification',
  function: 'verificationProviders',
  collections: ['verifications_providers'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'verification',
  function: 'verificationData',
  collections: ['verifications'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'oidc',
  function: 'oidcProviders',
  collections: ['oidcProviders'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'saml',
  function: 'samlProviders',
  collections: ['samlProviders'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'map',
  function: 'mapConfiguration',
  collections: ['mapConfiguration'],
  dumpable: 'optional',
});

CollectionGroupManager.registerCollectionGroup({
  pluginName: 'audit-logs',
  function: 'auditLogs',
  collections: ['auditLogs', 'auditChanges'],
  dumpable: 'optional',
});
