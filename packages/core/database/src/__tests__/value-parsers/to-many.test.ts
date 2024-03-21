import { Database, mockDatabase } from '../..';
import { ToManyValueParser } from '../../value-parsers';

describe('number value parser', () => {
  let parser: ToManyValueParser;
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.collection({
      name: 'posts',
      fields: [
        {
          type: 'belongsToMany',
          name: 'tags',
        },
        {
          type: 'belongsToMany',
          name: 'attachments',
          interface: 'attachment',
        },
      ],
    });
    db.collection({
      name: 'attachments',
      fields: [],
    });
    db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });
    await db.sync();
    const tag = db.getRepository('tags');
    await tag.create({
      values: { name: 'tag1' },
    });
  });

  afterEach(async () => {
    await db.close();
  });

  const setValue = async (value) => {
    const post = db.getCollection('posts');
    parser = new ToManyValueParser(post.getField('tags'), {
      column: {
        dataIndex: ['tags', 'name'],
      },
    });
    await parser.setValue(value);
  };

  const setAttachment = async (value) => {
    const post = db.getCollection('posts');
    parser = new ToManyValueParser(post.getField('attachments'), {});
    await parser.setValue(value);
  };

  it('should be [1]', async () => {
    await setValue('tag1');
    expect(parser.errors.length).toBe(0);
    expect(parser.getValue()).toEqual([1]);
  });

  it('should be null', async () => {
    await setValue('tag2');
    expect(parser.errors.length).toBe(1);
    expect(parser.getValue()).toBeNull();
  });

  it('should be attachment', async () => {
    await setAttachment('https://www.nocobase.com/images/logo.png');
    expect(parser.errors.length).toBe(0);
    expect(parser.getValue()).toMatchObject([
      {
        title: 'logo.png',
        extname: '.png',
        filename: 'logo.png',
        url: 'https://www.nocobase.com/images/logo.png',
      },
    ]);
  });
});

describe('china region', () => {
  let parser: ToManyValueParser;
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
    await db.clean({ drop: true });
    db.collection({
      name: 'users',
      fields: [
        {
          type: 'belongsToMany',
          name: 'chinaRegion',
          target: 'chinaRegions',
          interface: 'chinaRegion',
          targetKey: 'code',
          sortBy: 'level',
        },
      ],
    });
    db.collection({
      name: 'chinaRegions',
      autoGenId: false,
      fields: [
        {
          name: 'code',
          type: 'string',
          // unique: true,
          primaryKey: true,
        },
        {
          name: 'name',
          type: 'string',
        },
        {
          name: 'parent',
          type: 'belongsTo',
          target: 'chinaRegions',
          targetKey: 'code',
          foreignKey: 'parentCode',
        },
        {
          name: 'children',
          type: 'hasMany',
          target: 'chinaRegions',
          sourceKey: 'code',
          foreignKey: 'parentCode',
        },
        {
          name: 'level',
          type: 'integer',
        },
      ],
    });
    await db.sync();
    const areas = require('china-division/dist/areas.json');
    const cities = require('china-division/dist/cities.json');
    const provinces = require('china-division/dist/provinces.json');
    const ChinaRegion = db.getModel('chinaRegions');
    await ChinaRegion.bulkCreate(
      provinces.map((item) => ({
        code: item.code,
        name: item.name,
        level: 1,
      })),
    );
    await ChinaRegion.bulkCreate(
      cities.map((item) => ({
        code: item.code,
        name: item.name,
        level: 2,
        parentCode: item.provinceCode,
      })),
    );
    await ChinaRegion.bulkCreate(
      areas.map((item) => ({
        code: item.code,
        name: item.name,
        level: 3,
        parentCode: item.cityCode,
      })),
    );
  });

  afterEach(async () => {
    await db.close();
  });

  const setValue = async (value) => {
    const r = db.getCollection('users');
    parser = new ToManyValueParser(r.getField('chinaRegion'), {});
    await parser.setValue(value);
  };

  it('should be correct', async () => {
    await setValue('北京市/市辖区');
    expect(parser.errors.length).toBe(0);
    expect(parser.getValue()).toEqual(['11', '1101']);

    await setValue('北京市 / 市辖区');
    expect(parser.errors.length).toBe(0);
    expect(parser.getValue()).toEqual(['11', '1101']);

    await setValue('天津市 / 市辖区');
    expect(parser.errors.length).toBe(0);
    expect(parser.getValue()).toEqual(['12', '1201']);
  });

  it('should be null', async () => {
    await setValue('北京市2 / 市辖区');
    expect(parser.errors.length).toBe(1);
    expect(parser.getValue()).toBeNull();

    await setValue('北京市 / 市辖区 2');
    expect(parser.errors.length).toBe(1);
    expect(parser.getValue()).toBeNull();
  });
});
