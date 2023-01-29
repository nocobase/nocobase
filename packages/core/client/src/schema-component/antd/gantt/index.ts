import { ActionBar } from '../action';
import { Gantt } from './components/gantt/gantt';
import { GanttDesigner } from './Gantt.Designer';

import { ViewMode } from './types/public-types';

Gantt.ActionBar = ActionBar;

Gantt.ViewMode = ViewMode;
Gantt.Designer = GanttDesigner;

// const GanttV2 = Gantt;

export { Gantt };
