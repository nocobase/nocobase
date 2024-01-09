import { Plugin } from '../application/Plugin';

import { InheritanceCollectionMixin } from './mixins/InheritanceCollectionMixin';
// import {
//   checkbox,
//   checkboxGroup,
//   chinaRegion,
//   collection,
//   color,
//   createdAt,
//   createdBy,
//   datetime,
//   email,
//   icon,
//   id,
//   input,
//   integer,
//   json,
//   linkTo,
//   m2m,
//   m2o,
//   markdown,
//   multipleSelect,
//   number,
//   o2m,
//   o2o,
//   password,
//   percent,
//   phone,
//   radioGroup,
//   richText,
//   select,
//   subTable,
//   tableoid,
//   textarea,
//   time,
//   updatedAt,
//   updatedBy,
//   url,
// } from './interfaces';
// import { general, expression, sql, tree, view } from './templates';
import { interfaces } from './Configuration/interfaces';
import { collectionTemplates } from './Configuration/templates';
import { collection } from './Configuration/schemas/collections';

export class CollectionPlugin extends Plugin {
  async load() {
    this.collectionManager.addCollectionMixins([InheritanceCollectionMixin]);
    this.addCollectionFieldInterfaces();
    this.addCollectionTemplates();

    this.collectionManager.setReloadFn(this.reloadCollections.bind(this));
    // await this.collectionManager.reload();
  }

  addCollectionFieldInterfaces() {
    this.app.collectionManager.addCollectionFieldInterfaces([...interfaces.values()]);
    // this.app.collectionManager.addCollectionFieldInterfaces([
    //   checkbox,
    //   checkboxGroup,
    //   chinaRegion,
    //   collection,
    //   color,
    //   createdAt,
    //   createdBy,
    //   datetime,
    //   email,
    //   icon,
    //   id,
    //   input,
    //   integer,
    //   json,
    //   linkTo,
    //   m2m,
    //   m2o,
    //   markdown,
    //   multipleSelect,
    //   number,
    //   o2m,
    //   o2o,
    //   password,
    //   percent,
    //   phone,
    //   radioGroup,
    //   richText,
    //   select,
    //   subTable,
    //   tableoid,
    //   textarea,
    //   time,
    //   updatedAt,
    //   updatedBy,
    //   url,
    // ]);
  }

  addCollectionTemplates() {
    this.app.collectionManager.addCollectionTemplates(Object.values(collectionTemplates));
    // this.app.collectionManager.addCollectionTemplates([expression, general, sql, tree, view]);
  }

  async reloadCollections() {
    const service = await this.app.apiClient.request<{
      data: any;
    }>({
      resource: 'collections',
      action: 'list',
      params: {
        paginate: false,
        appends: ['fields', 'category'],
        filter: {
          // inherit: false,
        },
        sort: ['sort'],
      },
    });

    return [...(service?.data?.data || []), collection];
  }
}
