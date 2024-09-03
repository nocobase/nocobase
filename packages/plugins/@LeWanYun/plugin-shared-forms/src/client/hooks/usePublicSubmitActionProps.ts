import { useForm } from '@formily/react';
import { useDataBlockResource } from '@nocobase/client';
import { App as AntdApp } from 'antd';

// TODO：这里暂时只实现了基本流程，更多参考内核 @nocobase/client 的 useCreateActionProps
export const usePublicSubmitActionProps = () => {
  const { message } = AntdApp.useApp();
  const form = useForm();
  const resource = useDataBlockResource();
  return {
    type: 'primary',
    async onClick() {
      const values = form.values;
      if (Object.keys(values).length === 0) {
        message.error('表单数据为空');
        return;
      }
      await form.submit();
      await resource.publicSubmit({
        values,
      });
      await form.reset();
      message.success('提交成功!');
    },
  };
};
