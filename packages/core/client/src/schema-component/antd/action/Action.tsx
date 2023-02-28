import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema, useForm } from '@formily/react';
import { Button, Modal, Popover } from 'antd';
import classnames from 'classnames';
import React, { useState, useEffect } from 'react';
import { useActionContext } from '../..';
import { Icon } from '../../../icon';
import { SortableItem } from '../../common';
import { useCompile, useDesigner } from '../../hooks';
import { useProps } from '../../hooks/useProps';
import { useRecord } from '../../../record-provider';
import ActionContainer from './Action.Container';
import { ActionDesigner } from './Action.Designer';
import { ActionDrawer } from './Action.Drawer';
import { ActionLink } from './Action.Link';
import { ActionModal } from './Action.Modal';
import { ActionPage } from './Action.Page';
import { ActionContext } from './context';
import { useA } from './hooks';
import { ComposedAction } from './types';
import { useDesignable } from '../../';
import { linkageAction } from './utils';

export const actionDesignerCss = css`
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

export const Action: ComposedAction = observer((props: any) => {
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
    ...others
  } = props;
  const { onClick } = useProps(props);
  const [visible, setVisible] = useState(false);
  const [formValueChanged, setFormValueChanged] = useState(false);
  const Designer = useDesigner();
  const field = useField<any>();
  const { run } = useAction();
  const fieldSchema = useFieldSchema();
  const compile = useCompile();
  const form = useForm();
  const values = useRecord();
  const designerProps = fieldSchema['x-designer-props'];
  const openMode = fieldSchema?.['x-component-props']?.['openMode'];
  const disabled = form.disabled || field.disabled;
  const openSize = fieldSchema?.['x-component-props']?.['openSize'];
  const linkageRules = fieldSchema?.['x-linkage-rules'] || [];
  const { designable } = useDesignable();
  useEffect(() => {
    linkageRules.map((v) => {
      return v.actions?.map((h) => {
        linkageAction(h.operator, field, v.condition, values, designable);
      });
    });
  }, [linkageRules]);
  const renderButton = () => (
    <SortableItem
      {...others}
      loading={field?.data?.loading}
      icon={<Icon type={icon} />}
      disabled={disabled}
      style={{ border: field?.data?.hidden && '1px dashed #ede9e9' }}
      onClick={(e: React.MouseEvent) => {
        if (!disabled) {
          e.preventDefault();
          e.stopPropagation();
          const onOk = () => {
            onClick?.(e);
            setVisible(true);
            run();
          };
          if (confirm) {
            Modal.confirm({
              ...confirm,
              onOk,
            });
          } else {
            onOk();
          }
        }
      }}
      component={component || Button}
      className={classnames(className, actionDesignerCss)}
    >
      {title || compile(fieldSchema.title)}
      <Designer {...designerProps} />
    </SortableItem>
  );
  return (
    <ActionContext.Provider
      value={{
        button: renderButton(),
        visible,
        setVisible,
        formValueChanged,
        setFormValueChanged,
        openMode,
        openSize,
        containerRefKey,
        fieldSchema,
      }}
    >
      {popover && <RecursionField basePath={field.address} onlyRenderProperties schema={fieldSchema} />}
      {!popover && renderButton()}
      {!popover && props.children}
    </ActionContext.Provider>
  );
});

Action.Popover = observer((props) => {
  const { button, visible, setVisible } = useActionContext();
  return (
    <Popover
      {...props}
      destroyTooltipOnHide
      visible={visible}
      onVisibleChange={(visible) => {
        setVisible(visible);
      }}
      content={props.children}
    >
      {button}
    </Popover>
  );
});

Action.Popover.Footer = observer((props) => {
  return (
    <div
      className={css`
        display: flex;
        justify-content: flex-end;
        width: 100%;
      `}
    >
      {props.children}
    </div>
  );
});

Action.Link = ActionLink;
Action.Designer = ActionDesigner;
Action.Drawer = ActionDrawer;
Action.Modal = ActionModal;
Action.Container = ActionContainer;
Action.Page = ActionPage;

export default Action;
