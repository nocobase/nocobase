/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionBar } from '@nocobase/client';
import { Calendar } from './Calendar';
import { CalendarDesigner } from './Calendar.Designer';
import DeleteEvent from './DeleteEvent';
import { Event } from './Event';
import { Nav } from './Nav';
import { Title } from './Title';
import { Today } from './Today';
import { ViewSelect } from './ViewSelect';

Calendar.ActionBar = ActionBar;
Calendar.Event = Event;
Calendar.DeleteEvent = DeleteEvent;
Calendar.Title = Title;
Calendar.Today = Today;
Calendar.Nav = Nav;
Calendar.ViewSelect = ViewSelect;
Calendar.Designer = CalendarDesigner;

const CalendarV2 = Calendar;

export { CalendarV2 };
