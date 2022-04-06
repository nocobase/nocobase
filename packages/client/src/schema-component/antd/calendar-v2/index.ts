import { ActionBar } from '../action';
import { Calendar as CalendarV2 } from './Calendar';
import { CalendarDesigner } from './Calendar.Designer';
import { Event } from './Event';
import { Nav } from './Nav';
import './style.less';
import { Title } from './Title';
import { Today } from './Today';
import { ViewSelect } from './ViewSelect';

CalendarV2.ActionBar = ActionBar;
CalendarV2.Event = Event;
CalendarV2.Title = Title;
CalendarV2.Today = Today;
CalendarV2.Nav = Nav;
CalendarV2.ViewSelect = ViewSelect;
CalendarV2.Designer = CalendarDesigner;

export { CalendarV2 };
