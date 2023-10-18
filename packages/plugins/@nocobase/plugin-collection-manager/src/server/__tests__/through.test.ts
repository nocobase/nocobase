import PluginErrorHandler from '@nocobase/plugin-error-handler';
import { mockServer } from '@nocobase/test';
import Plugin from '../server';

describe('collections repository', () => {
  it('case 1', async () => {
    const app1 = mockServer({
      database: {
        tablePrefix: 'through_',
      },
      acl: false,
    });
    app1.plugin(PluginErrorHandler, { name: 'error-handler' });
    app1.plugin(Plugin, { name: 'collection-manager' });
    await app1.loadAndInstall({ clean: true });
    await app1.start();

    await app1
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'resumes',
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
            },
          ],
        },
      });

    await app1
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'jobs',
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
            },
          ],
        },
      });

    await app1
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'matches',
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
            },
          ],
        },
      });

    await app1
      .agent()
      .resource('collections.fields', 'resumes')
      .create({
        values: {
          name: 'jobs',
          type: 'belongsToMany',
          foreignKey: 'rid',
          otherKey: 'jid',
          reverseField: {
            type: 'belongsToMany',
            name: 'resumes',
          },
          target: 'jobs',
          through: 'matches',
        },
      });

    await app1
      .agent()
      .resource('collections.fields', 'resumes')
      .create({
        values: {
          name: 'matches2',
          type: 'hasMany',
          target: 'matches',
          foreignKey: 'rid',
          reverseField: {
            name: 'resume',
          },
        },
      });

    const job1 = await app1.db.getRepository('jobs').create({});
    await app1.db.getRepository('resumes').create({
      values: {
        jobs: [job1.get('id')],
      },
    });
    const match1 = await app1.db.getRepository('matches').findOne();
    expect(match1.toJSON()).toMatchObject({
      id: 1,
      rid: 1,
      jid: 1,
    });
    await app1.destroy();

    const app2 = mockServer({
      database: {
        tablePrefix: 'through_',
        database: app1.db.options.database,
        storage: app1.db.options.storage,
      },
    });

    app2.plugin(PluginErrorHandler, { name: 'error-handler' });
    app2.plugin(Plugin, { name: 'collection-manager' });
    await app2.load();
    await app2.start();

    await app2.db.sync({
      force: true,
    });
    const job = await app2.db.getRepository('jobs').create({});
    await app2.db.getRepository('resumes').create({
      values: {
        jobs: [job.get('id')],
      },
    });
    const match = await app2.db.getRepository('matches').findOne();
    expect(match.toJSON()).toMatchObject({
      id: 1,
      rid: 1,
      jid: 1,
    });
    await app2.destroy();
  });
});
