---
pkg: '@nocobase/plugin-notification-manager'
---

# Notification Manager

## Introduction

The Notification Manager is a centralized service that integrates multiple notification channels. It provides a unified interface for channel configuration, delivery management, and logging, and supports flexible expansion to additional channels.


![20240928112556](https://static-docs.nocobase.com/20240928112556.png)


- **Purple section**: The Notification Manager provides a comprehensive service that includes channel configuration and logging, with the option to expand to additional notification channels.
- **Green section**: In-App Message, a built-in channel, enables users to receive notifications directly within the application.
- **Red section**: Email, an extendable channel, allows users to receive notifications via email.

## Channel Management


![20240928181752](https://static-docs.nocobase.com/20240928181752.png)


Currently supported channels:

- [In-App Message](/notification-manager/notification-in-app-message)
- [Email](/notification-manager/notification-email) (using built-in SMTP transport)

You can also extend to more channels, refer to the [Channel Extension](/notification-manager/development/extension) documentation.

## Notification Logs

The system records detailed information and status for each notification, facilitating analysis and troubleshooting.


![20240928181649](https://static-docs.nocobase.com/20240928181649.png)


## Workflow Notification Node


![20240928181726](https://static-docs.nocobase.com/20240928181726.png)