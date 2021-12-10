import React, { useContext } from 'react';
import { useForm, observer } from '@formily/react';
import { Button, Popover as AntdPopover, Space } from 'antd';
import { useDesignable } from '..';
import { VisibleContext } from '../../context';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';
import { ButtonComponentContext } from './context';

export const Popover = observer((props) => {
  const { t } = useTranslation();
  const compile = useCompile();
  const { schema } = useDesignable();
  const form = useForm();
  const isFormDecorator = schema['x-decorator'] === 'Form';
  const [visible, setVisible] = useContext(VisibleContext);
  const button = useContext(ButtonComponentContext);
  return (
    <AntdPopover
      visible={visible}
      trigger={['click']}
      onVisibleChange={setVisible}
      {...props}
      title={compile(schema.title)}
      content={
        <div>
          {props.children}
          {isFormDecorator && (
            <div>
              <Space>
                <Button
                  onClick={() => {
                    form.clearErrors();
                    setVisible(false);
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type={'primary'}
                  onClick={async () => {
                    await form.submit();
                    setVisible(false);
                  }}
                >
                  {t('Submit')}
                </Button>
              </Space>
            </div>
          )}
        </div>
      }
    >
      {button}
    </AntdPopover>
  );
});
