import _, { filter } from 'lodash';

import { Collection } from './collection';
import { Appends, Expect, FindOptions } from './repository';
import FilterParser from './filterParser';
import { FindAttributeOptions, ModelCtor } from 'sequelize';
import { Database } from './database';

const debug = require('debug')('noco-database');

export class OptionsParser {
  options: FindOptions;
  database: Database;
  model: ModelCtor<any>;
  filterParser: FilterParser;

  constructor(model: ModelCtor<any>, database: Database, options: FindOptions) {
    this.model = model;
    this.options = options;
    this.database = database;
    this.filterParser = new FilterParser(model, this.database, options?.filter);
  }

  isAssociation(key: string) {
    return this.model.associations[key] !== undefined;
  }

  isAssociationPath(path: string) {
    return this.isAssociation(path.split('.')[0]);
  }

  parseFilterByPk() {
    if (this.options?.filterByPk) {
      return {
        where: {
          [this.model.primaryKeyAttribute]: this.options.filterByPk,
        },
      };
    }

    return null;
  }

  toSequelizeParams() {
    const filterParams = this.options?.filterByPk
      ? this.parseFilterByPk()
      : this.filterParser.toSequelizeParams();
    return this.parseSort(this.parseFields(filterParams));
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
    const expect = [];

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

    if (this.options?.expect) {
      for (const expectKey of this.options.expect) {
        if (this.isAssociationPath(expectKey)) {
          // expect association field
          expect.push(expectKey);
        } else {
          // if attributes is array form, ignore expect
          if (Array.isArray(attributes)) continue;
          attributes.exclude.push(expectKey);
        }
      }
    }

    return {
      attributes,
      ...this.parseExpect(expect, this.parseAppends(appends, filterParams)),
    };
  }

  protected parseExpect(expect: Expect, filterParams: any) {
    if (!expect) return filterParams;
    const setExpect = (queryParams: any, expect: string) => {
      // split expectKey to path form
      // posts.comments.content => ['posts', 'comments', 'content']
      // then set expect on include attributes
      const expectPath = expect.split('.');
      const association = expectPath[0];
      const lastLevel = expectPath.length <= 2;

      let existIncludeIndex = queryParams['include'].findIndex(
        (include) => include['association'] == association,
      );

      if (existIncludeIndex == -1) {
        // if include not exists, ignore this expect
        return;
      }

      if (lastLevel) {
        // if it not have exclude form
        if (
          Array.isArray(queryParams['include'][existIncludeIndex]['attributes'])
        ) {
          return;
        } else {
          if (
            !queryParams['include'][existIncludeIndex]['attributes']['exclude']
          ) {
            queryParams['include'][existIncludeIndex]['attributes']['exclude'] =
              [];
          }

          queryParams['include'][existIncludeIndex]['attributes'][
            'exclude'
          ].push(expectPath[1]);
        }
      } else {
        setExpect(
          queryParams['include'][existIncludeIndex],
          expectPath.filter((_, index) => index !== 0).join('.'),
        );
      }
    };

    for (const expectKey of expect) {
      setExpect(filterParams, expectKey);
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
        let attributes = queryParams['include'][existIncludeIndex][
          'attributes'
        ] || {
          include: [], // all fields are output by default
        };

        // if need set attribute
        if (appendFields.length == 2) {
          if (!Array.isArray(attributes)) {
            attributes = [];
            // push field to it
            attributes.push(appendFields[1]);
          }
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
          queryParams['include'][existIncludeIndex],
          appendFields.filter((_, index) => index !== 0).join('.'),
        );
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
