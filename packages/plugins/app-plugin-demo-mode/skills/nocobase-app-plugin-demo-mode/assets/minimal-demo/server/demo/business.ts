import { randomUUID } from 'node:crypto';
import type { DatabaseManager } from '@nocobase/db';
import type { DemoBusiness } from './dataset.js';

/** This example owns only these two business collections; adapt existing apps through their business services. */
export function createDemoBusiness(database: DatabaseManager): DemoBusiness {
  return {
    projectCollection: 'demoprojects',
    taskCollection: 'demotasks',
    visitorGrants: [
      {
        resource: { type: 'page', id: 'demoProjects' },
        actions: [{ action: 'access' }],
      },
    ],
    async createProject(input) {
      const id = randomUUID();
      await database
        .query()
        .insertInto('demoprojects')
        .values({ id, ...input })
        .execute();
      return id;
    },
    async createTask(input) {
      const id = randomUUID();
      await database
        .query()
        .insertInto('demotasks')
        .values({ id, ...input })
        .execute();
      return id;
    },
    async clearBusinessData() {
      await database.transaction(async (connection) => {
        await connection.query.deleteFrom('demotasks').allowAllRows().execute();
        await connection.query
          .deleteFrom('demoprojects')
          .allowAllRows()
          .execute();
      });
    },
  };
}
