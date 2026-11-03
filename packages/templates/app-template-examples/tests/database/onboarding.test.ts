import path from 'node:path';
import { describeMigration } from '@nocobase/app-testing/server';

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
