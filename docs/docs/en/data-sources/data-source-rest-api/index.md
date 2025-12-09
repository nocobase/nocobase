---
pkg: "@nocobase/plugin-data-source-rest-api"
---

# REST API Data Source

## Introduction

This plugin allows you to integrate data from REST API sources seamlessly.

## Installation

This is a commercial plugin. For detailed activation instructions, please refer to: [Commercial Plugin Activation Guide](https://www.nocobase.com/en/blog/nocobase-commercial-license-activation-guide)


## Adding a REST API Source

After activating the plugin, you can add a REST API source by selecting it from the Add new dropdown menu in the data source management section.


![20240721171420](https://static-docs.nocobase.com/20240721171420.png)


Configure the REST API source.


![20240721171507](https://static-docs.nocobase.com/20240721171507.png)


## Adding a Collection

In NocoBase, a RESTful resource is mapped to a Collection, such as a Users resource.

```bash
GET /users
POST /users
GET /users/1
PUT /users/1
DELETE /users/1
```

These API endpoints are mapped in NocoBase as follows:

```bash
GET /users:list
POST /users:create
POST /users:get?filterByTk=1
POST /users:update?filterByTk=1
POST /users:destroy?filterByTk=1
```

For a comprehensive guide on NocoBase API design specifications, refer to the API documentation.


![20240716213344](https://static-docs.nocobase.com/20240716213344.png)


Check the "NocoBase API - Core" chapter for detailed information.


![20240716213258](https://static-docs.nocobase.com/20240716213258.png)


The Collection configuration for a REST API data source includes the following:

### List

Map the interface for viewing a list of resources.


![20251201162457](https://static-docs.nocobase.com/20251201162457.png)


### Get

Map the interface for viewing resource details.


![20251201162744](https://static-docs.nocobase.com/20251201162744.png)


### Create

Map the interface for creating a resource.


![20251201163000](https://static-docs.nocobase.com/20251201163000.png)


### Update

Map the interface for updating a resource.


![20251201163058](https://static-docs.nocobase.com/20251201163058.png)


### Destroy

Map the interface for deleting a resource.


![20251201163204](https://static-docs.nocobase.com/20251201163204.png)


Both the List and Get interfaces are required to be configured.

## Debugging the API

### Request parameter integration

Example: Configure pagination parameters for the List API. If the third-party API does not support pagination natively, NocoBase will paginate based on the retrieved list data.


![20251201163500](https://static-docs.nocobase.com/20251201163500.png)


Please note that only variables added in the interface will take effect.

| Third-party API params name | NocoBase params             |
| --------------------------- | --------------------------- |
| page                        | {{request.params.page}}     |
| limit                       | {{request.params.pageSize}} |

You can click Try it out to debug and view the response.


![20251201163635](https://static-docs.nocobase.com/20251201163635.png)

<video width="100%" height="440" controls>
      <source src="https://static-docs.nocobase.com/20241121211034.mp4" type="video/mp4">
</video>

### Response format transformation

The response format of the third-party API may not be in NocoBase standard, and it needs to be transformed before it can be correctly displayed on the front end.


![20251201164529](https://static-docs.nocobase.com/20251201164529.png)

Adjust the conversion rules based on the response format of the third-party API to ensure the output conforms to the NocoBase standard.


![20251201164629](https://static-docs.nocobase.com/20251201164629.png)


Debugging process description


![20250418085020](https://static-docs.nocobase.com/20250418085020.png)

### Extract error message

When a third-party API throws an exception, its response format may not follow NocoBase’s standard. In such cases, the error message needs to be transformed before it can be correctly displayed on the frontend.

![20251201170545](https://static-docs.nocobase.com/20251201170545.png)

If no error message transformer is configured, NocoBase will apply the default transformation, converting the error into a message that contains the HTTP status code.

![20251201170732](https://static-docs.nocobase.com/20251201170732.png)

After configuring an error message transformer to match NocoBase’s output standard, the frontend will be able to properly display the exception messages returned by the third-party API.

![20251201170946](https://static-docs.nocobase.com/20251201170946.png)
![20251201171113](https://static-docs.nocobase.com/20251201171113.png)

## Variables

The REST API data source supports three types of variables for API integration:

- Custom data source variables
- NocoBase request variables
- Third-party response variables

### Custom Data Source Variables


![20240716221937](https://static-docs.nocobase.com/20240716221937.png)



![20240716221858](https://static-docs.nocobase.com/20240716221858.png)


### NocoBase Request

- Params: URL query parameters (Search Params), which vary depending on the interface.
- Headers: Custom request headers, primarily providing specific X- information from NocoBase.
- Body: The request body.
- Token: The API token for the current NocoBase request.


![20251201164833](https://static-docs.nocobase.com/20251201164833.png)

### Third-Party Responses

Currently, only the response body is available.


![20251201164915](https://static-docs.nocobase.com/20251201164915.png)


Below are the variables available for each interface:

### List

| Parameter               | Description                                                |
| ----------------------- | ---------------------------------------------------------- |
| request.params.page     | Current page                                               |
| request.params.pageSize | Number of items per page                                   |
| request.params.filter   | Filter criteria (must meet NocoBase Filter format)         |
| request.params.sort     | Sorting criteria (must meet NocoBase Sort format)          |
| request.params.appends  | Fields to load on demand, typically for association fields |
| request.params.fields   | Fields to include (whitelist)                              |
| request.params.except   | Fields to exclude (blacklist)                              |

### Get

| Parameter                 | Description                                                |
| ------------------------- | ---------------------------------------------------------- |
| request.params.filterByTk | Required, typically the current record ID                  |
| request.params.filter     | Filter criteria (must meet NocoBase Filter format)         |
| request.params.appends    | Fields to load on demand, typically for association fields |
| request.params.fields     | Fields to include (whitelist)                              |
| request.params.except     | Fields to exclude (blacklist)                              |

### Create

| Parameter                | Description               |
| ------------------------ | ------------------------- |
| request.params.whiteList | Whitelist                 |
| request.params.blacklist | Blacklist                 |
| request.body             | Initial data for creation |

### Update

| Parameter                 | Description                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Required, typically the current record ID          |
| request.params.filter     | Filter criteria (must meet NocoBase Filter format) |
| request.params.whiteList  | Whitelist                                          |
| request.params.blacklist  | Blacklist                                          |
| request.body              | Data for update                                    |

### Destroy

| Parameter                 | Description                                        |
| ------------------------- | -------------------------------------------------- |
| request.params.filterByTk | Required, typically the current record ID          |
| request.params.filter     | Filter criteria (must meet NocoBase Filter format) |

## Field Configuration

Field metadata (Fields) is extracted from the CRUD interface data of the adapted resource to serve as the fields of the collection.


![20250418085048](https://static-docs.nocobase.com/20250418085048.png)


Extract field metadata.


![20251201165133](https://static-docs.nocobase.com/20251201165133.png)


Fields and preview.


![20240716224403](https://static-docs.nocobase.com/20240716224403.png)


Edit fields (similar to other data sources).


![20240716224704](https://static-docs.nocobase.com/20240716224704.png)


## Adding REST API Data Source Blocks

Once the collection is configured, you can add blocks to the interface.


![20240716225120](https://static-docs.nocobase.com/20240716225120.png)
