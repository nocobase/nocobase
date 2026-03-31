---
pkg: '@nocobase/plugin-notification-in-app-message'
---

# Notification: In-App Message

## Introduction

Enables users to receive real-time message notifications directly within the NocoBase application.

## Installation

This plugin is a built-in plugin, so no additional installation is required.

## Adding an In-App Message Channel

Go to Notification Management, click the Add button, and select In-App Message.

![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)


Enter the channel name and description, then click Submit.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)


The new channel will now appear in the list.


![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)


## Use Case Example

To help you better understand how to use in-app messages, here is an example of "Marketing Lead Follow-Up."

Imagine your team is running a major marketing campaign aimed at tracking responses and needs from potential clients. Using in-app messages, you can:

**Create a Notification Channel**: First, in Notification Management, configure an in-app message channel named "Marketing Clue" to ensure team members can clearly identify its purpose.


![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)


**Configure a Workflow**: Create a workflow that automatically triggers a notification when a new marketing lead is generated. You can add a notification node to the workflow, select the "Marketing Clue" channel you created, and configure the message content as needed. For example:


![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)


**Receive Real-Time Notifications**: Once the workflow is triggered, all relevant personnel will receive notifications in real-time, ensuring the team can respond and act quickly.


![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)


**Message Management and Tracking**: In-app messages are grouped by their channel name. You can filter messages by their read and unread status to quickly view important information. Clicking the "View" button will redirect you to the configured link page for further action.


![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)