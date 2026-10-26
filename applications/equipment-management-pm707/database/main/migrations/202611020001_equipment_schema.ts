import { defineMigration } from '@nocobase/db';
export default defineMigration({
 name: '202611020001_equipment_schema',
 async up({ builder }) {
await builder.createCollection('equipmentCategories', (t) => {
t.string('id').primary().notNull();
t.string('name',{length:160}).notNull();t.string('code',{length:64}).notNull();t.unique('code');
});
await builder.createCollection('equipmentDepartments', (t) => {
t.string('id').primary().notNull();
t.string('name',{length:160}).notNull();t.string('code',{length:64}).notNull();t.unique('code');
});
await builder.createCollection('equipmentLocations', (t) => {
t.string('id').primary().notNull();
t.string('name',{length:160}).notNull();t.string('code',{length:64}).notNull();t.unique('code');
});
await builder.createCollection('equipmentAssets', (t) => {
t.string('id').primary().notNull();

t.string('assetNumber',{length:64}).notNull();t.unique('assetNumber');t.string('name',{length:160}).notNull();
t.string('serialNumber');t.string('model');t.string('manufacturer');
t.string('categoryId').notNull();t.string('departmentId').notNull();t.string('locationId').notNull();
t.string('custodianId');t.date('purchaseDate');t.date('warrantyUntil');t.date('nextMaintenanceAt');
t.decimal('purchaseCost',{precision:14,scale:2}).notNull().defaultTo(0);t.string('vendor');t.text('notes');
t.date('dueDate');t.string('priorStatus');t.datetimeTz('createdAt').notNull();
t.foreignKey('categoryId',{references:{collection:'equipmentCategories',fields:['id']}});
t.foreignKey('departmentId',{references:{collection:'equipmentDepartments',fields:['id']}});
t.foreignKey('locationId',{references:{collection:'equipmentLocations',fields:['id']}});
t.foreignKey('custodianId',{references:{collection:'user',fields:['id']}});
t.index(['custodianId','id']);t.index(['locationId','id']);t.index(['categoryId','id']);t.index(['dueDate']);t.index(['warrantyUntil']);t.index(['nextMaintenanceAt']);
t.string('status').notNull();t.datetimeTz('statusChangedAt').notNull();t.integer('lifecycleVersion').notNull().defaultTo(0);t.index(['status','statusChangedAt']);

});
await builder.createCollection('equipmentRequests', (t) => {
t.string('id').primary().notNull();

t.string('deviceId').notNull();t.string('kind').notNull();t.string('requesterId').notNull();
t.text('reason').notNull();t.date('dueDate');t.text('resolution');t.string('handledById');t.datetimeTz('createdAt').notNull();
t.foreignKey('deviceId',{references:{collection:'equipmentAssets',fields:['id']}});
t.foreignKey('requesterId',{references:{collection:'user',fields:['id']}});t.index(['requesterId','id']);t.index(['deviceId','status']);
t.string('status').notNull();t.datetimeTz('statusChangedAt').notNull();t.integer('lifecycleVersion').notNull().defaultTo(0);t.index(['status','statusChangedAt']);

});
await builder.createCollection('equipmentMaintenance', (t) => {
t.string('id').primary().notNull();

t.string('deviceId').notNull();t.string('kind').notNull();t.text('description').notNull();t.text('resolution');
t.decimal('cost',{precision:14,scale:2}).notNull().defaultTo(0);t.string('createdById').notNull();t.datetimeTz('createdAt').notNull();
t.foreignKey('deviceId',{references:{collection:'equipmentAssets',fields:['id']}});t.index(['deviceId','status']);
t.string('status').notNull();t.datetimeTz('statusChangedAt').notNull();t.integer('lifecycleVersion').notNull().defaultTo(0);t.index(['status','statusChangedAt']);

});
await builder.createCollection('equipmentStocktakes', (t) => {
t.string('id').primary().notNull();
t.string('name').notNull();t.string('locationId').notNull();t.string('createdById').notNull();t.datetimeTz('createdAt').notNull();t.string('status').notNull();t.datetimeTz('statusChangedAt').notNull();t.integer('lifecycleVersion').notNull().defaultTo(0);t.index(['status','statusChangedAt']);

});
await builder.createCollection('equipmentStocktakeItems', (t) => {
t.string('id').primary().notNull();

t.string('stocktakeId').notNull();t.string('deviceId').notNull();t.string('expectedLocationId').notNull();t.string('expectedCustodianId');
t.string('expectedStatus').notNull();t.integer('expectedVersion').notNull();t.string('actualLocationId');t.string('condition');t.text('note');t.boolean('resolved').notNull().defaultTo(false);
t.foreignKey('stocktakeId',{references:{collection:'equipmentStocktakes',fields:['id']}});
t.foreignKey('deviceId',{references:{collection:'equipmentAssets',fields:['id']}});t.unique(['stocktakeId','deviceId']);t.index(['stocktakeId','id']);

});
    await builder.createCollection('equipmentTransitions', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.string('lifecycle').notNull();
      table.string('recordId').notNull();
      table.string('transition').notNull();
      // Null on the entry runtime.create() writes.
      table.string('from');
      table.string('to').notNull();
      table.string('actorId').notNull();
      table.json('input').notNull().defaultTo({});
      table.datetimeTz('at').notNull();
      table.integer('version').notNull();
      // The caller's request id, as it sent it; null when it sent none.
      table.string('requestId');
      // What a repeated request is found by: the request id, or a key derived
      // from the version for an entry without one. It is never null, so one
      // plain unique index means the same on every dialect, whichever way it
      // treats NULL in a unique index.
      table.string('requestKey').notNull();
      table.index(['lifecycle', 'recordId', 'id']);
      table.unique(['lifecycle', 'recordId', 'version']);
      table.unique(['lifecycle', 'recordId', 'requestKey']);
    });

    await builder.createCollection('equipmentEffectRuns', (table) => {
      table.bigInt('id').primary().autoIncrement().notNull();
      table.bigInt('transitionId').notNull();
      table.string('lifecycle').notNull();
      table.string('recordId').notNull();
      table.string('effect').notNull();
      table.boolean('stayBound').notNull();
      table.string('status').notNull();
      table.integer('attempts').notNull().defaultTo(0);
      table.integer('maxAttempts').notNull().defaultTo(1);
      table.json('result');
      table.text('error');
      table.datetimeTz('createdAt').notNull();
      table.datetimeTz('updatedAt').notNull();
      table.datetimeTz('claimedAt');
      table.datetimeTz('runAfter');
      // A continuation the outcome still has to fire, refused so far for a
      // reason a deploy can remove; null when nothing is pending.
      table.json('continuation');
      // When the sweep may try that continuation next: null exactly when
      // nothing is pending, so the sweep finds the due runs without a JSON
      // filter, those due longest first.
      table.datetimeTz('continuationDueAt');
      // When the sweep gave up on that continuation: null unless it did, so
      // an operations page finds those runs, and prune() keeps them, without
      // a JSON filter.
      table.datetimeTz('continuationAbandonedAt');
      table.index(['status', 'id']);
      table.index(['lifecycle', 'recordId', 'id']);
      table.index(['continuationDueAt']);
      table.index(['continuationAbandonedAt']);
    });
},async down({builder}) {
await builder.dropCollection('equipmentEffectRuns');
await builder.dropCollection('equipmentTransitions');
await builder.dropCollection('equipmentStocktakeItems');
await builder.dropCollection('equipmentStocktakes');
await builder.dropCollection('equipmentMaintenance');
await builder.dropCollection('equipmentRequests');
await builder.dropCollection('equipmentAssets');
await builder.dropCollection('equipmentLocations');
await builder.dropCollection('equipmentDepartments');
await builder.dropCollection('equipmentCategories');
}});
