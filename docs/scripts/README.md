# 文档校对脚本

NocoBase 文档站维护 `cn / en / ja / es / pt / de / fr / ru / id / vi` 共 10 个语言版本，路径都在 `docs/docs/<lang>/`，文件树和侧边栏结构必须保持一致。这套脚本以 cn 作为基准，校对其他语言是否对齐，并兼带翻译膨胀检测。

## 脚本一览

| 脚本 | 检查内容 | 退出码 |
|---|---|---|
| `check-tree-alignment.mjs` | 各语言文件树是否对齐 cn | 不齐 = 1 |
| `check-meta-alignment.mjs` | 各语言 `_meta.json` 侧边栏的 link/name 集合是否对齐 cn | 不齐 = 1 |
| `check-nav-alignment.mjs` | 各语言 `_nav.json` 顶部导航条目数和 link 是否对齐 cn | 不齐 = 1 |
| `check-home-alignment.mjs` | 各语言首页 `index.md` frontmatter 的 hero.actions / features / items 结构和 link 是否对齐 cn | 不齐 = 1 |
| `check-bloated-files.mjs` | 翻译膨胀（巨型单行 / 超大文件，会让 rspress 编译卡死） | 有膨胀 = 1 |

五个脚本都用 cn 作基准，只读不写，不会改任何文件。

## 用法

从仓库根目录运行：

```bash
# 默认扫 docs/docs 下所有非 cn 语言（ar 除外，见下文）
node docs/scripts/check-tree-alignment.mjs
node docs/scripts/check-meta-alignment.mjs
node docs/scripts/check-nav-alignment.mjs
node docs/scripts/check-home-alignment.mjs
node docs/scripts/check-bloated-files.mjs

# 只查特定语言
node docs/scripts/check-bloated-files.mjs --lang=es

# 指定不同的 docs 根目录
node docs/scripts/check-tree-alignment.mjs path/to/docs/docs
```

## 典型输出

```
[es] OK (985 files)
[pt] OK (985 files)
[de] DIFF: 2 missing, 0 extra
  - missing: workflow/nodes/javascript.md
  - missing: workflow/nodes/parallel.md
```

```
[ja] DIFF:
  - hero.actions[0].link: cn=/get-started/how-nocobase-works lang=/quickstart
  - features[2].items 数量不一致 (cn=3, lang=2)
```

```
[BLOATED+OVERSIZED] es/plugin-development/client/index.md (size 1292019 vs cn 4322, max line 1220031 vs cn 345)
```

## 依赖

- `check-home-alignment.mjs` 用 `js-yaml` 解析 frontmatter，从当前工作目录的 `node_modules` 解析。仓库执行过 `yarn install` 后默认包含，无需额外安装。
- 其他四个脚本仅用 Node 内置模块（`fs` / `path`），零依赖。

## 平台兼容

五个脚本路径处理统一用 `path.posix.join` 拼相对路径，CRLF / LF 都能解析。Windows、macOS、Linux 都能跑，输出里的相对路径统一是正斜杠。

## 暂不维护的语言

`ar`（阿拉伯语）目前不在对齐范围内，所有脚本默认都会跳过它。如果以后要把 ar 重新纳入维护，从各脚本顶部的 `SKIP_LANGS` 集合里移除即可，或在调用时显式传 `--lang=ar` 强制检查（用于查现状）。
