---
title: "nb proxy caddy reload"
description: "nb proxy caddy reload 命令参考：按当前 driver 重载 Caddy 配置。"
keywords: "nb proxy caddy reload,NocoBase CLI,caddy,重载"
---

# nb proxy caddy reload

按当前 driver 重载 Caddy 配置。

## 用法

```bash
nb proxy caddy reload
```

## 示例

```bash
nb proxy caddy reload
```

## 说明

- 这条命令适合在你已经重新生成配置之后使用
- `reload` 要求当前 Caddy 已经在运行；如果还没启动，请先执行 `nb proxy caddy start`
- 本地 driver 会重载本地 Caddy，Docker driver 会在容器内执行重载

## 相关命令

- [`nb proxy caddy generate`](./generate.md)
- [`nb proxy caddy start`](./start.md)
