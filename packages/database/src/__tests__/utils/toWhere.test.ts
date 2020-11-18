import { Op } from "sequelize";
import Database from "../../database";
import Model, { ModelCtor } from '../../model';
import { toWhere } from "../../utils";
import { getDatabase } from "..";

describe('utils.toWhere', () => {
  describe('single', () => {
    it('=', () => {
      const where = toWhere({
        id: 12,
      });
      expect(where).toEqual({
        id: 12,
      });
    });

    it('Op.eq', () => {
      const where = toWhere({
        id: {
          eq: 12
        },
      });
      expect(where).toEqual({
        id: {
          [Op.eq]: 12,
        },
      });
    });
  
    it('Op.ilike', () => {
      const where = toWhere({
        id: {
          ilike: 'val1'
        },
      });
      expect(where).toEqual({
        id: {
          [Op.iLike]: 'val1',
        },
      });
    });
  
    it('Op.ilike', () => {
      const where = toWhere({
        'id.ilike': 'val1',
      });
      expect(where).toEqual({
        id: {
          [Op.iLike]: 'val1',
        },
      });
    });
  
    it('Op.is null', () => {
      const where = toWhere({
        'id.is': null,
      });
      expect(where).toEqual({
        id: {
          [Op.is]: null,
        },
      });
    });
  
    it('Op.in', () => {
      const where = toWhere({
        id: {
          in: [12]
        },
      });
      expect(where).toEqual({
        id: {
          [Op.in]: [12],
        },
      });
    });
  
    it('Op.in', () => {
      const where = toWhere({
        'id.in': [11, 12],
      });
      expect(where).toEqual({
        id: {
          [Op.in]: [11, 12],
        },
      });
    });

    it('Op.between', () => {
      expect(toWhere({
        'id.between': [1, 2]
      })).toEqual({
        id: { [Op.between]: [1, 2] }
      });
    });
  });

  describe('group by logical operator', () => {
    it('field.or', () => {
      expect(toWhere({
        'id.or': [1, 2]
      })).toEqual({
        id: { [Op.or]: [1, 2] }
      });
    });

    it('field.and', () => {
      expect(toWhere({
        'id.and': [1, 2]
      })).toEqual({
        id: { [Op.and]: [1, 2] }
      });
    });

    it('root or', () => {
      expect(toWhere({
        or: [{ a: 1 }, { b: 2 }]
      })).toEqual({
        [Op.or]: [{ a: 1 }, { b: 2 }]
      });
    });

    it('root and', () => {
      expect(toWhere({
        and: [{ a: 1 }, { b: 2 }]
      })).toEqual({
        [Op.and]: [{ a: 1 }, { b: 2 }]
      });
    });

    it('root "and" and "or"', () => {
      expect(toWhere({
        and: [{ a: 1 }, { b: 2 }],
        or: [{ c: 3 }, { d: 4 }]
      })).toEqual({
        [Op.and]: [{ a: 1 }, { b: 2 }],
        [Op.or]: [{ c: 3 }, { d: 4 }]
      });
    });

    it('root "and" and field', () => {
      expect(toWhere({
        and: [{ a: 1 }, { b: 2 }],
        'id.or': [3, 4]
      })).toEqual({
        [Op.and]: [{ a: 1 }, { b: 2 }],
        id: { [Op.or]: [3, 4] }
      });
    });

    it('or in and', () => {
      expect(toWhere({
        and: [{ a: 1 }, { 'b.or': [3, 4] }],
      })).toEqual({
        [Op.and]: [{ a: 1 }, { b: { [Op.or]: [3, 4] } }],
      });
    });

    it('and in or', () => {
      expect(toWhere({
        or: [{ a: 1 }, { and: [{ c: 3 }, { d: 4 }] }],
      })).toEqual({
        [Op.or]: [{ a: 1 }, { [Op.and]: [{ c: 3 }, { d: 4 }] }],
      });
    });

    // TODO: bug
    it.skip('field as or', () => {
      expect(toWhere({
        or: 1,
      })).toEqual({
        or: 1,
      });
    });

    // TODO: bug
    it.skip('or for field as or', () => {
      expect(toWhere({
        'or.or': [1, 2],
      })).toEqual({
        or: { [Op.or]: [1, 2] },
      });
    });
  });

  describe('association', () => {
    let db: Database;
    let Foo: ModelCtor<Model>;
    beforeAll(() => {
      db = getDatabase();
      db.table({
        name: 'bazs',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsTo',
            name: 'baz',
          }
        ]
      });
      db.table({
        name: 'foos',
        fields: [
          {
            type: 'hasMany',
            name: 'bars',
          }
        ],
      });
      Foo = db.getModel('foos');
    });
    afterAll(() => db.close());

    const toWhereExpect = (options, logging = false) => {
      const where = toWhere(options, {
        associations: Foo.associations,
      });
      return expect(where);
    }

    it('association', () => {
      toWhereExpect({
        col1: 'val1',
        bars: {
          name: {
            ilike: 'aa',
          },
          col2: {
            lt: 2,
          },
          baz: {
            col1: 12,
          },
        },
        'bars.col3.ilike': 'aa',
      }).toEqual({
        col1: 'val1',
        $__include: {
          bars: {
            name: {
              [Op.iLike]: 'aa',
            },
            col2: {
              [Op.lt]: 2,
            },
            col3: {
              [Op.iLike]: 'aa',
            },
            $__include: {
              baz: {
                col1: 12
              },
            },
          },
        },
      });
    });
  });
});
