import { useFieldSchema } from '@formily/react';
import { error, forEach } from '@nocobase/utils/client';
import { Cascader } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { findFormBlock, useTableBlockContext } from '../../../block-provider';
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
    dataId?: number;
    fields: string[];
    default?: boolean;
    dataScope?: object;
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
  ].concat(items.map<any>((t, i) => ({ key: i, ...t, isLeaf: t.dataId !== undefined })));

  const defaultTemplate = items.find((item) => item.default);
  return {
    templates,
    display,
    defaultTemplate,
    enabled: items.length > 0 && items.every((item) => item.dataId || item.dataScope),
  };
};
function filterReferences(obj) {
  const filteredObj = {};
  for (const key in obj) {
    if (typeof obj[key] !== 'object') {
      filteredObj[key] = obj[key];
    }
  }

  return filteredObj;
}
export const Templates = ({ style = {}, form }) => {
  const { templates, display, enabled, defaultTemplate } = useDataTemplates();
  const [options, setOptions] = useState<any>(templates);
  const [value, setValue] = useState(defaultTemplate?.key || 'none');
  const { resource } = useTableBlockContext();
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
    const key = value?.[0];
    const template = { ...option?.[0], dataId: option?.[1]?.key || option?.[0]?.dataId };
    setValue(key);
    if (key !== 'none') {
      fetchTemplateData(api, template, t)
        .then((data) => {
          if (form && data) {
            // 切换之前先把之前的数据清空
            form.reset();
            form.__template = true;

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
    } else {
      form?.reset();
    }
  }, []);
  if (!enabled || !display) {
    return null;
  }

  const loadChildren = (option): Promise<void> => {
    if (!option.dataScope) {
      return new Promise((resolve) => {
        error('Must be set field target');
        resolve(void 0);
      });
    }

    return new Promise(async (resolve) => {
      const { data } = (await resource.list({ filter: option.dataScope })) || {};
      if (data?.data.length === 0) {
        option.disabled = true;
        resolve();
        return;
      }
      option.children = data?.data.map((v) => {
        return {
          title: v[option?.titleField || 'id'],
          key: v?.id,
        };
      });
      resolve();
    });
  };

  const loadData = async (selectedOptions) => {
    const option = selectedOptions[selectedOptions.length - 1];
    if (option.dataScope) {
      await loadChildren(option);
      setOptions((prev) => [...prev]);
    }
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8f8f8', padding: '1em', ...style }}>
      <label style={{ fontSize: 14, fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: 8 }}>
        {t('Data template')}:{' '}
      </label>
      <Cascader
        changeOnSelect
        options={options}
        fieldNames={{ label: 'title', value: 'key', children: 'children' }}
        value={value}
        onChange={handleChange}
        loadData={loadData}
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
  if (template.fields.length === 0 || !template.dataId) {
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
