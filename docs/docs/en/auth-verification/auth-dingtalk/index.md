---
pkg: '@nocobase/plugin-auth-dingtalk'
---

# Authentication: DingTalk

## Introduction

The Authentication: DingTalk plugin allows users to log in to NocoBase using their DingTalk accounts.

## Enable Plugin


![](https://static-docs.nocobase.com/202406120929356.png)


## Apply for API Permissions in DingTalk Developer Console

Refer to <a href="https://open.dingtalk.com/document/orgapp/tutorial-obtaining-user-personal-information" target="_blank">DingTalk Open Platform - Implement Login to Third-Party Websites</a> to create an application.

Go to the application management console and enable "Personal Phone Number Information" and "Address Book Personal Information Read Permission".


![](https://static-docs.nocobase.com/202406120006620.png)


## Get Credentials from DingTalk Developer Console

Copy the Client ID and Client Secret.


![](https://static-docs.nocobase.com/202406120000595.png)


## Add DingTalk Authentication in NocoBase

Go to the user authentication plugin management page.


![](https://static-docs.nocobase.com/202406112348051.png)


Add - DingTalk


![](https://static-docs.nocobase.com/202406112349664.png)


### Configuration


![](https://static-docs.nocobase.com/202406120016896.png)


- Sign up automatically when the user does not exist - Whether to automatically create a new user when no existing user is matched by phone number.
- Client ID and Client Secret - Fill in the information copied in the previous step.
- Redirect URL - Callback URL, copy it and proceed to the next step.

## Configure Callback URL in DingTalk Developer Console

Paste the copied callback URL into the DingTalk Developer Console.


![](https://static-docs.nocobase.com/202406120012221.png)


## Login

Visit the login page and click the button below the login form to initiate third-party login.


![](https://static-docs.nocobase.com/202406120014539.png)