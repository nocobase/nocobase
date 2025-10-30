# Notification Manager

<PluginInfo name="notification-manager"></PluginInfo>

## Introduction

The Notification Manager is a centralized service that integrates various notification channels, offering a unified interface for channel configuration, management of notifications, and log recording. It’s also designed to be highly flexible, allowing for the expansion of additional channels.

![20240928112556](https://static-docs.nocobase.com/20240928112556.png)

- Purple section: The Notification Manager provides a comprehensive service that includes channel configuration and log recording, with the option to expand to other notification channels.
- Green section: In-App Message, a built-in channel, enables users to receive notifications directly within the application.
- Red section: Email, an extendable channel, allows users to receive notifications through email.

## Channel Management

![20240928181752](https://static-docs.nocobase.com/20240928181752.png)

The currently supported channels include:

- [In-App Message](/notification-manager/notification-in-app-message)
- [Email](/notification-manager/notification-email) (built-in SMTP protocol)

For additional channels, refer to the [Channel extension](./development/extension) documentation.

## Notification Logs

The system logs each notification's details and status, offering a valuable tool for both analysis and troubleshooting.

![20240928181649](https://static-docs.nocobase.com/20240928181649.png)

## Workflow Notification Node

![20240928181726](https://static-docs.nocobase.com/20240928181726.png)
