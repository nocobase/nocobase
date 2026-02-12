# Localization Management

## Introduction

The Localization Management plugin is used to manage and implement NocoBase's localization resources. It can translate system menus, data tables, fields, and all plugins to adapt to the language and culture of specific regions.

## Installation

This plugin is built-in and requires no additional installation.

## Usage Instructions

### Activating the Plugin

![](https://static-docs.nocobase.com/d16f6ecd6bfb8d1e8acff38f23ad37f8.png)

### Accessing the Localization Management Page

<img src="https://static-docs.nocobase.com/202404202134187.png"/>

### Synchronizing Translation Entries

<img src="https://static-docs.nocobase.com/202404202134850.png"/>

Currently, the following content can be synchronized:

- Local language packs for the system and plugins
- Collection titles, field titles, and field option labels
- Menu titles

After synchronization, the system will list all translatable entries for the current language.

<img src="https://static-docs.nocobase.com/202404202136567.png"/>

:::info{title=Note}
Different modules may have the same original text entries, which need to be translated separately.
:::

### Automatically Create Translation Entries

When editing a page, custom text within each block will automatically generate the corresponding i18n entry and simultaneously create the translation for the current language.

![](https://static-docs.nocobase.com/Localization-02-12-2026_08_39_AM.png)

![](https://static-docs.nocobase.com/Localization-NocoBase-02-12-2026_08_39_AM.png)

:::info{title=提示}
When defining text in code, you need to manually specify the ns (namespace), for example:
`${ctx.i18n.t('My custom js block', { ns: 'lm-flow-engine' })}`
:::


### Editing Translation Content

<img src="https://static-docs.nocobase.com/202404202142836.png"/>

### Publishing Translations

After completing the translation, you need to click the "Publish" button to make the changes take effect.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

### Translating Other Languages

Enable other languages in "System Settings", for example, Simplified Chinese.

![](https://static-docs.nocobase.com/618830967aaeb643c892fce355d59a73.png)

Switch to that language environment.

<img src="https://static-docs.nocobase.com/202404202144789.png"/>

Synchronize the entries.

<img src="https://static-docs.nocobase.com/202404202145877.png"/>

Translate and publish.

<img src="https://static-docs.nocobase.com/202404202143135.png"/>

