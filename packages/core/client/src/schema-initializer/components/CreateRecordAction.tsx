import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { RecursionField, observer, useField, useFieldSchema } from '@formily/react';
import { Button, Dropdown, Menu } from 'antd';
import React, { useEffect, useState } from 'react';
import { useDesignable } from '../../';
import { useACLRolesCheck, useRecordPkValue } from '../../acl/ACLProvider';
import { CollectionProvider, useCollection, useCollectionManager } from '../../collection-manager';
import { useRecord } from '../../record-provider';
import { ActionContext, useActionContext, useCompile } from '../../schema-component';
import { linkageAction } from '../../schema-component/antd/action/utils';

export const actionDesignerCss = css`
  position: relative;
  &:hover {
    .general-schema-designer {
      display: block;
    }
  }
  .general-schema-designer {
    position: absolute;
    z-index: 999;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    display: none;
    background: rgba(241, 139, 98, 0.06);
    border: 0;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
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

const actionAclCheck = (actionPath) => {
  const { data, inResources, getResourceActionParams, getStrategyActionParams } = useACLRolesCheck();
  const recordPkValue = useRecordPkValue();
  const collection = useCollection();
  const resource = collection.resource;
  const parseAction = (actionPath: string, options: any = {}) => {
    const [resourceName] = actionPath.split(':');
    if (data?.allowAll) {
      return {};
    }
    if (inResources(resourceName)) {
      return getResourceActionParams(actionPath);
    }
    return getStrategyActionParams(actionPath);
  };
  if (!actionPath && resource) {
    actionPath = `${resource}:create}`;
  }
  if (!actionPath?.includes(':')) {
    actionPath = `${resource}:${actionPath}`;
  }
  if (!actionPath) {
    return true;
  }
  const params = parseAction(actionPath, { recordPkValue });
  if (!params) {
    return false;
  }
  return true;
};

export const CreateRecordAction = observer((props: any) => {
  const [visible, setVisible] = useState(false);
  const collection = useCollection();
  const fieldSchema = useFieldSchema();
  const field: any = useField();
  const [currentCollection, setCurrentCollection] = useState(collection.name);
  const linkageRules = fieldSchema?.['x-linkage-rules'] || [];
  const values = useRecord();
  const ctx = useActionContext();
  useEffect(() => {
    field.linkageProperty = {};
    linkageRules
      .filter((k) => !k.disabled)
      .map((v) => {
        return v.actions?.map((h) => {
          linkageAction(h.operator, field, v.condition, values);
        });
      });
  }, [linkageRules, values]);
  return (
    <div className={actionDesignerCss}>
      <ActionContext.Provider value={{ ...ctx, visible, setVisible }}>
        <CreateAction
          {...props}
          onClick={(name) => {
            setVisible(true);
            setCurrentCollection(name);
          }}
        />
        <CollectionProvider name={currentCollection}>
          <RecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
        </CollectionProvider>
      </ActionContext.Provider>
    </div>
  );
});

export const CreateAction = observer((props: any) => {
  const { onClick } = props;
  const collection = useCollection();
  const fieldSchema = useFieldSchema();
  const enableChildren = fieldSchema['x-enable-children'] || [];
  const allowAddToCurrent = fieldSchema?.['x-allow-add-to-current'];
  const field: any = useField();
  const componentType = field.componentProps.type || 'primary';
  console.log(componentType)
  const { getChildrenCollections } = useCollectionManager();
  const totalChildCollections = getChildrenCollections(collection.name);
  const inheritsCollections = enableChildren
    .map((k) => {
      if (!k) {
        return;
      }
      const childCollection = totalChildCollections.find((j) => j.name === k.collection);
      if (!childCollection) {
        return;
      }
      return {
        ...childCollection,
        title: k.title || childCollection.title,
      };
    })
    .filter((v) => {
      return v && actionAclCheck(`${v.name}:create`);
    });
  const linkageRules = fieldSchema?.['x-linkage-rules'] || [];
  const values = useRecord();
  const compile = useCompile();
  const { designable } = useDesignable();
  const icon = props.icon || <PlusOutlined />;
  const menu = (
    <Menu>
      {inheritsCollections.map((option) => {
        return (
          <Menu.Item
            key={option.name}
            onClick={(info) => {
              onClick?.(option.name);
            }}
          >
            {compile(option.title)}
          </Menu.Item>
        );
      })}
    </Menu>
  );
  useEffect(() => {
    field.linkageProperty = {};
    linkageRules
      .filter((k) => !k.disabled)
      .map((v) => {
        return v.actions?.map((h) => {
          linkageAction(h.operator, field, v.condition, values);
        });
      });
  }, [linkageRules, values]);
  return (
    <div className={actionDesignerCss}>
      {inheritsCollections?.length > 0 ? (
        allowAddToCurrent === undefined || allowAddToCurrent ? (
          <Dropdown.Button
            type={componentType}
            icon={<DownOutlined />}
            buttonsRender={([leftButton, rightButton]) => [
              leftButton,
              React.cloneElement(rightButton as React.ReactElement<any, string>, { loading: false }),
            ]}
            overlay={menu}
            onClick={(info) => {
              onClick?.(collection.name);
            }}
          >
            {icon}
            {props.children}
          </Dropdown.Button>
        ) : (
          <Dropdown overlay={menu}>
            {
              <Button icon={icon} type={componentType}>
                {props.children} <DownOutlined />
              </Button>
            }
          </Dropdown>
        )
      ) : (
        <Button
          type={componentType}
          disabled={field.disabled}
          danger={componentType === 'danger'}
          icon={icon}
          onClick={(info) => {
            onClick?.(collection.name);
          }}
          style={{
            display: !designable && field?.data?.hidden && 'none',
            opacity: designable && field?.data?.hidden && 0.1,
          }}
        >
          {props.children}
        </Button>
      )}
    </div>
  );
});
