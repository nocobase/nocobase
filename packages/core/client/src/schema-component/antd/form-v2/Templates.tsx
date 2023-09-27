import { useFieldSchema } from '@formily/react';
import { error, forEach } from '@nocobase/utils/client';
import { Select, Space } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { findFormBlock } from '../../../block-provider';
import { useCollectionManager } from '../../../collection-manager';
import { useDuplicatefieldsContext } from '../../../schema-initializer/components';
import { compatibleDataId } from '../../../schema-settings/DataTemplates/FormDataTemplates';
import { useToken } from '../__builtins__';
import { RemoteSelect } from '../remote-select';

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

export const Templates = ({ style = {}, form }) => {
  const { token } = useToken();
  const { templates, display, enabled, defaultTemplate } = useDataTemplates();
  const { getCollectionJoinField } = useCollectionManager();
  const templateOptions = compatibleDataId(templates);
  const [targetTemplate, setTargetTemplate] = useState(defaultTemplate?.key || 'none');
  const [targetTemplateData, setTemplateData] = useState(null);
  const api = useAPIClient();
  const { t } = useTranslation();
  useEffect(() => {
    if (enabled && defaultTemplate) {
      form.__template = true;
      if (defaultTemplate.key === 'duplicate') {
        handleTemplateDataChange(defaultTemplate.dataId, defaultTemplate);
      }
    }
  }, []);
  useEffect(() => {
    if (!templateOptions?.some((v) => v.key === targetTemplate)) {
      handleTemplateChange('none');
    }
  }, [templateOptions]);
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

  const handleTemplateChange = useCallback(async (value) => {
    setTargetTemplate(value);
    setTemplateData(null);
    form?.reset();
  }, []);

  const handleTemplateDataChange: any = useCallback(async (value, option) => {
    const template = { ...option, dataId: value };
    setTemplateData(option);
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
  const template = templateOptions?.find((v) => v.key === targetTemplate);
  return (
    <div style={wrapperStyle}>
      <Space wrap>
        <label style={labelStyle}>{t('Data template')}: </label>
        <Select
          data-testid="antd-select"
          popupMatchSelectWidth={false}
          options={templateOptions}
          fieldNames={{ label: 'title', value: 'key' }}
          value={targetTemplate}
          onChange={handleTemplateChange}
        />
        {targetTemplate !== 'none' && template && (
          <RemoteSelect
            style={{ width: 220 }}
            fieldNames={{ label: template?.titleField, value: 'id' }}
            target={template?.collection}
            value={targetTemplateData}
            objectValue
            service={{
              resource: template?.collection,
              params: {
                filter: template?.dataScope,
              },
            }}
            onChange={(value) => handleTemplateDataChange(value?.id, { ...value, ...template })}
            targetField={getCollectionJoinField(`${template?.collection}.${template.titleField}`)}
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
