import React from 'react';
import {
  Plugin,
  ActionBar,
  CurrentAppInfoProvider,
  SchemaComponentOptions,
  useCollectionManagerV2,
  CollectionManagerProviderV2,
} from '@nocobase/client';
import { Gantt } from './components/gantt/gantt';
import { GanttDesigner } from './Gantt.Designer';
import { ViewMode } from './types/public-types';
import { Event } from './components/gantt/Event';
import { GanttActionInitializers } from './GanttActionInitializers';
import { GanttBlockInitializer } from './GanttBlockInitializer';
import { GanttBlockProvider, useGanttBlockProps } from './GanttBlockProvider';
import { ganttSettings } from './Gantt.Settings';

Gantt.ActionBar = ActionBar;
Gantt.ViewMode = ViewMode;
Gantt.Designer = GanttDesigner;
Gantt.Event = Event;
export { Gantt };

const GanttProvider = React.memo((props) => {
  return (
    <CurrentAppInfoProvider>
      <SchemaComponentOptions
        components={{ Gantt, GanttBlockInitializer, GanttBlockProvider }}
        scope={{ useGanttBlockProps }}
      >
        {props.children}
      </SchemaComponentOptions>
    </CurrentAppInfoProvider>
  );
});

GanttProvider.displayName = 'GanttProvider';
export class GanttPlugin extends Plugin {
  async load() {
    this.app.use(GanttProvider);
    this.app.schemaSettingsManager.add(ganttSettings);
    this.app.schemaInitializerManager.add(GanttActionInitializers);
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('dataBlocks.gantt', {
      title: "{{t('Gantt')}}",
      Component: 'GanttBlockInitializer',
    });
  }
}

export default GanttPlugin;
