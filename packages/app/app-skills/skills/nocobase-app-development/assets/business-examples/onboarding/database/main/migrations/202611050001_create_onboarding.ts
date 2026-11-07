import { defineMigration } from '@nocobase/db';

export default defineMigration({
  name: '202611050001_create_onboarding',
  async up({ builder }) {
    await builder.createCollection('onboardingDepartments', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('name', { length: 160 }).notNull();
      c.boolean('active').notNull();
      c.string('allowedUserId', { length: 128, nullable: true });
      c.index(['active', 'name']);
    });
    await builder.createCollection('onboardingCases', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('fullName', { length: 160 }).notNull();
      c.string('workEmail', { length: 160 }).notNull();
      c.string('nationality', { length: 2 }).notNull();
      c.string('departmentId', { length: 64, nullable: true });
      c.string('jobTitle', { length: 160 }).notNull();
      c.string('employmentType', { length: 24, nullable: true });
      c.string('startDate', { length: 10 }).notNull();
      c.integer('probationMonths', { nullable: true });
      c.string('contractEndDate', { length: 10 }).notNull();
      c.string('coordinatorId', { length: 128 }).notNull();
      c.string('status', { length: 24 }).notNull();
      c.datetimeTz('statusChangedAt').notNull();
      c.integer('lifecycleVersion').notNull().defaultTo(0);
      c.string('employeeId', { length: 64, nullable: true });
      c.datetimeTz('createdAt').notNull();
      c.belongsTo('department', 'onboardingDepartments')
        .foreignKey('departmentId')
        .targetKey('id')
        .constraints(true)
        .onDelete('restrict');
      c.hasMany('documents', 'onboardingDocuments')
        .foreignKey('caseId')
        .sourceKey('id')
        .constraints(false);
      c.hasOne('employee', 'onboardingEmployees')
        .foreignKey('caseId')
        .sourceKey('id')
        .constraints(false);
      c.index(['coordinatorId', 'status']);
      c.index(['status', 'statusChangedAt']);
    });
    await builder.createCollection('onboardingDocuments', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('caseId', { length: 64 }).notNull();
      c.string('kind', { length: 32 }).notNull();
      c.string('title', { length: 160 }).notNull();
      c.string('referenceNo', { length: 160 }).notNull();
      c.integer('position').notNull();
      c.belongsTo('case', 'onboardingCases')
        .foreignKey('caseId')
        .targetKey('id')
        .constraints(true)
        .onDelete('cascade');
      c.index(['caseId', 'position']);
    });
    await builder.createCollection('onboardingEmployees', (c) => {
      c.string('id', { length: 64 }).primary().notNull();
      c.string('caseId', { length: 64 }).notNull();
      c.string('fullName', { length: 160 }).notNull();
      c.string('workEmail', { length: 160 }).notNull();
      c.string('nationality', { length: 2 }).notNull();
      c.string('departmentId', { length: 64 }).notNull();
      c.string('jobTitle', { length: 160 }).notNull();
      c.string('employmentType', { length: 24 }).notNull();
      c.string('startDate', { length: 10 }).notNull();
      c.integer('probationMonths', { nullable: true });
      c.string('contractEndDate', { length: 10 }).notNull();
      c.datetimeTz('createdAt').notNull();
      c.unique('caseId', { name: 'uq_onboarding_employees_case' });
      c.unique('workEmail', { name: 'uq_onboarding_employees_email' });
      c.belongsTo('case', 'onboardingCases')
        .foreignKey('caseId')
        .targetKey('id')
        .constraints(true)
        .onDelete('restrict');
      c.belongsTo('department', 'onboardingDepartments')
        .foreignKey('departmentId')
        .targetKey('id')
        .constraints(true)
        .onDelete('restrict');
    });
  },
  async down({ builder }) {
    await builder.dropCollection('onboardingEmployees');
    await builder.dropCollection('onboardingDocuments');
    await builder.dropCollection('onboardingCases');
    await builder.dropCollection('onboardingDepartments');
  },
});
