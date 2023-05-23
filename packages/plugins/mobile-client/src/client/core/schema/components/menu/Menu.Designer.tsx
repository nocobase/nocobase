import { GeneralSchemaDesigner, SchemaSettings, useDesignable } from '@nocobase/client';
import { MenuOutlined } from '@ant-design/icons';
import React from 'react';
import { useTranslation } from '../../../../locale';
import { Button } from 'antd';
import { useFieldSchema, useField } from '@formily/react';

export const MenuDesigner: React.FC = (props) => {
  const { t } = useTranslation();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const field = useField();
  const schemaSettingsProps = {
    dn,
    field,
    fieldSchema,
  };
  return (
    <SchemaSettings
      title={
        <Button
          style={{
            borderColor: 'rgb(241, 139, 98)',
            color: 'rgb(241, 139, 98)',
          }}
          icon={<MenuOutlined />}
          type="dashed"
        >
          {t('Menu configuration')}
        </Button>
      }
      {...schemaSettingsProps}
    >
      <SchemaSettings.Remove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete menu?'),
        }}
        breakRemoveOn={{
          'x-component': 'Grid',
        }}
      />
    </SchemaSettings>
  );
};
