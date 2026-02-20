---
pkg: "@nocobase/plugin-email-manager"
---

# Configuration Guide

## Overview

After enabling the email plugin, administrators need to complete the related configuration first before regular users can integrate their email accounts into NocoBase (currently only Outlook and Gmail email accounts support authorization login; Microsoft accounts and Google accounts are not supported for direct integration).

The core of the configuration lies in the authentication settings for the email service provider's API calls. Administrators need to complete the following steps to ensure the plugin functions correctly:

1.  **Obtain authentication information from the service provider**
    -   Log in to the email service provider's developer console (e.g., Google Cloud Console or Microsoft Azure Portal).
    -   Create a new application or project and enable the Gmail or Outlook email API service.
    -   Obtain the corresponding Client ID and Client Secret.
    -   Configure the Redirect URI to match the NocoBase plugin's callback address.

2.  **Email Service Provider Configuration**
    -   Go to the Email plugin's configuration page.
    -   Provide the required API authentication information, including Client ID and Client Secret, to ensure proper authorization with the email service provider.

3.  **Authorization Login**
    -   Users log in to their email accounts via the OAuth protocol.
    -   The plugin will automatically generate and store the user's authorization token for subsequent API calls and email operations.

4.  **Connecting Email Accounts**
    -   After successful authorization, the user's email account will be connected to NocoBase.
    -   The plugin will synchronize the user's email data and provide features for managing, sending, and receiving emails.

5.  **Using Email Features**
    -   Users can view, manage, and send emails directly within the platform.
    -   All operations are completed through the email service provider's API calls, ensuring real-time synchronization and efficient transmission.

Through the process described above, NocoBase's Email plugin provides users with efficient and secure email management services. If you encounter any issues during configuration, please refer to the relevant documentation or contact the technical support team for assistance.

## Plugin Configuration

### Enable the Email Plugin

1. Go to the plugin management page
2. Find the "Email manager" plugin and enable it

### Email Service Provider Configuration

After enabling the Email plugin, you can configure the email service providers. Currently, Google and Microsoft email services are supported. Click "Settings" -> "Email Settings" in the top bar to go to the settings page.


![](https://static-docs.nocobase.com/mail-1733818617187.png)



![](https://static-docs.nocobase.com/mail-1733818617514.png)


For each service provider, you need to fill in the Client ID and Client Secret. The following sections will detail how to obtain these two parameters.