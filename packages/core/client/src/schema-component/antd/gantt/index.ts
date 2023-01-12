// import DeleteEvent from './DeleteEvent';
import { ActionBar } from '../action';
import { Gantt } from './components/gantt/gantt';
import { GanttDesigner } from './Gantt.Designer';
// import { Event } from './Event';
// import { Nav } from './Nav';
// import './style.less';
// import { Title } from './Title';
// import { Today } from './Today';
// import { ViewSelect } from './ViewSelect';

import { ViewMode } from './types/public-types';

Gantt.ActionBar = ActionBar;
// Calendar.Event = Event;
// Calendar.DeleteEvent = DeleteEvent;
// Calendar.Title = Title;
// Calendar.Today = Today;
Gantt.ViewMode = ViewMode;
// Gantt.ViewSelect = ViewSelect;
Gantt.Designer = GanttDesigner;

// const GanttV2 = Gantt;

export { Gantt };
