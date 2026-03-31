/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import cls from 'classnames';
import React from 'react';
import { useSchemaInitializerRender } from '../../../application';
import { Plugin } from '../../../application/Plugin';
import { useCollection } from '../../../data-source/collection/CollectionProvider';
import {
  associationFilterFilterBlockInitializer,
  filterCollapseItemInitializer,
  filterCollapseItemInitializer_deprecated,
} from '../../../modules/blocks/filter-blocks/collapse/filterCollapseItemInitializer';
import { DndContext, SortableItem } from '../../common';
import { useDesigner } from '../../hooks';
import { useToken } from '../__builtins__';
import { AssociationFilterBlockDesigner } from './AssociationFilter.BlockDesigner';
import { associationFilterInitializer } from './AssociationFilter.Initializer';
import { AssociationFilterItem } from './AssociationFilter.Item';
import { AssociationFilterItemDesigner } from './AssociationFilter.Item.Designer';
import { AssociationFilterProvider } from './AssociationFilterProvider';
import { useAssociationFilterHeight } from './hook';
export const AssociationFilter = (props) => {
  const { token } = useToken();
  const Designer = useDesigner();
  const filedSchema = useFieldSchema();
  const height = useAssociationFilterHeight();
  const { render } = useSchemaInitializerRender(filedSchema['x-initializer'], filedSchema['x-initializer-props']);
  return (
    <DndContext>
      <SortableItem
        className={cls(
          'nb-block-item',
          props.className,
          css`
            height: ${height ? height + 'px' : '100%'};
            overflow-y: auto;
            position: relative;
            border-radius: ${token.borderRadiusLG}px;
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
        {props.children}
        {render()}
      </SortableItem>
    </DndContext>
  );
};

AssociationFilter.Provider = AssociationFilterProvider;
AssociationFilter.Item = AssociationFilterItem as typeof AssociationFilterItem & {
  Designer: typeof AssociationFilterItemDesigner;
};
AssociationFilter.Item.Designer = AssociationFilterItemDesigner;
AssociationFilter.BlockDesigner = AssociationFilterBlockDesigner;

AssociationFilter.useAssociationField = () => {
  const fieldSchema = useFieldSchema();
  const collection = useCollection();
  return React.useMemo(() => collection?.getField(fieldSchema?.name as any), [fieldSchema?.name]);
};

export class AssociationFilterPlugin extends Plugin {
  async load() {
    this.app.schemaInitializerManager.add(associationFilterFilterBlockInitializer);
    this.app.schemaInitializerManager.add(filterCollapseItemInitializer_deprecated);
    this.app.schemaInitializerManager.add(filterCollapseItemInitializer);
    this.app.schemaInitializerManager.add(associationFilterInitializer);
  }
}
