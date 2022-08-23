import { Schema, useFieldSchema } from '@formily/react';
import {
  useAPIClient,
  useBlockRequestContext,
  useCollection,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { saveAs } from 'file-saver';
import { cloneDeep } from 'lodash';
import { useTranslation } from 'react-i18next';

let uploadFile;

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
  const { t } = useTranslation();
  const { schema: importSchema } = useImportSchema(actionSchema);
  return {
    async run() {
      const { importColumns, explain } = cloneDeep(importSchema?.['x-action-settings']?.['importSettings'] ?? {});
      importColumns.forEach((es) => {
        const { uiSchema, interface: fieldInterface } =
          getCollectionJoinField(`${name}.${es.dataIndex.join('.')}`) ?? {};
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
  const { t } = useTranslation();
  const { schema: importSchema } = useImportSchema(actionSchema);
  return {
    async run() {
      const { importColumns, explain } = cloneDeep(importSchema?.['x-action-settings']?.['importSettings'] ?? {});
      importColumns.forEach((es) => {
        const { uiSchema, interface: fieldInterface } =
          getCollectionJoinField(`${name}.${es.dataIndex.join('.')}`) ?? {};
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
      let formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('columns', JSON.stringify(importColumns));
      formData.append('explain', explain);
      await apiClient.axios.post(`${name}:importXlsx`, formData, {});
      //   .catch((err) => {});
      service?.refresh?.();
      uploadFile = undefined;
    },
  };
};

// export const useImportAction = () => {
//   const { run } = useImportStartAction();
//   return {
//     async onClick() {
//       run();
//     },
//   };
// };
