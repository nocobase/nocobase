---
pkg: '@nocobase/plugin-auth-dingtalk'
---

# Authentication: DingTalk

## Introduction

The Authentication: DingTalk plugin allows users to log in to NocoBase using their DingTalk accounts.

## Enable Plugin


![](https://static-docs.nocobase.com/20260513231045.png)

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


![](https://static-docs.nocobase.com/20260513231225.png)


- Sign up automatically when the user does not exist - Whether to automatically create a new user when no existing user is matched by phone number.
- Client ID and Client Secret - Fill in the information copied in the previous step.
- Redirect URL - Callback URL, copy it and proceed to the next step.
- Automatic login - When enabled, opening application links inside DingTalk will automatically check the current login status and try to sign in. If multiple DingTalk authenticators exist, only one of them can enable this option at a time.
- Automatic login mode - Choose how automatic login works:
  - OAuth redirect automatic login: automatically redirects through DingTalk OAuth. This mode does not require a DingTalk micro-app homepage to be configured, and is recommended if you do not want to maintain a separate micro-app entry.
  - DingTalk micro-app automatic login: silently signs in by requesting an `authCode` through DingTalk JSAPI. This mode requires `Corp ID`, and the NocoBase URL must be configured as the DingTalk micro-app homepage.
- Corp ID - Required only for the micro-app automatic login mode.

## Automatic login

Automatic login only works when the application is opened **inside the DingTalk client**. If users access NocoBase from a normal browser, the regular third-party login flow is still used.

### OAuth redirect automatic login

Use this mode when you want users to open a link inside DingTalk and be redirected into NocoBase automatically, but **do not want to depend on a micro-app homepage configuration**. After enabling it, NocoBase redirects users through DingTalk OAuth and returns them to the original page.

### DingTalk micro-app automatic login

Use this mode when you already have a DingTalk micro-app. The frontend requests an `authCode` from DingTalk JSAPI and then calls the NocoBase sign-in API to complete silent login.

Things to note for this mode:

1. `Corp ID` must be configured in the authenticator.
2. The NocoBase page URL must be configured as the DingTalk micro-app homepage.
3. Local development addresses such as `http://127.0.0.1:13000` cannot normally be used directly as a DingTalk micro-app domain. In practice, you usually need a public HTTPS domain or a tunnel URL.

## Configure Callback URL in DingTalk Developer Console

Paste the copied callback URL into the DingTalk Developer Console.


![](https://static-docs.nocobase.com/202406120012221.png)


## Login

Visit the login page and click the button below the login form to initiate third-party login.


![](https://static-docs.nocobase.com/202406120014539.png)