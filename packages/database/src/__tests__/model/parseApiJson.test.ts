import { literal, Op } from 'sequelize';
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
    name: 'bobs',
    fields: [
      {
        type: 'belongsTo',
        name: 'bar'
      }
    ]
  });
  db.table({
    name: 'bars',
    fields: [
      {
        type: 'belongsTo',
        name: 'foo',
      },
      {
        type: 'hasOne',
        name: 'bob'
      }
    ],
  });
  db.table({
    name: 'foos',
    fields: [
      {
        type: 'int',
        name: 'f_g61p'
      },
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

    it('filter with condition operator', () => {
      const data = Foo.parseApiJson({
        filter: { "and": [{ "f_g61p.eq": 23 }] }
      });
      expect(data).toEqual({
        where: {
          [Op.and]: [
            { f_g61p: { [Op.eq]: 23 } }
          ]
        }
      });
    });

    it('fields', () => {
      const data = Foo.parseApiJson({
        fields: ['col1'],
      });
      expect(data).toEqual({ attributes: ['col1'] });
    });

    it('fields.except', () => {
      expect(Foo.parseApiJson({
        fields: {
          except: ['col']
        },
      })).toEqual({
        attributes: {
          exclude: ['col']
        }
      });
    });

    it('fields.appends', () => {
      expect(Foo.parseApiJson({
        fields: {
          appends: ['col']
        },
      })).toEqual({
        attributes: {
          include: ['col']
        }
      });
    });

    // TODO(bug): 当遇到多层关联时，attributes 控制不正确
    it.skip('assciation fields', () => {
      expect(Foo.parseApiJson({
        fields: ['bars.bob', 'bars'],
      })).toEqual({
        include: [
          {
            association: 'bars',
            include: [
              {
                association: 'bob',
              }
            ]
          }
        ],
        distinct: true
      });
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
        page: 2
      })).toEqual({
        offset: 100,
        limit: 100,
      });
    });

    it('pagination: only perPage and max limit', () => {
      expect(Foo.parseApiJson({
        perPage: 1000
      })).toEqual({
        offset: 0,
        limit: 500,
      });
    });

    it('pagination: perPage=-1 stand for max limit', () => {
      expect(Foo.parseApiJson({
        page: 2,
        perPage: -1
      })).toEqual({
        offset: 500,
        limit: 500,
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
        sort: '-foo.a'
      })).toEqual({
        order: [
          [Foo, 'a', 'DESC'],
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
        distinct: true,
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
        distinct: true,
      });
    });
  });
});
