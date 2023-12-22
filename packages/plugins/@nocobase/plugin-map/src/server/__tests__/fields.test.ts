import Database from '@nocobase/database';
import { mockDatabase } from '@nocobase/test';
import { CircleField, LineStringField, PointField, PolygonField } from '../fields';

const data = {
  polygon: [
    [114.081074, 22.563646],
    [114.147335, 22.559207],
    [114.134975, 22.531621],
    [114.09103, 22.520045],
    [114.033695, 22.575376],
    [114.025284, 22.55461],
    [114.033523, 22.533048],
  ],
  point: [114.048868, 22.554927],
  circle: [114.058996, 22.549695, 4171],
  lineString: [
    [114.047323, 22.534158],
    [114.120966, 22.544146],
  ],
};
describe('fields', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.registerFieldTypes({
      point: PointField,
      circle: CircleField,
      polygon: PolygonField,
      lineString: LineStringField,
    });
  });

  afterEach(async () => {
    await db.close();
  });

  const createCollection = async () => {
    const fields = [
      {
        type: 'point',
        name: 'point',
      },
      {
        type: 'polygon',
        name: 'polygon',
      },
      {
        type: 'circle',
        name: 'circle',
      },
      {
        type: 'lineString',
        name: 'lineString',
      },
    ];
    const Test = db.collection({
      name: 'tests',
      fields,
    });

    await db.sync();

    return Test;
  };
  it('define', async () => {
    const Test = await createCollection();
    await Test.model.create();
  });

  it('create', async () => {
    const Test = await createCollection();
    const model = await Test.model.create(data);
    expect(model.get()).toMatchObject(data);
  });

  it('find', async () => {
    const Test = await createCollection();
    await Test.model.create(data);
    expect(await Test.model.findOne()).toMatchObject(data);
  });

  it('set and get', async () => {
    const Test = await createCollection();
    const model = await Test.model.create();
    model.set('point', [1, 2]);
    expect(model.get('point')).toMatchObject([1, 2]);
    model.set('polygon', [
      [3, 4],
      [5, 6],
    ]);
    expect(model.get('polygon')).toMatchObject([
      [3, 4],
      [5, 6],
    ]);
    model.set('lineString', [
      [5, 6],
      [7, 8],
    ]);
    expect(model.get('lineString')).toMatchObject([
      [5, 6],
      [7, 8],
    ]);
    model.set('circle', [1, 2, 0.5]);
    expect(model.get('circle')).toMatchObject([1, 2, 0.5]);
  });

  it('create and update', async () => {
    const Test = await createCollection();
    const model = await Test.model.create(data);
    await model.save();
    const findOne = () =>
      db.getRepository('tests').findOne({
        except: ['createdAt', 'updatedAt', 'id'],
      });
    expect(await findOne()).toMatchObject(data);

    await model.update({
      point: [1, 2],
      polygon: null,
    });

    expect(await findOne()).toMatchObject({
      circle: [114.058996, 22.549695, 4171],
      lineString: [
        [114.047323, 22.534158],
        [114.120966, 22.544146],
      ],
      point: [1, 2],
      polygon: null,
    });
  });

  it('empty', async () => {
    const Test = await createCollection();
    const model = await Test.model.create({
      circle: null,
      lineString: null,
      point: null,
      polygon: null,
    });
    await model.save();

    const findOne = () =>
      db.getRepository('tests').findOne({
        except: ['createdAt', 'updatedAt', 'id'],
      });

    expect(await findOne()).toMatchObject({
      circle: null,
      lineString: null,
      point: null,
      polygon: null,
    });
  });
});
