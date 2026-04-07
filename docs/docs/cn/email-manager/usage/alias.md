---
pkg: "@nocobase/plugin-email-manager"
title: "邮件别名"
description: "邮件别名用于在同一个邮箱账号下，以不同的发件人身份发送邮件"
keywords: "邮件别名,发件人身份,Send As,Alias,NocoBase"
---

# 邮件别名

## 功能说明

邮件别名用于在同一个邮箱账号下，以不同的发件人身份发送邮件。

发件时可以从发件人选择器中选择主邮箱或已同步的别名地址。回复、转发和草稿恢复时，系统会保留原来的发件身份。

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)

> Outlook 不支持该功能。

## 别名同步

Gmail 账号授权成功后，系统会自动同步该邮箱下可用的别名。

如果后续在 Gmail 中新增或调整了别名，可以进入邮箱设置，在“发件人名称”配置内点击“同步别名”重新拉取。

![](https://static-docs.nocobase.com/Email-settings-04-02-2026_06_04_PM.png)

## 发件时选择别名

在邮件编辑器中，点击发件人选择器，可以看到主邮箱以及该账号下已同步的别名。

如果同一个别名邮箱同时挂在多个账号下，选择器会附带所属主邮箱，帮助区分具体使用的是哪个账号上下文。

![](https://static-docs.nocobase.com/%E5%8F%91%E9%80%81%E9%82%AE%E4%BB%B6-04-02-2026_06_02_PM.png)