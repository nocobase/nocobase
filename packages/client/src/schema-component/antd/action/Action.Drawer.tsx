import { css } from '@emotion/css';
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
  const footerSchema = schema.reduceProperties((buf, s) => {
    if (s['x-component'] === 'Action.Drawer.Footer') {
      return s;
    }
    return buf;
  });
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
            footerSchema && (
              <div
                className={css`
                  display: flex;
                  justify-content: flex-end;
                  width: 100%;
                  .ant-btn {
                    margin-right: 8px;
                  }
                `}
              >
                <RecursionField
                  basePath={field.address}
                  schema={schema}
                  onlyRenderProperties
                  filterProperties={(s) => {
                    return s['x-component'] === 'Action.Drawer.Footer';
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
