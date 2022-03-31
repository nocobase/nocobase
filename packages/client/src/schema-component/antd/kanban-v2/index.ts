import { Action } from '../action';
import { Kanban } from './Kanban';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner } from './Kanban.Card.Designer';
import { KanbanCardViewer } from './Kanban.CardViewer';
import { KanbanDesigner } from './Kanban.Designer';

const KanbanV2 = Kanban;

KanbanV2.Card = KanbanCard;
KanbanV2.CardAdder = Action;
KanbanV2.CardViewer = KanbanCardViewer;
KanbanV2.Card.Designer = KanbanCardDesigner;
KanbanV2.Designer = KanbanDesigner;

export { KanbanV2 };
