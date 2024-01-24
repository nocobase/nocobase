import { useFieldSchema } from '@formily/react';
import {
  useCollection,
  useCollectionManager,
  useCompile,
  useDataBlockRequestV2,
  useDataBlockResourceV2,
} from '@nocobase/client';
import { saveAs } from 'file-saver';
import lodash from 'lodash';
import { useTranslation } from 'react-i18next';

export const useExportAction = () => {
  const service = useDataBlockRequestV2();
  const resource = useDataBlockResourceV2();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField } = useCollectionManager();
  const { name, title } = useCollection();
  const { t } = useTranslation();
  return {
    async onClick() {
      const { exportSettings } = lodash.cloneDeep(actionSchema?.['x-action-settings'] ?? {});
      exportSettings.forEach((es) => {
        const { uiSchema, interface: fieldInterface } =
          getCollectionJoinField(`${name}.${es.dataIndex.join('.')}`) ?? {};
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
          title: compile(title),
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
      saveAs(blob, `${compile(title)}.xlsx`);
    },
  };
};
