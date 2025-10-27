# Notification: In-App Message

<PluginInfo name="notification-in-app-message"></PluginInfo>

## Introduction

Enables users to receive real-time message notifications directly within the NocoBase application.

## Installation

This plugin is pre-installed, so no additional setup is required.

## Adding an In-App Message Channel

Go to the notification management section, click adding button and select In-app message.
![2024-11-08-08-33-26-20241108083326](https://static-docs.nocobase.com/2024-11-08-08-33-26-20241108083326.png)

Fill in the channel name and description, then click submit.
![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

The new channel will now appear in the list.

![2024-11-08-08-34-52-20241108083452](https://static-docs.nocobase.com/2024-11-08-08-34-52-20241108083452.png)

## Example Usage Scenario

To clarify the use of In-app message, here’s an example for "Marketing Lead Follow-Up".

Imagine your team is running a major marketing campaign aimed at tracking responses and needs from potential clients. Using in-app messages, you can:

**Set Up a Notification Channel:** Begin by creating a channel called "Marketing Clue" in notification management, making it easy for team members to identify its purpose.

![2024-11-08-08-34-32-20241108083431](https://static-docs.nocobase.com/2024-11-08-08-34-32-20241108083431.png)

**Configure a Workflow:** Create a workflow that automatically triggers notifications whenever a new lead is generated. Add a notification node to this workflow, select the "Marketing Clue" channel, and customize the message content according to campaign needs. For example:

![image-1-2024-10-27-14-07-17](https://static-docs.nocobase.com/image-1-2024-10-27-14-07-17.png)

**Receive Notifications in Real-Time:** Once the workflow triggers, all relevant team members will receive notifications instantly, allowing for quick responses.

![image-2-2024-10-27-14-07-22](https://static-docs.nocobase.com/image-2-2024-10-27-14-07-22.png)

**Message Management and Tracking:** In-app messages are grouped by channel name, and you can filter messages by read or unread status to prioritize important information. Clicking "View" redirects you to a configured link, allowing you to manage tasks seamlessly.

![20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41](https://static-docs.nocobase.com/20241027140648-2024-10-27-14-06-51-2024-10-29-13-26-41.png)
