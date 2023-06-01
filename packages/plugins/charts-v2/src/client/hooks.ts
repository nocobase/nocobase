import { useContext } from 'react';
import { ChartConfigContext, SelectedField } from './block/ChartConfigure';
import { useCollectionManager } from '@nocobase/client';
import { ISchema, Schema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { operators } from '@nocobase/client';
import formatters from './block/formatters';

export type FieldOption = {
  value: string;
  label: string;
  key: string;
  alias?: string;
  name?: string;
  type?: string;
  interface?: string;
  uiSchema?: ISchema;
};

export const useFields = (collection?: string) => {
  const { t } = useTranslation();
  const { current } = useContext(ChartConfigContext);
  if (!collection) {
    collection = current?.collection || {};
  }
  const { getCollectionFields } = useCollectionManager();
  const fields = (getCollectionFields(collection) || [])
    .filter((field) => {
      return !['belongsTo', 'hasMany', 'belongsToMany', 'hasOne'].includes(field.type) && field.interface;
    })
    .map((field) => ({
      key: field.key,
      label: field.uiSchema?.title || field.name,
      value: field.name,
      ...field,
    }));
  return Schema.compile(fields, { t }) as FieldOption[];
};

export const useFilterOptions = (fields: FieldOption[]) => {
  const { getInterface } = useCollectionManager();
  const interfaceMap = {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    createdById: 'createdBy',
    updatedById: 'updatedBy',
  };

  const options = [];
  fields.forEach((field) => {
    let ops = [];
    let optionChildren = [];
    const fieldInterface = getInterface(field.interface || interfaceMap[field.name]);
    if (fieldInterface?.filterable) {
      const { children, operators } = fieldInterface.filterable;
      ops = operators || [];
      optionChildren = children;
    } else {
      ops = operators[field.type] || [];
    }
    if (!ops.length && !optionChildren.length) {
      return;
    }
    options.push({
      name: field.value,
      title: field.label,
      schema: field.uiSchema,
      operators: ops.filter((op) => {
        return !op?.visible || op.visible(field);
      }),
      children: optionChildren,
    });
  });
  return options;
};

export const useAllFields = (fields: FieldOption[]) => (field: any) => {
  /**
   * chartFields is used for configuring chart fields
   * since the default alias is field display name, we need to set the option values to field display name
   * see also: 'appendAliasToQuery' function in 'renderer/ChartRenderer.tsx'
   */
  const chartFields = fields.map((field) => ({
    ...field,
    value: field.label,
  }));
  // When field alias is set, appends it to the field list
  const getAliasFields = (selectedFields: SelectedField[]) => {
    return selectedFields
      .filter((selectedField) => selectedField.alias)
      .map((selectedField) => ({
        key: selectedField.alias,
        label: selectedField.alias,
        value: selectedField.alias,
      }));
  };
  const query = field.query('query').get('value') || {};
  const measures = query.measures || [];
  const dimensions = query.dimensions || [];
  const aliasFields = [...getAliasFields(measures), ...getAliasFields(dimensions)];
  // unique
  const map = new Map([...chartFields, ...aliasFields].map((item) => [item.value, item]));
  const allFields = [...map.values()];
  field.dataSource = allFields;
};

export const useFormatters = (fields: FieldOption[]) => (field: any) => {
  const selectedField = field.query('.field').get('value');
  if (!selectedField) {
    field.dataSource = [];
    return;
  }
  let options = [];
  const fieldInterface = fields.find((field) => field.name === selectedField)?.interface;
  switch (fieldInterface) {
    case 'datetime':
    case 'createdAt':
    case 'updatedAt':
      options = formatters.datetime;
      break;
    case 'date':
      options = formatters.date;
      break;
    case 'time':
      options = formatters.time;
      break;
    default:
      options = [];
  }
  field.dataSource = options;
};

export const useCollectionOptions = () => {
  const { t } = useTranslation();
  const { collections } = useCollectionManager();
  const options = collections.map((collection: { name: string; title: string }) => ({
    label: collection.title,
    value: collection.name,
    key: collection.name,
  }));
  return Schema.compile(options, { t });
};
