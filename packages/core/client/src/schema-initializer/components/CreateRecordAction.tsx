/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined } from '@ant-design/icons';
import { observer, useField, useFieldSchema, useForm } from '@formily/react';
import { Button, Dropdown, MenuProps } from 'antd';
import { composeRef } from 'rc-util/lib/ref';
import React, { createRef, forwardRef, useEffect, useMemo } from 'react';
import { Collection, useCollectionManager, useDesignable } from '../../';
import { useACLActionParamsContext, useACLRolesCheck, useRecordPkValue } from '../../acl/ACLProvider';
import { useCollectionManager_deprecated, useCollection_deprecated } from '../../collection-manager';
import { useTreeParentRecord } from '../../modules/blocks/data-blocks/table/TreeRecordProvider';
import { useRecord } from '../../record-provider';
import { useCompile } from '../../schema-component';
import { linkageAction } from '../../schema-component/antd/action/utils';
import { usePopupUtils } from '../../schema-component/antd/page/pagePopupUtils';
import { parseVariables } from '../../schema-component/common/utils/uitls';
import { useLocalVariables, useVariables } from '../../variables';
import { useApp } from '../../application';

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
  const fieldSchema = useFieldSchema();
  const field: any = useField();
  const linkageRules: any[] = fieldSchema?.['x-linkage-rules'] || [];
  const values = useRecord();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: { values } as any });
  const { openPopup } = usePopupUtils();
  const treeRecordData = useTreeParentRecord();
  const cm = useCollectionManager();
  const app = useApp();

  useEffect(() => {
    field.stateOfLinkageRules = {};
    linkageRules
      .filter((k) => !k.disabled)
      .forEach((v) => {
        v.actions?.forEach((h) => {
          linkageAction(
            {
              operator: h.operator,
              field,
              condition: v.condition,
              variables,
              localVariables,
              conditionType: v.conditionType,
            },
            app.jsonLogic,
          );
        });
      });
  }, [field, linkageRules, localVariables, variables]);
  const internalRef = createRef<HTMLButtonElement | HTMLAnchorElement>();
  const buttonRef = composeRef(ref, internalRef);

  return (
    //@ts-ignore
    <div ref={buttonRef as React.Ref<HTMLButtonElement>}>
      <CreateAction
        {...props}
        onClick={(collection: Partial<Collection>) => {
          collection = cm.getCollection(collection.name) || collection;

          if (treeRecordData) {
            openPopup({
              recordData: treeRecordData,
            });
          } else {
            // fix https://nocobase.height.app/T-5084/description
            if (collection.isInherited?.()) {
              openPopup({
                collectionNameUsedInURL: collection.name,
              });
            } else {
              openPopup();
            }
          }
        }}
      />
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
    const app = useApp();
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
            linkageAction(
              {
                operator: h.operator,
                field,
                condition: v.condition,
                variables,
                localVariables,
                conditionType: v.conditionType,
              },
              app.jsonLogic,
            );
          });
        });
    }, [field, linkageRules, localVariables, variables]);
    return (
      <div>
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
  props: { onlyIcon, ...props },
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
  const aclCtx = useACLActionParamsContext();
  const buttonStyle = useMemo(() => {
    const shouldApplyOpacity = designable && (field?.data?.hidden || !aclCtx);
    const opacityValue = componentType !== 'link' ? (shouldApplyOpacity ? 0.1 : 1) : 1;
    return {
      opacity: opacityValue,
    };
  }, [designable, field?.data?.hidden, aclCtx, componentType]);

  if (inheritsCollections?.length > 0) {
    if (!linkageFromForm) {
      return allowAddToCurrent === undefined || allowAddToCurrent ? (
        <Dropdown.Button
          aria-label={props['aria-label']}
          danger={props.danger}
          type={componentType}
          icon={<DownOutlined />}
          style={{ ...props?.style, ...buttonStyle }}
          buttonsRender={([leftButton, rightButton]) => [
            React.cloneElement(leftButton as React.ReactElement<any, string>, {
              style: props?.style,
            }),
            React.cloneElement(rightButton as React.ReactElement<any, string>, {
              loading: false,
              style: { ...props?.style, justifyContent: 'center' },
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
              style={{ ...props?.style, ...buttonStyle }}
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
          ...buttonStyle,
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
        display: !designable && field?.data?.hidden ? 'none' : 'inline-block',
        opacity: designable && field?.data?.hidden && 0.1,
        ...buttonStyle,
      }}
    >
      {onlyIcon ? props?.children?.[1] : props?.children}
    </Button>
  );
}

export const CreateRecordAction = forwardRef<HTMLButtonElement | HTMLAnchorElement, any>(InternalCreateRecordAction);
