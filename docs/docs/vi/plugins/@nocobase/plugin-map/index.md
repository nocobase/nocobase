---
displayName: 'Block: Bản đồ'
packageName: '@nocobase/plugin-map'
title: 'Block: Bản đồ'
keywords: 'Block: Bản đồ,Plugin,NocoBase'
description: |
  Block bản đồ, hỗ trợ AMap và Google Maps, bạn cũng có thể mở rộng thêm nhiều loại bản đồ khác.
isFree: true
builtIn: true
defaultEnabled: false
editionLevel: 0
---

# Block: Bản đồ

In NocoBase v2, the **Map block** displays geographic data from a collection on a map. It supports AMap and Google Maps, and can render point, line, polygon, and circle fields. You can also add actions to the block to open record views, filter data, refresh data, or run custom logic.

The Map block is a collection block. Before using it, enable `@nocobase/plugin-map` and create at least one map field in the target collection.

## Before you start

### Configure a map provider

After enabling the plugin, go to "Plugin settings / Map manager" and configure the map provider.

The required settings are:

- **AMap**: `Access key`, plus `securityJsCode` or `serviceHost`
- **Google Maps**: `Api key`

After saving the settings, map fields and map blocks load the provider selected by the field's map type. If the map cannot be loaded, check whether the key is valid, whether the domain whitelist includes the current domain, and whether the browser can access the selected map provider.

### Create a map field

When adding a field to a collection, choose a field type from the "Map-based geometry" group.

| Field type | Usage                                                                 |
| ---------- | --------------------------------------------------------------------- |
| Point      | Marks a single location, such as a store, device, or customer address |
| Line       | Represents a route or track                                           |
| Polygon    | Represents an area                                                    |
| Circle     | Represents a radius around a center point                             |

You need to choose the "Map type" when creating the field. This determines whether the field editor and the block use AMap or Google Maps. Usually, one business dataset should use one map type consistently.

## Add a map block

In v2 page configuration mode, click "Add block" and choose "Map" from the "Data Blocks" group.

When creating the block, choose:

- **Collection**: the data source displayed by the block
- **Map field**: the field used to draw map overlays. It can be a map field in the current collection or a map field reached through an association field
- **Marker field**: optional. When the map field is a point field, you can choose a text field as the point label

If the collection has no available map field, the Map field selector will be empty. Add a point, line, polygon, or circle field to the collection first.

## Block settings

After creating the block, you can adjust its display and interaction behavior from the block settings.

| Setting                    | Description                                                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Map field and marker field | Changes the map field used by the block and the label field for point markers                                                  |
| Data scope                 | Limits the records loaded and displayed by the map block                                                                       |
| Concatenation order field  | Sorts point markers and connects them into a route. It only takes effect for point fields                                      |
| Default zoom level         | Sets the initial map zoom level                                                                                                |
| Actions                    | Adds buttons such as filter, add new, popup, link, refresh, custom request, AI employee, and JS action to the top of the block |

The Map block loads all records that match the data scope without pagination. For large datasets, configure a data scope or add filter actions to narrow the displayed records.

## View and select records

The Map block renders each record's map field as a map overlay. Clicking an overlay triggers the record opening flow, which is usually used to open a popup, drawer, or another record view.

The block provides selection tools in the upper-left corner:

- Location icon: exits selection mode and returns to normal viewing
- Selection icon: enters selection mode and lets you draw a polygon area on the map
- Confirm icon: confirms the current selection area and adds records inside it to the selected state

Selected records are synced to the block resource and can be used by later block actions.

## v2 development entry points

The v2 client implementation of the Map block is located in `packages/plugins/@nocobase/plugin-map/src/client-v2/`.

Key files:

- `plugin.tsx`: registers map fields, the Map manager settings page, and v2 FlowModel loaders
- `models/MapBlockModel.tsx`: defines the map block model. It extends `CollectionBlockModel` and defines flows for block creation, data scope, sorting, zoom level, and opening records
- `models/MapActionGroupModel.tsx`: defines the actions available in the map block
- `models/MapBlockComponent.tsx`: dispatches rendering to AMap or Google Maps according to the field's `mapType`
- `models/fieldModels/`: contains v2 model implementations for point, line, polygon, and circle fields

To extend another map provider, usually add a new `mapType` option for map fields, then implement the corresponding map renderer and block component.
