import { ActionBar } from '../action';
import { Gantt } from './components/gantt/gantt';
import { GanttDesigner } from './Gantt.Designer';
import { ViewMode } from './types/public-types';
import {Event} from './components/gantt/Event';

Gantt.ActionBar = ActionBar;

Gantt.ViewMode = ViewMode;
Gantt.Designer = GanttDesigner;
Gantt.Event = Event;

// const GanttV2 = Gantt;

export { Gantt };
