import { Form } from '@formily/core';
import { useFieldSchema } from '@formily/react';
import { forEach } from '@nocobase/utils/client';
import { Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useAPIClient } from '../../../api-client';
import { findFormBlock } from '../../../block-provider';
import { useCollectionManager } from '../../../collection-manager';

interface ITemplate {
  templates: {
    id?: number;
    title: string;
    collection: string;
    dataId: number;
    fields: string[];
    notUseTemplate?: boolean;
    default?: boolean;
  }[];
  /** 是否在 Form 区块显示模板选择器 */
  display: boolean;
}

export const Templates = ({ style = {}, form }) => {
  const fieldSchema = useFieldSchema();
  const { templates = [], display = true } = findDataTemplates(fieldSchema);
  const defaultTemplate = templates.find((item) => item.default);
  const [value, setValue] = React.useState(defaultTemplate?.id === undefined ? templates.length : defaultTemplate?.id);
  const api = useAPIClient();
  const [templateData, setTemplateData] = React.useState<any>(null);
  const { getCollectionFields } = useCollectionManager();

  useEffect(() => {
    if (defaultTemplate) {
      fetchTemplateData(api, defaultTemplate).then((data) => {
        setTemplateData(data);
      });
    }
  }, []);

  useEffect(() => {
    if (templates[value]?.notUseTemplate) {
      return;
    }
    const template = templates.find((item) => item.id === value);
    if (template && form) {
      const fields = getCollectionFields(template.collection);
      changeFormValues(form, templateData, template, fields);
    }
  }, [templateData]);

  addId(templates);

  const handleChange = useCallback(async (value, option) => {
    setValue(value);
    if (!option.notUseTemplate) {
      setTemplateData(await fetchTemplateData(api, option));
    } else {
      form?.reset();
    }
  }, []);

  if (!templates.length || !display) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f8f8', padding: '1em', ...style }}>
      <label style={{ fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap' }}>数据模板：</label>
      <Select
        style={{ width: '8em' }}
        options={templates}
        fieldNames={{ label: 'title', value: 'id' }}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

function findDataTemplates(fieldSchema): ITemplate {
  const formSchema = findFormBlock(fieldSchema);
  if (formSchema) {
    return _.cloneDeep(formSchema['x-template-data']) || {};
  }
  return {} as ITemplate;
}

async function fetchTemplateData(api, template: { collection: string; dataId: number; fields: string[] }) {
  return api
    .resource(template.collection)
    .get({
      filterByTk: template.dataId,
      fields: template.fields,
    })
    .then((data) => {
      return data.data?.data;
    });
}

function changeFormValues(
  form: Form<any>,
  data,
  template: { collection: string; dataId: number; fields: string[] },
  fields: any[],
) {
  if (!data) {
    return;
  }

  const deleteSystemFields = (data) => {
    if (!data) return;
    delete data.id;
    delete data.sort;
    delete data.createdById;
    delete data.createdBy;
    delete data.createdAt;
    delete data.updatedById;
    delete data.updatedBy;
    delete data.updatedAt;
  };

  const map = {
    hasOne(data, fieldData) {
      if (!data) return data;
      deleteSystemFields(data);
      delete data[fieldData.targetKey];
      delete data[fieldData.foreignKey];
      return data;
    },
    hasMany(data, fieldData) {
      return data?.map((item) => {
        if (!item) return item;
        deleteSystemFields(item);
        delete item[fieldData.targetKey];
        delete item[fieldData.foreignKey];
        return item;
      });
    },
    belongsTo(data, fieldData) {
      if (!data) return data;
      deleteSystemFields(data);
      return data;
    },
    belongsToMany(data, fieldData, parentData) {
      if (parentData) {
        delete parentData[fieldData.sourceKey];
      }
      return data.map((item) => {
        if (!item) return item;
        deleteSystemFields(item);
        delete item[fieldData.targetKey];
        const through = item[fieldData.through];
        if (through) {
          deleteSystemFields(through);
          delete through[fieldData.foreignKey];
          delete through[fieldData.otherKey];
        }
        return item;
      });
    },
  };

  forEach(template.fields, (field: string) => {
    const key = field.split('.')[0];
    const fieldData = fields.find((item) => item.name === key);

    _.set(
      form.values,
      key,
      map[fieldData.type] ? map[fieldData.type](_.get(data, key), fieldData, data) : _.get(data, key),
    );
  });
}

function addId(templates: ITemplate['templates']) {
  templates.unshift({
    title: '不使用模板',
    notUseTemplate: true,
  } as ITemplate['templates'][0]);
  templates.forEach((item, index) => {
    item.id = index;
  });
}
