---
title: "使用 importAsync 加载 frappe-gantt 甘特图组件"
description: "通过 ctx.importAsync 动态导入 frappe-gantt 并渲染可交互的甘特图。"
---

# 使用 importAsync 加载 frappe-gantt 甘特图组件

```ts
// 1. 动态导入 Gantt 构造函数
// 依赖 NPM_MODULE_BASE_URL 配置为 https://esm.sh 或你的私有 esm.sh 服务，
// 因此可以直接使用相对路径 /frappe-gantt@1.0.4
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. 准备任务数据
let tasks = [
  {
    id: '1',
    name: 'Redesign website',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20
  },
  {
    id: '2',
    name: 'Develop new feature',
    start: '2017-01-01',
    end: '2017-01-05',
    progress: 40,
    dependencies: '1'
  },
  {
    id: '3',
    name: 'QA & testing',
    start: '2017-01-06',
    end: '2017-01-10',
    progress: 10,
    dependencies: '2'
  },
];

// 3. 创建容器并渲染到当前上下文
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. 初始化 Gantt 图
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // 视图粒度：'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  language: 'en',
  bar_height: 24,
  padding: 18,
  custom_popup_html(task) {
    return `
      <div class="details-container">
        <h5>${task.name}</h5>
        <p>Start: ${task._start.toISOString().slice(0, 10)}</p>
        <p>End: ${task._end.toISOString().slice(0, 10)}</p>
        <p>Progress: ${task.progress}%</p>
      </div>
    `;
  },
});
```
