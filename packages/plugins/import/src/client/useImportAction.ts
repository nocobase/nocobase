import { useFieldSchema } from '@formily/react';
import {
  useAPIClient,
  useBlockRequestContext,
  useCollection,
  useCollectionManager,
  useCompile,
} from '@nocobase/client';
import { cloneDeep } from 'lodash';
import { useTranslation } from 'react-i18next';

export const useImportAction = () => {
  const { service, resource } = useBlockRequestContext();
  const apiClient = useAPIClient();
  const actionSchema = useFieldSchema();
  const compile = useCompile();
  const { getCollectionJoinField } = useCollectionManager();
  const { name, title, getField } = useCollection();
  const { t } = useTranslation();
  return {
    async onClick() {
      const { importSettings } = cloneDeep(actionSchema?.['x-action-settings'] ?? {});
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
      // 创建一个 input 节点
      const input = document.createElement('input');
      // 设置 type 为 file 类型
      input.setAttribute('type', 'file');
      // 设置为多选选中文件 | 单选情况下不要设置
      // input.setAttribute("multiple", 'muttiple')
      // 设置 accept 为 .png,.jpg 类型 | 表示为弹出框选择文件的时候只能选中 png 和 jpg后缀的文件
      input.setAttribute('accept', '.xls,.xlsx');
      // 触发文件变更按钮操作
      input.onchange = async function () {
        // 这里的this 指的是 当前input事件中的this, 可以通过拿到 files
        // 不管选一个文件还是两个文件，最终得到的结果都是 数组结构
        // 这里我们只要单文件，所以拿到 索引为0的文件即可
        const file = input.files[0];
        // 创建一个formData对象 | 这个是浏览器自带的
        let formData = new FormData();
        // 将得到的file 资源放到到formData中
        formData.append('file', file);
        formData.append('columns', JSON.stringify(importSettings));
        // 可以附带其他参数 | 如 id
        // formData.append('id', 1);
        // 这里的uploadImage 为axios封装的 export 出来的一个方法
        await apiClient.axios.post(`${name}:importXlsx`, formData, {});
        //   .catch((err) => {});
        service?.refresh?.();
      };

      // 执行 click 事件，弹出文件选择框
      input.click();
    },
  };
};
