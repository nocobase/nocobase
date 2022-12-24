import { FindAttributeOptions, ModelCtor, Op, Sequelize } from 'sequelize';
import { Collection } from './collection';
import { Database } from './database';
import FilterParser from './filter-parser';
import { Appends, Except, FindOptions } from './repository';

const debug = require('debug')('noco-database');

interface OptionsParserContext {
  collection: Collection;
  targetKey?: string;
}

export class OptionsParser {
  options: FindOptions;
  database: Database;
  collection: Collection;
  model: ModelCtor<any>;
  filterParser: FilterParser;
  context: OptionsParserContext;

  constructor(options: FindOptions, context: OptionsParserContext) {
    const { collection } = context;

    this.collection = collection;
    this.model = collection.model;
    this.options = options;
    this.database = collection.context.database;
    this.filterParser = new FilterParser(options?.filter, {
      collection,
      app: {
        ctx: options?.context,
      },
    });
    this.context = context;
  }

  isAssociation(key: string) {
    return this.model.associations[key] !== undefined;
  }

  isAssociationPath(path: string) {
    return this.isAssociation(path.split('.')[0]);
  }

  toSequelizeParams() {
    const queryParams = this.filterParser.toSequelizeParams();

    if (this.options?.filterByTk) {
      queryParams.where = {
        [Op.and]: [
          queryParams.where,
          {
            [this.context.targetKey || this.collection.filterTargetKey]: this.options.filterByTk,
          },
        ],
      };
    }

    return this.parseSort(this.parseFields(queryParams));
  }

  /**
   * parser sort options
   * @param filterParams
   * @protected
   */
  protected parseSort(filterParams) {
    let sort = this.options?.sort || [];
    if (typeof sort === 'string') {
      sort = sort.split(',');
    }

    const orderParams = [];
    for (const sortKey of sort) {
      let direction = sortKey.startsWith('-') ? 'DESC' : 'ASC';
      let sortField: Array<any> = sortKey.replace('-', '').split('.');
      if (this.database.inDialect('postgres', 'sqlite')) {
        direction = `${direction} NULLS LAST`;
      }
      // handle sort by association
      if (sortField.length > 1) {
        let associationModel = this.model;
        for (let i = 0; i < sortField.length - 1; i++) {
          const associationKey = sortField[i];
          sortField[i] = associationModel.associations[associationKey].target;
          associationModel = sortField[i];
        }
      }
      sortField.push(direction);
      if (this.database.inDialect('mysql')) {
        orderParams.push([Sequelize.fn('ISNULL', Sequelize.col(`${this.model.name}.${sortField[0]}`))]);
      }
      orderParams.push(sortField);
    }

    if (orderParams.length > 0) {
      return {
        order: orderParams,
        ...filterParams,
      };
    }

    return filterParams;
  }

  protected inheritFromSubQuery(): any {
    return [
      Sequelize.literal(`(select relname from pg_class where pg_class.oid = "${this.collection.name}".tableoid)`),
      '__tableName',
    ];
  }

  protected parseFields(filterParams: any) {
    const appends = this.options?.appends || [];
    const except = [];

    let attributes: FindAttributeOptions = {
      include: [],
      exclude: [],
    }; // out put all fields by default

    if (this.collection.isParent()) {
      attributes.include.push(this.inheritFromSubQuery());
    }

    if (this.options?.fields) {
      // 将fields拆分为 attributes 和 appends
      for (const field of this.options.fields) {
        if (this.isAssociationPath(field)) {
          // field is association field
          appends.push(field);
        } else {
          // field is model attribute, change attributes to array type
          if (!Array.isArray(attributes)) attributes = [];

          attributes.push(field);
        }
      }
    }

    if (this.options?.except) {
      for (const exceptKey of this.options.except) {
        if (this.isAssociationPath(exceptKey)) {
          // except association field
          except.push(exceptKey);
        } else {
          // if attributes is array form, ignore except
          if (Array.isArray(attributes)) continue;
          attributes.exclude.push(exceptKey);
        }
      }
    }

    return {
      attributes,
      ...this.parseExcept(except, this.parseAppends(appends, filterParams)),
    };
  }

  protected parseExcept(except: Except, filterParams: any) {
    if (!except) return filterParams;
    const setExcept = (queryParams: any, except: string) => {
      // split exceptKey to path form
      // posts.comments.content => ['posts', 'comments', 'content']
      // then set except on include attributes
      const exceptPath = except.split('.');
      const association = exceptPath[0];
      const lastLevel = exceptPath.length <= 2;

      let existIncludeIndex = queryParams['include'].findIndex((include) => include['association'] == association);

      if (existIncludeIndex == -1) {
        // if include not exists, ignore this except
        return;
      }

      if (lastLevel) {
        // if it not have exclude form
        if (Array.isArray(queryParams['include'][existIncludeIndex]['attributes'])) {
          return;
        } else {
          if (!queryParams['include'][existIncludeIndex]['attributes']['exclude']) {
            queryParams['include'][existIncludeIndex]['attributes']['exclude'] = [];
          }

          queryParams['include'][existIncludeIndex]['attributes']['exclude'].push(exceptPath[1]);
        }
      } else {
        setExcept(queryParams['include'][existIncludeIndex], exceptPath.filter((_, index) => index !== 0).join('.'));
      }
    };

    for (const exceptKey of except) {
      setExcept(filterParams, exceptKey);
    }

    return filterParams;
  }

  protected parseAppends(appends: Appends, filterParams: any) {
    if (!appends) return filterParams;

    /**
     * set include params
     * @param model
     * @param queryParams
     * @param append
     */
    const setInclude = (model: ModelCtor<any>, queryParams: any, append: string) => {
      const appendFields = append.split('.');
      const appendAssociation = appendFields[0];

      const associations = model.associations;

      // if append length less or equal 2
      // example:
      //  appends: ['posts']
      //  appends: ['posts.title']
      //  All of these can be seen as last level
      let lastLevel: boolean = false;

      if (appendFields.length == 1) {
        lastLevel = true;
      }

      if (appendFields.length == 2) {
        const associationModel = associations[appendFields[0]].target;
        if (associationModel.rawAttributes[appendFields[1]]) {
          lastLevel = true;
        }
      }

      // find association index
      if (queryParams['include'] == undefined) {
        queryParams['include'] = [];
      }

      let existIncludeIndex = queryParams['include'].findIndex(
        (include) => include['association'] == appendAssociation,
      );

      // if association not exist, create it
      if (existIncludeIndex == -1) {
        // association not exists
        queryParams['include'].push({
          association: appendAssociation,
        });

        existIncludeIndex = queryParams['include'].length - 1;
      }

      // end appends
      // without nests association
      if (lastLevel) {
        // get exist association attributes
        let attributes = queryParams['include'][existIncludeIndex]['attributes'] || {
          include: [], // all fields are output by default
        };

        // if need set attribute
        if (appendFields.length == 2) {
          if (!Array.isArray(attributes)) {
            attributes = [];
          }

          const attributeName = appendFields[1];

          // push field to it
          attributes.push(attributeName);
        } else {
          // if attributes is empty array, change it to object
          if (Array.isArray(attributes) && attributes.length == 0) {
            attributes = {
              include: [],
            };
          }
        }

        // set new attributes
        queryParams['include'][existIncludeIndex] = {
          ...queryParams['include'][existIncludeIndex],
          attributes,
        };
      } else {
        setInclude(
          model.associations[queryParams['include'][existIncludeIndex].association].target,
          queryParams['include'][existIncludeIndex],
          appendFields.filter((_, index) => index !== 0).join('.'),
        );
      }
    };

    // handle every appends
    for (const append of appends) {
      setInclude(this.model, filterParams, append);
    }

    debug('filter params: %o', filterParams);
    return filterParams;
  }
}
