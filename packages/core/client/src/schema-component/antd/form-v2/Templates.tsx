/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { error, forEach } from '@nocobase/utils/client';
import { Select, Space } from 'antd';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../api-client';
import { findFormBlock, useFormBlockContext } from '../../../block-provider/FormBlockProvider';
import { useCollectionManager_deprecated } from '../../../collection-manager';
import { useDataSourceHeaders, useDataSourceKey } from '../../../data-source';
import { useFlag } from '../../../flag-provider';
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

export const useFormDataTemplates = () => {
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { duplicateData } = useFormBlockContext();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  if (duplicateData) {
    return duplicateData;
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

export const Templates = React.memo(({ style = {}, form }: { style?: React.CSSProperties; form?: any }) => {
  const { token } = useToken();
  const { templates, display, enabled, defaultTemplate } = useFormDataTemplates();
  const { getCollectionJoinField } = useCollectionManager_deprecated();
  const templateOptions = compatibleDataId(templates);
  const [targetTemplate, setTargetTemplate] = useState(defaultTemplate?.key || 'none');
  const [targetTemplateData, setTemplateData] = useState(null);
  const api = useAPIClient();
  const { t } = useTranslation();
  const dataSource = useDataSourceKey();
  const headers = useDataSourceHeaders(dataSource);
  const { isInFilterFormBlock } = useFlag();
  useEffect(() => {
    if (enabled && defaultTemplate && form && !isInFilterFormBlock) {
      form.__template = true;
      if (defaultTemplate.key === 'duplicate') {
        handleTemplateDataChange(defaultTemplate.dataId, defaultTemplate, headers);
      }
    }
  }, []);
  useEffect(() => {
    if (!templateOptions?.some((v) => v.key === targetTemplate)) {
      handleTemplateChange('none');
    }
  }, [templateOptions]);
  const wrapperStyle = useMemo(() => {
    return {
      display: 'flex',
      alignItems: 'center',
      backgroundColor: token.colorFillAlter,
      padding: token.padding,
      ...style,
    };
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

  const handleTemplateDataChange: any = useCallback(async (value, option, headers) => {
    const template = { ...option, dataId: value };
    setTemplateData(option);
    fetchTemplateData(api, template, headers)
      .then((data) => {
        if (form && data) {
          // 切换之前先把之前的数据清空
          form.reset();
          form.__template = true;

          forEach(data, (value, key) => {
            if (value) {
              form.values[key] = value;
              form?.setInitialValuesIn?.(key, value);
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
          // @ts-ignore
          role="button"
          data-testid="select-form-data-template"
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
            onChange={(value) => handleTemplateDataChange(value?.id, { ...value, ...template }, headers)}
            targetField={getCollectionJoinField(`${template?.collection}.${template.titleField}`)}
          />
        )}
      </Space>
    </div>
  );
});

Templates.displayName = 'NocoBaseFormDataTemplates';

function findDataTemplates(fieldSchema): ITemplate {
  const formSchema = findFormBlock(fieldSchema);
  if (formSchema) {
    return _.cloneDeep(formSchema['x-data-templates']) || {};
  }
  return {} as ITemplate;
}

export async function fetchTemplateData(
  api,
  template: { collection: string; dataId: number; fields: string[] },
  headers?,
) {
  if (template.fields.length === 0 || !template.dataId) {
    return;
  }
  return api
    .resource(template.collection, undefined, headers)
    .get({
      filterByTk: template.dataId,
      fields: template.fields,
      isTemplate: true,
    })
    .then((data) => {
      return data.data?.data;
    });
}
