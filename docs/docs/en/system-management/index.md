---
title: China Region Field
description: The China Region field is used to store province, city, and district/county information for China.
pkg: "@nocobase/plugin-china-region"
---

# China Region Field

The China Region field is used to store province, city, and district/county information for China.

The data source for this field type comes from [Administrative-divisions-of-China](https://github.com/modood/Administrative-divisions-of-China).

## Installation

In the main NocoBase interface, go to "Plugin Manager", find the "China Region Field" plugin, and enable it.

## Usage

After enabling the plugin, you can add a "China Region" type field in the collection configuration.


![Add China Region Field](https://static-docs.nocobase.com/2d9f67604323616612c6a8581023719c.png)


In a form, you can select the province, city, and district/county in a cascading manner.


![Cascading selection of province, city, and district/county](https://static-docs.nocobase.com/71236173d1222409015c898c19951335.png)


## Field Configuration

**Storage Format**

- **Code**: Stores the codes for the province, city, and district/county, e.g., `110101`.
- **Name**: Stores the names of the province, city, and district/county, e.g., `Beijing/Beijing/Dongcheng District`.
- **Code and Name**: Stores both codes and names, e.g., `{"province":{"code":"110000","name":"Beijing"},"city":{"code":"110100","name":"Beijing"},"area":{"code":"110101","name":"Dongcheng District"}}`.

**Display Format**

- **Code**: Displays the codes for the province, city, and district/county, e.g., `110101`.
- **Name**: Displays the names of the province, city, and district/county, e.g., `Beijing/Beijing/Dongcheng District`.

**Default Value**

You can set a default province, city, and district/county.