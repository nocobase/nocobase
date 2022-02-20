import { css } from '@emotion/css';
import { observer, useField } from '@formily/react';
import { Button } from 'antd';
import classnames from 'classnames';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GeneralSchemaDesigner, SchemaSettings } from '../../../schema-settings';
import { SortableItem } from '../../common';
import { useDesigner } from '../../hooks';
import ActionContainer from './Action.Container';
import { ActionDrawer } from './Action.Drawer';
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
  const { openMode, containerRefKey, component, useAction = useA, onClick, className, ...others } = props;
  const [visible, setVisible] = useState(false);
  const Designer = useDesigner();
  const field = useField();
  const { run } = useAction();
  return (
    <ActionContext.Provider value={{ visible, setVisible, openMode, containerRefKey }}>
      <SortableItem
        {...others}
        onClick={(e) => {
          onClick && onClick(e);
          setVisible(true);
          run();
        }}
        component={component || Button}
        className={classnames(className, actionDesignerCss)}
      >
        <Designer />
        {field.title}
      </SortableItem>
      {props.children}
    </ActionContext.Provider>
  );
});

Action.Designer = () => {
  return (
    <GeneralSchemaDesigner>
      <SchemaSettings.Remove
        removeParentsIfNoChildren
        breakRemoveOn={(s) => {
          return s['x-component'] === 'Space' || s['x-component'] === 'ActionBar';
        }}
      />
    </GeneralSchemaDesigner>
  );
};

Action.Link = observer((props) => {
  return <Action {...props} component={Link} className={'nb-action-link'}/>;
});

Action.Drawer = ActionDrawer;
Action.Modal = ActionModal;
Action.Container = ActionContainer;
Action.Page = ActionPage;

export default Action;
