import React, { useContext } from 'react';
import { MenuItem } from './Menu.Item';
import {
  SchemaComponent,
  SchemaComponentOptions,
  SchemaInitializer,
  SortableItem,
  useDesignable,
  useDesigner,
} from '@nocobase/client';
import { css, cx } from '@emotion/css';
import { FormDialog, FormLayout } from '@formily/antd';
import { MenuDesigner } from './Menu.Designer';
import { SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { List } from 'antd-mobile';
import { useTranslation } from '../../../../locale';

const designerCss = css`
  position: relative;
  background: #ffffff;
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

const InternalMenu: React.FC = (props) => {
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const options = useContext(SchemaOptionsContext);
  let { insertBeforeEnd } = useDesignable();

  const { t } = useTranslation();

  const onAddMenuItem = () => {
    FormDialog({ title: t('Add menu item') }, () => {
      return (
        <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
          <FormLayout layout={'vertical'}>
            <SchemaComponent
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
                    'x-decorator': 'FormItem',
                    'x-component': 'IconPicker',
                    title: t('Icon'),
                    'x-component-props': {},
                  },
                  template: {
                    'x-decorator': 'FormItem',
                    'x-component': 'Select',
                    title: t('Page template'),
                    'x-component-props': {},
                  },
                },
              }}
            />
          </FormLayout>
        </SchemaComponentOptions>
      );
    })
      .open({})
      .then((values) => {
        insertBeforeEnd({
          type: 'void',
          'x-component': 'MMenu.Item',
          'x-component-props': values,
          'x-designer': 'MMenu.Item.Designer',
          properties: {
            page: {
              'x-component': 'MPage',
              'x-designer': 'MPage.Designer',
              'x-component-props': {},
            },
          },
        });
      });
  };

  return (
    <SortableItem className={cx('nb-mobile-menu', designerCss)}>
      <Designer />
      <List>
        <SchemaComponent onlyRenderProperties schema={fieldSchema}></SchemaComponent>
      </List>
      <SchemaInitializer.Button onClick={onAddMenuItem}>{t('Add menu item')}</SchemaInitializer.Button>
    </SortableItem>
  );
};

export const MMenu = InternalMenu as unknown as typeof InternalMenu & {
  Item: typeof MenuItem;
  Designer: typeof MenuDesigner;
};

MMenu.Item = MenuItem;
MMenu.Designer = MenuDesigner;
