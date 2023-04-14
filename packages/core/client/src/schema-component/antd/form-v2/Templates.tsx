import { Form } from '@formily/core';
import { useFieldSchema, useForm } from '@formily/react';
import { forEach } from '@nocobase/utils/client';
import { Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useAPIClient } from '../../../api-client';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { useSchemaTemplate } from '../../../schema-templates';

export const Templates = () => {
  const fieldSchema = useFieldSchema();
  const templates = findDataTemplates(fieldSchema);
  const defaultTemplate = templates.find((item) => item.default);
  const [value, setValue] = React.useState(defaultTemplate?.id || templates.length);
  const api = useAPIClient();
  const [templateData, setTemplateData] = React.useState<any>(null);
  const form = useForm();

  useEffect(() => {
    if (defaultTemplate) {
      fetchTemplateData(api, defaultTemplate).then((data) => {
        setTemplateData(data);
      });
    }
  }, []);

  useEffect(() => {
    if (value === templates.length - 1) {
      return;
    }
    const template = templates.find((item) => item.id === value);
    changeFormValues(form, templateData, template);
  }, [templateData]);

  if (templates) {
    templates.push({
      title: '不使用模板',
      id: templates.length,
    });
  }

  const handleChange = useCallback(async (value, option) => {
    setValue(value);
    if (value !== templates.length - 1) {
      setTemplateData(await fetchTemplateData(api, option));
    }
  }, []);

  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f8f8', padding: '1em' }}>
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

Templates.Designer = () => {
  const template = useSchemaTemplate();

  return (
    <GeneralSchemaDesigner template={template}>
      <SchemaSettings.Remove />
    </GeneralSchemaDesigner>
  );
};

function findDataTemplates(fieldSchema) {
  while (fieldSchema) {
    if (fieldSchema['x-component'] === 'Grid' || fieldSchema['x-data-templates']) {
      return (
        fieldSchema['x-data-templates']?.map((item, i) => {
          return {
            id: i,
            ...item,
          };
        }) || []
      );
    }
    fieldSchema = fieldSchema.parent;
  }
  return [];
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

function changeFormValues(form: Form<any>, data, template: { collection: string; dataId: number; fields: string[] }) {
  if (!data) {
    return;
  }

  forEach(template.fields, (field: string) => {
    const key = field.split('.')[0];
    _.set(form.values, key, _.get(data, key));
  });
}
