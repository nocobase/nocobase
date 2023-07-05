import { css } from '@emotion/css';
import { observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import React, { useEffect, useState } from 'react';
import { CollectionProvider, useCollection } from '../../collection-manager';
import { useRecord } from '../../record-provider';
import { ActionContextProvider, useActionContext } from '../../schema-component';
import { linkageAction } from '../../schema-component/antd/action/utils';

const actionDesignerCss = css`
  position: relative;
  &:hover {
    .general-schema-designer {
      display: block;
    }
  }
  .general-schema-designer {
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

export const AddChildAction = observer(
  (props: any) => {
    const [visible, setVisible] = useState(false);
    const collection = useCollection();
    const fieldSchema = useFieldSchema();
    const field: any = useField();
    const linkageRules = fieldSchema?.['x-linkage-rules'] || [];
    const values = useRecord();
    const ctx = useActionContext();
    useEffect(() => {
      field.linkageProperty = {};
      linkageRules
        .filter((k) => !k.disabled)
        .map((v) => {
          return v.actions?.map((h) => {
            linkageAction(h.operator, field, v.condition, values);
          });
        });
    }, [linkageRules, values]);
    return (
      <div className={actionDesignerCss}>
        <ActionContextProvider value={{ ...ctx, visible, setVisible }}>
          <a onClick={() => setVisible(true)}>{props.children}</a>
          <CollectionProvider name={values.__collection || collection.name}>
            <RecursionField schema={fieldSchema} basePath={field.address} onlyRenderProperties />
          </CollectionProvider>
        </ActionContextProvider>
      </div>
    );
  },
  { displayName: 'AddChildAction' },
);
