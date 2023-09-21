import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Drawer } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { OpenSize } from './';
import { useStyles } from './Action.Drawer.style';
import { useActionContext } from './hooks';
import { ComposedActionDrawer } from './types';

const openSizeWidthMap = new Map<OpenSize, string>([
  ['small', '30%'],
  ['middle', '50%'],
  ['large', '70%'],
]);
export const ActionDrawer: ComposedActionDrawer = observer(
  (props) => {
    const { footerNodeName = 'Action.Drawer.Footer', ...others } = props;
    const { visible, setVisible, openSize = 'middle', drawerProps, modalProps } = useActionContext();
    const schema = useFieldSchema();
    const field = useField();
    const { componentCls, hashId } = useStyles();
    const footerSchema = schema.reduceProperties((buf, s) => {
      if (s['x-component'] === footerNodeName) {
        return s;
      }
      return buf;
    });

    return (
      <Drawer
        data-testid="action-drawer"
        width={openSizeWidthMap.get(openSize)}
        title={field.title}
        {...others}
        {...drawerProps}
        rootStyle={{
          ...drawerProps?.style,
          ...others?.style,
        }}
        destroyOnClose
        open={visible}
        onClose={() => setVisible(false, true)}
        rootClassName={classNames(componentCls, hashId, drawerProps?.className, others.className, 'reset')}
        footer={
          footerSchema && (
            <div className={'footer'}>
              <RecursionField
                basePath={field.address}
                schema={schema}
                onlyRenderProperties
                filterProperties={(s) => {
                  return s['x-component'] === footerNodeName;
                }}
              />
            </div>
          )
        }
      >
        <RecursionField
          basePath={field.address}
          schema={schema}
          onlyRenderProperties
          filterProperties={(s) => {
            return s['x-component'] !== footerNodeName;
          }}
        />
      </Drawer>
    );
  },
  { displayName: 'ActionDrawer' },
);

ActionDrawer.Footer = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
  },
  { displayName: 'ActionDrawer.Footer' },
);

export default ActionDrawer;
