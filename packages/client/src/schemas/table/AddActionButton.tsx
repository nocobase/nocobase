import React, { useState } from 'react';
import { Dropdown, Menu, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Schema } from '@formily/react';
import { useDesignable, ISchema } from '..';
import { useDisplayedMapContext, useClient } from '../../constate';
import SwitchMenuItem from '../../components/SwitchMenuItem';
import { getSchemaPath } from '../../components/schema-renderer';
import { generateActionSchema } from './utils';

export const AddActionButton = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const displayed = useDisplayedMapContext();
  const { appendChild, remove } = useDesignable();
  const { schema, designable } = useDesignable();
  const { createSchema, removeSchema, updateSchema } = useClient();

  if (!designable || !schema['x-designable-bar']) {
    return null;
  }
  return (
    <Dropdown
      trigger={['hover']}
      visible={visible}
      onVisibleChange={setVisible}
      overlay={
        <Menu>
          <Menu.ItemGroup title={t('Enable actions')}>
            {[
              { title: t('Filter'), name: 'filter' },
              { title: t('Export'), name: 'export' },
              { title: t('Add new'), name: 'create' },
              { title: t('Delete'), name: 'destroy' },
            ].map((item) => (
              <SwitchMenuItem
                key={item.name}
                checked={displayed.has(item.name)}
                title={item.title}
                onChange={async (checked) => {
                  if (!checked) {
                    const s = displayed.get(item.name) as Schema;
                    const path = getSchemaPath(s);
                    displayed.remove(item.name);
                    const removed = remove(path);
                    await removeSchema(removed);
                  } else {
                    const s = generateActionSchema(item.name);
                    const data = appendChild(s);
                    await createSchema(data);
                  }
                }}
              />
            ))}
          </Menu.ItemGroup>
          <Menu.Divider />
          <Menu.SubMenu disabled title={t('Customize')}>
            <Menu.Item style={{ minWidth: 120 }}>{t('Function')}</Menu.Item>
            <Menu.Item>{t('Popup form')}</Menu.Item>
            <Menu.Item>{t('Flexible popup')}</Menu.Item>
          </Menu.SubMenu>
        </Menu>
      }
    >
      <Button
        className={'designable-btn designable-btn-dash'}
        style={{ marginLeft: 8 }}
        type={'dashed'}
        icon={<SettingOutlined />}
      >
        {t('Configure actions')}
      </Button>
    </Dropdown>
  );
};
