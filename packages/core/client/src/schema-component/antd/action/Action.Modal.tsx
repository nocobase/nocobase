import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { Modal } from 'antd';
import classNames from 'classnames';
import React from 'react';
import { createPortal } from 'react-dom';
import { OpenSize, useActionContext } from '.';
import { ComposedActionDrawer } from './types';

const openSizeWidthMap = new Map<OpenSize, string>([
  ['small', '40%'],
  ['middle', '60%'],
  ['large', '80%'],
]);
export const ActionModal: ComposedActionDrawer = observer((props) => {
  const { footerNodeName = 'Action.Modal.Footer', width, ...others } = props;
  const { visible, setVisible, openSize = 'large' } = useActionContext();
  const actualWidth = width ?? openSizeWidthMap.get(openSize);
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
        <div
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Modal
            width={actualWidth}
            title={field.title}
            {...others}
            destroyOnClose
            visible={visible}
            onCancel={() => setVisible(false, true)}
            className={classNames(
              others.className,
              css`
                &.nb-action-popup {
                  .ant-modal-header {
                    display: none;
                  }

                  .ant-modal-body {
                    padding-top: 16px;
                  }

                  .ant-modal-body {
                    background: #f0f2f5;
                  }

                  .ant-modal-close-x {
                    width: 32px;
                    height: 32px;
                    line-height: 32px;
                  }
                }
              `,
            )}
            footer={
              footerSchema ? (
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
              ) : (
                false
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
          </Modal>
        </div>,
        document.body,
      )}
    </>
  );
});

ActionModal.Footer = observer(() => {
  const field = useField();
  const schema = useFieldSchema();
  return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
});

export default ActionModal;
