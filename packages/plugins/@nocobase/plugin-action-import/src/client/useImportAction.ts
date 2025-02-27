/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Schema, useFieldSchema, useForm } from '@formily/react';
import {
  useActionContext,
  useAPIClient,
  useBlockRequestContext,
  useCollection_deprecated,
  useCollectionManager_deprecated,
  useCompile,
  useDataBlockProps,
  useDataBlockResource,
  useDataSourceHeaders,
} from '@nocobase/client';
import lodash from 'lodash';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from './constants';
import { useImportContext } from './context';
import { ImportStatus } from './ImportModal';
import { useEffect } from 'react';
import { useFields } from './useFields';
import { initImportSettings } from './ImportActionInitializer';
import { useImportActionContext } from './ImportActionContext';

const useImportSchema = () => {
  const { fieldSchema: actionSchema } = useActionContext();
  const fieldSchema = useFieldSchema();

  let schema = actionSchema || fieldSchema;
  while (schema && schema['x-action'] !== 'importXlsx') {
    schema = schema.parent;
    console.log('schema', schema);
  }
  return { schema };
};

const toArr = (v: any) => {
  if (!v || !Array.isArray(v)) {
    return [];
  }
  return v;
};

export const useDownloadXlsxTemplateAction = () => {
  const { service, resource } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField, getCollectionField } = useCollectionManager_deprecated();
  const { name, title, getField } = useCollection_deprecated();
  const { t } = useTranslation(NAMESPACE);
  const { schema: importSchema } = useImportSchema();

  return {
    async run() {
      const { importColumns, explain } = lodash.cloneDeep(
        importSchema?.['x-action-settings']?.['importSettings'] ?? {},
      );
      const columns = toArr(importColumns)
        .map((column) => {
          const field = getCollectionField(`${name}.${column.dataIndex[0]}`);
          if (!field) {
            return;
          }
          column.defaultTitle = compile(field?.uiSchema?.title) || field.name;
          if (column.dataIndex.length > 1) {
            const subField = getCollectionJoinField(`${name}.${column.dataIndex.join('.')}`);
            if (!subField) {
              return;
            }
            column.defaultTitle = column.defaultTitle + '/' + compile(subField?.uiSchema?.title) || subField.name;
          }
          if (field.interface === 'chinaRegion') {
            column.dataIndex.push('name');
          }
          return column;
        })
        .filter(Boolean);
      const { data } = await resource.downloadXlsxTemplate(
        {
          values: {
            title: compile(title),
            explain,
            columns: compile(columns),
          },
        },
        {
          method: 'post',
          responseType: 'blob',
        },
      );
      const blob = new Blob([data], { type: 'application/x-xls' });
      saveAs(blob, `${compile(title)}.xlsx`);
    },
  };
};

export const useImportStartAction = () => {
  const { service, resource } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField, getCollectionField } = useCollectionManager_deprecated();
  const { name, title, getField } = useCollection_deprecated();
  const { t } = useTranslation(NAMESPACE);
  const { schema: importSchema } = useImportSchema();
  const form = useForm();
  const { setVisible, fieldSchema } = useActionContext();
  const { setImportModalVisible, setImportStatus, setImportResult } = useImportContext();
  const { upload } = form.values;
  const dataBlockProps = useDataBlockProps();
  const headers = useDataSourceHeaders(dataBlockProps.dataSource);
  const newResource = useDataBlockResource();

  useEffect(() => {
    form.reset();
  }, []);

  return {
    async run() {
      const { importColumns, explain } = lodash.cloneDeep(
        importSchema?.['x-action-settings']?.['importSettings'] ?? {},
      );
      const columns = toArr(importColumns)
        .map((column) => {
          const field = getCollectionField(`${name}.${column.dataIndex[0]}`);
          if (!field) {
            return;
          }
          column.defaultTitle = compile(field?.uiSchema?.title) || field.name;
          if (column.dataIndex.length > 1) {
            const subField = getCollectionJoinField(`${name}.${column.dataIndex.join('.')}`);
            if (!subField) {
              return;
            }
            column.defaultTitle = column.defaultTitle + '/' + compile(subField?.uiSchema?.title) || subField.name;
          }
          if (field.interface === 'chinaRegion') {
            column.dataIndex.push('name');
          }
          return column;
        })
        .filter(Boolean);

      const formData = new FormData();

      const uploadFiles = form.values.upload.map((f) => f.originFileObj);
      formData.append('file', uploadFiles[0]);
      formData.append('columns', JSON.stringify(columns));
      formData.append('explain', explain);

      const { triggerWorkflow, identifyDuplicates, uniqueField, duplicateStrategy } = form.values;

      if (triggerWorkflow !== undefined) {
        formData.append('triggerWorkflow', JSON.stringify(triggerWorkflow));
      }

      if (identifyDuplicates) {
        formData.append(
          'duplicateOption',
          JSON.stringify({
            uniqueField,
            mode: duplicateStrategy,
          }),
        );
      }

      const importMode = importSchema?.['x-action-settings']?.importMode || 'auto';

      setVisible(false);
      setImportModalVisible(true);
      setImportStatus(ImportStatus.IMPORTING);

      try {
        const { data } = await (newResource as any).importXlsx(
          {
            values: formData,
            mode: importMode,
          },
          {
            timeout: 10 * 60 * 1000,
          },
        );

        form.reset();

        if (!data.data.taskId) {
          setImportResult(data);
          await service?.refresh?.();
          setImportStatus(ImportStatus.IMPORTED);
        } else {
          setImportModalVisible(false);
          setVisible(false);
        }
      } catch (error) {
        setImportModalVisible(false);
        setVisible(true);
      }
    },
    disabled: upload?.length === 0 || form.errors?.length > 0,
  };
};
