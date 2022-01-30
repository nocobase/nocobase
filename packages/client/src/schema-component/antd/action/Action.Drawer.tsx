import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Drawer } from 'antd';
import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { VisibleContext } from './context';
import { ComposedActionDrawer } from './types';

export const ActionDrawer: ComposedActionDrawer = observer((props) => {
  const [visible, setVisible] = useContext(VisibleContext);
  const schema = useFieldSchema();
  const field = useField();
  return (
    <>
      {createPortal(
        <Drawer
          width={'50%'}
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
