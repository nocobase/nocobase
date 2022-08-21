import { Schema, useFieldSchema } from '@formily/react';
import {
  useAPIClient,
  useBlockRequestContext,
  useCollection,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { cloneDeep } from 'lodash';
import { useTranslation } from 'react-i18next';

const useImportSchema = (s: Schema) => {
  let schema = s;
  while (schema && schema['x-action'] !== 'import') {
    schema = schema.parent;
  }
  return { schema };
};

const useImportStartAction = () => {
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
      debugger;
      const { importSettings } = cloneDeep(importSchema?.['x-action-settings'] ?? {});
      importSettings.forEach((es) => {
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
      const input = document.createElement('input');
      input.setAttribute('type', 'file');
      // input.setAttribute("multiple", 'muttiple')
      input.setAttribute('accept', '.xls,.xlsx');
      input.onchange = async function () {
        const file = input.files[0];
        let formData = new FormData();
        formData.append('file', file);
        formData.append('columns', JSON.stringify(importSettings));
        await apiClient.axios.post(`${name}:importXlsx`, formData, {});
        //   .catch((err) => {});
        service?.refresh?.();
      };

      // 执行 click 事件，弹出文件选择框
      input.click();
    },
  };
};

export const useImportAction = () => {
  const { run } = useImportStartAction();
  return {
    async onClick() {
      run();
    },
  };
};

export const beforeUploadHandler = () => {
  return false;
};
