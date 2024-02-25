import React, { useContext } from 'react';
import {
  Plugin,
  Action,
  CurrentAppInfoProvider,
  SchemaComponentOptions,
  CollectionManagerContext,
} from '@nocobase/client';
import { Kanban } from './Kanban';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner, kanbanCardInitializers } from './Kanban.Card.Designer';
import { KanbanCardViewer } from './Kanban.CardViewer';
import { KanbanDesigner } from './Kanban.Designer';
import { kanbanActionInitializers } from './KanbanActionInitializers';
import { KanbanBlockProvider, useKanbanBlockProps } from './KanbanBlockProvider';
import { KanbanBlockInitializer } from './KanbanBlockInitializer';
import { kanbanSettings } from './Kanban.Settings';

Kanban.Card = KanbanCard;
Kanban.CardAdder = Action;
Kanban.CardViewer = KanbanCardViewer;
Kanban.Card.Designer = KanbanCardDesigner;
Kanban.Designer = KanbanDesigner;

const KanbanV2 = Kanban;

const KanbanPluginProvider = React.memo((props) => {
  const ctx = useContext(CollectionManagerContext);
  return (
    <CurrentAppInfoProvider>
      <SchemaComponentOptions
        components={{ Kanban, KanbanBlockProvider, KanbanV2, KanbanBlockInitializer }}
        scope={{ useKanbanBlockProps }}
      >
        <CollectionManagerContext.Provider value={{ ...ctx }}>{props.children}</CollectionManagerContext.Provider>
      </SchemaComponentOptions>
    </CurrentAppInfoProvider>
  );
});
KanbanPluginProvider.displayName = 'KanbanPluginProvider';

class KanbanPlugin extends Plugin {
  async load() {
    this.app.use(KanbanPluginProvider);
    this.app.schemaInitializerManager.add(kanbanCardInitializers);
    this.app.schemaInitializerManager.add(kanbanActionInitializers);
    this.app.schemaSettingsManager.add(kanbanSettings);

    const blockInitializers = this.app.schemaInitializerManager.get('BlockInitializers');
    blockInitializers?.add('dataBlocks.kanban', {
      title: '{{t("Kanban")}}',
      Component: 'KanbanBlockInitializer',
    });
  }
}

export default KanbanPlugin;
