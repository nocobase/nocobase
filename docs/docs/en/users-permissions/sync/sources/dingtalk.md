---
pkg: "@nocobase/plugin-auth-dingtalk"
---

# Synchronize User Data from DingTalk

## Introduction

The **DingTalk** plugin provides a user data sync source type **dingtalk** that supports:

- **Full sync**: Pull departments and members along the department tree (via DingTalk Open Platform directory-related APIs on `oapi.dingtalk.com`).
- **Incremental sync** (optional): After you configure an **event subscription** HTTP callback in the DingTalk Open Platform, NocoBase can apply user and department change events.

## Prepare a DingTalk application

Create an enterprise internal application in the DingTalk Open Platform (or one that matches your org type), and obtain:

- **Client ID** (AppKey)
- **Client Secret** (AppSecret)

Grant the app directory read and other required permissions (see the DingTalk console).

## Add a sync data source in NocoBase

![](https://static-docs.nocobase.com/20260513231840.png)

Go to **Users & permissions → Sync → Add**, choose sync source type **DingTalk**, and fill in:

- **Client ID** and **Client Secret**: same as the application above.
- **Token** and **EncodingAESKey** (optional, for event callbacks): must match what you configure for event subscription in DingTalk.

After saving, copy the **event subscription callback URL** shown on the page into the DingTalk Open Platform event subscription settings, and subscribe to directory-related events (for example user added/updated/left, department created/updated/removed).

## Run sync

In the data source list, click **Sync** to run a full pull. When it succeeds, check **Users** and **Departments**.

## Incremental sync

With event subscription enabled and **Token** / **EncodingAESKey** configured correctly, DingTalk pushes encrypted events; the server decrypts them and writes changes through the user data sync resources. If you do not use the callback, you can still stay consistent via scheduled or manual full sync.

## Relationship to the authenticator

The Client ID / Secret on the sync source can be the **same** as the DingTalk **authenticator** (one app), or you can use a **separate** app that has directory permissions—follow least privilege for your environment.
