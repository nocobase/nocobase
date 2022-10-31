# 插件目录结构

可以通过 `yarn pm create my-plugin` 快速创建一个空插件，目录结构如下：

```bash
|- /my-plugin
  |- /src
    |- /client      # 插件客户端代码
    |- /server      # 插件服务端代码
  |- client.d.ts
  |- client.js
  |- package.json   # 插件包信息
  |- server.d.ts
  |- server.js
```

`/src/server` 的教程参考 [服务端](./server) 章节，`/src/client` 的教程参考 [客户端](./client) 章节。
