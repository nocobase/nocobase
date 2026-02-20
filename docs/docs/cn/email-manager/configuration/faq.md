---
pkg: "@nocobase/plugin-email-manager"
---

# 常见问题

## 微软账户授权登录后，邮件无法接收

**答：** 目前仅支持 Outlook 和 Gmail 邮箱账户授权登录，不支持微软账户和谷歌账户。可参考：[answers.microsoft.com](https://answers.microsoft.com/zh-hans/outlook_com/forum/all/%E7%8E%B0%E6%9C%89%E5%BE%AE%E8%BD%AF%E8%B4%A6/dba12dda-a7c7-4346-8263-53f4a6d9dc68)

**提示：** 如不确定是否拥有"真正的 Outlook.com 邮箱"或"Gmail 邮箱"，可尝试用网页方式访问 Outlook.com 或 Gmail.com，检查是否能直接登录并正常发邮件。如果不行，说明可能未开通对应邮箱服务，需先开通或改用其他邮箱。


## 取消授权

如需删除或重新授权已授权的邮箱账户，可按以下操作进行：

#### **Gmail 邮箱**

1. 打开 https://myaccount.google.com/u/0/connections 并登录

![](https://static-docs.nocobase.com/mail-1735634131347.png)

2. 点击对应应用，然后点击删除

![](https://static-docs.nocobase.com/mail-1735634131518.png)

![](https://static-docs.nocobase.com/mail-1735634131697.png)

#### **Outlook 邮箱**

1. 打开 https://account.microsoft.com/ 并登录
    
2. 点击"Apps and services that can access your data"按钮

![](https://static-docs.nocobase.com/mail-1735634131870.png)

3. 点击编辑并移除

![](https://static-docs.nocobase.com/mail-1735634132052.png)