## 1. Implementation
- [ ] 1.1 在 `FlowContext` 增加 `getMeta(value?, options?)` 与类型定义（`FlowContextMeta` / `FlowContextGetMetaOptions`）
- [ ] 1.2 实现 `maxDepth` 裁剪策略（含 async `children()` 的包装；保证不因限深而触发额外解析）
- [ ] 1.3 在 `getMeta` 内部复用 RunJS 文档体系获取 `RunJSDocMeta`（版本/locale 透传）
- [ ] 1.4 CodeEditor：在 `runjsCompletions` 中优先使用 `ctx.getMeta()`（保留兼容回退）
- [ ] 1.5 文档：补充 `FlowContext` API 文档（`ctx.getMeta`）与使用示例
- [ ] 1.6 测试：
  - [ ] 1.6.1 `flow-engine`：新增/补齐 `getMeta` 单测（maxDepth / value 子树 / async children）
  - [ ] 1.6.2 `client`：补齐 `runjsCompletions` 测试（确保新增入口不改变现有补全行为）

## 2. Validation
- [ ] 2.1 `yarn test packages/core/flow-engine`（或对应 vitest 子集）
- [ ] 2.2 手动验证：RunJS CodeEditor 补全在 `record/formValues/popup` 场景下表现与性能符合预期

