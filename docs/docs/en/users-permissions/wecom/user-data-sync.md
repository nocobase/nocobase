# Synchronizing User Data from WeCom

<PluginInfo commercial="true" name="wecom"></PluginInfo>

## Introduction

The **WeCom** plugin allows users to synchronize user and department data from WeCom.

## Create and Configure a WeCom Custom Application

First, you need to create a custom application in the WeCom admin panel and obtain the **Corporate ID**, **AgentID**, and **Secret**.

Refer to [User Authentication - WeCom](./auth).

## Add a Data Synchronization Source in NocoBase

Navigate to Users and Permissions > Synchronization > Add, and fill in the required information.

![](https://static-docs.nocobase.com/202412041251867.png)

## Configure Address Book Synchronization

Go to the WeCom admin panel and navigate to Security and Management > Management Tools, then click Address Book Synchronization.

![](https://static-docs.nocobase.com/202412041249958.png)

Follow the instructions as shown in the image and configure a trusted corporate IP address.

![](https://static-docs.nocobase.com/202412041250776.png)

Once this is set up, you can proceed with user data synchronization.

## Set Up an Event Reception Server

To ensure that changes in user or department data on the WeCom side are promptly synchronized with the NocoBase application, further configuration is required.

After completing the previous setup steps, you can copy the address for the address book callback notifications.

![](https://static-docs.nocobase.com/202412041256547.png)

Enter this address into the WeCom settings, and obtain the Token and EncodingAESKey to complete the NocoBase user synchronization data source configuration.

![](https://static-docs.nocobase.com/202412041257947.png)

