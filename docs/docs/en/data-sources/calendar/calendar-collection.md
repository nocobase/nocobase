---
pkg: "@nocobase/plugin-calendar"
title: "Calendar collection"
description: "Use a Calendar collection to store time-range data such as meetings, schedules, courses, and shifts, then display and edit event records with Calendar blocks."
keywords: "Calendar collection,Calendar Collection,calendar events,recurring events,Calendar block,NocoBase"
---

# Calendar collection

## Introduction

Calendar collections are suitable for time-range data, such as meeting-room reservations, project schedules, course schedules, duty rosters, and event calendars. They are still collections, but include fields related to calendar events so that they can be used with Calendar blocks later.

You can create Calendar collections only from the main data source. External databases, REST API data sources, and External NocoBase data sources do not support creating Calendar collections.

## Use cases

Calendar collections are suitable for these business scenarios:

- Meeting-room, vehicle, and equipment reservations
- Project schedules, task plans, and milestone arrangements
- Timetables, training plans, and event calendars
- Duty rosters, shift records, and inspection plans
- Event records that need to be viewed by day, week, or month

## Create and configure

In the main data source, click **Create collection** and select **Calendar collection** to create a Calendar collection.

Calendar collection settings are mostly the same as those for a general collection. `Preset fields` controls common system fields, and Calendar collections also include fields for storing recurring-event data.

| Setting | Description |
| --- | --- |
| Collection display name | The name displayed for the collection, such as `Meeting room reservations`, `Course schedule`, or `Duty roster`. |
| Collection name | The collection identifier used internally by APIs, relation fields, permissions, and workflows. |
| Inherits | Select a parent collection to inherit. This setting is visible only when the main database is PostgreSQL. |
| Categories | Collection categories affect only organization in Data source management; they do not change the collection structure. |
| Description | A description of the collection. State which events it stores, who maintains it, and which business processes it relates to. |
| Preset fields | Preset fields. Keep system fields and Calendar collection built-in fields when creating a Calendar collection. |

### Built-in fields

After a Calendar collection is created, it usually includes the following built-in fields. `cron` and `exclude` store recurrence rules and excluded dates.

| Field | Field name | Description |
| --- | --- | --- |
| ID | `id` | The default primary key that uniquely identifies an event record. |
| Created at | `createdAt` | Automatically records when the event record was created. |
| Created by | `createdBy` | Automatically records the user who created the event record. |
| Updated at | `updatedAt` | Automatically records when the event record was last updated. |
| Updated by | `updatedBy` | Automatically records the user who last updated the event record. |
| Sort | `sort` | Stores the sort value for an event record and supports capabilities such as drag-and-drop ordering. |
| Repeats | `cron` | Stores recurrence rules, such as daily, weekly, monthly, or yearly repetition. |
| Exclude | `exclude` | Stores excluded dates in a recurring event. It is normally maintained automatically through calendar interactions. |
| Space | `space` | Available after enabling the [Multi-space plugin](../../multi-app/multi-space/index.md). It isolates data by space and does not appear when Multi-space is not enabled. |

When a Calendar block uses a Calendar collection, specify the business fields used to display events:

| Setting | Description |
| --- | --- |
| Title field | Determines the event title in the calendar, such as `Meeting subject` or `Course name`. |
| Start date field | Determines when the event starts. Usually use a date-time field. |
| End date field | Determines when the event ends. Usually use a date-time field. |

:::warning Note

`cron` and `exclude` are normally maintained by Calendar capabilities and should not be edited directly as ordinary business fields. Create and configure title, start-date, and end-date fields according to your business needs; otherwise, Calendar blocks cannot display events correctly.

:::

### Primary key field

Like a general collection, a Calendar collection needs a primary key. Keep the ID preset field when creating the collection; its default primary-key type is `Snowflake ID (53-bit)`.

If a Calendar collection has no primary key, set **Record unique key** when editing the collection. Otherwise, Calendar blocks might not open, edit, or locate event records correctly.

## Edit configuration

In the collection list, click **Edit** next to a Calendar collection to change its display name, category, description, simple pagination mode, **Record unique key**, and other settings.

Calendar built-in fields such as `cron` and `exclude` are normally used by Calendar capabilities and should not be repurposed for other business meanings. To extend event information, add ordinary business fields such as location, participants, meeting room, or status.

## Delete a collection

In the collection list, click **Delete** next to a Calendar collection to delete it.

Deleting a Calendar collection deletes event records, Calendar built-in field data, and related collection metadata. Before deleting it, confirm whether Calendar blocks, Table blocks, permissions, workflows, or APIs still depend on the collection.

:::danger Warning

Calendar collections usually store time data for schedules, reservations, and shifts. After deletion, historical events and recurrence rules are lost. Confirm that the data is backed up or no longer needed before proceeding.

:::

## Use in pages

A Calendar collection can use most data blocks for a [general collection](../data-source-main/general-collection.md) to create, read, update, and delete records. It is also usually used with Calendar blocks:

| Block | Use |
| --- | --- |
| [Calendar block](../../interface-builder/blocks/data-blocks/calendar.md) | Displays event records in day, week, month, and other views, and creates, views, and edits events in the calendar. |
| [Table block](../../interface-builder/blocks/data-blocks/table.md) | Views, filters, and maintains event records in a list. |
| [Form block](../../interface-builder/blocks/data-blocks/form.md) | Creates or edits one event record. |
| [Details block](../../interface-builder/blocks/data-blocks/details.md) | Views details of one event. |

## Related links

- [General collection](../data-source-main/general-collection.md) - General configuration and block usage.
- [Date and time fields](../data-modeling/collection-fields/datetime/datetime.md) - Create event start and end fields.
- [Calendar block](../../interface-builder/blocks/data-blocks/calendar.md) - Display data in a calendar on a page.
- [Multi-space](../../multi-app/multi-space/index.md) - Learn about the Space field and data isolation by space.
