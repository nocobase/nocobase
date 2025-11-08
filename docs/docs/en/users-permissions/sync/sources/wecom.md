---
pkg: "@nocobase/plugin-wecom"
---

# Synchronize User Data from WeChat Work



## Introduction

The **WeChat Work** plugin supports synchronizing user and department data from WeChat Work.

## Create and configure a custom WeChat Work application.

First, you need to create a custom application in the WeChat Work admin console and obtain the **Corp ID**, **AgentId**, and **Secret**.

Refer to [User Authentication - WeChat Work](/auth-verification/auth-wecom/).

## Add a synchronization data source in NocoBase

Go to Users & Permissions - Sync - Add, and fill in the obtained information.



![](https://static-docs.nocobase.com/202412041251867.png)



## Configure Contacts Sync

Go to the WeChat Work admin console - Security and Management - Management Tools, and click on Contacts Sync.



![](https://static-docs.nocobase.com/202412041249958.png)



Configure as shown in the figure, and set the trusted IP of the enterprise.



![](https://static-docs.nocobase.com/202412041250776.png)



Now you can proceed with user data synchronization.

## Set up the event receiving server

If you want changes to user and department data on the WeChat Work side to be synchronized to the NocoBase application in a timely manner, you can proceed with further settings.

After filling in the previous configuration information, you can copy the contacts callback notification URL.



![](https://static-docs.nocobase.com/202412041256547.png)



Fill it into the WeChat Work settings, obtain the Token and EncodingAESKey, and complete the NocoBase user synchronization data source configuration.



![](https://static-docs.nocobase.com/202412041257947.png)