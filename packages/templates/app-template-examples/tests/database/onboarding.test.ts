import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';
import { expect } from 'vitest';

describeMigration('202611050001_create_onboarding', {
  sources: [
    {
      packageName: 'onboarding-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  async up({ expectCollection }) {
    for (const name of [
      'onboardingDepartments',
      'onboardingCases',
      'onboardingDocuments',
      'onboardingEmployees',
    ])
      await expectCollection(name).toExist();
    await expectCollection('onboardingCases').toHaveField('lifecycleVersion', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('onboardingCases').toHaveIndex([
      'coordinatorId',
      'status',
    ]);
    await expectCollection('onboardingDocuments').toHaveField('position', {
      type: 'integer',
      nullable: false,
    });
    await expectCollection('onboardingDocuments').toHaveIndex([
      'caseId',
      'position',
    ]);
    await expectCollection('onboardingEmployees').toHaveIndex(['caseId'], {
      unique: true,
    });
    await expectCollection('onboardingEmployees').toHaveIndex(['workEmail'], {
      unique: true,
    });
  },
  async down({ expectCollection }) {
    for (const name of [
      'onboardingDocuments',
      'onboardingEmployees',
      'onboardingCases',
      'onboardingDepartments',
    ])
      await expectCollection(name).not.toExist();
  },
});

// A case written before the binding column belongs to the only definition
// the table has had.
describeMigration('202611110005_onboarding_definition_binding', {
  sources: [
    {
      packageName: 'onboarding-test',
      directory: path.resolve(
        import.meta.dirname,
        '../../database/main/migrations',
      ),
    },
  ],
  async before({ connection }) {
    await connection.repository('onboardingCases').createOne({
      values: {
        id: 'case-before-binding',
        fullName: 'Lin Wei',
        workEmail: 'lin@example.com',
        nationality: 'CN',
        jobTitle: 'Engineer',
        startDate: '2026-12-01',
        contractEndDate: '2027-12-01',
        coordinatorId: 'chen',
        status: 'draft',
        statusChangedAt: '2026-11-01T00:00:00.000Z',
        lifecycleVersion: 1,
        createdAt: '2026-11-01T00:00:00.000Z',
      },
    });
  },
  async up({ connection, expectCollection }) {
    await expectCollection('onboardingCases').toHaveField(
      'lifecycleDefinition',
      { type: 'string', nullable: true },
    );
    const rows = await connection.repository('onboardingCases').findMany({});
    expect(rows.map((row) => row.lifecycleDefinition)).toEqual(['onboarding']);
  },
  async down({ expectCollection }) {
    await expectCollection('onboardingCases').not.toHaveField(
      'lifecycleDefinition',
    );
  },
});
