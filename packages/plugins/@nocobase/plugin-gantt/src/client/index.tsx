/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionBar, Plugin, SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { GanttDesigner } from './Gantt.Designer';
import { ganttSettings, oldGanttSettings } from './Gantt.Settings';
import { GanttActionInitializers_deprecated, ganttActionInitializers } from './GanttActionInitializers';
import { GanttBlockInitializer } from './GanttBlockInitializer';
import { GanttBlockProvider, useGanttBlockProps } from './GanttBlockProvider';
import { Event } from './components/gantt/Event';
import { Gantt } from './components/gantt/gantt';
import { ViewMode } from './types/public-types';
import { useCreateAssociationGanttBlock, useCreateGanttBlock } from './GanttBlockInitializer';

Gantt.ActionBar = ActionBar;
Gantt.ViewMode = ViewMode;
Gantt.Designer = GanttDesigner;
Gantt.Event = Event;
export { Gantt };

const GanttProvider = React.memo((props) => {
  return (
    <SchemaComponentOptions
      components={{ Gantt, GanttBlockInitializer, GanttBlockProvider }}
      scope={{ useGanttBlockProps }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
});

GanttProvider.displayName = 'GanttProvider';
export class PluginGanttClient extends Plugin {
  async load() {
    this.app.use(GanttProvider);
    this.app.schemaSettingsManager.add(oldGanttSettings);
    this.app.schemaSettingsManager.add(ganttSettings);
    this.app.schemaInitializerManager.add(GanttActionInitializers_deprecated);
    this.app.schemaInitializerManager.add(ganttActionInitializers);
    const blockInitializers = this.app.schemaInitializerManager.get('page:addBlock');
    blockInitializers?.add('dataBlocks.gantt', {
      title: "{{t('Gantt')}}",
      Component: 'GanttBlockInitializer',
    });
    this.app.schemaInitializerManager.addItem('popup:common:addBlock', 'dataBlocks.gantt', {
      title: "{{t('Gantt')}}",
      Component: 'GanttBlockInitializer',
      useComponentProps() {
        const { createAssociationGanttBlock } = useCreateAssociationGanttBlock();
        const { createGanttBlock } = useCreateGanttBlock();

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
              return createGanttBlock({ item });
            }
            createAssociationGanttBlock({ item });
          },
          showAssociationFields: true,
          hideSearch: true,
        };
      },
    });
    this.app.addScopes({
      useGanttBlockProps,
    });
  }
}

export default PluginGanttClient;
