import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import cls from 'classnames';
import React from 'react';
import { SortableItem } from '../../common';
import { useDesigner, useProps } from '../../hooks';

const getTestId = (schema) => {
  const resource = schema?.['x-decorator-props']?.['resource'];
  if (resource) {
    return `${resource}-resource`;
  }
  const field = schema['x-collection-field'];
  if (field) {
    return `${field}-field`;
  }
  return `${schema.name}-item`;
};

export const BlockItem: React.FC<any> = (props) => {
  const { className, children } = useProps(props);
  const Designer = useDesigner();
  const schema = useFieldSchema();
  return (
    <SortableItem
      data-testid={getTestId(schema)}
      className={cls(
        'nb-block-item',
        className,
        css`
          position: relative;
          &:hover {
            > .general-schema-designer {
              display: block;
            }
          }
          &.nb-form-item:hover {
            > .general-schema-designer {
              background: var(--colorBgSettingsHover) !important;
              border: 0 !important;
              top: -5px !important;
              bottom: -5px !important;
              left: -5px !important;
              right: -5px !important;
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
            border: 2px solid var(--colorBorderSettingsHover);
            pointer-events: none;
            > .general-schema-designer-icons {
              position: absolute;
              right: 2px;
              top: 2px;
              line-height: 16px;
              pointer-events: all;
              .ant-space-item {
                background-color: var(--colorSettings);
                color: #fff;
                line-height: 16px;
                width: 16px;
                padding-left: 1px;
                align-self: stretch;
              }
            }
          }
        `,
      )}
    >
      <Designer />
      {children}
    </SortableItem>
  );
};
