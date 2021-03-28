import { getDatabase } from '..';
import Database from '../../database';
import Model, { ModelCtor } from '../../model';
import { toInclude } from '../../utils';



describe('toInclude', () => {
  let db: Database;
  let Foo: ModelCtor<Model>;
  beforeEach(() => {
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

  afterEach(() => db.close());

  const toIncludeExpect = (options: any, logging = false) => {
    const include = toInclude(options, {
      model: Foo,
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
    }).toEqual({ attributes: ['col1', 'col2'] });
  });

  it('association count attribute', () => {
    toIncludeExpect({
      fields: ['col1', 'bars_count'],
    }).toEqual({ attributes: ['col1', Foo.withCountAttribute('bars')] });
  });

  it('association without attributes', () => {
    toIncludeExpect({
      fields: ['col1', 'bars'],
    }).toEqual({
      attributes: ['col1'],
      include: [
        {
          association: 'bars',
        }
      ],
      distinct: true,
    });
  });

  it('association attributes', () => {
    toIncludeExpect({
      fields: ['col1', 'bars.col1', 'bars.col2'],
    }).toEqual({
      attributes: ['col1'],
      include: [
        {
          association: 'bars',
          attributes: ['col1', 'col2'],
        }
      ],
      distinct: true,
    });
  });

  it('association attributes', () => {
    toIncludeExpect({
      fields: ['col1', ['bars', 'col1'], ['bars', 'col2']],
    }).toEqual({
      attributes: ['col1'],
      include: [
        {
          association: 'bars',
          attributes: ['col1', 'col2'],
        }
      ],
      distinct: true,
    });
  });

  it('nested association', () => {
    toIncludeExpect({
      fields: ['col1', 'bars.baz'],
    }).toEqual({
      attributes: ['col1'],
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
      distinct: true,
    });
  });

  it('nested association', () => {
    toIncludeExpect({
      fields: ['col1', 'bars', 'bars.baz'],
    }, true).toEqual({
      attributes: ['col1'],
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
      distinct: true,
    });
  });

  it('nested association', () => {
    toIncludeExpect({
      fields: ['col1', 'bars.baz', 'bars'],
    }, true).toEqual({
      attributes: ['col1'],
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
      distinct: true,
    });
  });

  it('nested association', () => {
    toIncludeExpect({
      fields: ['col1', 'bars.col1', 'bars.col2', 'bars.baz'],
    }).toEqual({
      attributes: ['col1'],
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
      distinct: true,
    });
  });

  it('nested association', () => {
    // TODO，输出 bars 的所有字段
    toIncludeExpect({
      fields: ['col1', 'bars.col1', 'bars.col2', 'bars.baz.col1', 'bars.baz.col2'],
    }).toEqual({
      attributes: ['col1'],
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
      distinct: true,
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
      ],
      distinct: true,
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
      distinct: true,
    });
  });

  it('excpet attributes', () => {
    toIncludeExpect({
      fields: {
        except: ['col1'],
      },
    }).toEqual({
      attributes: {
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
        exclude: ['col1'],
      },
      include: [
        {
          association: 'bars',
          attributes: {
            exclude: ['col1'],
          }
        }
      ],
      distinct: true,
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
        ],
        distinct: true,
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
        ],
        distinct: true,
      });
    });

  });

});
