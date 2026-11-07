import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611040001_create_procurement',
  async up({ builder }) {
    await builder.createCollection('procurementSuppliers', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('name', { length: 160 }).notNull();
      c.boolean('active').notNull();
      c.string('allowedUserId', { length: 128, nullable: true });
      c.index(['active', 'name']);
    });
    await builder.createCollection('procurementMaterials', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('name', { length: 160 }).notNull();
      c.boolean('active').notNull();
      c.string('allowedUserId', { length: 128, nullable: true });
      c.integer('unitPriceMinor').notNull();
      c.index(['active', 'name']);
    });
    await builder.createCollection('procurementRequests', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('title', { length: 160 }).notNull();
      c.string('applicantId', { length: 128 }).notNull();
      c.string('reviewerId', { length: 128, nullable: true });
      c.string('supplierId', { length: 64, nullable: true });
      c.string('status', { length: 24 }).notNull();
      c.datetimeTz('statusChangedAt').notNull();
      c.integer('lifecycleVersion').notNull().defaultTo(0);
      c.integer('totalMinor').notNull();
      c.datetimeTz('createdAt').notNull();
      c.belongsTo('supplier', 'procurementSuppliers').foreignKey('supplierId').targetKey('id').constraints(true).onDelete('restrict');
      c.hasMany('lines', 'procurementLines').foreignKey('requestId').sourceKey('id').constraints(false);
      c.index(['applicantId', 'status']);
      c.index(['reviewerId', 'status']);
      c.index(['status', 'statusChangedAt']);
    });
    await builder.createCollection('procurementLines', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('requestId', { length: 64 }).notNull();
      c.string('materialId', { length: 64 }).notNull();
      c.string('materialName', { length: 160 }).notNull();
      c.integer('quantity').notNull();
      c.integer('unitPriceMinor').notNull();
      c.integer('amountMinor').notNull();
      c.integer('position').notNull();
      c.belongsTo('request', 'procurementRequests').foreignKey('requestId').targetKey('id').constraints(true).onDelete('cascade');
      c.belongsTo('material', 'procurementMaterials').foreignKey('materialId').targetKey('id').constraints(true).onDelete('restrict');
      c.index(['requestId', 'position']);
    });
  },
  async down({ builder }) {
    await builder.dropCollection('procurementLines');
    await builder.dropCollection('procurementRequests');
    await builder.dropCollection('procurementMaterials');
    await builder.dropCollection('procurementSuppliers');
  },
});
