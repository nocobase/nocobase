import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Drawer } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { createPortal } from 'react-dom';
import { useActionContext } from './hooks';
import { ComposedActionDrawer } from './types';

export const ActionDrawer: ComposedActionDrawer = observer((props) => {
  const { footerNodeName = 'Action.Drawer.Footer', ...others } = props;
  const { visible, setVisible } = useActionContext();
  const schema = useFieldSchema();
  const field = useField();
  const footerSchema = schema.reduceProperties((buf, s) => {
    if (s['x-component'] === footerNodeName) {
      return s;
    }
    return buf;
  });
  return (
    <>
      {createPortal(
        <Drawer
          width={'50%'}
          title={field.title}
          {...others}
          destroyOnClose
          visible={visible}
          onClose={() => setVisible(false)}
          className={classNames(
            others.className,
            css`
              &.nb-action-popup {
                .ant-drawer-content {
                  background: #f0f2f5;
                }
              }
              &.nb-record-picker-selector {
                .nb-block-item {
                  margin-bottom: 24px;
                  .general-schema-designer {
                    top: -8px;
                    bottom: -8px;
                    left: -8px;
                    right: -8px;
                  }
                }
              }
            `,
          )}
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
