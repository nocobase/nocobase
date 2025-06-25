# 开发错误总结与经验教训

本文档记录了在开发 Lowcode Block Plugin 过程中遇到的错误和解决方案，为后续开发提供参考。

## 1. 外部库加载问题

### 错误现象
- `Tabulator is not a constructor`
- `Tabulator failed to load`
- 库加载后全局变量不可用

### 根本原因
1. **错误的全局变量假设**: 假设 Tabulator 会同时暴露 `window.TabulatorFull` 和 `window.Tabulator`
2. **库初始化时间**: script 的 onload 事件触发时，库可能还没有完全初始化
3. **加载方式不一致**: 混用 requirejs 和 script 标签加载

### 解决方案
```javascript
// ❌ 错误方式: 假设多个全局变量
if (window.TabulatorFull || window.Tabulator) {
  resolve(window.TabulatorFull || window.Tabulator);
}

// ✅ 正确方式: 确认实际的全局变量名
if (window.Tabulator) {
  resolve(window.Tabulator);
}

// ✅ 或者使用 requirejs 统一加载
const Tabulator = await requireAsync('tabulator');
```

### 经验教训
- **查阅官方文档**: 确认库暴露的实际全局变量名
- **统一加载方式**: 要么全用 requirejs，要么全用 script 标签，不要混用
- **添加初始化延迟**: 某些库需要短暂延迟才能完全可用

## 2. DOM 作用域污染问题

### 错误现象
- 多个区块相互影响
- ID 冲突导致功能异常
- 其他区块无法正常加载

### 根本原因
1. **全局 ID 使用**: 使用固定 ID 如 `"users-table"`
2. **全局 DOM 查询**: 使用 `document.getElementById()` 等全局方法
3. **事件监听器泄漏**: 全局事件监听器没有正确清理

### 解决方案
```javascript
// ❌ 错误方式: 固定 ID
element.innerHTML = '<div id="users-table"></div>';
const table = document.getElementById('users-table');

// ✅ 正确方式: 动态生成唯一 ID
const tableId = `users-table-${Date.now()}`;
element.innerHTML = `<div id="${tableId}"></div>`;
const table = element.querySelector(`#${tableId}`);

// ✅ 或者直接使用 DOM 引用
const tableDiv = document.createElement('div');
element.appendChild(tableDiv);
const table = new Tabulator(tableDiv, options);
```

### 经验教训
- **避免固定 ID**: 总是生成唯一标识符
- **限制作用域**: 使用 `element.querySelector()` 而不是全局查询
- **清理资源**: 组件销毁时清理事件监听器和定时器

## 3. 模板字符串转义问题

### 错误现象
- `Invalid or unexpected token`
- 模板字符串解析错误

### 根本原因
在示例代码中错误地转义了模板字符串的反引号

### 解决方案
```javascript
// ❌ 错误方式: 转义反引号
element.innerHTML = \\`<pre>\\${JSON.stringify(data, null, 2)}</pre>\\`;

// ✅ 正确方式: 直接使用模板字符串
element.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
```

### 经验教训
- **注意转义**: 在代码示例中避免不必要的转义
- **测试示例**: 确保所有示例代码都能正常执行

## 4. 异步函数执行环境问题

### 错误现象
- `await is only valid in async functions`

### 根本原因
用户代码包含 `await` 但没有在 async 函数中执行

### 解决方案
```javascript
// ❌ 错误方式: 直接执行用户代码
const executionFunction = new Function(params.code);
await executionFunction(element, ctx, model);

// ✅ 正确方式: 包装为 async 函数
const wrappedCode = `
  return (async function(element, ctx, model, requirejs, requireAsync, loadCSS) {
    ${params.code}
  }).apply(this, arguments);
`;
const executionFunction = new Function(wrappedCode);
await executionFunction(element, ctx, model, requirejs, requireAsync, loadCSS);
```

### 经验教训
- **支持现代语法**: 确保执行环境支持用户期望的语法特性
- **错误提示友好**: 提供清晰的错误信息指导用户

## 5. 库依赖版本兼容问题

### 错误现象
- 某些 API 不可用
- 行为与预期不符

### 根本原因
- 使用了不兼容的库版本
- API 在不同版本间有变化

### 解决方案
```javascript
// ✅ 指定稳定版本
requirejs.config({
  paths: {
    'tabulator': 'https://unpkg.com/tabulator-tables@5.5.0/dist/js/tabulator.min'
  }
});

// ✅ 使用简化的 CSS 版本避免样式冲突
await loadCSS('https://unpkg.com/tabulator-tables@5.5.0/dist/css/tabulator_simple.min.css');
```

### 经验教训
- **锁定版本**: 在生产环境中使用具体版本号而不是 latest
- **测试兼容性**: 验证所使用的 API 在目标版本中可用
- **选择轻量级**: 优先使用简化版本减少冲突

## 6. 错误处理和用户体验

### 最佳实践
```javascript
try {
  // 主要逻辑
  const result = await someAsyncOperation();
  // 渲染结果
} catch (error) {
  console.error('详细错误信息:', error);
  element.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #ff4d4f;">
      <h3>操作失败</h3>
      <p>错误: ${error.message}</p>
      <button onclick="window.location.reload()" style="...">
        重试
      </button>
    </div>
  `;
}
```

### 经验教训
- **友好的错误提示**: 向用户显示可理解的错误信息
- **提供重试机制**: 给用户修复问题的机会
- **日志记录**: 保留详细的错误信息用于调试

## 7. 代码组织和维护性

### 最佳实践
- **模块化**: 将复杂功能拆分为独立的函数
- **命名规范**: 使用描述性的变量和函数名
- **注释文档**: 为复杂逻辑添加说明注释
- **示例简洁**: README 中的示例应该简洁且可复现

### 经验教训
- **先简单后复杂**: 从基础功能开始，逐步增加复杂性
- **测试驱动**: 每个功能都应该有对应的测试用例
- **文档同步**: 代码变更时及时更新文档

## 总结

这些错误主要集中在：
1. **外部依赖管理** - 库加载、版本兼容
2. **作用域控制** - 避免全局污染、ID 冲突
3. **代码执行环境** - 异步支持、错误处理
4. **用户体验** - 错误提示、操作反馈

通过总结这些经验，我们可以在后续开发中避免类似问题，提高代码质量和用户体验。