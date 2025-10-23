# 自定义交互事件

在事件编辑器编写 JS，通过 ECharts 实例 `chart` 注册交互行为（点击、悬浮、高亮等），实现联动与动态反馈。

![截图占位：事件编辑器概览](https://static-docs.nocobase.com/20251023232724.png)

## 事件注册与解绑
- 注册：`chart.on(eventName, handler)`
- 解绑：`chart.off(eventName, handler)` 或 `chart.off(eventName)` 清理同名事件

示例：点击高亮选中
```js
// 清理旧事件，避免重复绑定
chart.off('click');

chart.on('click', (params) => {
  const { seriesIndex, dataIndex } = params;
  // 高亮当前数据点
  chart.dispatchAction({ type: 'highlight', seriesIndex, dataIndex });
  // 取消其它高亮
  chart.dispatchAction({ type: 'downplay', seriesIndex });
});
```

![截图占位：点击高亮示意](https://static-docs.nocobase.com/20251023232724.png)

## 示例：点击切换系列显隐
```js
chart.off('click');
chart.on('click', (params) => {
  const name = params.seriesName;
  const option = chart.getOption();
  const series = option.series.map(s => {
    if (s.name === name) {
      s.hide = !s.hide;
      s.itemStyle = s.itemStyle || {};
      s.itemStyle.opacity = s.hide ? 0.2 : 1;
    }
    return s;
  });
  chart.setOption({ series }, true);
});
```

![截图占位：系列显隐效果](https://static-docs.nocobase.com/20251023232724.png)

## 示例：点击显示详情弹窗（示意）
```js
chart.off('click');
chart.on('click', (params) => {
  const detail = JSON.stringify({
    name: params.name,
    value: params.value,
    series: params.seriesName
  }, null, 2);
  // 控制台输出或触发自定义 UI
  console.log('详情', detail);
});
```

![截图占位：点击触发详情示意](https://static-docs.nocobase.com/20251023232724.png)

## 预览与保存
- 点击“预览”加载并执行事件代码。
- 点击“保存/确定”持久化事件 JS；“取消”回到上次保存状态。

建议：
- 每次绑定前先 `chart.off('event')`，避免多次绑定导致重复执行或内存增长。
- 事件里尽量使用轻量操作（`dispatchAction`、`setOption`），避免阻塞渲染。
- 与图表选项、数据查询配合验证，确保事件处理的字段与当前数据一致。