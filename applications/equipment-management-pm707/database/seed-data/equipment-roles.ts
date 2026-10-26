import { definePermissionSet } from '@nocobase/authorization/permission-sets';
import {
  assetResource,
  requestResource,
  maintenanceResource,
  stocktakeResource,
  referenceResource,
} from '../../server/providers/equipment/resources.ts';
const page = (id: string) => ({
  resource: { type: 'page' as const, id },
  actions: [{ action: 'access' }],
});
export const equipmentManager = definePermissionSet('equipment-manager')
  .title('Equipment manager')
  .grant(
    ...[
      'equipment',
      'myEquipment',
      'operations',
      'maintenance',
      'stocktakes',
      'referenceData',
    ].map(page),
  )
  .grant(
    assetResource.reference().grant({
      view: { assets: 'allRecords' },
      inspect: { assets: 'allRecords' },
      create: { assets: 'allRecords' },
      update: { assets: 'allRecords' },
      issue: { assets: 'allRecords' },
      borrow: { assets: 'allRecords' },
      return: { assets: 'allRecords' },
      transfer: { assets: 'allRecords' },
      scrap: { assets: 'allRecords', requests: 'allRecords' },

      import: { assets: 'allRecords' },
      export: { assets: 'allRecords' },
    }),
  )
  .grant(
    requestResource.reference().grant({
      view: { requests: 'allRecords' },
      create: { requests: 'allRecords', assets: 'allRecords' },
      reject: { requests: 'allRecords' },
      export: { requests: 'allRecords' },
      complete: {
        requests: 'allRecords',
        assets: 'allRecords',
        maintenance: 'allRecords',
      },
    }),
  )
  .grant(
    maintenanceResource.reference().grant({
      view: { maintenance: 'allRecords' },
      create: { maintenance: 'allRecords', assets: 'allRecords' },
      complete: { maintenance: 'allRecords', assets: 'allRecords' },
      export: { maintenance: 'allRecords' },
    }),
  )
  .grant(
    stocktakeResource.reference().grant({
      view: { stocktakes: 'allRecords', items: 'allRecords' },
      create: {
        stocktakes: 'allRecords',
        items: 'allRecords',
        assets: 'allRecords',
      },
      observe: {
        stocktakes: 'allRecords',
        items: 'allRecords',
        assets: 'allRecords',
      },
      complete: {
        stocktakes: 'allRecords',
        items: 'allRecords',
        assets: 'allRecords',
      },
      export: { stocktakes: 'allRecords', items: 'allRecords' },
    }),
  )
  .grant(
    referenceResource.reference().grant({
      view: {
        categories: 'allRecords',
        departments: 'allRecords',
        locations: 'allRecords',
      },
      directory: { users: 'allRecords' },
      manage: {
        categories: 'allRecords',
        departments: 'allRecords',
        locations: 'allRecords',
      },
    }),
  )
  .grant({
    resource: { type: 'settings', id: 'equipment.workflows' },
    actions: [{ action: 'read' }],
  })
  .build();
export const equipmentStaff = definePermissionSet('equipment-staff')
  .title('Equipment member')
  .grant(...['equipment', 'myEquipment', 'operations'].map(page))
  .grant(
    assetResource.reference().grant({ view: { assets: 'equipment.catalog' } }),
  )
  .grant(
    requestResource.reference().grant({
      view: { requests: 'equipment.myRequests' },
      create: {
        requests: 'equipment.myRequests',
        assets: 'equipment.catalog',
      },
    }),
  )
  .grant(
    referenceResource.reference().grant({
      view: {
        categories: 'allRecords',
        departments: 'allRecords',
        locations: 'allRecords',
      },
    }),
  )
  .build();
