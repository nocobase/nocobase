---
title: "Load frappe-gantt with importAsync"
description: "Dynamically import frappe-gantt via ctx.importAsync and render an interactive Gantt chart."
---

# Load frappe-gantt with importAsync

```ts
// 1. Dynamically import the Gantt constructor
// This depends on NPM_MODULE_BASE_URL being set to https://esm.sh or your private esm.sh,
// so you can use a short path like /frappe-gantt@1.0.4
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Prepare task data
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

// 3. Create a container and render it into the current context
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Initialize the Gantt chart
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // view granularity: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
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
