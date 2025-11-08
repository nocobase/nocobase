---
pkg: "@nocobase/plugin-environment-variables"
---

# Variables and Secrets

## Introduction

Centralized configuration and management of environment variables and secrets for sensitive data storage, configuration data reuse, and environment configuration isolation.

## Differences from `.env`

| **Feature**               | **`.env` File**                                                                                    | **Dynamically Configured Variables and Secrets**                                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Storage Location**      | Stored in the `.env` file in the project root directory                                            | Stored in the `environmentVariables` table in the database                                                                                                      |
| **Loading Method**        | Loaded into `process.env` using tools like `dotenv` during application startup                     | Dynamically read and loaded into `app.environment` during application startup                                                                                   |
| **Modification Method**   | Requires direct file editing, and the application needs to be restarted for changes to take effect | Supports runtime modification, changes take effect immediately after reloading the application configuration                                                    |
| **Environment Isolation** | Each environment (development, testing, production) requires separate maintenance of `.env` files  | Each environment (development, testing, production) requires separate maintenance of data in the `environmentVariables` table                                   |
| **Applicable Scenarios**  | Suitable for fixed static configurations, such as main database information for the application    | Suitable for dynamic configurations that require frequent adjustments or are tied to business logic, such as external databases, file storage information, etc. |

## Installation

Built-in plugin, no separate installation required.

## Usage

### Configuration Data Reuse

For example, if multiple places in the workflow require email nodes and SMTP configuration, the common SMTP configuration can be stored in environment variables.


![20250102181045](https://static-docs.nocobase.com/20250102181045.png)


### Sensitive Data Storage

Storage of various external database configuration information, cloud file storage keys, etc.


![20250102103513](https://static-docs.nocobase.com/20250102103513.png)


### Environment Configuration Isolation

In different environments such as development, testing, and production, independent configuration management strategies are used to ensure that the configurations and data of each environment do not interfere with each other. Each environment has its own independent settings, variables, and resources, which avoids conflicts between development, testing, and production environments and ensures that the system runs as expected in each environment.

For example, the configuration for file storage services may differ between development and production environments, as shown below:

Development Environment

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Production Environment

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Environment Variable Management


![20250102155314](https://static-docs.nocobase.com/20250102155314.png)


### Adding Environment Variables

- Supports single and batch addition
- Supports plaintext and encrypted storage


![20250102155509](https://static-docs.nocobase.com/20250102155509.png)


Single Addition


![20250102155731](https://static-docs.nocobase.com/20250102155731.png)


Batch Addition


![20250102155258](https://static-docs.nocobase.com/20250102155258.png)


## Notes

### Restarting the Application

After modifying or deleting environment variables, a prompt to restart the application will appear at the top. Changes to environment variables will only take effect after the application is restarted.


![20250102155007](https://static-docs.nocobase.com/20250102155007.png)


### Encrypted Storage

Encrypted data for environment variables uses AES symmetric encryption. The PRIVATE KEY for encryption and decryption is stored in the storage directory. Please keep it safe; if lost or overwritten, the encrypted data cannot be decrypted.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Currently Supported Plugins for Environment Variables

### Action: Custom Request


![20250102180751](https://static-docs.nocobase.com/20250102180751.png)


### Auth: CAS


![20250102160129](https://static-docs.nocobase.com/20250102160129.png)


### Auth: DingTalk


![20250102160205](https://static-docs.nocobase.com/20250102160205.png)


### Auth: LDAP


![20250102160312](https://static-docs.nocobase.com/20250102160312.png)


### Auth: OIDC


![20250102160426](https://static-docs.nocobase.com/20250102160426.png)


### Auth: SAML


![20250102160652](https://static-docs.nocobase.com/20250102160652.png)


### Auth: WeCom


![20250102160758](https://static-docs.nocobase.com/20250102160758.png)


### Data Source: External MariaDB


![20250102160935](https://static-docs.nocobase.com/20250102160935.png)


### Data Source: External MySQL


![20250102173602](https://static-docs.nocobase.com/20250102173602.png)


### Data Source: External Oracle


![20250102174153](https://static-docs.nocobase.com/20250102174153.png)


### Data Source: External PostgreSQL


![20250102175630](https://static-docs.nocobase.com/20250102175630.png)


### Data Source: External SQL Server


![20250102175814](https://static-docs.nocobase.com/20250102175814.png)


### Data Source: KingbaseES


![20250102175951](https://static-docs.nocobase.com/20250102175951.png)


### Data Source: REST API


![20250102180109](https://static-docs.nocobase.com/20250102180109.png)


### File Storage: Local


![20250102161114](https://static-docs.nocobase.com/20250102161114.png)


### File Storage: Aliyun OSS


![20250102161404](https://static-docs.nocobase.com/20250102161404.png)


### File Storage: Amazon S3


![20250102163730](https://static-docs.nocobase.com/20250102163730.png)


### File Storage: Tencent COS


![20250102173109](https://static-docs.nocobase.com/20250102173109.png)


### File Storage: S3 Pro

Not adapted

### Map: AMap


![20250102163803](https://static-docs.nocobase.com/20250102163803.png)


### Map: Google


![20250102171524](https://static-docs.nocobase.com/20250102171524.png)


### Email Settings

Not adapted

### Notification: Email


![20250102164059](https://static-docs.nocobase.com/20250102164059.png)


### Public Forms


![20250102163849](https://static-docs.nocobase.com/20250102163849.png)


### System Settings


![20250102164139](https://static-docs.nocobase.com/20250102164139.png)


### Verification: Aliyun SMS


![20250102164247](https://static-docs.nocobase.com/20250102164247.png)


### Verification: Tencent SMS


![20250102165814](https://static-docs.nocobase.com/20250102165814.png)


### Workflow


![20250102180537](https://static-docs.nocobase.com/20250102180537.png)