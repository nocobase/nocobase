/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field } from '@formily/core';
import { observer, Schema, useField, useFieldSchema, useForm } from '@formily/react';
import { isPortalInBody } from '@nocobase/utils/client';
import { App, Button, Tooltip } from 'antd';
import classnames from 'classnames';
import { isEqual } from 'lodash';
import debounce from 'lodash/debounce';
import { reaction } from '@formily/reactive';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useTranslation } from 'react-i18next';
import { uid } from '@formily/shared';
import { ErrorFallback, StablePopover, TabsContextProvider, useActionContext } from '../..';
import { useDesignable } from '../../';
import { useACLActionParamsContext } from '../../../acl';
import {
  useCollectionParentRecordData,
  useCollectionRecordData,
  useDataBlockRequestGetter,
} from '../../../data-source';
import { NocoBaseRecursionField } from '../../../formily/NocoBaseRecursionField';
import { withDynamicSchemaProps } from '../../../hoc/withDynamicSchemaProps';
import { Icon } from '../../../icon';
import { TreeRecordProvider } from '../../../modules/blocks/data-blocks/table/TreeRecordProvider';
import { VariablePopupRecordProvider } from '../../../modules/variable/variablesProvider/VariablePopupRecordProvider';
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
import { NAMESPACE_UI_SCHEMA } from '../../../i18n/constant';
import { forEachLinkageRule } from '../../../schema-settings/LinkageRules/forEachLinkageRule';
import { getVariableValuesInCondition } from '../../../schema-settings/LinkageRules/bindLinkageRulesToFiled';
import { getVariableValue } from '../../../common/getVariableValue';

// 这个要放到最下面，否则会导致前端单测失败
import { useApp } from '../../../application';
import { useAllDataBlocks } from '../page/AllDataBlocksProvider';

const useA = () => {
  return {
    async run() {},
  };
};

const handleError = console.log;

export const Action: ComposedAction = withDynamicSchemaProps(
  React.memo((props: ActionProps) => {
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
    const Designer = useDesigner();
    const field = useField<any>();
    const fieldSchema = useFieldSchema();
    const compile = useCompile();
    const recordData = useCollectionRecordData();
    const confirm = compile(fieldSchema['x-component-props']?.confirm) || propsConfirm;
    const linkageRules = useMemo(
      () => fieldSchema?.['x-linkage-rules']?.filter((k) => !k.disabled) || [],
      [fieldSchema?.['x-linkage-rules']],
    );
    const { designable } = useDesignable();
    const tarComponent = useComponent(component) || component;
    const variables = useVariables();
    const localVariables = useLocalVariables();
    const { visibleWithURL, setVisibleWithURL } = usePopupUtils();
    const { setSubmitted } = useActionContext();
    const { getAriaLabel } = useGetAriaLabelOfAction(title);
    const parentRecordData = useCollectionParentRecordData();
    const app = useApp();
    const { getAllDataBlocks } = useAllDataBlocks();
    const form = useForm();
    useEffect(() => {
      if (field.stateOfLinkageRules) {
        setInitialActionState(field);
      }
      const id = uid();
      const disposes = [];
      // 如果不延迟执行，那么一开始获取到的 form.values 的值是旧的，会导致详情区块的联动规则出现一些问题
      setTimeout(() => {
        form.addEffects(id, () => {
          forEachLinkageRule(linkageRules, (action, rule) => {
            disposes.push(
              reaction(
                () => {
                  // 获取条件中的变量值
                  const variableValuesInCondition = getVariableValuesInCondition({ linkageRules, localVariables });
                  const result = [variableValuesInCondition].map((item) => JSON.stringify(item)).join(',');
                  return result;
                },
                () => {
                  field.stateOfLinkageRules = {};
                  linkageAction(
                    {
                      operator: action.operator,
                      field,
                      condition: rule.condition,
                      variables,
                      localVariables,
                      conditionType: rule.conditionType,
                      variableNameOfLeftCondition: '$nRecord',
                    },
                    app.jsonLogic,
                  );
                },
                { fireImmediately: true, equals: isEqual },
              ),
            );
          });
        });
      });

      return () => {
        form.removeEffects(id);
        disposes.forEach((dispose) => {
          dispose();
        });
      };
    }, [linkageRules, recordData]);

    const handleMouseEnter = useCallback(
      (e) => {
        onMouseEnter?.(e);
      },
      [onMouseEnter],
    );

    const handleClick = useMemo(() => {
      return (
        onClick &&
        (async (e, callback) => {
          await onClick?.(e, callback);

          // 执行完 onClick 之后，刷新数据区块
          const blocksToRefresh = fieldSchema['x-action-settings']?.onSuccess?.blocksToRefresh || [];
          if (blocksToRefresh.length > 0) {
            getAllDataBlocks().forEach((block) => {
              if (blocksToRefresh.includes(block.uid)) {
                try {
                  block.service?.refresh();
                } catch (error) {
                  console.error('Failed to refresh block:', block.uid, error);
                }
              }
            });
          }
        })
      );
    }, [onClick, fieldSchema, getAllDataBlocks]);

    return (
      <InternalAction
        containerRefKey={containerRefKey}
        fieldSchema={fieldSchema}
        designable={designable}
        field={field}
        icon={icon}
        loading={loading}
        handleMouseEnter={handleMouseEnter}
        tarComponent={tarComponent}
        className={className}
        type={props.type}
        Designer={Designer}
        onClick={handleClick}
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
    onClick,
    refreshDataBlockRequest,
    fieldSchema,
    setVisible,
    run,
    confirm,
    modal,
    setSubmitted,
    confirmTitle,
    title,
  };

  const handleVisibleChange = useCallback(
    (value: boolean): void => {
      setVisible?.(value);
      setVisibleWithURL?.(value);
    },
    [setVisibleWithURL],
  );

  let result = (
    <PopupVisibleProvider visible={false}>
      <ActionContextProvider
        button={RenderButton(buttonProps)}
        visible={visible || visibleWithURL}
        setVisible={handleVisibleChange}
        formValueChanged={formValueChanged}
        setFormValueChanged={setFormValueChanged}
        openMode={openMode}
        openSize={openSize}
        containerRefKey={containerRefKey}
        fieldSchema={fieldSchema}
        setSubmitted={setSubmitted}
      >
        {popover && <NocoBaseRecursionField basePath={field.address} onlyRenderProperties schema={fieldSchema} />}
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
    return wrapSSR(<TreeRecordProvider parent={recordData}>{result}</TreeRecordProvider>) as React.ReactElement;
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
export function isBulkEditAction(fieldSchema) {
  return fieldSchema['x-action'] === 'customize:bulkEdit';
}

const RenderButton = ({
  designable,
  field,
  aclCtx,
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
  onClick,
  refreshDataBlockRequest,
  fieldSchema,
  setVisible,
  run,
  confirm,
  modal,
  setSubmitted,
  confirmTitle,
  title,
}) => {
  const { getDataBlockRequest } = useDataBlockRequestGetter();
  const { t } = useTranslation();
  const { isPopupVisibleControlledByURL } = usePopupSettings();
  const { openPopup } = usePopupUtils();
  const variables = useVariables();
  const localVariables = useLocalVariables();
  const openPopupRef = useRef(null);
  const compile = useCompile();
  const form = useForm();
  openPopupRef.current = openPopup;
  const scopes = {
    variables,
    localVariables,
  };

  const handleButtonClick = useCallback(
    async (e: React.MouseEvent, checkPortal = true) => {
      if (checkPortal && isPortalInBody(e.target as Element)) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();

      const resultTitle = await getVariableValue(t(confirm?.title, { title: compile(fieldSchema.title) }), scopes);
      const resultContent = await getVariableValue(t(confirm?.content, { title: compile(fieldSchema.title) }), scopes);
      if (!disabled && aclCtx) {
        const onOk = () => {
          if (onClick) {
            onClick(e, () => {
              if (refreshDataBlockRequest !== false) {
                setSubmitted?.(true);
                getDataBlockRequest()?.refresh?.();
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
          await form?.submit?.();
          modal.confirm({
            title: t(resultTitle, { title: confirmTitle || title || field?.title }),
            content: t(resultContent, { title: confirmTitle || title || field?.title }),
            onOk,
          });
        } else {
          onOk();
        }
      }
    },
    [
      aclCtx,
      confirm?.content,
      confirm?.enable,
      confirm?.title,
      confirmTitle,
      disabled,
      field,
      fieldSchema,
      isPopupVisibleControlledByURL,
      modal,
      onClick,
      refreshDataBlockRequest,
      run,
      setSubmitted,
      setVisible,
      t,
      title,
      getDataBlockRequest,
    ],
  );

  return (
    <RenderButtonInner
      designable={designable}
      field={field}
      aclCtx={aclCtx}
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
      title={title}
      {...others}
    />
  );
};

RenderButton.displayName = 'RenderButton';

const RenderButtonInner = observer(
  (props: {
    designable: boolean;
    field: Field;
    aclCtx: any;
    icon: string;
    loading: boolean;
    disabled: boolean;
    buttonStyle: React.CSSProperties;
    handleMouseEnter: (e: React.MouseEvent) => void;
    getAriaLabel: (postfix?: string) => string;
    handleButtonClick: (e: React.MouseEvent, checkPortal?: boolean) => void;
    tarComponent: React.ElementType;
    componentCls: string;
    hashId: string;
    className: string;
    type: string;
    Designer: React.ElementType;
    designerProps: any;
    title: string;
    isLink?: boolean;
    onlyIcon?: boolean;
  }) => {
    const {
      designable,
      field,
      aclCtx,
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
      title,
      isLink,
      onlyIcon,
      ...others
    } = props;
    const { t } = useTranslation();
    const debouncedClick = useCallback(
      debounce(
        (e: React.MouseEvent, checkPortal = true) => {
          handleButtonClick(e, checkPortal);
        },
        300,
        { leading: true, trailing: false },
      ),
      [handleButtonClick],
    );

    useEffect(() => {
      return () => {
        debouncedClick.cancel();
      };
    }, []);
    const WrapperComponent = useMemo(
      () =>
        React.forwardRef(
          ({ component: Component = tarComponent || Button, icon, onlyIcon, children, ...restProps }: any, ref) => {
            return (
              <Component ref={ref} {...restProps}>
                {onlyIcon ? (
                  <Tooltip title={restProps.title}>
                    <span style={{ padding: 3 }}>{icon && typeof icon === 'string' ? <Icon type={icon} /> : icon}</span>
                  </Tooltip>
                ) : (
                  <span style={{ paddingRight: 3 }}>
                    {icon && typeof icon === 'string' ? <Icon type={icon} /> : icon}
                  </span>
                )}
                {onlyIcon ? children[1] : children}
              </Component>
            );
          },
        ),
      [onlyIcon],
    );
    if (!designable && (field?.data?.hidden || !aclCtx)) {
      return null;
    }

    const rawTitle = title ?? field?.title;
    const actionTitle = typeof rawTitle === 'string' ? t(rawTitle, { ns: NAMESPACE_UI_SCHEMA }) : rawTitle;
    const { opacity, ...restButtonStyle } = buttonStyle;
    const linkStyle = isLink && opacity ? { opacity } : undefined;
    const Component = onlyIcon || tarComponent ? WrapperComponent : tarComponent || Button;
    return (
      <SortableItem
        role="button"
        aria-label={getAriaLabel()}
        {...others}
        onMouseEnter={handleMouseEnter}
        // @ts-ignore
        loading={field?.data?.loading || loading}
        icon={typeof icon === 'string' ? <Icon type={icon} style={linkStyle} /> : icon}
        disabled={disabled}
        style={isLink ? restButtonStyle : buttonStyle}
        onClick={process.env.__E2E__ ? handleButtonClick : debouncedClick} // E2E 中的点击操作都是很快的，如果加上 debounce 会导致 E2E 测试失败
        component={Component}
        className={classnames(componentCls, hashId, className, 'nb-action')}
        type={type === 'danger' ? undefined : type}
        title={actionTitle}
        onlyIcon={onlyIcon}
      >
        {!onlyIcon && actionTitle && (
          <span className={icon ? 'nb-action-title' : null} style={linkStyle}>
            {actionTitle}
          </span>
        )}
        <Designer {...designerProps} />
      </SortableItem>
    );
  },
);

RenderButtonInner.displayName = 'RenderButtonInner';
