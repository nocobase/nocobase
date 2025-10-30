# API Documentation

<PluginInfo name="api-doc"></PluginInfo>

## Introduction

The plugin generates NocoBase HTTP API documentation based on Swagger.

## Installation

This is a built-in plugin, no installation required. Activate to use.

## Usage Instructions

### Accessing the API Documentation Page

http://localhost:13000/admin/settings/api-doc/documentation

![](https://static-docs.nocobase.com/8db51cf50e3c666aba5a850a0fb664a0.png)

### Documentation Overview

![](https://static-docs.nocobase.com/5bb4d3e5bba6c6fdfcd830592e72385b.png)

- Total API Documentation: `/api/swagger:get`
- Core API Documentation: `/api/swagger:get?ns=core`
- All Plugins API Documentation: `/api/swagger:get?ns=plugins`
- Each Plugin's Documentation: `/api/swagger:get?ns=plugins/{name}`
- User Customized Collections API Documentation: `/api/swagger:get?ns=collections`
- Specified `${collection}` and related `${collection}.${association}` resources: `/api/swagger:get?ns=collections/{name}`

## Developer Guide

### How to Write Swagger Documentation for Plugins

Add a `swagger/index.ts` file in the plugin's `src` folder with the following content:

```typescript
export default {
  info: {
    title: 'NocoBase API - Auth plugin',
  },
  tags: [],
  paths: {},
  components: {
    schemas: {},
  },
};
```

For detailed writing rules, please refer to the [Swagger Official Documentation](https://swagger.io/docs/specification/about/).