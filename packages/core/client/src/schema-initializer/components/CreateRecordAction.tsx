import React, { useState } from 'react';
import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import { RecursionField, useFieldSchema, useField } from '@formily/react';
import { Dropdown, Menu, Button } from 'antd';
import { css } from '@emotion/css';
import { observer } from '@formily/react';
import { useCollectionManager, useCollection, CollectionProvider } from '../../collection-manager';
import { ActionContext, useCompile, useActionContext } from '../../schema-component';
import { useRecordPkValue, useACLRolesCheck } from '../../acl/ACLProvider';

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

export const CreateRecordAction = observer((props) => {
  const [visible, setVisible] = useState(false);
  const collection = useCollection();
  const fieldSchema = useFieldSchema();
  const enableChildren = fieldSchema['x-enable-children'] || [];
  const field = useField();
  const componentType = field.componentProps.type || 'primary';
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
  const [currentCollection, setCurrentCollection] = useState(collection.name);
  const ctx = useActionContext();
  const compile = useCompile();
  const menu = (
    <Menu>
      {inheritsCollections.map((option) => {
        return (
          <Menu.Item
            key={option.name}
            onClick={(info) => {
              setVisible(true);
              setCurrentCollection(option.name);
            }}
          >
            {compile(option.title)}
          </Menu.Item>
        );
      })}
    </Menu>
  );
  return (
    <div className={actionDesignerCss}>
      <ActionContext.Provider value={{ ...ctx, visible, setVisible }}>
        {inheritsCollections?.length > 0 ? (
          <Dropdown.Button
            type={componentType}
            icon={<DownOutlined />}
            buttonsRender={([leftButton, rightButton]) => [
              leftButton,
              React.cloneElement(rightButton as React.ReactElement<any, string>, { loading: false }),
            ]}
            overlay={menu}
            onClick={(info) => {
              setVisible(true);
              setCurrentCollection(collection.name);
            }}
          >
            <PlusOutlined />
            {props.children}
          </Dropdown.Button>
        ) : (
          <Button
            type={componentType}
            danger={componentType === 'danger'}
            icon={<PlusOutlined />}
            onClick={(info) => {
              setVisible(true);
              setCurrentCollection(collection.name);
            }}
          >
            {props.children}
          </Button>
        )}
        <CollectionProvider name={currentCollection}>
          <RecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
        </CollectionProvider>
      </ActionContext.Provider>
    </div>
  );
});

// export const CreateRecordAction = observer((props: any) => {
//   return (
//     <Action {...props} component={CreateAction}>
//       {props.children}
//     </Action>
//   );
// });
