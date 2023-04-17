import { css, cx } from '@emotion/css';
import { useField, useFieldSchema } from '@formily/react';
import {
  GeneralSchemaDesigner,
  Icon,
  SchemaSettings,
  SortableItem,
  useCompile,
  useDesignable,
  useDesigner,
} from '@nocobase/client';
import { List, ListItemProps } from 'antd-mobile';
import React from 'react';
import { useHistory, useParams, useRouteMatch } from 'react-router-dom';
import { useTranslation } from '../../../../locale';
import { useSchemaPatch } from '../../hooks';

const designerCss = css`
  position: relative;
  width: 100%;
  &:hover {
    > .general-schema-designer {
      display: block;
    }
  }
  &.nb-action-link {
    > .general-schema-designer {
      top: -10px;
      bottom: -10px;
      left: -10px;
      right: -10px;
    }
  }
  > .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    border: 0;
    pointer-events: none;
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: #f18b62;
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
      }
    }
  }
`;

interface MMenuItemProps extends ListItemProps {
  name: string;
  icon: string;
}

const InternalMenuItem: React.FC<MMenuItemProps> = (props) => {
  const { icon, name } = props;
  const Designer = useDesigner();
  const history = useHistory();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const match = useRouteMatch();
  const params = useParams<{ name: string }>();

  const onToPage = () => {
    history.push(params.name ? fieldSchema['x-uid'] : `${match.url}/${fieldSchema['x-uid']}`);
  };
  return (
    <SortableItem className={cx('nb-mobile-menu-item', designerCss)}>
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
      <SchemaSettings.ModalItem
        title={t('Edit menu info')}
        initialValues={field.componentProps}
        schema={{
          properties: {
            name: {
              type: 'string',
              title: t('Menu item name'),
              required: true,
              'x-component': 'Input',
              'x-decorator': 'FormItem',
            },
            icon: {
              required: true,
              'x-decorator': 'FormItem',
              'x-component': 'IconPicker',
              title: t('Icon'),
              'x-component-props': {},
            },
          },
        }}
        onSubmit={onUpdateComponentProps}
      />
      <SchemaSettings.Remove
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
