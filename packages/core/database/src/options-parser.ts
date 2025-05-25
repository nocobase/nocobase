/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import lodash from 'lodash';
import { FindAttributeOptions, ModelStatic, Op, Sequelize } from 'sequelize';
import { Collection } from './collection';
import { Database } from './database';
import FilterParser from './filter-parser';
import { Appends, Except, FindOptions } from './repository';
import qs from 'qs';

const debug = require('debug')('noco-database');

interface OptionsParserContext {
  collection: Collection;
  targetKey?: string;
}

export class OptionsParser {
  options: FindOptions;
  database: Database;
  collection: Collection;
  model: ModelStatic<any>;
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

  static appendInheritInspectAttribute(include, collection): any {
    // if include already has __tableName, __schemaName, skip
    if (include.find((item) => item?.[1] === '__tableName')) {
      return;
    }

    include.push([
      Sequelize.literal(`(select relname from pg_class where pg_class.oid = "${collection.name}".tableoid)`),
      '__tableName',
    ]);

    include.push([
      Sequelize.literal(`
        (SELECT n.nspname
        FROM pg_class c
               JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.oid = "${collection.name}".tableoid)
      `),
      '__schemaName',
    ]);
  }

  isAssociation(key: string) {
    return this.model.associations[key] !== undefined;
  }

  isAssociationPath(path: string) {
    return this.isAssociation(path.split('.')[0]);
  }

  filterByTkToWhereOption() {
    const filterByTkOption = this.options?.filterByTk;

    if (!filterByTkOption) {
      return {};
    }

    // multi filter target key
    if (lodash.isPlainObject(this.options.filterByTk)) {
      const where = {};
      for (const [key, value] of Object.entries(filterByTkOption)) {
        where[key] = value;
      }

      return where;
    }

    // single filter target key
    const filterTargetKey = this.context.targetKey || this.collection.filterTargetKey;

    if (Array.isArray(filterTargetKey)) {
      throw new Error('multi filter target key value must be object');
    }

    return {
      [filterTargetKey]: filterByTkOption,
    };
  }

  toSequelizeParams(options: { parseSort?: boolean } = { parseSort: true }) {
    const queryParams = this.filterParser.toSequelizeParams();

    if (this.options?.filterByTk) {
      const filterByTkWhere = this.filterByTkToWhereOption();
      queryParams.where = {
        [Op.and]: [queryParams.where, filterByTkWhere],
      };
    }

    if (this.options?.include) {
      if (!queryParams.include) {
        queryParams.include = [];
      }

      queryParams.include.push(...lodash.castArray(this.options.include));
    }
    const fields = this.parseFields(queryParams);
    return options.parseSort ? this.parseSort(fields) : fields;
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

    let defaultSortField: Array<string> | string = this.model.primaryKeyAttribute;

    if (Array.isArray(this.collection.filterTargetKey)) {
      defaultSortField = this.collection.filterTargetKey;
    }

    if (!defaultSortField && this.collection.filterTargetKey && !Array.isArray(this.collection.filterTargetKey)) {
      defaultSortField = this.collection.filterTargetKey;
    }

    if (defaultSortField && !this.options?.group) {
      defaultSortField = lodash.castArray(defaultSortField);
      for (const key of defaultSortField) {
        if (!sort.includes(key)) {
          sort.push(key);
        }
      }
    }

    const orderParams = [];

    for (const sortKey of sort) {
      let direction = sortKey.startsWith('-') ? 'DESC' : 'ASC';
      const sortField: Array<any> = sortKey.startsWith('-') ? sortKey.replace('-', '').split('.') : sortKey.split('.');

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
      } else {
        const rawField = this.model.rawAttributes[sortField[0]];
        sortField[0] = rawField?.field || sortField[0];
      }

      sortField.push(direction);
      if (this.database.isMySQLCompatibleDialect()) {
        const fieldName = sortField[0];

        // @ts-ignore
        if (this.model.fieldRawAttributesMap[fieldName]) {
          orderParams.push([Sequelize.fn('ISNULL', Sequelize.col(`${this.model.name}.${sortField[0]}`))]);
        }
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

  protected parseFields(filterParams: any) {
    const appends = this.options?.appends || [];
    const except = [];

    if (this.options?.attributes) {
      return {
        attributes: this.options.attributes,
      };
    }

    let attributes: FindAttributeOptions = {
      include: [],
      exclude: [],
    }; // out put all fields by default

    if (this.collection.isParent()) {
      OptionsParser.appendInheritInspectAttribute(attributes.include, this.collection);
    }

    if (this.options?.fields) {
      attributes = [];

      if (this.collection.isParent()) {
        OptionsParser.appendInheritInspectAttribute(attributes, this.collection);
      }

      // 将fields拆分为 attributes 和 appends
      for (const field of this.options.fields) {
        if (this.isAssociationPath(field)) {
          // field is association field
          appends.push(field);
        } else {
          // field is model attribute, change attributes to array type
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

      const existIncludeIndex = queryParams['include'].findIndex((include) => include['association'] == association);

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

  protected parseAppendWithOptions(append: string) {
    const parts = append.split('(');
    const obj: { name: string; options?: object; raw?: string } = {
      name: parts[0],
    };

    if (parts.length > 1) {
      const optionsStr = parts[1].replace(')', '');
      obj.options = qs.parse(optionsStr);
      obj.raw = `(${optionsStr})`;
    }

    return obj;
  }

  protected parseAppends(appends: Appends, filterParams: any) {
    if (!appends) return filterParams;

    // sort appends by path length
    appends = lodash.sortBy(appends, (append) => append.split('.').length);

    /**
     * set include params
     * @param model
     * @param queryParams
     * @param append
     */
    const setInclude = (model: ModelStatic<any>, queryParams: any, append: string) => {
      const appendWithOptions = this.parseAppendWithOptions(append);

      append = appendWithOptions.name;

      const appendFields = append.split('.');
      const appendAssociation = appendFields[0];

      const associations = model.associations;

      // if append length less or equal 2
      // example:
      //  appends: ['posts']
      //  appends: ['posts.title']
      //  All of these can be seen as last level
      let lastLevel = false;

      if (appendFields.length == 1) {
        lastLevel = true;
      }

      if (appendFields.length == 2) {
        const association = associations[appendFields[0]];
        if (!association) {
          throw new Error(`association ${appendFields[0]} in ${model.name} not found`);
        }

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

      // if include from filter, remove fromFilter attribute
      if (existIncludeIndex != -1) {
        delete queryParams['include'][existIncludeIndex]['fromFilter'];

        // set include attributes to all attributes
        if (
          Array.isArray(queryParams['include'][existIncludeIndex]['attributes']) &&
          queryParams['include'][existIncludeIndex]['attributes'].length == 0
        ) {
          queryParams['include'][existIncludeIndex]['attributes'] = {
            include: [],
          };
        }
      }

      if (
        lastLevel &&
        existIncludeIndex != -1 &&
        lodash.get(queryParams, ['include', existIncludeIndex, 'attributes', 'include'])?.length == 0
      ) {
        // if append is last level and association exists, ignore it
        return;
      }

      // if association not exist, create it
      if (existIncludeIndex == -1) {
        // association not exists
        queryParams['include'].push({
          association: appendAssociation,
          options: appendWithOptions.options || {},
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
        const existInclude = queryParams['include'][existIncludeIndex];
        if (existInclude.attributes && Array.isArray(existInclude.attributes) && existInclude.attributes.length == 0) {
          existInclude.attributes = {
            include: [],
          };
        }

        let nextAppend = appendFields.filter((_, index) => index !== 0).join('.');
        if (appendWithOptions.raw) {
          nextAppend += appendWithOptions.raw;
        }

        setInclude(
          model.associations[queryParams['include'][existIncludeIndex].association].target,
          queryParams['include'][existIncludeIndex],
          nextAppend,
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
