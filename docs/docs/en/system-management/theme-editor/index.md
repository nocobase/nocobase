# Theme Editor

> The current theme feature is implemented based on Ant Design 5.x. It is recommended to read about the [Customizing Theme](https://ant.design/docs/react/customize-theme) concept before proceeding with this document.

## Introduction

The Theme Editor plugin is used to modify the styles of the entire front-end page. It currently supports editing global [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken), and [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken), as well as enabling a [switch](https://ant.design/docs/react/customize-theme#use-preset-algorithms) to Dark Mode and Compact Mode. In the future, it may support [component-level](https://ant.design/docs/react/customize-theme#component-level-customization) theme customization.

## Usage Instructions

### Enabling the Theme Editor Plugin

First, update NocoBase to the latest version (v0.11.1 or above). Then, search for the `Theme Editor` card in the Plugin Manager page. Click the Enable button at the bottom right of the card and wait for the page to refresh.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Navigating to the Theme Configuration Page

After enabling the plugin, click the settings button at the bottom left of the card to navigate to the theme editing page. By default, there are four theme options: `Default Theme`, `Dark Theme`, `Compact Theme`, and `Compact Dark Theme`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Adding a New Theme

Click the `Add New Theme` button and select `Create a Brand New Theme`. A Theme Editor will pop up on the right side of the page, allowing you to edit Colors, Sizes, Styles, and more. After editing, enter a theme name and click save to complete the theme creation.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Applying a New Theme

Move the mouse to the top right corner of the page to see the theme switcher. Click on it to switch to other themes, such as the newly added theme.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Editing an Existing Theme

Click the `Edit` button at the bottom left of the card. A Theme Editor will pop up on the right side of the page (similar to adding a new theme). After editing, click save to complete the theme modification.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Setting User-Selectable Themes

Newly added themes are available for users to switch to by default. If you do not want users to switch to a certain theme, turn off the `User selectable` switch at the bottom right of the theme card, which prevents users from switching to that theme.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Setting as Default Theme

Initially, the default theme is `Default Theme`. To set a specific theme as the default, turn on the `Default Theme` toggle at the bottom right of the card. This ensures that when users open the page for the first time, they will see this theme. Note: The default theme cannot be deleted.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Deleting a Theme

Click the `Delete` button below the card, then confirm in the pop-up dialog to delete the theme.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)