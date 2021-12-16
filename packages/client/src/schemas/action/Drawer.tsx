import React, { useContext } from 'react';
import { useForm, observer } from '@formily/react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Button, Space, Drawer as AntdDrawer } from 'antd';
import { FormLayout } from '@formily/antd';
import { useDesignable, useDefaultAction } from '..';
import { VisibleContext } from '../../context';
import { useCompile } from '../../hooks/useCompile';
import { TitleDesignableBar } from './TitleDesignableBar';
import { useDesignableSwitchContext } from '../../constate';

export const Drawer = observer((props: any) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { useOkAction = useDefaultAction, useCancelAction = useDefaultAction, ...others } = props;
  const { schema } = useDesignable();
  const [visible, setVisible] = useContext(VisibleContext);
  const { designable, setDesignable } = useDesignableSwitchContext();
  const form = useForm();
  const { run: runOk } = useOkAction();
  const { run: runCancel } = useCancelAction();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  console.log('Action.Modal.field', schema['x-read-pretty']);
  return (
    <>
      {createPortal(
        <AntdDrawer
          width={'50%'}
          title={
            <>
              {compile(schema.title)}
              {<TitleDesignableBar />}
            </>
          }
          maskClosable
          destroyOnClose
          footer={
            isFormDecorator &&
            !schema['x-read-pretty'] && (
              <Space style={{ float: 'right' }}>
                <Button
                  onClick={async (e) => {
                    form.clearErrors();
                    props.onClose && (await props.onClose(e));
                    runCancel && (await runCancel());
                    setVisible(false);
                    if (isFormDecorator) {
                      await form.reset();
                    }
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  onClick={async (e) => {
                    await form.submit();
                    props.onOk && (await props.onOk(e));
                    runOk && (await runOk());
                    setVisible(false);
                    if (isFormDecorator) {
                      await form.reset();
                    }
                  }}
                  type={'primary'}
                >
                  {t('Submit')}
                </Button>
              </Space>
            )
          }
          {...others}
          visible={visible}
          onClose={async (e) => {
            props.onClose && (await props.onClose(e));
            runCancel && (await runCancel());
            setVisible(false);
            if (isFormDecorator) {
              await form.reset();
            }
          }}
        >
          <FormLayout layout={'vertical'}>{props.children}</FormLayout>
        </AntdDrawer>,
        document.body,
      )}
    </>
  );
});
