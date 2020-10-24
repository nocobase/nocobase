import { requireModule, toWhere, toInclude } from '../utils';
import path from 'path';
import { Op } from 'sequelize';
import { getDatabase } from '.';
import Database from '../database';
import Model, { ModelCtor } from '../model';

describe('utils', () => {
  describe('toWhere', () => {
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

  describe('toInclude', () => {
    let db: Database;
    let Foo: ModelCtor<Model>;
    beforeAll(() => {
      db = getDatabase();
      db.table({
        name: 'bazs',
      });
      db.table({
        name: 'bays',
      });
      db.table({
        name: 'bars',
        fields: [
          {
            type: 'belongsTo',
            name: 'baz',
          },
          {
            type: 'belongsTo',
            name: 'bay',
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
      Foo = db.getModel('foos');
    });

    const toIncludeExpect = (options: any, logging = false) => {
      const include = toInclude(options, {
        Model: Foo,
        associations: Foo.associations,
      });
      if (logging) {
        console.log(JSON.stringify(include, null, 2));
      }
      return expect(include);
    };

    it('normal columns', () => {
      toIncludeExpect({
        fields: ['col1', 'col2'],
      }).toEqual({ attributes: [ 'col1', 'col2' ] });
    });

    it('association count attribute', () => {
      toIncludeExpect({
        fields: ['col1', 'bars_count'],
      }).toEqual({ attributes: [ 'col1', Foo.withCountAttribute('bars') ] });
    });

    it('association without attributes', () => {
      toIncludeExpect({
        fields: ['col1', 'bars'],
      }).toEqual({
        attributes: [ 'col1' ],
        include: [
          {
            association: 'bars',
          }
        ],
      });
    });

    it('association attributes', () => {
      toIncludeExpect({
        fields: ['col1', 'bars.col1', 'bars.col2'],
      }).toEqual({
        attributes: [ 'col1' ],
        include: [
          {
            association: 'bars',
            attributes: [ 'col1', 'col2' ],
          }
        ],
      });
    });

    it('association attributes', () => {
      toIncludeExpect({
        fields: ['col1', ['bars', 'col1'], ['bars', 'col2']],
      }).toEqual({
        attributes: [ 'col1' ],
        include: [
          {
            association: 'bars',
            attributes: [ 'col1', 'col2' ],
          }
        ],
      });
    });

    it('nested association', () => {
      toIncludeExpect({
        fields: ['col1', 'bars.baz'],
      }).toEqual({
        attributes: [ 'col1' ],
        include: [
          {
            association: 'bars',
            attributes: [],
            include: [
              {
                association: 'baz',
              }
            ]
          }
        ],
      });
    });

    it.skip('nested association', () => {
      // TODO，输出 bars 的所有字段
      toIncludeExpect({
        fields: ['col1', 'bars', 'bars.baz'],
      }, true).toEqual({
        attributes: [ 'col1' ],
        include: [
          {
            association: 'bars',
            include: [
              {
                association: 'baz',
              }
            ]
          }
        ],
      });
    });

    it('nested association', () => {
      toIncludeExpect({
        fields: ['col1', 'bars.col1', 'bars.col2', 'bars.baz'],
      }).toEqual({
        attributes: [ 'col1' ],
        include: [
          {
            association: 'bars',
            attributes: ['col1', 'col2'],
            include: [
              {
                association: 'baz',
              }
            ]
          }
        ],
      });
    });

    it('nested association', () => {
      // TODO，输出 bars 的所有字段
      toIncludeExpect({
        fields: ['col1', 'bars.col1', 'bars.col2', 'bars.baz.col1', 'bars.baz.col2'],
      }).toEqual({
        attributes: [ 'col1' ],
        include: [
          {
            association: 'bars',
            attributes: ['col1', 'col2'],
            include: [
              {
                association: 'baz',
                attributes: ['col1', 'col2'],
              }
            ]
          }
        ],
      });
    });

    it('append attributes', () => {
      toIncludeExpect({
        fields: {
          appends: ['bars_count'],
        },
      }).toEqual({
        attributes: {
          include: [Foo.withCountAttribute('bars')],
        },
      });
    });

    it('append attributes', () => {
      toIncludeExpect({
        fields: {
          appends: ['bars.col1', 'bars_count'],
        },
      }).toEqual({
        attributes: {
          include: [Foo.withCountAttribute('bars')],
        },
        include: [
          {
            association: 'bars',
            attributes: {
              include: ['col1'],
            },
          }
        ]
      });
    });

    it('only & append attributes', () => {
      toIncludeExpect({
        fields: {
          only: ['col1'],
          appends: ['bars_count'],
        },
      }).toEqual({
        attributes: ['col1', Foo.withCountAttribute('bars')],
      });
    });

    it('only & append attributes', () => {
      toIncludeExpect({
        fields: {
          only: ['col1', 'bars.col1'],
          appends: ['bars_count'],
        },
      }).toEqual({
        attributes: ['col1', Foo.withCountAttribute('bars')],
        include: [
          {
            association: 'bars',
            attributes: ['col1'],
          }
        ],
      });
    });

    it('excpet attributes', () => {
      toIncludeExpect({
        fields: {
          except: ['col1'],
        },
      }).toEqual({
        attributes: {
          include: [],
          exclude: ['col1'],
        },
      });
    });

    it('excpet attributes', () => {
      toIncludeExpect({
        fields: {
          except: ['col1', 'bars.col1'],
        },
      }).toEqual({
        attributes: {
          include: [],
          exclude: ['col1'],
        },
        include: [
          {
            association: 'bars',
            attributes: {
              include: [],
              exclude: ['col1'],
            }
          }
        ]
      });
    });

    it('excpet & append attributes', () => {
      toIncludeExpect({
        fields: {
          except: ['col1'],
          appends: ['bars_count'],
        },
      }).toEqual({
        attributes: {
          include: [Foo.withCountAttribute('bars')],
          exclude: ['col1'],
        },
      });
    });

    describe('where options', () => {
      it('where', () => {
        toIncludeExpect({
          filter: {
            col1: 'val1',
          },
          fields: {
            except: ['col1'],
            appends: ['bars_count'],
          },
        }).toEqual({
          attributes: {
            include: [Foo.withCountAttribute('bars')],
            exclude: ['col1'],
          },
          where: {
            col1: 'val1',
          },
        });
      });

      it('where', () => {
        toIncludeExpect({
          filter: {
            col1: 'val1',
            bars: {
              col1: 'val1',
            }
          },
          fields: {
            except: ['col1'],
            appends: ['bars', 'bars_count'],
          },
        }).toEqual({
          attributes: {
            include: [Foo.withCountAttribute('bars')],
            exclude: ['col1'],
          },
          where: {
            col1: 'val1',
          },
          include: [
            {
              association: 'bars',
              where: {
                col1: 'val1',
              }
            }
          ]
        });
      });

      it('where', () => {
        toIncludeExpect({
          filter: {
            col1: 'val1',
            bars: {
              col1: 'val1',
            }
          },
          fields: {
            except: ['col1'],
            appends: ['bars_count'],
          },
        }).toEqual({
          attributes: {
            include: [Foo.withCountAttribute('bars')],
            exclude: ['col1'],
          },
          where: {
            col1: 'val1',
          },
          include: [
            {
              association: 'bars',
              where: {
                col1: 'val1',
              }
            }
          ]
        });
      });
      
      it('parseApiJson', () => {
        const data = Foo.parseApiJson({
          filter: {
            col1: 'co2',
          }
        });
        expect(data).toEqual({ where: { col1: 'co2' } });
      });

      it('parseApiJson', () => {
        const data = Foo.parseApiJson({
          fields: ['col1'],
        });
        expect(data).toEqual({ attributes: ['col1'] });
      });

      it('parseApiJson', () => {
        const data = Foo.parseApiJson({
          fields: ['col1'],
          filter: {
            col1: 'co2',
          },
        });
        expect(data).toEqual({ attributes: ['col1'], where: { col1: 'co2' } });
      });

      it('parseApiJson', () => {
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

      it('parseApiJson', () => {
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

  describe('requireModule', () => {
    test('toBeTruthy', () => {
      const r = requireModule(true);
      expect(r).toBeTruthy();
    });

    test('toBeInstanceOf Function', () => {
      const r = requireModule(() => {});
      expect(r).toBeInstanceOf(Function);
    });

    test('toBeInstanceOf Function', () => {
      const r = requireModule(path.resolve(__dirname, './modules/fn'));
      expect(r).toBeInstanceOf(Function);
    });

    test('toBeInstanceOf Function', () => {
      const r = requireModule(path.resolve(__dirname, './modules/fnts'));
      expect(r).toBeInstanceOf(Function);
    });

    test('object', () => {
      const r = requireModule(path.resolve(__dirname, './modules/obj'));
      expect(r).toEqual({
        'foo': 'bar',
      });
    });

    test('object', () => {
      const r = requireModule(path.resolve(__dirname, './modules/objts'));
      expect(r).toEqual({
        'foo': 'bar',
      });
    });

    test('json', () => {
      const r = requireModule(path.resolve(__dirname, './modules/json'));
      expect(r).toEqual({
        'foo': 'bar',
      });
    });
  });
});
