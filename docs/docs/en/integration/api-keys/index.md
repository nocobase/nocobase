# API Key

## Introduction

## Installation

## Usage Instructions

http://localhost:13000/admin/settings/api-keys/configuration


![](https://static-docs.nocobase.com/d64ccbdc8a512a0224e9f81dfe14a0a8.png)


### Add API Key


![](https://static-docs.nocobase.com/46141872fc0ad9a96fa5b14e97fcba12.png)


**Notes**

- The API key you add belongs to the current user and inherits the current user's role.
- Ensure the `APP_KEY` environment variable is configured and kept confidential. If `APP_KEY` changes, all previously added API keys will become invalid.

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