# Changesets

改动了可发布 package 时，在同一个 PR 里执行：

```bash
pnpm changeset
```

交互式选择受影响的 package、SemVer 级别和变更说明，生成一份 `.changeset/<name>.md`。它只声明「这次改动该升什么版本」，不改任何版本号——版本号由发版 workflow 计算。

纯文档、测试或不影响发布产物的改动不需要 changeset。

`develop` 处于 prerelease 模式时，`major` 对已经是 `X.0.0-beta.N` 的包不起作用：changesets 算的是 `semver.inc('1.0.0-beta.33', 'major')` = `1.0.0`，结果只是 `1.0.0-beta.34`，破坏性改动在版本号上看不出来。`node scripts/validate-changesets.mjs` 会拦下这种 changeset。处理方式是把该包的 `version` 改成 `<X+1>.0.0-beta`、在它的 `CHANGELOG.md` 加上同名的 `## <X+1>.0.0-beta` 标题（发版时会变成 `<X+1>.0.0-beta.0`），并在同一个 changeset 里给所有在 `dependencies` 或 `peerDependencies` 里依赖它的包加一条 `patch`——它们的 `workspace:^` 范围仍然接受新版本，changesets 不会自动重发它们。
