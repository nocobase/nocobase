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
import _, { default as lodash } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { ErrorFallback, StablePopover, useActionContext } from '../..';
import { useDesignable } from '../../';
import { useACLActionParamsContext } from '../../../acl';
import { useCollectionParentRecordData, useCollectionRecordData, useDataBlockRequest } from '../../../data-source';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { Icon } from '../../../icon';
import { TreeRecordProvider } from '../../../modules/blocks/data-blocks/table/TreeRecordProvider';
import { VariablePopupRecordProvider } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
import { RecordProvider } from '../../../record-provider';
import { useLocalVariables, useVariables } from '../../../variables';
import { SortableItem } from '../../common';
import { useCompile, useComponent, useDesigner } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import { PopupVisibleProvider } from '../page/PagePopups';
import { usePopupUtils } from '../page/pagePopupUtils';
import { usePopupSettings } from '../page/PopupSettingsProvider';
import ActionContainer from './Action.Container';
import { ActionDesigner } from './Action.Designer';
import { ActionDrawer } from './Action.Drawer';
import { ActionLink } from './Action.Link';
import { ActionModal } from './Action.Modal';
import { ActionPage } from './Action.Page';
import useStyles from './Action.style';
import { ActionContextProvider } from './context';
import { useGetAriaLabelOfAction } from './hooks/useGetAriaLabelOfAction';
import { ActionProps, ComposedAction } from './types';
import { linkageAction, setInitialActionState } from './utils';

const useA = () => {
  return {
    async run() {},
  };
};

const handleError = (err) => console.log(err);

export const Action: ComposedAction = withDynamicSchemaProps(
  observer((props: ActionProps) => {
    const {
      popover,
      confirm,
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
      refreshDataBlockRequest: propsRefreshDataBlockRequest,
      ...others
    } = useProps(props); // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const aclCtx = useACLActionParamsContext();
    const { wrapSSR, componentCls, hashId } = useStyles();
    const { t } = useTranslation();
    const { visibleWithURL, setVisibleWithURL } = usePopupUtils();
    const [visible, setVisible] = useState(false);
    const [formValueChanged, setFormValueChanged] = useState(false);
    const { setSubmitted: setParentSubmitted } = useActionContext();
    const Designer = useDesigner();
    const field = useField<any>();
    const { run, element, disabled: disableAction } = _.isFunction(useAction) ? useAction(actionCallback) : ({} as any);
    const fieldSchema = useFieldSchema();
    const compile = useCompile();
    const form = useForm();
    const recordData = useCollectionRecordData();
    const parentRecordData = useCollectionParentRecordData();
    const designerProps = fieldSchema['x-toolbar-props'] || fieldSchema['x-designer-props'];
    const openMode = fieldSchema?.['x-component-props']?.['openMode'];
    const openSize = fieldSchema?.['x-component-props']?.['openSize'];
    const refreshDataBlockRequest = fieldSchema?.['x-component-props']?.['refreshDataBlockRequest'];

    const disabled = form.disabled || field.disabled || field.data?.disabled || propsDisabled || disableAction;
    const linkageRules = useMemo(() => fieldSchema?.['x-linkage-rules'] || [], [fieldSchema?.['x-linkage-rules']]);
    const { designable } = useDesignable();
    const tarComponent = useComponent(component) || component;
    const { modal } = App.useApp();
    const variables = useVariables();
    const localVariables = useLocalVariables({ currentForm: { values: recordData, readPretty: false } as any });
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

    const buttonStyle = useMemo(() => {
      return {
        ...style,
        opacity: designable && (field?.data?.hidden || !aclCtx) && 0.1,
        color: disabled ? 'rgba(0, 0, 0, 0.25)' : style?.color,
      };
    }, [aclCtx, designable, field?.data?.hidden, style, disabled]);

    const handleMouseEnter = useCallback(
      (e) => {
        onMouseEnter?.(e);
      },
      [onMouseEnter],
    );

    const buttonProps = {
      designable,
      field,
      aclCtx,
      actionTitle,
      icon,
      loading,
      disabled,
      buttonStyle,
      handleMouseEnter,
      tarComponent,
      designerProps,
      componentCls,
      hashId,
      className,
      others,
      getAriaLabel,
      type: props.type,
      Designer,
      openMode,
      onClick,
      refreshDataBlockRequest,
      service,
      fieldSchema,
      setVisible,
      run,
      confirm,
      modal,
      setSubmitted: setParentSubmitted,
    };

    const buttonElement = RenderButton(buttonProps);

    // if (!btnHover) {
    //   return buttonElement;
    // }

    const result = (
      <PopupVisibleProvider visible={false}>
        <ActionContextProvider
          button={buttonElement}
          visible={visible || visibleWithURL}
          setVisible={(value) => {
            setVisible?.(value);
            setVisibleWithURL?.(value);
          }}
          formValueChanged={formValueChanged}
          setFormValueChanged={setFormValueChanged}
          openMode={openMode}
          openSize={openSize}
          containerRefKey={containerRefKey}
          fieldSchema={fieldSchema}
          setSubmitted={setParentSubmitted}
        >
          {popover && <RecursionField basePath={field.address} onlyRenderProperties schema={fieldSchema} />}
          {!popover && <RenderButton {...buttonProps} />}
          <VariablePopupRecordProvider>{!popover && props.children}</VariablePopupRecordProvider>
          {element}
        </ActionContextProvider>
      </PopupVisibleProvider>
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
    const content = (
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
        {props.children}
      </ErrorBoundary>
    );
    return (
      <StablePopover
        {...props}
        destroyTooltipOnHide
        open={visible}
        onOpenChange={(visible) => {
          setVisible(visible);
        }}
        content={content}
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

// TODO: Plugin-related code should not exist in the core. It would be better to implement it by modifying the schema, but it would cause incompatibility.
function isBulkEditAction(fieldSchema) {
  return fieldSchema['x-action'] === 'customize:bulkEdit';
}

function RenderButton({
  designable,
  field,
  aclCtx,
  actionTitle,
  icon,
  loading,
  disabled,
  buttonStyle,
  handleMouseEnter,
  tarComponent,
  designerProps,
  componentCls,
  hashId,
  className,
  others,
  getAriaLabel,
  type,
  Designer,
  openMode,
  onClick,
  refreshDataBlockRequest,
  service,
  fieldSchema,
  setVisible,
  run,
  confirm,
  modal,
  setSubmitted,
}) {
  const { t } = useTranslation();
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { openPopup } = usePopupUtils();

  const handleButtonClick = useCallback(
    (e: React.MouseEvent, checkPortal = true) => {
      if (checkPortal && isPortalInBody(e.target as Element)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      if (!disabled && aclCtx) {
        const onOk = () => {
          if (onClick) {
            onClick(e, () => {
              if (refreshDataBlockRequest !== false) {
                setSubmitted?.(true);
                service?.refresh?.();
              }
            });
          } else if (isBulkEditAction(fieldSchema) || !isPopupVisibleControlledByURL()) {
            setVisible(true);
            run?.();
          } else {
            if (
              // Currently, only buttons of these types can control the visibility of popups through URLs.
              ['view', 'update', 'create', 'customize:popup'].includes(fieldSchema['x-action']) &&
              fieldSchema['x-uid']
            ) {
              openPopup();
            } else {
              setVisible(true);
              run?.();
            }
          }
        };
        if (confirm?.enable !== false && confirm?.content) {
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
    [
      aclCtx,
      actionTitle,
      confirm?.content,
      confirm?.title,
      disabled,
      modal,
      onClick,
      openPopup,
      refreshDataBlockRequest,
      run,
      service,
      setVisible,
      t,
    ],
  );

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
      icon={typeof icon === 'string' ? <Icon type={icon} /> : icon}
      disabled={disabled}
      style={buttonStyle}
      onClick={handleButtonClick}
      component={tarComponent || Button}
      className={classnames(componentCls, hashId, className, 'nb-action')}
      type={type === 'danger' ? undefined : type}
    >
      {actionTitle}
      <Designer {...designerProps} />
    </SortableItem>
  );
}
