import { Appends, Except, FindOptions } from './repository';
import FilterParser from './filter-parser';
import { FindAttributeOptions, ModelCtor, Op } from 'sequelize';
import { Database } from './database';
import { Collection } from './collection';

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
    this.filterParser = new FilterParser(options?.filter, { collection });
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
    const sort = this.options?.sort || [];

    const orderParams = sort.map((sortKey: string) => {
      const direction = sortKey.startsWith('-') ? 'DESC' : 'ASC';
      const sortField: Array<any> = sortKey.replace('-', '').split('.');

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
      return sortField;
    });

    if (orderParams.length > 0) {
      return {
        order: orderParams,
        ...filterParams,
      };
    }

    return filterParams;
  }

  protected parseFields(filterParams: any) {
    const appends = this.options?.appends || [];
    const except = [];

    let attributes: FindAttributeOptions = {
      include: [],
      exclude: [],
    }; // out put all fields by default

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
    const associations = this.model.associations;

    /**
     * set include params
     * @param includeRoot
     * @param appends
     */
    const setInclude = (queryParams: any, append: string) => {
      const appendFields = append.split('.');
      const appendAssociation = appendFields[0];

      // if append length less or equal 2
      // example:
      //  appends: ['posts']
      //  appends: ['posts.title']
      //  All of these can be seen as last level
      const lastLevel = appendFields.length <= 2;

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

        existIncludeIndex = 0;
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

          // push field to it
          attributes.push(appendFields[1]);
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
        setInclude(queryParams['include'][existIncludeIndex], appendFields.filter((_, index) => index !== 0).join('.'));
      }
    };

    // handle every appends
    for (const append of appends) {
      const appendFields = append.split('.');

      if (!associations[appendFields[0]]) {
        throw new Error(`${append} is not a valid association`);
      }

      setInclude(filterParams, append);
    }

    debug('filter params: %o', filterParams);
    return filterParams;
  }
}
