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
| `check-i18n-coverage.mjs` | **本 PR 内** cn `.md`/`.mdx` 改动是否同步到了其他 9 个语言（单向检查） | 有未同步 = 1 |

六个脚本都用 cn 作基准，只读不写，不会改任何文件。前五个看「结构对不对齐」，最后一个看「内容修改有没有跟」。

## 用法

脚本会自己探测 docsRoot——支持两种 cwd：仓库根目录或 `docs/` 目录。从哪儿跑都行：

```bash
# 从仓库根目录跑
node docs/scripts/check-tree-alignment.mjs
node docs/scripts/check-meta-alignment.mjs
node docs/scripts/check-nav-alignment.mjs
node docs/scripts/check-home-alignment.mjs
node docs/scripts/check-bloated-files.mjs

# 或从 docs/ 目录跑（CI 一般在这里跑）
cd docs
node scripts/check-tree-alignment.mjs
node scripts/check-meta-alignment.mjs
# ...

# 只查特定语言
node docs/scripts/check-bloated-files.mjs --lang=es

# 显式传 docs 根目录（cwd 不在仓库内时）
node docs/scripts/check-tree-alignment.mjs /abs/path/to/docs/docs

# i18n coverage：输入是 PR 改动的文件列表（不扫文件树，cwd 无所谓）
gh pr view <pr-number> --json files --jq '.files[].path' | node docs/scripts/check-i18n-coverage.mjs
node docs/scripts/check-i18n-coverage.mjs --files=changed-files.txt
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

```
cn changes: 2 file(s)
[en] OK
[ja] STALE: 2 cn change(s) without ja sync
  - workflow/index.md
  - workflow/nodes/manual.md
[es] OK
...
```

## i18n coverage 与 `skip-i18n-check` label

`check-i18n-coverage.mjs` 只在 PR 维度有意义——它要的是「这个 PR 相对 base 改了哪些文件」。CI 里推荐用 `gh pr view <pr> --json files` 拿改动列表，不要用 `git diff origin/<base>...HEAD`，原因是 `actions/checkout` 默认 shallow clone 拿不到 base。

某些 cn 改动确实不需要其他语言跟（比如 typo 修复、纯排版调整、中国独有的注释或链接）。这种情况下，PR 上打 `skip-i18n-check` label，CI 的 i18n-coverage step 会读到 label 后整体跳过。打 label 需要仓库写权限，避免被随手滥用——用法和理由建议在 PR 描述里说明。

打 label：

```bash
gh pr edit <pr-number> --add-label skip-i18n-check
```

## 依赖

- `check-home-alignment.mjs` 用 `js-yaml` 解析 frontmatter，按 cwd 链路找它的 `node_modules`：先看 `<cwd>/node_modules`，再看 `<cwd>/docs/node_modules`，覆盖「从 repo root 跑」和「从 docs/ 跑」两种场景。`yarn install` 之后会作为 rspress 间接依赖装到 `docs/node_modules`，无需手动安装。
- 其他五个脚本仅用 Node 内置模块（`fs` / `path`），零依赖。

## 平台兼容

六个脚本路径处理统一用 `path.posix.join` 拼相对路径，CRLF / LF 都能解析。Windows、macOS、Linux 都能跑，输出里的相对路径统一是正斜杠。

## 暂不维护的语言

`ar`（阿拉伯语）目前不在对齐范围内，所有脚本默认都会跳过它。如果以后要把 ar 重新纳入维护，从各脚本顶部的 `SKIP_LANGS` 集合里移除即可，或在调用时显式传 `--lang=ar` 强制检查（用于查现状）。
