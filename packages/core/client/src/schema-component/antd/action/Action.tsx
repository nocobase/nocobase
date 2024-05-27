/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import { isPortalInBody } from '@nocobase/utils/client';
import { App, Button } from 'antd';
import classnames from 'classnames';
import { default as lodash } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StablePopover, useActionContext } from '../..';
import { useDesignable } from '../../';
import { useACLActionParamsContext } from '../../../acl';
import {
  useCollection,
  useCollectionParentRecordData,
  useCollectionRecordData,
  useDataBlockRequest,
} from '../../../data-source';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { Icon } from '../../../icon';
import { TreeRecordProvider } from '../../../modules/blocks/data-blocks/table/TreeRecordProvider';
import { DeclareVariable } from '../../../modules/variable/DeclareVariable';
import { RecordProvider } from '../../../record-provider';
import { useLocalVariables, useVariables } from '../../../variables';
import { SortableItem } from '../../common';
import { useCompile, useComponent, useDesigner } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import ActionContainer from './Action.Container';
import { ActionDesigner } from './Action.Designer';
import { ActionDrawer } from './Action.Drawer';
import { ActionLink } from './Action.Link';
import { ActionModal } from './Action.Modal';
import { ActionPage } from './Action.Page';
import useStyles from './Action.style';
import { ActionContextProvider } from './context';
import { useA } from './hooks';
import { useGetAriaLabelOfAction } from './hooks/useGetAriaLabelOfAction';
import { ActionProps, ComposedAction } from './types';
import { linkageAction, setInitialActionState } from './utils';

export const Action: ComposedAction = withDynamicSchemaProps(
  observer((props: ActionProps) => {
    const {
      popover,
      confirm,
      openMode: om,
      containerRefKey,
      component,
      useAction = useA,
      className,
      icon,
      title,
      onClick,
      style,
      loading,
      openSize: os,
      disabled: propsDisabled,
      actionCallback,
      /** 如果为 true 则说明该按钮是树表格的 Add child 按钮 */
      addChild,
      onMouseEnter,
      ...others
    } = useProps(props); // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const aclCtx = useACLActionParamsContext();
    const { wrapSSR, componentCls, hashId } = useStyles();
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    const [formValueChanged, setFormValueChanged] = useState(false);
    const Designer = useDesigner();
    const field = useField<any>();
    const { run, element } = useAction(actionCallback);
    const fieldSchema = useFieldSchema();
    const compile = useCompile();
    const form = useForm();
    const recordData = useCollectionRecordData();
    const parentRecordData = useCollectionParentRecordData();
    const collection = useCollection();
    const designerProps = fieldSchema['x-toolbar-props'] || fieldSchema['x-designer-props'];
    const openMode = fieldSchema?.['x-component-props']?.['openMode'];
    const openSize = fieldSchema?.['x-component-props']?.['openSize'];
    const refreshDataBlockRequest = fieldSchema?.['x-component-props']?.['refreshDataBlockRequest'];

    const disabled = form.disabled || field.disabled || field.data?.disabled || propsDisabled;
    const linkageRules = useMemo(() => fieldSchema?.['x-linkage-rules'] || [], [fieldSchema?.['x-linkage-rules']]);
    const { designable } = useDesignable();
    const tarComponent = useComponent(component) || component;
    const { modal } = App.useApp();
    const variables = useVariables();
    const localVariables = useLocalVariables({ currentForm: { values: recordData } as any });
    const { getAriaLabel } = useGetAriaLabelOfAction(title);
    const service = useDataBlockRequest();

    const actionTitle = useMemo(() => {
      const res = title || compile(fieldSchema.title);
      return lodash.isString(res) ? t(res) : res;
    }, [title, fieldSchema.title, t]);

    useEffect(() => {
      if (field.stateOfLinkageRules) {
        setInitialActionState(field);
      }
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

    const handleButtonClick = useCallback(
      (e: React.MouseEvent) => {
        if (isPortalInBody(e.target as Element)) {
          return;
        }
        e.preventDefault();
        e.stopPropagation();

        if (!disabled && aclCtx) {
          const onOk = () => {
            if (onClick) {
              onClick(e, () => {
                if (refreshDataBlockRequest !== false) {
                  service?.refresh?.();
                }
              });
            } else {
              setVisible(true);
              run();
            }
          };
          if (confirm?.content) {
            modal.confirm({
              title: t(confirm.title, { title: actionTitle }),
              content: t(confirm.content, { title: actionTitle }),
              onOk,
            });
          } else {
            onOk();
          }
        }
      },
      [confirm, disabled, modal, onClick, run],
    );

    const buttonStyle = useMemo(() => {
      return {
        ...style,
        opacity: designable && (field?.data?.hidden || !aclCtx) && 0.1,
      };
    }, [designable, field?.data?.hidden, style]);

    const handleMouseEnter = useCallback(
      (e) => {
        onMouseEnter?.(e);
      },
      [onMouseEnter],
    );
    const renderButton = () => {
      if (!designable && (field?.data?.hidden || !aclCtx)) {
        return null;
      }

      return (
        <SortableItem
          role="button"
          aria-label={getAriaLabel()}
          {...others}
          onMouseEnter={handleMouseEnter}
          loading={field?.data?.loading || loading}
          icon={icon ? <Icon type={icon} /> : null}
          disabled={disabled}
          style={buttonStyle}
          onClick={handleButtonClick}
          component={tarComponent || Button}
          className={classnames(componentCls, hashId, className, 'nb-action')}
          type={(props as any).type === 'danger' ? undefined : props.type}
        >
          {actionTitle}
          <Designer {...designerProps} />
        </SortableItem>
      );
    };

    const buttonElement = renderButton();

    // if (!btnHover) {
    //   return buttonElement;
    // }

    const result = (
      <ActionContextProvider
        button={buttonElement}
        visible={visible}
        setVisible={setVisible}
        formValueChanged={formValueChanged}
        setFormValueChanged={setFormValueChanged}
        openMode={openMode}
        openSize={openSize}
        containerRefKey={containerRefKey}
        fieldSchema={fieldSchema}
      >
        {popover && <RecursionField basePath={field.address} onlyRenderProperties schema={fieldSchema} />}
        {!popover && renderButton()}
        <DeclareVariable
          name="$nPopupRecord"
          title={t('Current popup record')}
          value={recordData}
          collection={collection}
        >
          {!popover && props.children}
        </DeclareVariable>
        {element}
      </ActionContextProvider>
    );

    // fix https://nocobase.height.app/T-3235/description
    if (addChild) {
      return wrapSSR(
        // fix https://nocobase.height.app/T-3966
        <RecordProvider record={null} parent={parentRecordData}>
          <TreeRecordProvider parent={recordData}>{result}</TreeRecordProvider>
        </RecordProvider>,
      );
    }

    return wrapSSR(result);
  }),
  { displayName: 'Action' },
);

Action.Popover = observer(
  (props) => {
    const { button, visible, setVisible } = useActionContext();
    return (
      <StablePopover
        {...props}
        destroyTooltipOnHide
        open={visible}
        onOpenChange={(visible) => {
          setVisible(visible);
        }}
        content={props.children}
      >
        {button}
      </StablePopover>
    );
  },
  { displayName: 'Action.Popover' },
);

Action.Popover.Footer = observer(
  (props) => {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          width: '100%',
        }}
      >
        {props.children}
      </div>
    );
  },
  { displayName: 'Action.Popover.Footer' },
);

Action.Link = ActionLink;
Action.Designer = ActionDesigner;
Action.Drawer = ActionDrawer;
Action.Modal = ActionModal;
Action.Container = ActionContainer;
Action.Page = ActionPage;

export default Action;
