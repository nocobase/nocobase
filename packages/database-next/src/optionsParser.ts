import _, { filter } from 'lodash';

import { Collection } from './collection';
import { Appends, Expect, FindOptions } from './repository';
import FilterParser from './filterParser';
import { FindAttributeOptions } from 'sequelize';
import fields from '@nocobase/database/examples/plugins/db-driven/tables/fields';

const debug = require('debug')('noco-database');

export class OptionsParser {
  options: FindOptions;
  collection: Collection;
  filterParser: FilterParser;

  constructor(collection: Collection, options: FindOptions) {
    this.collection = collection;
    this.options = options;
    this.filterParser = new FilterParser(collection, options?.filter);
  }

  isAssociation(key: string) {
    return this.collection.model.associations[key] !== undefined;
  }

  isAssociationPath(path: string) {
    return this.isAssociation(path.split('.')[0]);
  }

  toSequelizeParams() {
    const filterParams = this.filterParser.toSequelizeParams();

    const associations = this.collection.model.associations;
    const appends = this.options.appends || [];
    const expect = [];

    let attributes: FindAttributeOptions = {
      include: [],
      exclude: [],
    }; // out put all fields by default

    if (this.options.fields) {
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

    if (this.options.expect) {
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
    const associations = this.collection.model.associations;

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
