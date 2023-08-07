import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import cls from 'classnames';
import React from 'react';
import { useCollection } from '../../../collection-manager';
import { useSchemaInitializer } from '../../../schema-initializer';
import { DndContext, SortableItem } from '../../common';
import { useDesigner } from '../../hooks';
import { useToken } from '../__builtins__';
import { AssociationFilterBlockDesigner } from './AssociationFilter.BlockDesigner';
import { AssociationFilterFilterBlockInitializer } from './AssociationFilter.FilterBlockInitializer';
import { AssociationFilterInitializer } from './AssociationFilter.Initializer';
import { AssociationFilterItem } from './AssociationFilter.Item';
import { AssociationFilterItemDesigner } from './AssociationFilter.Item.Designer';
import { AssociationFilterProvider } from './AssociationFilterProvider';

export const AssociationFilter = (props) => {
  const { token } = useToken();
  const Designer = useDesigner();
  const filedSchema = useFieldSchema();

  const { render } = useSchemaInitializer(filedSchema['x-initializer']);

  return (
    <DndContext>
      <SortableItem
        className={cls(
          'nb-block-item',
          props.className,
          css`
            height: 100%;
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
AssociationFilter.Initializer = AssociationFilterInitializer;
AssociationFilter.FilterBlockInitializer = AssociationFilterFilterBlockInitializer;
AssociationFilter.Item = AssociationFilterItem as typeof AssociationFilterItem & {
  Designer: typeof AssociationFilterItemDesigner;
};
AssociationFilter.Item.Designer = AssociationFilterItemDesigner;
AssociationFilter.BlockDesigner = AssociationFilterBlockDesigner;

AssociationFilter.useAssociationField = () => {
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  return React.useMemo(() => getField(fieldSchema.name as any), [fieldSchema.name]);
};
