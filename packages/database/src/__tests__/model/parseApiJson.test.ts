import { literal } from 'sequelize';
import { getDatabase } from '..';
import Database from '../../database';
import Model, { ModelCtor } from '../../model';


let db: Database;
let Bar: ModelCtor<Model>;
let Baz: ModelCtor<Model>;
let Bay: ModelCtor<Model>;
let Foo: ModelCtor<Model>;

beforeAll(() => {
  db = getDatabase();
  db.table({
    name: 'bazs',
    fields: [
      {
        type: 'belongsToMany',
        name: 'bays'
      },
    ]
  });
  db.table({
    name: 'bays',
    fields: [
      {
        type: 'belongsToMany',
        name: 'bazs'
      },
    ]
  });

  db.table({
    name: 'bars',
    fields: [
      {
        type: 'belongsTo',
        name: 'foo',
      },
    ],
  });
  db.table({
    name: 'foos',
    fields: [
      {
        type: 'hasMany',
        name: 'bars',
      },
      {
        type: 'hasMany',
        name: 'fozs',
      },
      {
        type: 'hasMany',
        name: 'coos',
      },
    ],
  });
  db.table({
    name: 'fozs',
  });
  db.table({
    name: 'coos',
  });
  Bar = db.getModel('bars');
  Baz = db.getModel('bazs');
  Bay = db.getModel('bays');
  Foo = db.getModel('foos');
});

afterAll(() => db.close());



describe('parseApiJson', () => {
  describe('self table', () => {
    it('empty', () => {
      expect(Foo.parseApiJson({})).toEqual({});
    });

    it('filter', () => {
      const data = Foo.parseApiJson({
        filter: {
          col1: 'co2',
        }
      });
      expect(data).toEqual({ where: { col1: 'co2' } });
    });
  
    it('fields', () => {
      const data = Foo.parseApiJson({
        fields: ['col1'],
      });
      expect(data).toEqual({ attributes: ['col1'] });
    });

    // TODO(bug): should not contain `include: []`
    it.skip('fields.except', () => {
      expect(Foo.parseApiJson({
        fields: {
          except: ['col']
        },
      })).toEqual({ attributes: {
        exclude: ['col']
      }});
    });

    it('fields.appends', () => {
      expect(Foo.parseApiJson({
        fields: {
          appends: ['col']
        },
      })).toEqual({ attributes: {
        include: ['col']
      }});
    });
  
    it('filter and fields', () => {
      const data = Foo.parseApiJson({
        fields: ['col1'],
        filter: {
          col1: 'co2',
        },
      });
      expect(data).toEqual({ attributes: ['col1'], where: { col1: 'co2' } });
    });

    it('pagination: page and perPage', () => {
      expect(Foo.parseApiJson({
        page: 1,
        perPage: 10
      })).toEqual({
        offset: 0,
        limit: 10,
      });
    });

    it('pagination: only page', () => {
      expect(Foo.parseApiJson({
        page: 1
      })).toEqual({
        offset: 0,
        limit: 20,
      });
    });

    it('sort: single self field', () => {
      expect(Foo.parseApiJson({
        sort: 'a'
      })).toEqual({
        order: [
          ['a', 'ASC']
        ]
      });
    });

    it('sort: multiple self fields', () => {
      expect(Foo.parseApiJson({
        sort: 'a,-b'
      })).toEqual({
        order: [
          ['a', 'ASC'],
          ['b', 'DESC'],
        ]
      });
    });

    it('sort: association field', () => {
      expect(Bar.parseApiJson({
        sort: '-baz.a'
      })).toEqual({
        order: [
          [Baz, 'a', 'DESC'],
        ]
      });
    });

    it('sort: many to many association field', () => {
      expect(Baz.parseApiJson({
        sort: '-bays.a'
      })).toEqual({
        order: [
          [Bay, 'a', 'DESC'],
        ]
      });
    });

    it('page + sort + fields', () => {
      expect(Foo.parseApiJson({
        fields: ['a', 'b'],
        page: 2,
        perPage: 10,
        sort: 'a'
      })).toEqual({
        attributes: ['a', 'b'],
        offset: 10,
        limit: 10,
        order: [
          ['a', 'ASC']
        ]
      });
    });
  });

  describe('associations', () => {
    it('filter on hasMany field', () => {
      const data = Foo.parseApiJson({
        fields: ['col1'],
        filter: {
          col1: 'val1',
          bars: {
            col1: 'val1',
          }
        },
      });
      expect(data).toEqual({
        attributes: ['col1'],
        where: { col1: 'val1' },
        include: [
          {
            association: 'bars',
            where: { col1: 'val1' },
          }
        ],
      });
    });
  
    it('filter and fields to fetch hasMany field', () => {
      const data = Foo.parseApiJson({
        fields: ['col1', 'bars.col1'],
        filter: {
          col1: 'val1',
          bars: {
            col1: 'val1',
          }
        },
      });
      expect(data).toEqual({
        attributes: ['col1'],
        where: { col1: 'val1' },
        include: [
          {
            association: 'bars',
            attributes: ['col1'],
            where: { col1: 'val1' },
          }
        ],
      });
    });
  });
});
