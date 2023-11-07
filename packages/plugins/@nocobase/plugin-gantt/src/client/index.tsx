import React, { useContext } from 'react';
import {
  Plugin,
  ActionBar,
  CollectionManagerContext,
  CurrentAppInfoProvider,
  SchemaComponentOptions,
} from '@nocobase/client';
import { Gantt } from './components/gantt/gantt';
import { GanttDesigner } from './Gantt.Designer';
import { ViewMode } from './types/public-types';
import { Event } from './components/gantt/Event';
import { GanttActionInitializers } from './GanttActionInitializers';
import { GanttBlockInitializer } from './GanttBlockInitializer';
import { GanttBlockProvider, useGanttBlockProps } from './GanttBlockProvider';

Gantt.ActionBar = ActionBar;
Gantt.ViewMode = ViewMode;
Gantt.Designer = GanttDesigner;
Gantt.Event = Event;
export { Gantt };

const GanttProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <CurrentAppInfoProvider>
      <SchemaComponentOptions
        components={{ Gantt, GanttBlockInitializer, GanttBlockProvider }}
        scope={{ useGanttBlockProps }}
      >
        <CollectionManagerContext.Provider value={{ ...ctx }}>{props.children}</CollectionManagerContext.Provider>
      </SchemaComponentOptions>
    </CurrentAppInfoProvider>
  );
});

GanttProvider.displayName = 'GanttProvider';
export class GanttPlugin extends Plugin {
  async load() {
    this.app.use(GanttProvider);
    this.app.schemaInitializerManager.add(GanttActionInitializers);
    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('dataBlocks.gantt', {
      title: "{{t('Gantt')}}",
      Component: 'GanttBlockInitializer',
    });
  }
}

export default GanttPlugin;
