# Block Extensions Overview

In NocoBase 2.0, the block extension mechanism has been significantly simplified. Developers only need to inherit the corresponding **FlowModel** base class and implement related interface methods (mainly the `renderComponent()` method) to quickly customize blocks.

## Block Categories

NocoBase categorizes blocks into three types, displayed in groups in the configuration interface:

- **Data blocks**: Blocks that inherit from `DataBlockModel` or `CollectionBlockModel`
- **Filter blocks**: Blocks that inherit from `FilterBlockModel`
- **Other blocks**: Blocks that directly inherit from `BlockModel`

> The block grouping is determined by the corresponding base class. The classification logic is based on inheritance relationships and requires no additional configuration.

## Base Class Description

The system provides four base classes for extensions:

### BlockModel

**Basic Block Model**, the most versatile block base class.

- Suitable for display-only blocks that don't depend on data
- Categorized into **Other blocks** group
- Applicable to personalized scenarios

### DataBlockModel

**Data Block Model (not bound to data table)**, for blocks with custom data sources.

- Not directly bound to a data table, can customize data fetching logic
- Categorized into **Data blocks** group
- Applicable to: calling external APIs, custom data processing, statistical charts, etc.

### CollectionBlockModel

**Collection Block Model**, for blocks that need to be bound to a data table.

- Requires binding to a data table model base class
- Categorized into **Data blocks** group
- Applicable to: lists, forms, kanban boards, and other blocks that clearly depend on a specific data table

### FilterBlockModel

**Filter Block Model**, for building filter condition blocks.

- Model base class for building filter conditions
- Categorized into **Filter blocks** group
- Usually works in conjunction with data blocks

## How to Choose a Base Class

When selecting a base class, you can follow these principles:

- **Need to bind to a data table**: Prioritize `CollectionBlockModel`
- **Custom data source**: Choose `DataBlockModel`
- **For setting filter conditions and working with data blocks**: Choose `FilterBlockModel`
- **Not sure how to categorize**: Choose `BlockModel`

## Quick Start

Creating a custom block only requires three steps:

1. Inherit the corresponding base class (e.g., `BlockModel`)
2. Implement the `renderComponent()` method to return a React component
3. Register the block model in the plugin

For detailed examples, please refer to [Write a Block Plugin](./write-a-block-plugin).

