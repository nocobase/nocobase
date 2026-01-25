# Cascading Selection

## Introduction

The cascading selector is designed for association fields whose target collection is a tree table. It allows users to select data following the hierarchical structure of the tree collection and supports fuzzy search for quick filtering.

## Usage Instructions

- For **to-one** association, the cascading selector is **single-select**.

![20251125214656](https://static-docs.nocobase.com/20251125214656.png)

- For **to-many** association, the cascading selector is **multi-select**.

![20251125215318](https://static-docs.nocobase.com/20251125215318.png)

## Field Configuration Options

### Title Field

The title field determines the label displayed for each option.

![20251125214923](https://static-docs.nocobase.com/20251125214923.gif)

> Supports quick search based on the title field

![20251125215026](https://static-docs.nocobase.com/20251125215026.gif)

For more details, see:  
[Title Field](/interface-builder/fields/field-settings/title-field)

### Data Scope

Controls the data scope of the tree list (if a child record matches the conditions, its parent record will also be included).

![20251125215111](https://static-docs.nocobase.com/20251125215111.png)

For more details, see:  
[Data Scope](/interface-builder/fields/field-settings/data-scope)

More field components:  
[Field Components](/interface-builder/fields/association-field)
