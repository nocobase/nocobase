import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  Icon,
  SchemaSettingsModalItem,
  SchemaSettingsRemove,
  SortableItem,
  css,
  cx,
  useCompile,
  useDesigner,
} from '@nocobase/client';
import { List, ListItemProps } from 'antd-mobile';
import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../../../locale';
import { useSchemaPatch } from '../../hooks';
import { menuItemSchema } from './schema';

interface MMenuItemProps extends ListItemProps {
  name: string;
  icon: string;
}

const InternalMenuItem: React.FC<MMenuItemProps> = (props) => {
  const { icon, name } = props;
  const Designer = useDesigner();
  const navigate = useNavigate();
  const location = useLocation();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const params = useParams<{ name: string }>();

  const onToPage = () => {
    const locationPath = location.pathname.endsWith('/') ? location.pathname.slice(0, -1) : location.pathname;
    navigate(params.name ? `/mobile/${fieldSchema['x-uid']}` : `${locationPath}/${fieldSchema['x-uid']}`);
  };
  return (
    <SortableItem
      className={cx(
        'nb-mobile-menu-item',
        css`
          width: 100%;
          background: var(--adm-color-background);
          > .adm-list-item {
            background: inherit;
          }
        `,
      )}
    >
      <List.Item arrow clickable {...props} prefix={<Icon type={icon} />} onClick={onToPage}>
        {compile(name)}
      </List.Item>
      <Designer></Designer>
    </SortableItem>
  );
};

const MenuItemDesigner: React.FC = () => {
  const { t } = useTranslation();
  const { onUpdateComponentProps } = useSchemaPatch();
  const field = useField();

  return (
    <GeneralSchemaDesigner>
      <SchemaSettingsModalItem
        title={t('Edit menu info')}
        initialValues={field.componentProps}
        schema={menuItemSchema}
        onSubmit={onUpdateComponentProps}
      />
      <SchemaSettingsRemove
        key="remove"
        removeParentsIfNoChildren
        confirm={{
          title: t('Delete menu item?'),
        }}
        breakRemoveOn={{
          'x-component': 'MMenu',
        }}
      />
    </GeneralSchemaDesigner>
  );
};

export const MenuItem = InternalMenuItem as typeof InternalMenuItem as unknown as {
  Designer: typeof MenuItemDesigner;
};

MenuItem.Designer = MenuItemDesigner;
