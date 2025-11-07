---
pkg: "@nocobase/plugin-calendar"
---

# Calendar Block

## Introduction

The Calendar Block offers a streamlined way to view and manage events and date-related data in a calendar format, making it perfect for scheduling meetings, planning events, and organizing your time efficiently.

## Installation

This plugin comes pre-installed, so no additional setup is required.

## Adding Blocks


![20250403220300](https://static-docs.nocobase.com/20250403220300.png)


1.  Title Field: Used to display information on the calendar bars. Currently, it supports field types such as `Single Line Text`, `Single select`, `Phone`, `Email`, `Radio Group`, and `Sequence`. The supported title field types can be extended through plugins.
2.  Start Time: Indicates when the task begins.
3.  End Time: Marks when the task ends.

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20240419201640.mp4" type="video/mp4">
</video>

Clicking on a task bar highlights the selection and opens a detailed pop-up window.


![20240408171928](https://static-docs.nocobase.com/20240408171928.png)


## Configure Fields


![20240419203321](https://static-docs.nocobase.com/20240419203321.png)


### Display Lunar Calendar


![20240419203603](https://static-docs.nocobase.com/20240419203603.png)


### Set Data Range


![20240419203751](https://static-docs.nocobase.com/20240419203751.png)


For additional information, see .

### Set Block Height

Example: Adjust the height of the order calendar block. No scrollbar will appear inside the calendar block.


![20240605215742](https://static-docs.nocobase.com/20240605215742.gif)


For more information, refer to

### Background Color Field

:::info{title=Tip}
The version of NocoBase needs to be v1.4.0-beta or above.
:::

This option can be used to configure the background color of calendar events. Here's how to use it:

1.  The calendar data table needs to have a field of type **Single select** or **Radio group**, and this field needs to be configured with colors.
2.  Then, return to the calendar block configuration interface and select the field you just configured with colors in the **Background Color Field**.
3.  Finally, you can try selecting a color for a calendar event and click submit. You'll see that the color has taken effect.


![20240914192017_rec_](https://static-docs.nocobase.com/20240914192017_rec_.gif)


### Week Start Day

> Supported in version v1.7.7 and above

The calendar block supports setting the start day of the week, allowing you to choose **Sunday** or **Monday** as the first day of the week.
The default start day is **Monday**, making it easier for users to adjust the calendar display according to regional habits for a better user experience.


![20250707165958](https://static-docs.nocobase.com/20250707165958.png)


## Configure Actions


![20240419203424](https://static-docs.nocobase.com/20240419203424.png)


### Today

The "Today" button in the Calendar Block offers quick navigation, enabling users to instantly return to the current date after exploring other dates.


![20240419203514](https://static-docs.nocobase.com/20240419203514.png)


### Switch View

The default view is set to Month.


![20240419203349](https://static-docs.nocobase.com/20240419203349.png)