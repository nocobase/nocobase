import { useFieldSchema, useForm } from '@formily/react';
import { App } from 'antd';
import { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDetailBlock } from '../../../block-provider/FormBlockProvider';
import { ActionContext } from './context';

export const useA = () => {
  return {
    async run() {},
  };
};

export const useActionContext = () => {
  const ctx = useContext(ActionContext);
  const { t } = useTranslation();
  const { modal } = App.useApp();

  return {
    ...ctx,
    setVisible(visible: boolean, confirm = false) {
      if (ctx?.openMode !== 'page') {
        if (!visible) {
          if (confirm && ctx.formValueChanged) {
            modal.confirm({
              title: t('Unsaved changes'),
              content: t("Are you sure you don't want to save?"),
              async onOk() {
                ctx.setFormValueChanged(false);
                ctx.setVisible?.(false);
              },
            });
          } else {
            ctx?.setVisible?.(false);
          }
        } else {
          ctx?.setVisible?.(visible);
        }
      }
    },
  };
};

export const useCloseAction = () => {
  const { setVisible } = useContext(ActionContext);
  const form = useForm();
  return {
    async run() {
      setVisible(false);
      form.submit((values) => {
        console.log(values);
      });
    },
  };
};

export const useLinkageAction = () => {
  const fieldSchema = useFieldSchema();
  const isRecordAction = useIsDetailBlock();
  const isAction = ['Action.Link', 'Action'].includes(fieldSchema['x-component']);
  return isAction && isRecordAction;
};
