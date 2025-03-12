/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Action, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { Kanban } from './Kanban';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner, kanbanCardInitializers, kanbanCardInitializers_deprecated } from './Kanban.Card.Designer';
import { KanbanCardViewer } from './Kanban.CardViewer';
import { KanbanDesigner } from './Kanban.Designer';
import { kanbanSettings } from './Kanban.Settings';
import { kanbanActionInitializers, kanbanActionInitializers_deprecated } from './KanbanActionInitializers';
import {
  KanbanBlockInitializer,
  useCreateAssociationKanbanBlock,
  useCreateKanbanBlock,
} from './KanbanBlockInitializer';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';

Kanban.Card = KanbanCard;
Kanban.CardAdder = Action;
Kanban.CardViewer = KanbanCardViewer;
Kanban.Card.Designer = KanbanCardDesigner;
Kanban.Designer = KanbanDesigner;

const KanbanV2 = Kanban;

const KanbanPluginProvider = React.memo((props) => {
  return (
    <SchemaComponentOptions
      components={{ Kanban, KanbanBlockProvider, KanbanV2, KanbanBlockInitializer }}
      scope={{ useKanbanBlockProps }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
});
KanbanPluginProvider.displayName = 'KanbanPluginProvider';

type GroupOption = {
  value: string | number;
  label: string;
  color: string;
};

type CollectionField = {
  name: string;
  type: string;
  interface: string;
  [key: string]: any; // 扩展字段
};

type Option = { color?: string; label: string; value: string };
type GroupOptions = { options: Option[]; loading?: boolean };
type GetGroupOptions = (collectionField: string) => GroupOptions;

type UseGetGroupOptions = (collectionField: CollectionField) => { options: GroupOption[] };

const useDefaultGroupFieldsOptions = (collectionField) => {
  return { options: collectionField.uiSchema.enum };
};
class PluginKanbanClient extends Plugin {
  groupFields: { [T: string]: { useGetGroupOptions: GetGroupOptions } } = {
    select: { useGetGroupOptions: useDefaultGroupFieldsOptions },
    radioGroup: { useGetGroupOptions: useDefaultGroupFieldsOptions },
  };

  registerGroupFieldInterface(interfaceName: string, options: { useGetGroupOptions: GetGroupOptions }) {
    this.groupFields[interfaceName] = options;
  }

  getGroupFieldInterface(key) {
    if (key) {
      return this.groupFields[key];
    }
    return this.groupFields;
  }

  async load() {
    this.app.use(KanbanPluginProvider);
    this.app.schemaInitializerManager.add(kanbanCardInitializers_deprecated);
    this.app.schemaInitializerManager.add(kanbanCardInitializers);
    this.app.schemaInitializerManager.add(kanbanActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(kanbanActionInitializers);
    this.app.schemaSettingsManager.add(kanbanSettings);

    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('dataBlocks.kanban', {
      title: '{{t("Kanban")}}',
      Component: 'KanbanBlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'dataBlocks.kanban', {
      title: '{{t("Kanban")}}',
      Component: 'KanbanBlockInitializer',
      useComponentProps() {
        const { createAssociationKanbanBlock } = useCreateAssociationKanbanBlock();
        const { createKanbanBlock } = useCreateKanbanBlock();

        return {
          onlyCurrentDataSource: true,
          filterCollections({ associationField }) {
            if (associationField) {
              return ['hasMany', 'belongsToMany'].includes(associationField.type);
            }
            return false;
          },
          createBlockSchema: ({ item, fromOthersInPopup }) => {
            if (fromOthersInPopup) {
              return createKanbanBlock({ item });
            }
            createAssociationKanbanBlock({ item });
          },
          showAssociationFields: true,
          hideSearch: true,
        };
      },
    });
  }
}

export default PluginKanbanClient;
