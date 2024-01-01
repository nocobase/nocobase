import { Plugin } from '../application/Plugin';
import { CollectionManagerSchemaComponentProvider } from './CollectionManagerSchemaComponentProvider';
import { InheritanceCollectionMixin } from './collection-mixins/InheritanceCollectionMixin';
import {
  checkbox,
  checkboxGroup,
  chinaRegion,
  collection,
  color,
  createdAt,
  createdBy,
  datetime,
  email,
  icon,
  id,
  input,
  integer,
  json,
  linkTo,
  m2m,
  m2o,
  markdown,
  multipleSelect,
  number,
  o2m,
  o2o,
  password,
  percent,
  phone,
  radioGroup,
  richText,
  select,
  subTable,
  tableoid,
  textarea,
  time,
  updatedAt,
  updatedBy,
  url,
} from './interfaces';
import {
  calendarCollectionTemplate,
  expressionCollectionTemplate,
  generalCollectionTemplate,
  sqlCollectionTemplate,
  treeCollectionTemplate,
  viewCollectionTemplate,
} from './templates';
export {
  useCollectionFilterOptions,
  useSortFields,
  useLinkageCollectionFilterOptions,
  useCollectionFieldsOptions,
} from './action-hooks';
export * from './CollectionManagerSchemaComponentProvider';
export * from './CollectionManagerShortcut';
export * from './Configuration';
export { registerField, registerGroup, registerGroupLabel, getOptions } from './Configuration/interfaces';
export * from './context';
export * from './hooks';
export * as interfacesProperties from './interfaces/properties';
export * from './ResourceActionProvider';
export { getConfigurableProperties } from './templates/properties';
export * from './CollectionHistoryProvider';
export * from './interfaces/properties';
export * from './CollectionCategroriesProvider';
export * from './collection-mixins';

export class CollectionPlugin extends Plugin {
  async load() {
    this.app.addProviders([CollectionManagerSchemaComponentProvider]);
    this.addCollectionTemplates();
    this.addCollectionFieldInterfaces();
    this.collectionManager.addCollectionMixins([InheritanceCollectionMixin]);

    this.collectionManager.setReloadCollections(this.reloadCollections.bind(this));
    await this.collectionManager.reload();
  }

  addCollectionFieldInterfaces() {
    this.app.collectionManager.addCollectionFieldInterfaces([
      checkbox,
      checkboxGroup,
      chinaRegion,
      collection,
      color,
      createdAt,
      createdBy,
      datetime,
      email,
      icon,
      id,
      input,
      integer,
      json,
      linkTo,
      m2m,
      m2o,
      markdown,
      multipleSelect,
      number,
      o2m,
      o2o,
      password,
      percent,
      phone,
      radioGroup,
      richText,
      select,
      subTable,
      tableoid,
      textarea,
      time,
      updatedAt,
      updatedBy,
      url,
    ]);
  }

  addCollectionTemplates() {
    this.app.collectionManager.addCollectionTemplates([
      calendarCollectionTemplate,
      expressionCollectionTemplate,
      generalCollectionTemplate,
      sqlCollectionTemplate,
      treeCollectionTemplate,
      viewCollectionTemplate,
    ]);
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

    const collections = (service?.data?.data || []).map(({ rawTitle, title, fields, ...collection }) => ({
      ...collection,
      title: rawTitle ? title : this.app.i18n.t(title),
      rawTitle: rawTitle || title,
      fields: fields.map(({ uiSchema, ...field }) => {
        if (uiSchema?.title) {
          const title = uiSchema.title;
          uiSchema.title = uiSchema.rawTitle ? title : this.app.i18n.t(title);
          uiSchema.rawTitle = uiSchema.rawTitle || title;
        }
        if (uiSchema?.enum) {
          uiSchema.enum = uiSchema.enum.map((item) => ({
            ...item,
            value: item?.value || item,
            label: item.rawLabel ? item.label : this.app.i18n.t(item.label),
            rawLabel: item.rawLabel || item.label,
          }));
        }
        return { uiSchema, ...field };
      }),
    }));

    return collections;
  }
}
