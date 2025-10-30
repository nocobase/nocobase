# API Key

## Introduction

## Installation

## Usage Instructions

http://localhost:13000/admin/settings/api-keys/configuration

![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)

### Add API Key

![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)

**Notes**

- The added API key is for the current user, and the role is the role to which the current user belongs
- Please make sure that the `APP_KEY` environment variable has been configured and is kept confidential. If the APP_KEY changes, all added API keys will become invalid.

### How to configure APP_KEY

For the docker version, modify the docker-compose.yml file

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

For the source code or create-nocobase-app installation, you can directly modify the APP_KEY in the .env file

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```