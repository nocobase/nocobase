import { Schema, useFieldSchema, useForm } from '@formily/react';
import { isEmpty } from '@formily/shared';
import {
  useActionContext,
  useAPIClient,
  useBlockRequestContext,
  useCollection,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { message } from 'antd';
import { saveAs } from 'file-saver';
import { cloneDeep } from 'lodash';
import { useTranslation } from 'react-i18next';
import { NAMESPACE } from './constants';
import { useImportContext } from './context';
import { ImportStatus } from './ImportModal';

const useImportSchema = (s: Schema) => {
  let schema = s;
  while (schema && schema['x-action'] !== 'import') {
    schema = schema.parent;
  }
  return { schema };
};

export const useDownloadXlsxTemplateAction = () => {
  const { service, resource } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField } = useCollectionManager();
  const { name, title, getField } = useCollection();
  const { t } = useTranslation(NAMESPACE);
  const { schema: importSchema } = useImportSchema(actionSchema);
  return {
    async run() {
      const { importColumns, explain } = cloneDeep(importSchema?.['x-action-settings']?.['importSettings'] ?? {});
      try {
        importColumns.forEach((es) => {
          const { uiSchema, interface: fieldInterface } =
            getCollectionJoinField(`${name}.${es.dataIndex.join('.')}`) ?? {};
          if (isEmpty(uiSchema) && isEmpty(fieldInterface)) {
            throw new Error(t('Field {{fieldName}} does not exist', { fieldName: es.dataIndex.join('.') }));
          }
          es.enum = uiSchema?.enum?.map((e) => ({ value: e.value, label: e.label }));
          if (!es.enum && uiSchema.type === 'boolean') {
            es.enum = [
              { value: true, label: t('Yes') },
              { value: false, label: t('No') },
            ];
          }
          es.defaultTitle = compile(uiSchema?.title);
          if (fieldInterface === 'chinaRegion') {
            es.dataIndex.push('name');
          }
        });
      } catch (error) {
        message.error(error.message);
        return;
      }

      const { data } = await resource.downloadXlsxTemplate(
        {
          title: compile(title),
          explain,
          columns: JSON.stringify(compile(importColumns)),
        },
        {
          method: 'get',
          responseType: 'blob',
        },
      );
      let blob = new Blob([data], { type: 'application/x-xls' });
      saveAs(blob, `${compile(title)}.xlsx`);
    },
  };
};

export const useImportStartAction = () => {
  const { service, resource } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField } = useCollectionManager();
  const { name, title, getField } = useCollection();
  const { t } = useTranslation(NAMESPACE);
  const { schema: importSchema } = useImportSchema(actionSchema);
  const form = useForm();
  const { setVisible } = useActionContext();
  const { setImportModalVisible, setImportStatus, setImportResult } = useImportContext();
  return {
    async run() {
      const { importColumns, explain } = cloneDeep(importSchema?.['x-action-settings']?.['importSettings'] ?? {});
      try {
        importColumns.forEach((es) => {
          const { uiSchema, interface: fieldInterface } =
            getCollectionJoinField(`${name}.${es.dataIndex.join('.')}`) ?? {};
          if (isEmpty(uiSchema) && isEmpty(fieldInterface)) {
            throw new Error(t('Field {{fieldName}} does not exist', { fieldName: es.dataIndex.join('.') }));
          }
          es.enum = uiSchema?.enum?.map((e) => ({ value: e.value, label: e.label }));
          if (!es.enum && uiSchema.type === 'boolean') {
            es.enum = [
              { value: true, label: t('Yes') },
              { value: false, label: t('No') },
            ];
          }
          es.defaultTitle = compile(uiSchema?.title);
          if (fieldInterface === 'chinaRegion') {
            es.dataIndex.push('name');
          }
        });
      } catch (error) {
        message.error(error.message);
        return;
      }
      let formData = new FormData();
      const uploadFiles = form.values.upload.map((f) => f.originFileObj);
      console.log(form, uploadFiles);
      formData.append('file', uploadFiles[0]);
      formData.append('columns', JSON.stringify(importColumns));
      formData.append('explain', explain);
      setVisible(false);
      setImportModalVisible(true);
      setImportStatus(ImportStatus.IMPORTING);
      const { data }: any = await apiClient.axios
        .post(`${name}:importXlsx`, formData, {
          timeout: 10 * 60 * 1000,
        })
        .catch((err) => {});
      setImportResult(data);
      form.reset();
      await service?.refresh?.();
      setImportStatus(ImportStatus.IMPORTED);
    },
  };
};
