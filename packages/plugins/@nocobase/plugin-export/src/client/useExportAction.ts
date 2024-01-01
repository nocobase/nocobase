import { useFieldSchema } from '@formily/react';
import {
  useAPIClient,
  useBlockRequestContext,
  useCollectionManagerV2,
  useCollectionV2,
  useCompile,
} from '@nocobase/client';
import lodash from 'lodash';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';

export const useExportAction = () => {
  const { service, resource } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const cm = useCollectionManagerV2();
  const collection = useCollectionV2();
  const { t } = useTranslation();
  return {
    async onClick() {
      const { exportSettings } = lodash.cloneDeep(actionSchema?.['x-action-settings'] ?? {});
      exportSettings.forEach((es) => {
        const { uiSchema, interface: fieldInterface } =
          cm.getCollectionField(`${name}.${es.dataIndex.join('.')}`) ?? {};
        // @ts-ignore
        es.enum = uiSchema?.enum?.map((e) => ({ value: e.value, label: e.label }));
        if (!es.enum && uiSchema?.type === 'boolean') {
          es.enum = [
            { value: true, label: t('Yes') },
            { value: false, label: t('No') },
          ];
        }
        es.defaultTitle = uiSchema?.title;
        if (fieldInterface === 'chinaRegion') {
          es.dataIndex.push('name');
        }
      });
      const { data } = await resource.export(
        {
          title: compile(collection.title),
          appends: service.params[0]?.appends?.join(),
          filter: JSON.stringify(service.params[0]?.filter),
          sort: service.params[0]?.sort,
        },
        {
          method: 'post',
          data: {
            columns: compile(exportSettings),
          },
          responseType: 'blob',
        },
      );
      const blob = new Blob([data], { type: 'application/x-xls' });
      saveAs(blob, `${compile(collection.title)}.xlsx`);
    },
  };
};
