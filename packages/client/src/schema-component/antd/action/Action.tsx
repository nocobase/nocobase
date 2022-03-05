import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Button, Modal, Popover } from 'antd';
import classnames from 'classnames';
import React, { useState } from 'react';
import { useActionContext } from '../..';
import { SortableItem } from '../../common';
import { useDesigner } from '../../hooks';
import ActionContainer from './Action.Container';
import { ActionDesigner } from './Action.Designer';
import { ActionDrawer } from './Action.Drawer';
import { ActionLink } from './Action.Link';
import { ActionModal } from './Action.Modal';
import { ActionPage } from './Action.Page';
import { ActionContext } from './context';
import { useA } from './hooks';
import { ComposedAction } from './types';

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
    openMode,
    containerRefKey,
    component,
    useAction = useA,
    onClick,
    className,
    ...others
  } = props;
  const [visible, setVisible] = useState(false);
  const Designer = useDesigner();
  const field = useField();
  const { run } = useAction();
  const fieldSchema = useFieldSchema();
  const renderButton = () => (
    <SortableItem
      {...others}
      onClick={(e: React.MouseEvent) => {
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
      }}
      component={component || Button}
      className={classnames(className, actionDesignerCss)}
    >
      <Designer />
      {field.title}
    </SortableItem>
  );
  return (
    <ActionContext.Provider value={{ button: renderButton(), visible, setVisible, openMode, containerRefKey }}>
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
