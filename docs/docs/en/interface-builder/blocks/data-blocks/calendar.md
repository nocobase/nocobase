---
pkg: "@nocobase/plugin-calendar"
title: "Calendar Block"
description: "The Calendar block displays events and date-based data in a calendar view. It is suitable for scenarios such as meeting scheduling and activity planning, and supports configuration of title fields, start and end dates, lunar calendar display, and data scope."
keywords: "Calendar Block, Calendar View, Event Management, Meeting Scheduling, Calendar, NocoBase"
---

# Calendar block

## Introduction

The Calendar block provides an intuitive calendar view to display events and date-related data. It is suitable for typical scenarios such as meeting scheduling and activity planning.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_27_PM.png)


## Installation

This block is a built-in plugin and does not require additional installation.

## Add block

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_39_PM.png)

![](https://static-docs.nocobase.com/Calendar-04-29-2026_09_47_PM.png)

After selecting the "Calendar" block and choosing a data table, configure the fields used by calendar events in the popup:

1. Select the "Title field", which is used as the event title.
2. Select the "Start date field", which determines the event start date.
3. Optionally select the "End date field". If it is not selected, events are displayed as all-day events based on the start date.

After completing the configuration, you can create the Calendar block.

## Block settings

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_38_AM.png)

### Title field

Used to display the title information on calendar event bars.

Currently supported field types include `input`, `select`, `phone`, `email`, `radioGroup`, `sequence`, etc. Additional types can be supported via plugin extensions.

### Start date field

Specifies the start time of an event.

### End date field

Specifies the end time of an event. This field is optional. If it is not configured, events are displayed as all-day events based on the start date.

### Quick create event

Click on an empty date area in the calendar to quickly open a pop-up for creating an event.

![](https://static-docs.nocobase.com/Add-new-04-23-2026_10_39_AM.png)

When clicking on an existing event:
- The selected event will be highlighted
- A detail modal will open for viewing or editing

### Show lunar

When enabled, the calendar will display corresponding lunar date information.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM.png)

### Data scope

Used to restrict the data displayed in the calendar block.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM.png)

For more details, see: [Set Data Scope](/interface-builder/blocks/block-settings/data-scope)

### Block height

Allows customization of the calendar block height to avoid internal scrollbars and improve layout experience.

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_30_PM%20(1).png)

For more details, see: [Block Height](/interface-builder/blocks/block-settings/block-height)

### Color field

Used to configure the background color of calendar events for better visual distinction.

Steps:

1. Add a **Single select** or **Radio group** field in the data table and configure colors for its options;
2. In the calendar block settings, set this field as the "Color Field";
3. When creating or editing events, select a color to see it applied in the calendar.

![](https://static-docs.nocobase.com/Calendar-04-23-2026_10_41_AM%20(1).png)

### Week start day

Supports setting the first day of the week:
- Sunday
- Monday (default)

This can be adjusted based on regional preferences for a more natural calendar experience.

## Actions

![](https://static-docs.nocobase.com/Calendar-04-13-2026_03_32_PM.png)

### Today

Click the "Today" button to quickly navigate back to the current date in the calendar view.

### Turn pages

Switch between dates based on the current view mode:
- Month view: previous month / next month
- Week view: previous week / next week
- Day view: yesterday / tomorrow

### Select view

Supports switching between:
- Month view (default)
- Week view
- Day view

### Title

Displays the current date based on the selected view.
