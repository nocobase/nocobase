import { useFieldSchema } from '@formily/react';
import { dayjs, error, forEach } from '@nocobase/utils/client';
import { Select, Space, Tag } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../';
import { useAPIClient } from '../../../api-client';
import { findFormBlock, mergeFilter } from '../../../block-provider';
import { useCollection, useCollectionManager } from '../../../collection-manager';
import { useDuplicatefieldsContext } from '../../../schema-initializer/components';
import { compatibleDataId } from '../../../schema-settings/DataTemplates/FormDataTemplates';
import { useToken } from '../__builtins__';

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
    titleField?: string;
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
  ].concat(
    items.map<any>((t, i) => ({
      key: i,
      ...t,
      isLeaf: t.dataId !== null && t.dataId !== undefined,
      titleCollectionField: t?.titleField && getCollectionJoinField(`${t.collection}.${t.titleField}`),
    })),
  );
  const defaultTemplate = items.find((item) => item.default);
  return {
    templates,
    display,
    defaultTemplate,
    enabled: items.length > 0 && items.every((item) => item.dataId || item.dataScope),
  };
};

export const mapOptionsToTags = (options, fieldNames, titleCollectionfield, templateConfig, compile) => {
  try {
    return options
      .map((option) => {
        let label = compile(option[fieldNames.label]);
        if (titleCollectionfield?.uiSchema?.enum) {
          if (Array.isArray(label)) {
            label = label
              .map((item, index) => {
                const option = titleCollectionfield.uiSchema.enum.find((i) => i.value === item);
                if (option) {
                  return (
                    <Tag key={index} color={option.color} style={{ marginRight: 3 }}>
                      {option?.label || item}
                    </Tag>
                  );
                } else {
                  return <Tag key={item}>{item}</Tag>;
                }
              })
              .reverse();
          } else {
            const item = titleCollectionfield.uiSchema.enum.find((i) => i.value === label);
            if (item) {
              label = <Tag color={item.color}>{item.label}</Tag>;
            }
          }
        }

        if (titleCollectionfield?.type === 'date') {
          label = dayjs(label).format('YYYY-MM-DD');
        }

        return {
          ...templateConfig,
          title: label,
          key: option.id,
        };
      })
      .filter(Boolean);
  } catch (err) {
    console.error(err);
    return options;
  }
};

export const Templates = ({ style = {}, form }) => {
  const { token } = useToken();
  const { templates, display, enabled, defaultTemplate } = useDataTemplates();
  const templateOptions = compatibleDataId(templates);
  const [targetTemplate, setTargetTemplate] = useState(defaultTemplate?.key || 'none');
  const [targetTemplateData, setTemplateData] = useState(null);
  const [templateDatas, setTemaplteDatas] = useState([]);
  const api = useAPIClient();
  const { t } = useTranslation();
  const compile = useCompile();
  const { name } = useCollection();
  const resource = api.resource(name);
  useEffect(() => {
    if (enabled && defaultTemplate) {
      form.__template = true;
      loadData(defaultTemplate);
    }
  }, []);

  const wrapperStyle = useMemo(() => {
    return { display: 'flex', alignItems: 'center', backgroundColor: token.colorFillAlter, padding: '1em', ...style };
  }, [style, token.colorFillAlter]);

  const labelStyle = useMemo<{
    fontSize: number;
    fontWeight: 'bold';
    whiteSpace: 'nowrap';
    marginRight: number;
  }>(() => {
    return { fontSize: token.fontSize, fontWeight: 'bold', whiteSpace: 'nowrap', marginRight: token.marginXS };
  }, [token.fontSize, token.marginXS]);

  const handleTemplateChange = useCallback(async (value, option) => {
    setTargetTemplate(value);
    setTemplateData(null);
    form?.reset();
    if (value.key !== 'none') {
      loadData(option);
    }
  }, []);

  const handleTemplateDataChange = useCallback(async (value, option) => {
    const template = { ...option, dataId: value };
    setTemplateData(value);
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
  }, []);

  if (!enabled || !display) {
    return null;
  }

  const loadChildren = async (option, filter) => {
    const { data } = (await resource.list({ filter })) || {};
    if (data?.data.length === 0) {
      return;
    }
    return mapOptionsToTags(
      data?.data,
      { label: option?.titleField || 'id', value: 'id', children: 'children' },
      option?.titleCollectionField,
      option,
      compile,
    );
  };

  const loadData = async (selectedOptions, filter?) => {
    if (selectedOptions.dataScope) {
      const data = await loadChildren(selectedOptions, mergeFilter([selectedOptions.dataScope, filter || {}]));
      setTemaplteDatas(data);
    }
  };

  return (
    <div style={wrapperStyle}>
      <Space wrap>
        <label style={labelStyle}>{t('Data template')}: </label>
        <Select
          popupMatchSelectWidth={false}
          options={templateOptions}
          fieldNames={{ label: 'title', value: 'key' }}
          value={targetTemplate}
          onChange={handleTemplateChange}
        />
        {targetTemplate !== 'none' && (
          <Select
            style={{ width: 220 }}
            fieldNames={{ label: 'title', value: 'key' }}
            value={targetTemplateData}
            onChange={handleTemplateDataChange}
            options={templateDatas}
            showSearch
            // onSearch={async (val) => {
            //   const template = templateOptions?.find((v) => v.key === targetTemplate);
            //   loadData(template, { $and: [{ [template.titleField]: { $includes: val } }] });
            // }}
            onSearch={(val) => {
              const template = templateOptions?.find((v) => v.key === targetTemplate);
              onSearch(template, { $and: [{ [template.titleField]: { $eq: 1 } }] });
            }}
          />
        )}
      </Space>
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
