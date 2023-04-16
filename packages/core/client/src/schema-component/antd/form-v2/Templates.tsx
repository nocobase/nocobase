import { useFieldSchema } from '@formily/react';
import { Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { findFormBlock } from '../../../block-provider';

interface ITemplate {
  items: {
    key: string;
    title: string;
    collection: string;
    dataId: number;
    fields: string[];
    default?: boolean;
  }[];
  /** 是否在 Form 区块显示模板选择器 */
  display: boolean;
}

const useDataTemplates = () => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { items = [], display = true } = findDataTemplates(fieldSchema);
  const templates: any = [
    {
      key: 'none',
      title: t('None'),
    },
  ].concat(items.map<any>((t, i) => ({ key: i, ...t })));
  const defaultTemplate = items.find((item) => item.default);
  return {
    templates,
    display,
    defaultTemplate,
    enabled: items.length > 0,
  };
};

export const Templates = ({ style = {}, form }) => {
  const { templates, display, enabled, defaultTemplate } = useDataTemplates();
  const [value, setValue] = React.useState(defaultTemplate?.key || 'none');
  const api = useAPIClient();
  const { t } = useTranslation();

  useEffect(() => {
    if (defaultTemplate) {
      fetchTemplateData(api, defaultTemplate).then((data) => {
        if (form) {
          form.values = data;
        }
      });
    }
  }, []);

  const handleChange = useCallback(async (value, option) => {
    setValue(value);
    if (option.key !== 'none') {
      if (form) {
        form.values = await fetchTemplateData(api, option);
      }
    } else {
      form?.reset();
    }
  }, []);

  if (!enabled || !display) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f8f8', padding: '1em', ...style }}>
      <label style={{ fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: 8 }}>
        {t('Data template')}:{' '}
      </label>
      <Select
        // style={{ width: '8em' }}
        options={templates}
        fieldNames={{ label: 'title', value: 'key' }}
        value={value}
        onChange={handleChange}
      />
    </div>
  );
};

function findDataTemplates(fieldSchema): ITemplate {
  const formSchema = findFormBlock(fieldSchema);
  if (formSchema) {
    return _.cloneDeep(formSchema['x-data-templates']) || {};
  }
  return {} as ITemplate;
}

async function fetchTemplateData(api, template: { collection: string; dataId: number; fields: string[] }) {
  return api
    .resource(template.collection)
    .get({
      filterByTk: template.dataId,
      fields: template.fields,
      isTemplate: true,
    })
    .then((data) => {
      return data.data?.data;
    });
}
