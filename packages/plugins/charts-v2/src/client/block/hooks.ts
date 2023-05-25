import { useContext } from 'react';
import { ChartConfigContext } from './ChartConfigure';
import { useCollectionManager } from '@nocobase/client';
import { ISchema, Schema } from '@formily/react';
import { useTranslation } from 'react-i18next';
import { operators } from '@nocobase/client';

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

export const useFields = () => {
  const { t } = useTranslation();
  const { current } = useContext(ChartConfigContext);
  const { collection } = current || {};
  const { getCollectionFields } = useCollectionManager();
  const fields = (getCollectionFields(collection) || [])
    .filter((field) => {
      return !['set', 'password', 'json', 'belongsTo', 'hasMany', 'belongsToMany', 'hasOne'].includes(field.type);
    })
    .map((field) => ({
      key: field.key,
      label: field.uiSchema?.title || field.name,
      value: field.name,
      ...field,
    }));
  return Schema.compile(fields, { t });
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
    const fieldInterface = getInterface(field.interface || interfaceMap[field.name]);
    if (fieldInterface) {
      ops = fieldInterface?.filterable?.operators || [];
    } else {
      ops = operators[field.type] || [];
    }
    if (!ops.length) {
      return;
    }
    options.push({
      name: field.value,
      title: field.label,
      schema: field.uiSchema,
      operators: ops,
    });
  });
  return options;
};
