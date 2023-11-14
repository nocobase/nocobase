import { css } from '@emotion/css';
import { observer, RecursionField, SchemaExpressionScopeContext, useField, useFieldSchema } from '@formily/react';
import React, { useContext } from 'react';
import { createPortal } from 'react-dom';
import { useActionContext } from '.';
import { ComposedActionDrawer } from './types';

const useScope = (key: string) => {
  const scope = useContext(SchemaExpressionScopeContext);
  return scope[key];
};

export const ActionPage: ComposedActionDrawer = observer(
  (props: any) => {
    const { footerNodeName = 'Action.Page.Footer', ...others } = props;
    const { containerRefKey, visible, setVisible } = useActionContext();
    const containerRef = useScope(containerRefKey);
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
        {containerRef?.current &&
          visible &&
          createPortal(
            <div data-testid="action-page" className="nb-action-page">
              <RecursionField
                basePath={field.address}
                schema={schema}
                onlyRenderProperties
                filterProperties={(s) => {
                  return s['x-component'] !== footerNodeName;
                }}
              />
              {footerSchema && (
                <div
                  className={css`
                    display: flex;
                    /* justify-content: flex-end; */
                    /* flex-direction: row-reverse; */
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
              )}
            </div>,
            containerRef?.current,
          )}
      </>
    );
  },
  { displayName: 'ActionPage' },
);

ActionPage.Footer = observer(
  () => {
    const field = useField();
    const schema = useFieldSchema();
    return <RecursionField basePath={field.address} schema={schema} onlyRenderProperties />;
  },
  { displayName: 'ActionPage.Footer' },
);

export default ActionPage;
