/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { observer, RecursionField, Schema, useField, useFieldSchema, useForm } from '@formily/react';
import { isPortalInBody } from '@nocobase/utils/client';
import { App, Button } from 'antd';
import classnames from 'classnames';
import { default as lodash } from 'lodash';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { ErrorFallback, StablePopover, TabsContextProvider, useActionContext } from '../..';
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
import { ActionContextProps, ActionProps, ComposedAction } from './types';
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
      confirm: propsConfirm,
      /** 如果为 true 则说明该按钮是树表格的 Add child 按钮 */
      addChild,
      onMouseEnter,
      refreshDataBlockRequest: propsRefreshDataBlockRequest,
      confirmTitle,
      ...others
    } = useProps(props); // 新版 UISchema（1.0 之后）中已经废弃了 useProps，这里之所以继续保留是为了兼容旧版的 UISchema
    const { t } = useTranslation();
    const Designer = useDesigner();
    const field = useField<any>();
    const fieldSchema = useFieldSchema();
    const compile = useCompile();
    const recordData = useCollectionRecordData();
    const confirm = compile(fieldSchema['x-component-props']?.confirm) || propsConfirm;
    const linkageRules = useMemo(() => fieldSchema?.['x-linkage-rules'] || [], [fieldSchema?.['x-linkage-rules']]);
    const { designable } = useDesignable();
    const tarComponent = useComponent(component) || component;
    const variables = useVariables();
    const localVariables = useLocalVariables({ currentForm: { values: recordData, readPretty: false } as any });
    const { visibleWithURL, setVisibleWithURL } = usePopupUtils();
    const { setSubmitted } = useActionContext();
    const { getAriaLabel } = useGetAriaLabelOfAction(title);
    const parentRecordData = useCollectionParentRecordData();

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

    const handleMouseEnter = useCallback(
      (e) => {
        onMouseEnter?.(e);
      },
      [onMouseEnter],
    );

    return (
      <InternalAction
        containerRefKey={containerRefKey}
        fieldSchema={fieldSchema}
        designable={designable}
        field={field}
        actionTitle={actionTitle}
        icon={icon}
        loading={loading}
        handleMouseEnter={handleMouseEnter}
        tarComponent={tarComponent}
        className={className}
        type={props.type}
        Designer={Designer}
        onClick={onClick}
        confirm={confirm}
        confirmTitle={confirmTitle}
        popover={popover}
        addChild={addChild}
        recordData={recordData}
        title={title}
        style={style}
        propsDisabled={propsDisabled}
        useAction={useAction}
        visibleWithURL={visibleWithURL}
        setVisibleWithURL={setVisibleWithURL}
        setSubmitted={setSubmitted}
        getAriaLabel={getAriaLabel}
        parentRecordData={parentRecordData}
        actionCallback={actionCallback}
        {...others}
      />
    );
  }),
  { displayName: 'Action' },
);

interface InternalActionProps {
  containerRefKey: ActionContextProps['containerRefKey'];
  fieldSchema: Schema;
  designable: boolean;
  field: Field;
  actionTitle: string;
  icon: string;
  loading: boolean;
  handleMouseEnter: (e: React.MouseEvent) => void;
  tarComponent: React.ElementType;
  className: string;
  type: string;
  Designer: React.ElementType;
  onClick: (e: React.MouseEvent) => void;
  confirm: {
    enable: boolean;
    content: string;
    title: string;
  };
  confirmTitle: string;
  popover: boolean;
  addChild: boolean;
  recordData: any;
  title: string;
  style: React.CSSProperties;
  propsDisabled: boolean;
  useAction: (actionCallback: (...args: any[]) => any) => {
    run: () => void;
    element: React.ReactNode;
    disabled: boolean;
  };
  actionCallback: (...args: any[]) => any;
  visibleWithURL: boolean;
  setVisibleWithURL: (visible: boolean) => void;
  setSubmitted: (v: boolean) => void;
  getAriaLabel: (postfix?: string) => string;
  parentRecordData: any;
}

const InternalAction: React.FC<InternalActionProps> = observer(function Com(props) {
  const {
    containerRefKey,
    fieldSchema,
    designable,
    field,
    actionTitle,
    icon,
    loading,
    handleMouseEnter,
    tarComponent,
    className,
    type,
    Designer,
    onClick,
    confirm,
    confirmTitle,
    popover,
    addChild,
    recordData,
    title,
    style,
    propsDisabled,
    useAction,
    actionCallback,
    visibleWithURL,
    setVisibleWithURL,
    setSubmitted,
    getAriaLabel,
    parentRecordData,
    ...others
  } = props;
  const [visible, setVisible] = useState(false);
  const { wrapSSR, componentCls, hashId } = useStyles();
  const [formValueChanged, setFormValueChanged] = useState(false);
  const designerProps = fieldSchema['x-toolbar-props'] || fieldSchema['x-designer-props'];
  const openMode = fieldSchema?.['x-component-props']?.['openMode'];
  const openSize = fieldSchema?.['x-component-props']?.['openSize'];
  const refreshDataBlockRequest = fieldSchema?.['x-component-props']?.['refreshDataBlockRequest'];
  const { modal } = App.useApp();
  const form = useForm();
  const aclCtx = useACLActionParamsContext();
  const { run, element, disabled: disableAction } = useAction?.(actionCallback) || ({} as any);
  const disabled = form.disabled || field.disabled || field.data?.disabled || propsDisabled || disableAction;

  const buttonStyle = useMemo(() => {
    return {
      ...style,
      opacity: designable && (field?.data?.hidden || !aclCtx) && 0.1,
      color: disabled ? 'rgba(0, 0, 0, 0.25)' : style?.color,
    };
  }, [aclCtx, designable, field?.data?.hidden, style, disabled]);

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
    type,
    Designer,
    openMode,
    onClick,
    refreshDataBlockRequest,
    fieldSchema,
    setVisible,
    run,
    confirm,
    modal,
    setSubmitted,
    confirmTitle,
  };

  let result = (
    <PopupVisibleProvider visible={false}>
      <ActionContextProvider
        button={RenderButton(buttonProps)}
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
        setSubmitted={setSubmitted}
      >
        {popover && <RecursionField basePath={field.address} onlyRenderProperties schema={fieldSchema} />}
        {!popover && <RenderButton {...buttonProps} />}
        <VariablePopupRecordProvider>{!popover && props.children}</VariablePopupRecordProvider>
        {element}
      </ActionContextProvider>
    </PopupVisibleProvider>
  );

  if (isBulkEditAction(fieldSchema)) {
    // Clear the context of Tabs to avoid affecting the Tabs of the upper-level popup
    result = <TabsContextProvider>{result}</TabsContextProvider>;
  }

  if (addChild) {
    return wrapSSR(
      <RecordProvider record={null} parent={parentRecordData}>
        <TreeRecordProvider parent={recordData}>{result}</TreeRecordProvider>
      </RecordProvider>,
    ) as React.ReactElement;
  }

  return wrapSSR(result) as React.ReactElement;
});

InternalAction.displayName = 'InternalAction';

Action.Popover = function ActionPopover(props) {
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
};

Action.Popover.displayName = 'Action.Popover';

Action.Popover.Footer = (props) => {
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
};

Action.Popover.Footer.displayName = 'Action.Popover.Footer';

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
  fieldSchema,
  setVisible,
  run,
  confirm,
  modal,
  setSubmitted,
  confirmTitle,
}) {
  const service = useDataBlockRequest();
  const { t } = useTranslation();
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { openPopup } = usePopupUtils();

  const serviceRef = useRef(null);
  serviceRef.current = service;

  const openPopupRef = useRef(null);
  openPopupRef.current = openPopup;

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
                serviceRef.current?.refresh?.();
              }
            });
          } else if (isBulkEditAction(fieldSchema) || !isPopupVisibleControlledByURL()) {
            setVisible(true);
            run?.();
          } else {
            // Currently, only buttons of these types can control the visibility of popups through URLs.
            if (
              ['view', 'update', 'create', 'customize:popup'].includes(fieldSchema['x-action']) &&
              fieldSchema['x-uid']
            ) {
              openPopupRef.current();
            } else {
              setVisible(true);
              run?.();
            }
          }
        };
        if (confirm?.enable !== false && confirm?.content) {
          modal.confirm({
            title: t(confirm.title, { title: confirmTitle || actionTitle }),
            content: t(confirm.content, { title: confirmTitle || actionTitle }),
            onOk,
          });
        } else {
          onOk();
        }
      }
    },
    [
      disabled,
      aclCtx,
      confirm?.enable,
      confirm?.content,
      confirm?.title,
      onClick,
      fieldSchema,
      isPopupVisibleControlledByURL,
      refreshDataBlockRequest,
      setSubmitted,
      setVisible,
      run,
      modal,
      t,
      confirmTitle,
      actionTitle,
    ],
  );

  return (
    <RenderButtonInner
      designable={designable}
      field={field}
      aclCtx={aclCtx}
      actionTitle={actionTitle}
      icon={icon}
      loading={loading}
      disabled={disabled}
      buttonStyle={buttonStyle}
      handleMouseEnter={handleMouseEnter}
      getAriaLabel={getAriaLabel}
      handleButtonClick={handleButtonClick}
      tarComponent={tarComponent}
      componentCls={componentCls}
      hashId={hashId}
      className={className}
      type={type}
      Designer={Designer}
      designerProps={designerProps}
      {...others}
    />
  );
}

const RenderButtonInner = observer(
  (props: {
    designable: boolean;
    field: Field;
    aclCtx: any;
    actionTitle: string;
    icon: string;
    loading: boolean;
    disabled: boolean;
    buttonStyle: React.CSSProperties;
    handleMouseEnter: (e: React.MouseEvent) => void;
    getAriaLabel: (postfix?: string) => string;
    handleButtonClick: (e: React.MouseEvent) => void;
    tarComponent: React.ElementType;
    componentCls: string;
    hashId: string;
    className: string;
    type: string;
    Designer: React.ElementType;
    designerProps: any;
  }) => {
    const {
      designable,
      field,
      aclCtx,
      actionTitle,
      icon,
      loading,
      disabled,
      buttonStyle,
      handleMouseEnter,
      getAriaLabel,
      handleButtonClick,
      tarComponent,
      componentCls,
      hashId,
      className,
      type,
      Designer,
      designerProps,
      ...others
    } = props;

    if (!designable && (field?.data?.hidden || !aclCtx)) {
      return null;
    }

    return (
      <SortableItem
        role="button"
        aria-label={getAriaLabel()}
        {...others}
        onMouseEnter={handleMouseEnter}
        // @ts-ignore
        loading={field?.data?.loading || loading}
        icon={typeof icon === 'string' ? <Icon type={icon} /> : icon}
        disabled={disabled}
        style={buttonStyle}
        onClick={handleButtonClick}
        component={tarComponent || Button}
        className={classnames(componentCls, hashId, className, 'nb-action')}
        type={type === 'danger' ? undefined : type}
      >
        {actionTitle && <span className={icon ? 'nb-action-title' : null}>{actionTitle}</span>}
        <Designer {...designerProps} />
      </SortableItem>
    );
  },
);

RenderButtonInner.displayName = 'RenderButtonInner';
