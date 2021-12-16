import React, { useState } from 'react';
import { useField } from '@formily/react';
import { Dropdown, Menu, Space } from 'antd';
import { useDesignable, updateSchema } from '..';
import cls from 'classnames';
import { MenuOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaField } from '../../components/schema-renderer';
import { useTranslation } from 'react-i18next';
import { useCompile } from '../../hooks/useCompile';
import { useDesignableSwitchContext } from '../../constate';

export const TitleDesignableBar = (props: any) => {
  const { designable } = useDesignableSwitchContext();
  if (!designable) {
    return null;
  }
  const { t } = useTranslation();
  const { schema, remove, refresh, insertAfter } = useDesignable();
  const [visible, setVisible] = useState(false);
  const compile = useCompile();
  const field = useField();

  const changeTitleHandler = async (e) => {
    const values = await FormDialog(t('edit title'), () => {
      return (
        <FormLayout layout={'vertical'}>
          <SchemaField
            schema={{
              type: 'object',
              properties: {
                title: {
                  type: 'string',
                  title: t('Custom Title'),
                  'x-decorator': 'FormItem',
                  'x-component': 'Input',
                },
              },
            }}
          />
        </FormLayout>
      );
    }).open({
      initialValues: {
        title: compile(schema['title']),
      },
    });
    schema['title'] = values.title;
    field.title = values.title;
    await updateSchema({ key: schema['key'], title: schema['title'] });
    refresh();
  };

  return (
    <div className={cls('designable-bar', { active: visible })}>
      <span
        onClick={(e) => {
          e.stopPropagation();
        }}
        className={cls('designable-bar-actions', { active: visible })}
      >
        <Space size={2}>
          <Dropdown
            trigger={['hover']}
            visible={visible}
            onVisibleChange={(visible) => {
              setVisible(visible);
            }}
            overlay={
              <Menu>
                <Menu.Item onClick={changeTitleHandler}>{t('edit title')}</Menu.Item>
              </Menu>
            }
          >
            <MenuOutlined />
          </Dropdown>
        </Space>
      </span>
    </div>
  );
};
