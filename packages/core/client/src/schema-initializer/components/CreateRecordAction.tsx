import { DownOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import { Button, Dropdown, MenuProps } from 'antd';
import React, { useEffect, useMemo, useState, forwardRef, createRef } from 'react';
import { composeRef } from 'rc-util/lib/ref';
import { useDesignable } from '../../';
import { useACLRolesCheck, useRecordPkValue } from '../../acl/ACLProvider';
import {
  CollectionProvider_deprecated,
  useCollection_deprecated,
  useCollectionManager_deprecated,
} from '../../collection-manager';
import { useRecord } from '../../record-provider';
import { ActionContextProvider, useActionContext, useCompile } from '../../schema-component';
import { linkageAction } from '../../schema-component/antd/action/utils';
import { parseVariables } from '../../schema-component/common/utils/uitls';
import { useLocalVariables, useVariables } from '../../variables';

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
    background: var(--colorBgSettingsHover);
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

export function useAclCheck(actionPath) {
  const aclCheck = useAclCheckFn();
  return aclCheck(actionPath);
}

function useAclCheckFn() {
  const { data, inResources, getResourceActionParams, getStrategyActionParams } = useACLRolesCheck();
  const recordPkValue = useRecordPkValue();
  const collection = useCollection_deprecated();
  function actionAclCheck(actionPath: string) {
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
  }

  return actionAclCheck;
}

const InternalCreateRecordAction = (props: any, ref) => {
  const [visible, setVisible] = useState(false);
  const collection = useCollection_deprecated();
  const fieldSchema = useFieldSchema();
  const field: any = useField();
  const [currentCollection, setCurrentCollection] = useState(collection.name);
  const [currentCollectionDataSource, setCurrentCollectionDataSource] = useState(collection.dataSource);
  const linkageRules: any[] = fieldSchema?.['x-linkage-rules'] || [];
  const values = useRecord();
  const ctx = useActionContext();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: { values } as any });
  useEffect(() => {
    field.stateOfLinkageRules = {};
    linkageRules
      .filter((k) => !k.disabled)
      .forEach((v) => {
        v.actions?.forEach((h) => {
          linkageAction({
            operator: h.operator,
            field,
            condition: v.condition,
            variables,
            localVariables,
          });
        });
      });
  }, [field, linkageRules, localVariables, variables]);
  const internalRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
  const buttonRef = composeRef(ref, internalRef);
  return (
    //@ts-ignore
    <div className={actionDesignerCss} ref={buttonRef as React.Ref<HTMLButtonElement>}>
      <ActionContextProvider value={{ ...ctx, visible, setVisible }}>
        <CreateAction
          {...props}
          onClick={(collectionData) => {
            setVisible(true);
            setCurrentCollection(collectionData.name);
            setCurrentCollectionDataSource(collectionData.dataSource);
          }}
        />
        <CollectionProvider_deprecated name={currentCollection} dataSource={currentCollectionDataSource}>
          <RecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
        </CollectionProvider_deprecated>
      </ActionContextProvider>
    </div>
  );
};

function getLinkageCollection(str, form, field) {
  const variablesCtx = { $form: form.values, $iteration: form.values };
  if (str.includes('$iteration')) {
    const path = field.path.segments.concat([]);
    path.splice(-2);
    str = str.replace('$iteration.', `$iteration.${path.join('.')}.`);
    const data = parseVariables(str, variablesCtx);
    return data;
  } else {
    const data = parseVariables(str, { $form: form.values });
    return data;
  }
}
export const CreateAction = observer(
  (props: any) => {
    const { onClick } = props;
    const collection = useCollection_deprecated();
    const fieldSchema = useFieldSchema();
    const field: any = useField();
    const form = useForm();
    const variables = useVariables();
    const aclCheck = useAclCheckFn();

    const enableChildren = fieldSchema['x-enable-children'] || [];
    const allowAddToCurrent = fieldSchema?.['x-allow-add-to-current'];
    const linkageFromForm = fieldSchema?.['x-component-props']?.['linkageFromForm'];
    // antd v5 danger type is deprecated
    const componentType = field.componentProps.type === 'danger' ? undefined : field.componentProps.type || 'primary';
    const { getChildrenCollections } = useCollectionManager_deprecated();
    const totalChildCollections = getChildrenCollections(collection.name);
    const inheritsCollections = useMemo(() => {
      return enableChildren
        .map((k) => {
          if (!k) {
            return;
          }
          const childCollection = totalChildCollections.find((j) => j.name === k.collection);
          if (!childCollection) {
            return;
          }
          return {
            ...childCollection.getOptions(),
            title: k.title || childCollection.title,
          };
        })
        .filter((v) => {
          return v && aclCheck(`${v.name}:create`);
        });
    }, [enableChildren, totalChildCollections]);
    const linkageRules: any[] = fieldSchema?.['x-linkage-rules'] || [];
    const values = useRecord();
    const localVariables = useLocalVariables({ currentForm: { values } as any });
    const compile = useCompile();
    const { designable } = useDesignable();
    const icon = props.icon || null;
    const menuItems = useMemo<MenuProps['items']>(() => {
      return inheritsCollections.map((option) => ({
        key: option.name,
        label: compile(option.title),
        onClick: () => onClick?.(option),
      }));
    }, [inheritsCollections, onClick]);

    const menu = useMemo<MenuProps>(() => {
      return {
        items: menuItems,
      };
    }, [menuItems]);

    useEffect(() => {
      field.stateOfLinkageRules = {};
      linkageRules
        .filter((k) => !k.disabled)
        .forEach((v) => {
          v.actions?.forEach((h) => {
            linkageAction({
              operator: h.operator,
              field,
              condition: v.condition,
              variables,
              localVariables,
            });
          });
        });
    }, [field, linkageRules, localVariables, variables]);
    return (
      <div className={actionDesignerCss}>
        <FinallyButton
          {...{
            inheritsCollections,
            linkageFromForm,
            allowAddToCurrent,
            props,
            componentType,
            menu,
            onClick,
            collection,
            icon,
            field,
            form,
            designable,
          }}
        />
      </div>
    );
  },
  { displayName: 'CreateAction' },
);

function FinallyButton({
  inheritsCollections,
  linkageFromForm,
  allowAddToCurrent,
  props,
  componentType,
  menu,
  onClick,
  collection,
  icon,
  field,
  form,
  designable,
}: {
  inheritsCollections: any;
  linkageFromForm: any;
  allowAddToCurrent: any;
  props: any;
  componentType: any;
  menu: MenuProps;
  onClick: any;
  collection;
  icon: any;
  field: any;
  form;
  designable: boolean;
}) {
  const { getCollection } = useCollectionManager_deprecated();

  if (inheritsCollections?.length > 0) {
    if (!linkageFromForm) {
      return allowAddToCurrent === undefined || allowAddToCurrent ? (
        <Dropdown.Button
          aria-label={props['aria-label']}
          danger={props.danger}
          type={componentType}
          icon={<DownOutlined />}
          buttonsRender={([leftButton, rightButton]) => [
            React.cloneElement(leftButton as React.ReactElement<any, string>, {
              style: props?.style,
            }),
            React.cloneElement(rightButton as React.ReactElement<any, string>, {
              loading: false,
              style: props?.style,
            }),
          ]}
          menu={menu}
          onClick={(info) => {
            onClick?.(collection);
          }}
        >
          {icon}
          {props.children}
        </Dropdown.Button>
      ) : (
        <Dropdown menu={menu}>
          {
            <Button
              aria-label={props['aria-label']}
              icon={icon}
              type={componentType}
              danger={props.danger}
              style={props?.style}
            >
              {props.children} <DownOutlined />
            </Button>
          }
        </Dropdown>
      );
    }
    return (
      <Button
        aria-label={props['aria-label']}
        type={componentType}
        disabled={field.disabled}
        danger={props.danger}
        icon={icon}
        onClick={(info) => {
          const collectionName = getLinkageCollection(linkageFromForm, form, field);
          const targetCollectionName = inheritsCollections.find((v) => v.name === collectionName)
            ? collectionName
            : collection.name;
          const targetCollection = getCollection(targetCollectionName);
          onClick?.(targetCollection);
        }}
        style={{
          display: !designable && field?.data?.hidden && 'none',
          opacity: designable && field?.data?.hidden && 0.1,
        }}
      >
        {props.children}
      </Button>
    );
  }
  return (
    <Button
      {...props}
      aria-label={props['aria-label']}
      type={componentType}
      disabled={field.disabled}
      danger={props.danger}
      icon={icon}
      onClick={(info) => {
        onClick?.(collection);
      }}
      style={{
        ...props?.style,
        display: !designable && field?.data?.hidden && 'none',
        opacity: designable && field?.data?.hidden && 0.1,
      }}
    >
      {props.children}
    </Button>
  );
}

export const CreateRecordAction = forwardRef<HTMLButtonElement | HTMLAnchorElement, any>(InternalCreateRecordAction);
