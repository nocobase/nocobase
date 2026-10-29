import { randomUUID } from 'node:crypto';
import { defineSeed } from '@nocobase/db';
import metadata from '../../../package.json' with { type: 'json' };

export default defineSeed({
  name: '202611040001_procurement',
  async run(context) {
    for (const [key, action] of [['procurement-applicant', 'request'], ['procurement-reviewer', 'review']]) {
      const sets = context.repository('authorizationPermissionSets');
      if (!(await sets.findOne({ filter: { key } }))) await sets.createOne({ values: {
        id: randomUUID(), key, title: JSON.stringify({ key: action === 'request' ? 'procurement.applicantRole' : 'procurement.reviewerRole', ns: metadata.name }),
        grants: [
          { resource: { type: 'page', id: 'procurement' }, actions: [{ action: 'access' }] },
          { resource: { type: 'settings', id: 'procurement' }, actions: [{ action }] },
        ], createdAt: new Date(), updatedAt: new Date(),
      } });
    }
  },
});
