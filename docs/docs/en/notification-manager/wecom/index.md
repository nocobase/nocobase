---
pkg: '@nocobase/plugin-auth-wecom'
---

# Notification: WeCom

## Introduction

The **WeCom** plugin allows the application to send notification messages to WeCom users.

## Add and configure WeCom authenticator

First, you need to add and configure a WeCom authenticator on NocoBase, refer to [User Authentication - WeCom](/auth-verification/auth-wecom). Only system users who have logged in via WeCom can receive system notifications through WeCom.

## Add WeCom notification channel


![](https://static-docs.nocobase.com/202412041522365.png)


## Configure WeCom notification channel

Select the authenticator you just configured.


![](https://static-docs.nocobase.com/202412041525284.png)


## Workflow notification node configuration

Select the configured WeCom notification channel. It supports three message types: Text Card, Markdown, and Template Card.


![](https://static-docs.nocobase.com/202412041529319.png)