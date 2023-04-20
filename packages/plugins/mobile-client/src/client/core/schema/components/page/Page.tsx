import React from 'react';
import { css, cx } from '@emotion/css';
import { PageDesigner } from './Page.Designer';
import { SchemaComponent, SortableItem, useDesigner } from '@nocobase/client';
import { useFieldSchema } from '@formily/react';

const designerCss = css`
  position: relative;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding-bottom: var(--nb-spacing);
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
    border: 0;
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

const InternalPage: React.FC = (props) => {
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  return (
    <SortableItem className={cx('nb-mobile-page', designerCss)}>
      <Designer></Designer>
      <div
        className={cx(
          'nb-mobile-page-header',
          css`
            display: flex;
            background: #ffffff;
            margin-bottom: var(--nb-spacing);
          `,
        )}
      >
        <SchemaComponent
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] === 'MHeader';
          }}
        ></SchemaComponent>
      </div>
      <SchemaComponent
        schema={fieldSchema}
        filterProperties={(s) => {
          return s['x-component'] !== 'MHeader';
        }}
      ></SchemaComponent>
    </SortableItem>
  );
};

export const MPage = InternalPage as unknown as typeof InternalPage & {
  Designer: typeof PageDesigner;
};
MPage.Designer = PageDesigner;
MPage.displayName = 'MPage';
