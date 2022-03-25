import { Action } from '../action';
import { Kanban } from './Kanban';
import { KanbanCard } from './Kanban.Card';

const KanbanV2 = Kanban;
KanbanV2.Card = KanbanCard;
KanbanV2.CardAdder = Action;

export * from './KanbanBlockProvider';
export { KanbanV2 };

