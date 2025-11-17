/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { observer, RecursionField, Schema, useField, useFieldSchema, ISchema } from '@formily/react';
import { Tabs as AntdTabs, TabPaneProps } from 'antd';
import classNames from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSchemaInitializerRender,
  withDynamicSchemaProps,
  Icon,
  DndContext,
  SchemaComponent,
  useDesigner,
  SortableItem,
  GeneralSchemaDesigner,
  SchemaSettingsModalItem,
  SchemaSettingsDivider,
  SchemaSettingsRemove,
  useDesignable,
  useMobileLayout,
  MarkdownReadPretty,
  useToken,
} from '@nocobase/client';
import { usePluginTranslation } from './locale';

const MemoizeRecursionField = React.memo(RecursionField);
MemoizeRecursionField.displayName = 'MemoizeRecursionField';

const MemoizeTabs = React.memo(AntdTabs);
MemoizeTabs.displayName = 'MemoizeTabs';

export const BlockTabs: any = React.memo((props: any) => {
  const fieldSchema = useFieldSchema();
  const field = useField();
  const { render } = useSchemaInitializerRender(fieldSchema['x-initializer'], fieldSchema['x-initializer-props']);
  const { isMobileLayout } = useMobileLayout();
  const { t } = useTranslation();
  const { token } = useToken();

  const items = useMemo(() => {
    const result = fieldSchema.mapProperties((schema: Schema, key: string) => {
      return {
        key,
        label: <MemoizeRecursionField name={key} schema={schema} onlyRenderSelf />,
        children: (
          <SchemaComponent
            name={key}
            schema={schema}
            onlyRenderProperties
            distributed
          />
        ),
      };
    });

    return result;
  }, [fieldSchema]);

  const tabBarExtraContent = useMemo(
    () => ({
      right: render(),
    }),
    [render],
  );

  const title = useMemo(() => {
    const blockTitle = fieldSchema['x-component-props']?.['title'] || field.title;
    const description = fieldSchema['x-component-props']?.['description'];
    if (!blockTitle && !description) {
      return null;
    }
    return (
      <div
        style={{
          padding: '8px 0px 8px',
          backgroundColor: token.colorBgContainer,
          borderRadius: `${token.borderRadiusBlock} ${token.borderRadiusBlock} 0 0`,
          paddingLeft: token.paddingLG,
          paddingRight: token.paddingLG,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        {blockTitle && <span>{t(blockTitle, { ns: 'ui-schema-storage' })}</span>}
        {description && (
          <MarkdownReadPretty
            value={t(description, { ns: 'ui-schema-storage' })}
            style={{
              overflowWrap: 'break-word',
              whiteSpace: 'normal',
              fontWeight: 400,
              color: token.colorTextDescription,
              borderRadius: '4px',
              marginTop: blockTitle ? '4px' : 0,
            }}
          />
        )}
      </div>
    );
  }, [fieldSchema['x-component-props']?.title, fieldSchema['x-component-props']?.description, field.title, t, token]);

  return (
    <DndContext>
      <div
        style={{
          backgroundColor: token.colorBgContainer,
          borderRadius: title ? `0 0 ${token.borderRadiusBlock} ${token.borderRadiusBlock}` : token.borderRadiusBlock,
          marginBottom: token.marginBlock,
          overflow: 'hidden',
        }}
      >
        {title}
        <MemoizeTabs
          {...props}
          destroyInactiveTabPane
          tabBarExtraContent={tabBarExtraContent}
          style={props.style}
          items={items}
        />
      </div>
    </DndContext>
  );
});

BlockTabs.displayName = 'BlockTabs';

const designerCss = css`
  position: relative;
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
    background: var(--colorBgSettingsHover);
    border: 0;
    pointer-events: none;
    &.nb-in-template {
      background: var(--colorTemplateBgSettingsHover);
    }
    > .general-schema-designer-icons {
      position: absolute;
      right: 2px;
      top: 2px;
      line-height: 16px;
      pointer-events: all;
      .ant-space-item {
        background-color: var(--colorSettings);
        color: #fff;
        line-height: 16px;
        width: 16px;
        padding-left: 1px;
        align-self: stretch;
      }
    }
  }
`;

BlockTabs.TabPane = withDynamicSchemaProps(
  observer(
    (props: TabPaneProps & { icon?: any; hidden?: boolean }) => {
      const Designer = useDesigner();
      const field = useField();
      const { t } = usePluginTranslation();
      if (props.hidden) {
        return null;
      }

      return (
        <SortableItem className={classNames('nb-action-link', designerCss, props.className)}>
          {props.icon && <Icon style={{ marginRight: 2 }} type={props.icon} />}{' '}
          {props.tab || t(field.title || 'Unnamed')}
          <Designer />
        </SortableItem>
      );
    },
    { displayName: 'BlockTabs.TabPane' },
  ),
);

BlockTabs.TabPane.displayName = 'BlockTabs.TabPane';

const TabPaneDesigner = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { dn } = useDesignable();
  const { t } = usePluginTranslation();
  return (
    <GeneralSchemaDesigner disableInitializer>
      <SchemaSettingsModalItem
        key="edit"
        title={t('Edit')}
        schema={
          {
            type: 'object',
            title: t('Edit tab'),
            properties: {
              title: {
                title: t('Tab name'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                'x-component-props': {},
              },
            },
          } as ISchema
        }
        initialValues={{ title: field.title, icon: field.componentProps?.icon }}
        onSubmit={({ title, icon }) => {
          const props = fieldSchema['x-component-props'] || {};
          fieldSchema.title = title;
          field.title = title;
          props.icon = icon;
          field.componentProps.icon = icon;
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props'].icon = icon;
          dn.emit('patch', {
            schema: {
              ['x-uid']: fieldSchema['x-uid'],
              title,
              ['x-component-props']: props,
            },
          });
        }}
      />
      <SchemaSettingsDivider />
      <SchemaSettingsRemove />
    </GeneralSchemaDesigner>
  );
};

BlockTabs.TabPane.Designer = TabPaneDesigner;

export default BlockTabs;
