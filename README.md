English | [中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md)

https://github.com/user-attachments/assets/a50c100a-4561-4e06-b2d2-d48098659ec0

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase - Scalability&#0045;first&#0044;&#0032;open&#0045;source&#0032;no&#0045;code&#0032;platform | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## What is NocoBase

NocoBase is an extensibility-first, open-source no-code development platform.   
Instead of investing years of time and millions of dollars in research and development, deploy NocoBase in a few minutes and you'll have a private, controllable, and extremely scalable no-code development platform!

Homepage:  
https://www.nocobase.com/  

Online Demo:  
https://demo.nocobase.com/new

Documents:  
https://docs.nocobase.com/

Forum:  
https://forum.nocobase.com/

Tutorials:  
https://www.nocobase.com/en/tutorials

Use Cases:  
https://www.nocobase.com/en/blog/tags/customer-stories

## Quickstart

To get a quick working development environment you could use Gitpod.

[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/nocobase/nocobase)

## Release Notes

Our [blog](https://www.nocobase.com/en/blog/timeline) is regularly updated with release notes and provides a weekly summary.

## Distinctive features

### 1. Data model-driven

Most form-, table-, or process-driven no-code products create data structures directly in the user interface, such as Airtable, where adding a new column to a table is adding a new field. This has the advantage of simplicity of use, but the disadvantage of limited functionality and flexibility to meet the needs of more complex scenarios.

NocoBase adopts the design idea of separating the data structure from the user interface, allowing you to create any number of blocks (data views) for the data collections, with different type, styles, content, and actions in each block. This balances the simplicity of no-code operation with the flexibility of native development.

![model](https://static-docs.nocobase.com/model.png)

### 2. What you see is what you get

NocoBase enables the development of complex and distinctive business systems, but this does not mean that complex and specialized operations are required. With a single click, configuration options are displayed on the usage interface, and administrators with system configuration privileges can directly configure the user interface in a WYSIWYG manner.

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

### 3. Everything is implemented as plugins

NocoBase adopts plugin architecture, all new functions can be realized by developing and installing plugins, and expanding the functions is as easy as installing an APP on your phone.

![plugins](https://static-docs.nocobase.com/plugins.png)

## Installation

NocoBase supports three installation methods:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">Installing With Docker (👍Recommended)</a>

  Suitable for no-code scenarios, no code to write. When upgrading, just download the latest image and reboot.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">Installing from create-nocobase-app CLI</a>

  The business code of the project is completely independent and supports low-code development.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">Installing from Git source code</a>

  If you want to experience the latest unreleased version, or want to participate in the contribution, you need to make changes and debug on the source code, it is recommended to choose this installation method, which requires a high level of development skills, and if the code has been updated, you can git pull the latest code.
