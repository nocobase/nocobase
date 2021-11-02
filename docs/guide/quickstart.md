---
order: 2
toc: menu
---

# Quick Start

This article will help you quickly install and start NocoBase, and introduce the basic usage.

## 1. Requirements

Please make sure your system has installed Node.js 12.x or above.

```bash
$ node -v
v12.13.1
```

If you don't have Node.js installed you can download and install [the latest LTS version](https://nodejs.org/en/download/) from the official website. If you plan to work with Node.js for a long time, it is recommended to use [nvm](https://github.com/nvm-sh/nvm) (for Win systems you can use [nvm-windows](https://github.com/coreybutler/nvm-windows)) to manage Node.js version.

Also, it is recommended to use the yarn package manager.

```bash
$ npm install --global yarn
```

With the environment ready, the next step is to install a NocoBase application.

## 2. Installation and Start-up

To make it easier for newcomers to install and start quickly, NocoBase provides a very simple command line.

```bash
$ yarn create nocobase-app my-nocobase-app --quickstart
```

The above command will help you quickly download, install and start the NocoBase application. If you prefer to perform step by step, you can also do this:

```bash
# 1. 创建项目
$ yarn create nocobase-app my-nocobase-app

# 2. 切换到项目根目录
$ cd my-nocobase-app

# 3. 初始化数据
$ yarn nocobase init --import-demo

# 4. 启动项目
$ yarn start
```

Executing it step-by-step will help you understand the process and make it easier to troubleshoot issues that arise during the installation. If a problem arises and you can't fix it yourself, please post the error log from the terminal output on [GitHub Issue](https://github.com/nocobase/nocobase/issues) and we'll all work together to help you fix it.

When you see the following, it means that the NocoBase you just created has been installed and started.

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/c77012649cab2677117c7628fd11960a.jpg" style="max-width: 800px; width: 100%; box-shadow: 0 8px 24px -2px rgb(0 0 0 / 5%); border-radius: 15px;">

## 3. Log in to NocoBase

Use a browser to open http://localhost:8000 and you will see the login page of NocoBase. The initial account is `admin@nocobase.com` and the password is `admin123`.

<img src="https://nocobase.oss-cn-beijing.aliyuncs.com/158b580706930486132d1f927a71691a.jpg" style="max-width: 800px; width: 100%; box-shadow: 0 8px 24px -2px rgb(0 0 0 / 5%); border-radius: 10px;">

## 4. Create Collections and Fields

NocoBase provides a global data table configuration panel to facilitate users to quickly create collections and fields.

<video src="https://nocobase.oss-cn-beijing.aliyuncs.com/6e2df7073bf3ea23a10c5d4620dc2be0.m4v" style="max-width: 800px; width: 100%; border-radius: 5px;" controls="controls">
your browser does not support the video tag
</video>

Follow the instructions in the video to create the posts and tags tables and several fields.

## 5. Configure Menus and Pages

Next, add new menu groups and pages to manage the article and tag data you just created.

<video src="https://nocobase.oss-cn-beijing.aliyuncs.com/405d1d3a6d8db31d247e06f5af18de4b.m4v" style="max-width: 800px; width: 100%; border-radius: 5px;" controls="controls">
your browser does not support the video tag
</video>

## 6. Create Blocks to Pages

Create table blocks of articles and labels in the page configured in the previous step, and enable the actions that need to be opened.

```ts
// coming soon
```

## 7. Add Data

Now you can add posts and tags.

```ts
// coming soon
```

## 8. Connect to the API

In addition to the visual interface, data resources can also be accessed through the [REST API](/zh-CN/api/rest-api) provided by NocoBase.

- post resorce：http://localhost:8000/api/posts
- user resource ：http://localhost:8000/api/tags

You can directly click to open the above API address, or use a tool like Postman to access it. NocoBase also provides a more suitable API Client (JavaScript SDK) to manage NocoBase data resources. For more information, please refer to the [API Client](/zh-CN/api/client#apiclient) chapter.