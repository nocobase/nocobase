import React from 'react';
import { css, cx } from '@emotion/css';
import { PageDesigner } from './Page.Designer';
import { SortableItem, useDesigner } from '@nocobase/client';
import { RecursionField, useFieldSchema } from '@formily/react';

const InternalPage: React.FC = (props) => {
  const Designer = useDesigner();
  const fieldSchema = useFieldSchema();
  const tabsSchema = fieldSchema.properties?.['tabs'];

  return (
    <SortableItem
      eid="nb-mobile-scroll-wrapper"
      className={cx(
        'nb-mobile-page',
        css`
          background: #f0f2f5;
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          overflow-x: hidden;
          overflow-y: auto;
          padding-bottom: var(--nb-spacing);
        `,
      )}
    >
      <Designer {...fieldSchema?.['x-designer-props']}></Designer>
      <div
        style={{
          marginBottom: tabsSchema ? null : 'var(--nb-spacing)',
        }}
        className={cx(
          'nb-mobile-page-header',
          css`
            & > .ant-tabs > .ant-tabs-nav {
              background: #fff;
              padding: 0 var(--nb-spacing);
            }
            display: flex;
            flex-direction: column;
          `,
        )}
      >
        <RecursionField
          schema={fieldSchema}
          filterProperties={(s) => {
            return ['MHeader', 'Tabs'].includes(s['x-component']);
          }}
        ></RecursionField>
      </div>

      {!tabsSchema && (
        <RecursionField
          schema={fieldSchema}
          filterProperties={(s) => {
            return s['x-component'] !== 'MHeader';
          }}
        ></RecursionField>
      )}
    </SortableItem>
  );
};

export const MPage = InternalPage as unknown as typeof InternalPage & {
  Designer: typeof PageDesigner;
};
MPage.Designer = PageDesigner;
MPage.displayName = 'MPage';
