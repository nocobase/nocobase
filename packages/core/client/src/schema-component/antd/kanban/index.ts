import { Action } from '../action';
import { Kanban } from './Kanban';
import { KanbanCard } from './Kanban.Card';
import { KanbanCardDesigner } from './Kanban.Card.Designer';
import { KanbanCardDesignerTitleSwitch } from './Kanban.Card.Designer.TitleSwitch';
import { KanbanCardViewer } from './Kanban.CardViewer';
import { KanbanDesigner } from './Kanban.Designer';

Kanban.Card = KanbanCard;
Kanban.CardAdder = Action;
Kanban.CardViewer = KanbanCardViewer;
Kanban.Card.Designer = KanbanCardDesigner;
Kanban.Card.Designer.TitleSwitch = KanbanCardDesignerTitleSwitch;
Kanban.Designer = KanbanDesigner;

const KanbanV2 = Kanban;

export { Kanban, KanbanV2 };
