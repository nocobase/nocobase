import { useFieldSchema } from '@formily/react';
import { useAPIClient, useBlockRequestContext, useCollection, useCompile } from '@nocobase/client';

export const useExportAction = () => {
  const { service } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { name, title } = useCollection();

  return {
    async onClick() {
      const { exportSettings } = actionSchema?.['x-action-settings'] ?? {};
      const { data } = await apiClient.request({
        url: `/${name}:exportXlsx`,
        method: 'get',
        responseType: 'blob',
        params: {
          title: compile(title),
          columns: JSON.stringify(exportSettings),
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
