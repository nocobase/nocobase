import { mockServer, MockServer } from '@nocobase/test';
import CollectionManagerPlugin from '../plugin';

describe('collections repository', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = mockServer({
      database: {
        tablePrefix: 'through_',
      },
    });
    await app.cleanDb();
    app.plugin(CollectionManagerPlugin);
    await app.load();
    await app.install({ clean: true });
    await app.start();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('case 1', async () => {
    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'resumes',
          createdBy: true,
          updatedBy: true,
          sortable: true,
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
              interface: 'id',
            },
          ],
          title: '简历',
        },
      });

    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'jobs',
          createdBy: true,
          updatedBy: true,
          sortable: true,
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
              interface: 'id',
            },
          ],
          title: '职位',
        },
      });

    await app
      .agent()
      .resource('collections')
      .create({
        values: {
          name: 'matches',
          createdBy: true,
          updatedBy: true,
          sortable: true,
          fields: [
            {
              name: 'id',
              type: 'integer',
              autoIncrement: true,
              primaryKey: true,
              allowNull: false,
              uiSchema: { type: 'number', title: '{{t("ID")}}', 'x-component': 'InputNumber', 'x-read-pretty': true },
              interface: 'id',
            },
          ],
          title: '匹配',
        },
      });

    await app
      .agent()
      .resource('collections.fields', 'resumes')
      .create({
        values: {
          name: 'jobs',
          type: 'belongsToMany',
          uiSchema: {
            'x-component': 'RecordPicker',
            'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
            title: '职位',
          },
          reverseField: {
            interface: 'linkTo',
            type: 'belongsToMany',
            uiSchema: {
              'x-component': 'RecordPicker',
              'x-component-props': { multiple: true, fieldNames: { label: 'id', value: 'id' } },
              title: '简历',
            },
          },
          interface: 'linkTo',
          target: 'jobs',
          through: 'matches',
        },
      });

    const matchesCollection = app.db.getCollection('matches');

    const matchesFields = [...matchesCollection.fields.entries()];
    const matchJobField = matchesFields.find((item) => item[1].options.target == 'jobs');

    expect(matchesCollection.model.rawAttributes[matchJobField[1].options.foreignKey].primaryKey).not.toBeTruthy();

    app = mockServer({
      database: {
        tablePrefix: 'through_',
      },
    });
    app.plugin(CollectionManagerPlugin);
    await app.load();
    await app.start();

    await app.db.sync();

    expect(
      app.db.getCollection('matches').model.rawAttributes[matchJobField[1].options.foreignKey].primaryKey,
    ).not.toBeTruthy();
  });
});
