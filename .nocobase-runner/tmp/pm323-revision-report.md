返修进度：已将可独立验证的测试修复追加到原 PR，但全文件交互改为真实 `userEvent` 时发现一个需要产品范围决定的行为问题，因此暂未把该次完整转换提交，也不建议现在交 Astra 复审。

- PR：[nocobase#10846](https://github.com/nocobase/nocobase/pull/10846)，目标 `v3-develop`，分支 `agent/PM-323`。最新 head：`0003d787abd01e0dc77b6a5765e3a4f37da77960`。提交 `3ea50725faa3067c1660a5759eb6040db29c7ded` 修正本地标签菜单和就绪等待；追加提交 `0003d787abd01e0dc77b6a5765e3a4f37da77960` 是 CI changeset 检查失败后补的 mail package patch changeset。
- 菜单用例改用 `await user.click` 点击消息及 More actions，并等待菜单；恢复原显式 3000ms，保留 Archive 不存在、Local label 可用的断言。Compose 交互前等待按钮启用；两个 fake-timer 用例在 `listAccounts` 完成后也等待 Compose 启用。抽屉基线、关闭、焦点及精确请求计数断言未改。没有改产品代码。
- 对提交 `3ea50725...` 的文件完整运行通过：84 passed、1 skipped。受限 CPU 循环 30/30 通过，每轮 84 passed、1 skipped；容器可见 8 CPU，测试及 `yes` 竞争负载均固定在 CPU 0，命令是 `taskset -c 0 pnpm --filter @nocobase/app-plugin-mail exec vitest run --project client --maxWorkers=2 tests/client/mail-workspace-page.test.tsx`。单文件实际为一个 Vitest worker，`--maxWorkers=2` 是上限，不代表两个测试 worker 并行。包测试 985 passed、3 skipped；lint、typecheck、build、Prettier 和 changeset 校验通过。附件 `pm323-repeat-revision.log` 记录每轮结果。
- 完整点击交互统一的试运行把 130 个 `fireEvent.click` 转成 `await user.click` 后，文件有一个既有取消定时发送的用例失败：真实用户点击确实调用了 mock `mail.cancelSubmission`，但拒绝后的预期错误文字没有留在页面。证据链是 `mail-workspace-page.tsx:650-680` 在取消拒绝时先增加 `reloadVersion` 再调用 `requestError`，而 `use-mail-workspace-data.ts:264` 的 reload effect 会清除错误；测试在 `mail-workspace-page.test.tsx:2896` 因找不到该文字失败。该转换也使另一个签名菜单项查询需要等待，我已加 `findByRole`，该用例随后通过。产品层错误消失属于本任务约定中“发现真实竞态先报告”的情况；我没有改产品行为，也没有把失败测试断言放宽。探索性转换已撤回，没有混入 PR。
- 新 head CI 快照：`ciState: null`、checks 为空（`2026-10-13T18:50:40Z`），尚无 CI 结果。`3ea50725...` 的 changeset 检查曾失败，原因是 package.json 新增测试依赖；现已补 changeset 并推送新 head，changeset CI 仍待新运行。
- 已有永久删除用例的 1 个 skip 保持未覆盖。

请决定：这个错误提示丢失是否拆为独立产品修复，然后本 PR 对该取消失败测试保留低层 click 事件并完成其余交互审查；还是授权把产品错误提示竞态纳入 PM-323？
