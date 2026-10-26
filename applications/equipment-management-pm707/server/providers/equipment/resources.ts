import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import {
  defineDatabasePermission,
  type AppAuthorization,
} from '@nocobase/app-plugin-authorization/server';
import { buildFilter } from '@nocobase/repository-input';
export const publicAssetFields = [
  'id',
  'assetNumber',
  'name',
  'serialNumber',
  'model',
  'manufacturer',
  'categoryId',
  'departmentId',
  'locationId',
  'custodianId',
  'warrantyUntil',
  'nextMaintenanceAt',
  'dueDate',
  'status',
  'statusChangedAt',
  'lifecycleVersion',
  'createdAt',
] as const;
const publicAssets = defineDatabasePermission((p) =>
  p.collection('equipmentAssets').read(publicAssetFields),
);
const full = (name: string) =>
  defineDatabasePermission((p) => p.collection(name).read('*'));
export const dictionaries = [
  'equipmentCategories',
  'equipmentDepartments',
  'equipmentLocations',
] as const;
const assetData = full('equipmentAssets');
const requestData = full('equipmentRequests');
const maintenanceData = full('equipmentMaintenance');
const stocktakeData = full('equipmentStocktakes');
const itemData = full('equipmentStocktakeItems');
export const assetResource = defineCompositeResource('equipment.assets', (r) =>
  r
    .title('Assets')
    .action('view', (a) =>
      a.title('View catalog and own assets').grant('assets', publicAssets),
    )
    .action('inspect', (a) =>
      a.title('Read procurement and full history').grant('assets', assetData),
    )
    .action('create', (a) =>
      a.title('Add assets').grant('assets', assetData.create('*')),
    )
    .action('update', (a) =>
      a.title('Edit asset details').grant('assets', assetData.update('*')),
    )
    .action('issue', (a) =>
      a.title('Issue equipment').grant('assets', assetData.update('*')),
    )
    .action('borrow', (a) =>
      a.title('Lend equipment').grant('assets', assetData.update('*')),
    )
    .action('return', (a) =>
      a.title('Return equipment').grant('assets', assetData.update('*')),
    )
    .action('transfer', (a) =>
      a.title('Transfer equipment').grant('assets', assetData.update('*')),
    )
    .action('scrap', (a) =>
      a
        .title('Scrap equipment')
        .grant('assets', assetData.update('*'))
        .grant('requests', requestData),
    )
    .action('import', (a) =>
      a
        .title('Import assets')
        .grant('assets', assetData.create('*').update('*')),
    )
    .action('export', (a) =>
      a.title('Export assets').grant('assets', assetData),
    ),
);
export const requestResource = defineCompositeResource(
  'equipment.requests',
  (r) =>
    r
      .title('Equipment requests')
      .action('view', (a) =>
        a.title('View requests').grant('requests', requestData),
      )
      .action('create', (a) =>
        a
          .title('Request equipment')
          .grant('requests', requestData.create('*'))
          .grant('assets', publicAssets),
      )
      .action('reject', (a) =>
        a.title('Reject requests').grant('requests', requestData.update('*')),
      )
      .action('export', (a) =>
        a.title('Export requests').grant('requests', requestData),
      )
      .action('complete', (a) =>
        a
          .title('Confirm requests')
          .grant('requests', requestData.update('*'))
          .grant('assets', assetData.update('*'))
          .grant('maintenance', maintenanceData.create('*')),
      ),
);
export const maintenanceResource = defineCompositeResource(
  'equipment.maintenance',
  (r) =>
    r
      .title('Repairs and maintenance')
      .action('view', (a) =>
        a.title('View maintenance').grant('maintenance', maintenanceData),
      )
      .action('create', (a) =>
        a
          .title('Open maintenance')
          .grant('maintenance', maintenanceData.create('*').update('*'))
          .grant('assets', assetData.update('*')),
      )
      .action('complete', (a) =>
        a
          .title('Complete maintenance')
          .grant('maintenance', maintenanceData.create('*').update('*'))
          .grant('assets', assetData.update('*')),
      )
      .action('export', (a) =>
        a.title('Export maintenance').grant('maintenance', maintenanceData),
      ),
);
export const stocktakeResource = defineCompositeResource(
  'equipment.stocktakes',
  (r) =>
    r
      .title('Stocktakes')
      .action('view', (a) =>
        a
          .title('View stocktakes')
          .grant('stocktakes', stocktakeData)
          .grant('items', itemData),
      )
      .action('create', (a) =>
        a
          .title('Create stocktake')
          .grant('stocktakes', stocktakeData.create('*').update('*'))
          .grant('items', itemData.create('*').update('*'))
          .grant('assets', assetData),
      )
      .action('observe', (a) =>
        a
          .title('Record observation')
          .grant('stocktakes', stocktakeData.create('*').update('*'))
          .grant('items', itemData.create('*').update('*'))
          .grant('assets', assetData),
      )
      .action('complete', (a) =>
        a
          .title('Complete stocktake')
          .grant('stocktakes', stocktakeData.create('*').update('*'))
          .grant('items', itemData.create('*').update('*'))
          .grant('assets', assetData),
      )
      .action('export', (a) =>
        a
          .title('Export stocktakes')
          .grant('stocktakes', stocktakeData)
          .grant('items', itemData),
      ),
);
export const referenceResource = defineCompositeResource(
  'equipment.reference',
  (r) =>
    r
      .title('Reference data')
      .action('view', (a) =>
        a
          .title('Read reference data')
          .grant('categories', full(dictionaries[0]))
          .grant('departments', full(dictionaries[1]))
          .grant('locations', full(dictionaries[2])),
      )
      .action('directory', (a) =>
        a.title('Choose custodians').grant(
          'users',
          defineDatabasePermission((p) =>
            p.collection('user').read(['id', 'name']),
          ),
        ),
      )
      .action('manage', (a) =>
        a
          .title('Maintain reference data')
          .grant(
            'categories',
            full(dictionaries[0]).create('*').update('*').delete(),
          )
          .grant(
            'departments',
            full(dictionaries[1]).create('*').update('*').delete(),
          )
          .grant(
            'locations',
            full(dictionaries[2]).create('*').update('*').delete(),
          ),
      ),
);
export const resources = [
  assetResource.build(),
  requestResource.build(),
  maintenanceResource.build(),
  stocktakeResource.build(),
  referenceResource.build(),
];
export function registerEquipmentAuthorization(authz: AppAuthorization): void {
  for (const name of [
    ...dictionaries,
    'user',
    'equipmentAssets',
    'equipmentRequests',
    'equipmentMaintenance',
    'equipmentStocktakes',
    'equipmentStocktakeItems',
  ])
    authz.database.collections.add({ name, title: name });
  authz.ui.sections.add({
    name: 'equipment',
    title: 'Equipment',
    parent: 'business',
  });
  for (const resource of resources) {
    const ref = authz.compositeResources.define(resource);
    authz.ui.place(ref, { section: 'equipment' });
  }
  authz.recordAccess.define(
    defineRecordAccess('equipment.catalog', (a) =>
      a
        .title('Available or assigned to me')
        .collections('equipmentAssets')
        .resolver(({ principal }) =>
          principal.type === 'user'
            ? buildFilter((f) =>
                f.or([
                  f.string('status').eq('idle'),
                  f.string('custodianId').eq(principal.id),
                ]),
              )
            : false,
        ),
    ).build(),
  );
  authz.recordAccess.define(
    defineRecordAccess('equipment.myRequests', (a) =>
      a
        .title('My requests')
        .collections('equipmentRequests')
        .resolver(({ principal }) =>
          principal.type === 'user'
            ? buildFilter((f) => f.string('requesterId').eq(principal.id))
            : false,
        ),
    ).build(),
  );
  authz.ui.sections.add({
    name: 'equipment.admin',
    title: 'Equipment',
    parent: 'administration',
  });
  authz.settings.add({
    id: 'equipment.workflows',
    title: 'Equipment workflows',
    actions: [{ name: 'read' }],
  });
  authz.ui.place(
    { type: 'settings', id: 'equipment.workflows' },
    { section: 'equipment.admin' },
  );
}
