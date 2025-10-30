# API Keys

## Introduction

## Usage Instructions

http://localhost:13000/admin/settings/api-keys/configuration


![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)


### Add API Key


![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)


**Notes**

- The added API key is for the current user, and its role is the current user's role.
- Please ensure that the `APP_KEY` environment variable is configured and not leaked. If the `APP_KEY` is changed, all added API keys will be invalidated.

### How to configure APP_KEY

For the Docker version, modify the docker-compose.yml file

```diff
services:
  app:
    image: nocobase/nocobase:main
    environment:
+     - APP_KEY=4jAokvLKTJgM0v_JseUkJ
```

For source code or create-nocobase-app installation, directly modify the APP_KEY in the .env file.

```bash
APP_KEY=4jAokvLKTJgM0v_JseUkJ
```