import { ActionBar } from '../action';
import { KanbanV2 } from './components/Kanban';
import { KanabanDesigner } from './Kanban.Designer';
import { KanbanCardViewer } from './components/Kanban.CardViewer';
import { Event } from './components/Event';

KanbanV2.ActionBar = ActionBar;
KanbanV2.ViewMode = KanbanCardViewer;
KanbanV2.Designer = KanabanDesigner;
KanbanV2.Event = Event;

export { KanbanV2 };
