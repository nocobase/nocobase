import { useFieldSchema } from '@formily/react';
import {
  useAPIClient,
  useBlockRequestContext,
  useCollection,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';

export const useExportAction = () => {
  const { service } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField } = useCollectionManager();
  const { name, title, getField } = useCollection();
  const { t } = useTranslation();
  return {
    async onClick() {
      const { exportSettings } = actionSchema?.['x-action-settings'] ?? {};
      exportSettings.forEach((es) => {
        const { uiSchema } = getCollectionJoinField(`${name}.${es.dataIndex.join('.')}`) ?? {};
        es.enum = uiSchema?.enum?.map((e) => ({ value: e.value, label: e.label }));
        if (!es.enum && uiSchema.type === 'boolean') {
          es.enum = [
            { value: true, label: t('Yes') },
            { value: false, label: t('No') },
          ];
        }
        es.defaultTitle = uiSchema?.title;
      });
      const { data } = await apiClient.request({
        url: `/${name}:exportXlsx`,
        method: 'get',
        responseType: 'blob',
        params: {
          title: compile(title),
          columns: JSON.stringify(compile(exportSettings)),
          appends: service.params[0]?.appends?.join(),
          filter: JSON.stringify(service.params[0]?.filter),
        },
      });

      let blob = new Blob([data], { type: 'application/x-xls' });
      const a = document.createElement('a');
      const blobUrl = window.URL.createObjectURL(blob);
      a.download = `${compile(title)}.xlsx`;
      a.href = blobUrl;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    },
  };
};
