---
title: "REST API data source"
description: "Connect REST API data and map RESTful resources to collections. Configure List, Get, Create, Update, and Destroy API mappings to support CRUD operations."
keywords: "REST API data source,external API,API mapping,collection mapping,NocoBase"
---

# REST API data source

<PluginInfo commercial="true" name="data-source-rest-api"></PluginInfo>

## Introduction

Use this data source to connect data provided by REST APIs.

## Installation

This is a commercial plugin. For activation instructions, see the [Commercial plugin activation guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide).

## Add a REST API source

After activating the plugin, choose **REST API** from the **Add new** menu in Data source management.

![Choose the REST API data source](https://static-docs.nocobase.com/20240721171420.png)

Configure the REST API source.

![Configure the REST API source](https://static-docs.nocobase.com/20240721171507.png)

## Add a collection

A RESTful resource maps to a NocoBase collection. For example, consider a Users resource:

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

It maps to the following NocoBase API configuration:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

For the complete NocoBase API design specification, see the API documentation.

![API documentation entry](https://static-docs.nocobase.com/20240716213344.png)

See the **NocoBase API - Core** section.

![NocoBase API - Core](https://static-docs.nocobase.com/20240716213258.png)

The REST API data-source collection is configured as follows.

### List

Configure the API mapping for retrieving a resource list.

![Configure the List API](https://static-docs.nocobase.com/20251201162457.png)

### Get

Configure the API mapping for retrieving resource details.

![Configure the Get API](https://static-docs.nocobase.com/20251201162744.png)

### Create

Configure the API mapping for creating a resource.

![Configure the Create API](https://static-docs.nocobase.com/20251201163000.png)

### Update

Configure the API mapping for updating a resource.

![Configure the Update API](https://static-docs.nocobase.com/20251201163058.png)

### Destroy

Configure the API mapping for deleting a resource.

![Configure the Destroy API](https://static-docs.nocobase.com/20251201163204.png)

List and Get are required API mappings.

## Debug APIs

### Request parameter integration

For example, configure pagination parameters for the List API. If the third-party API itself does not support pagination, NocoBase paginates the returned list data.

![Configure List pagination parameters](https://static-docs.nocobase.com/20251201163500.png)

Only variables added to the API take effect.

| Third-party API parameter | NocoBase parameter |
| --- | --- |
| page | {{request.params.page}} |
| limit | {{request.params.pageSize}} |

Click **Try it out** to debug the API and inspect the response.

![Debug an API request](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Response format conversion

The response format of a third-party API might not match the NocoBase standard. Convert it before it can be displayed correctly in the client.

![Configure response conversion](https://static-docs.nocobase.com/20251201164529.png)

Adjust the conversion rules according to the third-party API response so that it matches the NocoBase output standard.

![Response conversion rules](https://static-docs.nocobase.com/20251201164629.png)

Debugging flow.

![Response conversion debugging flow](https://static-docs.nocobase.com/20240717110051.png)

### Error information conversion

When a third-party API returns an error, its error response might not match the NocoBase standard. Convert it before the client can display it correctly.

![Configure error conversion](https://static-docs.nocobase.com/20251201170545.png)

When error conversion is not configured, the error is converted by default to an error message that includes the HTTP status code.

![Default error conversion](https://static-docs.nocobase.com/20251201170732.png)

After configuring error conversion to match the NocoBase output standard, the client can display third-party API error information correctly.

![Error conversion rules](https://static-docs.nocobase.com/20251201170946.png)
![Converted third-party API error](https://static-docs.nocobase.com/20251201171113.png)

## Variables

The REST API data source provides three variable categories for API integration:

- Data-source custom variables
- NocoBase requests
- Third-party responses

### Data-source custom variables

![Data-source custom variables](https://static-docs.nocobase.com/20240716221937.png)

![Configure a data-source custom variable](https://static-docs.nocobase.com/20240716221858.png)

### NocoBase requests

- Params: URL query parameters (Search Params). The available Params differ between APIs
- Headers: request headers, primarily providing NocoBase custom `X-` information
- Body: the request body
- Token: the API token of the current NocoBase request

![NocoBase request variables](https://static-docs.nocobase.com/20251201164833.png)

### Third-party responses

Currently, only the response Body is available.

![Third-party response variables](https://static-docs.nocobase.com/20251201164915.png)

The available variables for each API integration are as follows.

### List

| Parameter | Description |
| --- | --- |
| request.params.page | Current page number |
| request.params.pageSize | Number of records per page |
| request.params.filter | Filter conditions. They must use the NocoBase Filter format. |
| request.params.sort | Sorting rules. They must use the NocoBase Sort format. |
| request.params.appends | Fields loaded on demand, typically for loading relationship fields on demand |
| request.params.fields | Fields that the API returns, as an allowlist |
| request.params.except | Fields to exclude, as a denylist |

### Get

| Parameter | Description |
| --- | --- |
| request.params.filterByTk | Required. Usually the ID of the current record |
| request.params.filter | Filter conditions. They must use the NocoBase Filter format. |
| request.params.appends | Fields loaded on demand, typically for loading relationship fields on demand |
| request.params.fields | Fields that the API returns, as an allowlist |
| request.params.except | Fields to exclude, as a denylist |

### Create

| Parameter | Description |
| --- | --- |
| request.params.whiteList | Allowlist |
| request.params.blacklist | Denylist |
| request.body | Initial data for creating the record |

### Update

| Parameter | Description |
| --- | --- |
| request.params.filterByTk | Required. Usually the ID of the current record |
| request.params.filter | Filter conditions. They must use the NocoBase Filter format. |
| request.params.whiteList | Allowlist |
| request.params.blacklist | Denylist |
| request.body | Data to update |

### Destroy

| Parameter | Description |
| --- | --- |
| request.params.filterByTk | Required. Usually the ID of the current record |
| request.params.filter | Filter conditions. They must use the NocoBase Filter format. |

## Configure fields

Extract field metadata (Fields) from data returned by the adapted resource CRUD APIs and use it as the fields of the collection.

![Extract collection fields](https://static-docs.nocobase.com/20240716223636.png)

Extract field metadata.

![Extract field metadata](https://static-docs.nocobase.com/20251201165133.png)

Fields and preview.

![Fields and preview](https://static-docs.nocobase.com/20240716224403.png)

Edit fields in the same way as for other data sources.

![Edit REST API fields](https://static-docs.nocobase.com/20240716224704.png)

## Add REST API data-source blocks

After configuring the collection, you can add blocks to pages.

![Add a REST API data-source block](https://static-docs.nocobase.com/20240716225120.png)
