import { useFieldSchema } from '@formily/react';
import { error, forEach } from '@nocobase/utils/client';
import { Select } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { findFormBlock } from '../../../block-provider';
import { useCollectionManager } from '../../../collection-manager';
import { useDuplicatefieldsContext } from '../../../schema-initializer/components';

export interface ITemplate {
  config?: {
    [key: string]: {
      /** 设置的数据范围 */
      filter?: any;
      /** 设置的标题字段 */
      titleField?: string;
    };
  };
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
  const data = useDuplicatefieldsContext();
  const { getCollectionJoinField } = useCollectionManager();
  if (data) {
    return data;
  }
  const { items = [], display = true } = findDataTemplates(fieldSchema);
  // 过滤掉已经被删除的字段
  items.forEach((item) => {
    try {
      item.fields = item.fields
        ?.map((field) => {
          const joinField = getCollectionJoinField(`${item.collection}.${field}`);
          if (joinField) {
            return field;
          }
          return '';
        })
        .filter(Boolean);
    } catch (err) {
      error(err);
      item.fields = [];
    }
  });

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
    enabled: items.length > 0 && items.every((item) => item.dataId !== undefined),
  };
};
function mergeObjects(obj1, obj2) {
  const merged = {};

  for (let key in obj1) {
    if (obj1.hasOwnProperty(key)) {
      merged[key] = obj1[key];
    }
  }

  for (let key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (merged.hasOwnProperty(key)) {
        if (Array.isArray(merged[key]) && Array.isArray(obj2[key])) {
          merged[key] = [{ ...merged[key][0], ...obj2[key][0] }];
        } else {
          merged[key] = [{ ...merged[key], ...obj2[key] }];
        }
      } else {
        merged[key] = obj2[key];
      }
    }
  }

  return merged;
}


export const Templates = ({ style = {}, form }) => {
  const { templates, display, enabled, defaultTemplate } = useDataTemplates();
  const [value, setValue] = React.useState(defaultTemplate?.key || 'none');
  const api = useAPIClient();
  const { t } = useTranslation();

  useEffect(() => {
    if (enabled && defaultTemplate) {
      form.__template = true;
      fetchTemplateData(api, defaultTemplate, t)
        .then((data) => {
          if (form && data) {
            forEach(data, (value, key) => {
              if (value) {
                form.values[key] = value;
              }
            });
          }
          return data;
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, []);

  const handleChange = useCallback(async (value, option) => {
    setValue(value);
    if (option.key !== 'none') {
      fetchTemplateData(api, option, t)
        .then((data) => {
          if (form && data) {
            // 切换之前先把之前的数据清空
            form.reset();
            form.__template = true;
            form.setValues(mergeObjects(form.values, data));
          }
          return data;
        })
        .catch((err) => {
          console.error(err);
        });
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

export async function fetchTemplateData(api, template: { collection: string; dataId: number; fields: string[] }, t) {
  if (template.fields.length === 0) {
    return;
  }
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
