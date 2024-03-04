English | [中文](./README.zh-CN.md)
 
![NocoBase](https://nocobase-file.oss-cn-beijing.aliyuncs.com/main-l.png)

**Note:** 📌

NocoBase is in early stage of development and is subject to frequent changes, please use caution in production environments.

## Recent major updates

- [v0.20：Support for multiple data sources - 2024/03/03](https://docs-cn.nocobase.com/welcome/release/v0200-changelog)
- [v0.19: Application process optimization - 2024/01/08](https://blog.nocobase.com/posts/release-v019/)
- [v0.18: Establish a sound testing system - 2023/12/21](https://blog.nocobase.com/posts/release-v018/)
- [v0.17: New SchemaInitializer and SchemaSettings - 2023/12/11](https://blog.nocobase.com/posts/release-v017/)
- [v0.16: New cache manager - 2023/11/20](https://blog.nocobase.com/posts/release-v016/)
- [v0.15: New plugin settings manager - 2023/11/13](https://blog.nocobase.com/posts/release-v015/)
- [v0.14: New plugin manager, supports adding plugins through UI - 2023/09/11](https://blog.nocobase.com/posts/release-v014/)
- [v0.13: New application status flow - 2023/08/24](https://blog.nocobase.com/posts/release-v013/)
- [v0.12: New plugin build tool - 2023/08/01](https://blog.nocobase.com/posts/release-v012/)
- [v0.11: New client application, plugin and router - 2023/07/08](https://blog.nocobase.com/posts/release-v011/)

## What is NocoBase

NocoBase is a scalability-first, open-source no-code development platform.   
Instead of investing years of time and millions of dollars in research and development, deploy NocoBase in a few minutes and you'll have a private, controllable, and extremely scalable no-code development platform!

Homepage:  
https://www.nocobase.com/  

Online Demo:  
https://demo.nocobase.com/new

Documents:  
https://docs.nocobase.com/

Contact Us:  
hello@nocobase.com

## Distinctive features

### 1. Model-driven, separate "user interface" from "data structure"

Most form-, table-, or process-driven no-code products create data structures directly in the user interface, such as Airtable, where adding a new column to a table is adding a new field. This has the advantage of simplicity of use, but the disadvantage of limited functionality and flexibility to meet the needs of more complex scenarios.

NocoBase adopts the design idea of separating the data structure from the user interface, allowing you to create any number of blocks (data views) for the data collections, with different type, styles, content, and actions in each block. This balances the simplicity of no-code operation with the flexibility of native development.

![model](https://nocobase-file.oss-cn-beijing.aliyuncs.com/model-l.png)

### 2. What you see is what you get

NocoBase enables the development of complex and distinctive business systems, but this does not mean that complex and specialized operations are required. With a single click, configuration options are displayed on the usage interface, and administrators with system configuration privileges can directly configure the user interface in a WYSIWYG manner.

![wysiwyg](https://nocobase-file.oss-cn-beijing.aliyuncs.com/wysiwyg.gif)

### 3. Functions as plugins

NocoBase adopts plugin architecture, all new functions can be realized by developing and installing plugins, and expanding the functions is as easy as installing an APP on your phone.

![plugins](https://nocobase-file.oss-cn-beijing.aliyuncs.com/plugins-l.png)

## Installation

NocoBase supports three installation methods:

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/docker-compose">Installing With Docker (👍Recommended)</a>

  Suitable for no-code scenarios, no code to write. When upgrading, just download the latest image and reboot.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/create-nocobase-app">Installing from create-nocobase-app CLI</a>

  The business code of the project is completely independent and supports low-code development.

- <a target="_blank" href="https://docs.nocobase.com/welcome/getting-started/installation/git-clone">Installing from Git source code</a>

  If you want to experience the latest unreleased version, or want to participate in the contribution, you need to make changes and debug on the source code, it is recommended to choose this installation method, which requires a high level of development skills, and if the code has been updated, you can git pull the latest code.

## License

- [Core packages](https://github.com/nocobase/nocobase/tree/main/packages/core) are [Apache 2.0 licensed](./LICENSE-APACHE-2.0).
- [Plugins packages](https://github.com/nocobase/nocobase/tree/main/packages/plugins) are [AGPL 3.0 licensed](./LICENSE-AGPL).
