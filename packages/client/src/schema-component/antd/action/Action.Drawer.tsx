import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { Drawer } from 'antd';
import { VisibleContext } from './context';
import { ComposedActionDrawer } from './types';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';

export const ActionDrawer: ComposedActionDrawer = observer((props) => {
  const [visible, setVisible] = useContext(VisibleContext);
  const schema = useFieldSchema();
  const field = useField();
  return (
    <>
      {createPortal(
        <Drawer
          title={schema.title}
          {...props}
          destroyOnClose
          visible={visible}
          onClose={() => setVisible(false)}
          footer={
            <RecursionField
              basePath={field.address}
              schema={schema}
              onlyRenderProperties
              filterProperties={(s) => {
                return s['x-component'] === 'Action.Drawer.Footer';
              }}
            />
          }
        >
          <RecursionField
            basePath={field.address}
            schema={schema}
            onlyRenderProperties
            filterProperties={(s) => {
              return s['x-component'] !== 'Action.Drawer.Footer';
            }}
          />
        </Drawer>,
        document.body,
      )}
    </>
  );
});

ActionDrawer.Footer = observer(() => {
  const field = useField();
  const schema = useFieldSchema();
  return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
});

export default ActionDrawer;
