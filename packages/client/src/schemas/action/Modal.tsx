import React, { useContext } from 'react';
import { useForm, observer, useField } from '@formily/react';
import { Button, Modal as AntdModal } from 'antd';
import { useDesignable, useDefaultAction } from '..';
import { FormLayout } from '@formily/antd';
import { VisibleContext } from '../../context';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';

export const Modal = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { useOkAction = useDefaultAction, useCancelAction = useDefaultAction, ...others } = props;
  const { schema } = useDesignable();
  const [visible, setVisible] = useContext(VisibleContext);
  const form = useForm();
  const { run: runOk } = useOkAction();
  const { run: runCancel } = useCancelAction();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  const field = useField();
  console.log('Action.Modal.field', schema['x-read-pretty']);
  return (
    <AntdModal
      title={compile(schema.title)}
      destroyOnClose
      maskClosable
      width={'50%'}
      footer={
        isFormDecorator && !schema['x-read-pretty']
          ? [
              <Button
                onClick={async () => {
                  if (isFormDecorator) {
                    form.clearErrors();
                  }
                  runCancel && (await runCancel());
                  setVisible(false);
                  if (isFormDecorator) {
                    await form.reset();
                  }
                }}
              >
                {t('Cancel')}
              </Button>,
              <Button
                type={'primary'}
                onClick={async () => {
                  if (isFormDecorator) {
                    await form.submit();
                  }
                  runOk && (await runOk());
                  setVisible(false);
                  if (isFormDecorator) {
                    await form.reset();
                  }
                }}
              >
                {t('Submit')}
              </Button>,
            ]
          : null
      }
      {...others}
      onCancel={async () => {
        if (isFormDecorator) {
          form.clearErrors();
        }
        runCancel && (await runCancel());
        setVisible(false);
        if (isFormDecorator) {
          await form.reset();
        }
      }}
      visible={visible}
    >
      <FormLayout layout={'vertical'}>{props.children}</FormLayout>
    </AntdModal>
  );
});
