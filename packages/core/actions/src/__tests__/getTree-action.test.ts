import {registerActions} from '@nocobase/actions';
import {mockServer} from './index';

describe('getTree action', () => {
  let app;
  beforeEach(async () => {
    app = mockServer();
    registerActions(app);

    const cities = app.collection({
      name: 'cities',
      tree: 'adjacency-list',
      fields: [
        {
          type: 'string',
          name: 'cityName',
        },
        {
          type: 'belongsTo',
          name: 'parent',
          target: 'cities',
          foreignKey: 'parentId',
        },
        {
          type: 'hasMany',
          name: 'children',
          target: 'cities',
          foreignKey: 'parentId',
        },
      ],
    });


    await app.db.sync();

    const c1 = await cities.repository.create({
      values: {
        cityName: 'cities',
      },
    });
    const c2 = await cities.repository.create({
      values: {
        cityName: 'hebei',
        parentId: c1.get("id")
      },
    });
    const c3 = await cities.repository.create({
      values: {
        cityName: 'shandong',
        parentId: c1.get("id")
      },
    });

    await cities.repository.createMany({
      records: [
        {
          cityName: 'xingtai',
          parentId: c2.get("id")
        },
        {
          cityName: 'handan',
          parentId: c2.get("id")
        },
      ]
    });

  });

  afterEach(async () => {
    await app.destroy();
  });

  test('getTree', async () => {
    const response = await app
      .agent()
      .resource('cities')
      .getTree({
        paginate: false,
        appends: [],
      });

    const body = response.body;
    expect(body.length).toEqual(1);
    expect(body[0]['children'].length).toEqual(2);
    expect(body[0]['children'][0].__path).toEqual('0.children.0');
    expect(body[0]['children'][0]['children'].length).toEqual(2);
    expect(body[0]['children'][0]['children'][0].__path).toEqual('0.children.0.children.0');
  });

});
