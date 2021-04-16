---
title: '@nocobase/plugin-automations'
---

# @nocobase/plugin-automations

提供自动化模块

## 安装

```bash
yarn nocobase pull automations --start
```

## 用例

```ts
// 省略上文

database.table({
  name: 'tests',
  fields: [
    {
      type: 'string',
      name: 'name1',
    },
    {
      type: 'string',
      name: 'name2',
    },
  ],
});

database.table({
  name: 'demos',
  fields: [
    {
      type: 'string',
      name: 'col1',
    },
    {
      type: 'string',
      name: 'col2',
    },
  ],
});

const [Automation, Test] = database.getModels(['automations', 'tests']);

const automation = await Automation.create({
  title: 'a1',
  enabled: true,
  type: 'collections:afterCreate',
  collection_name: 'tests',
});

automation.startJob('test', async (result, options) => {
  // job 代码
});

// 使用内置的 job
await automation.updateAssociations({
  jobs: [
    {
      title: 'j1',
      enabled: true,
      type: 'create',
      collection_name: 'demos',
      values: [
        {
          column: 'col1',
          op: 'eq',
          value: 'n1'
        },
        {
          column: 'col2',
          op: 'ref',
          value: 'name2'
        },
      ],
    }
  ],
});

// tests 表新增数据会触发上面执行 job 任务
await Test.create({
  name1: 'n11',
  name2: 'n22',
});
```

## Model API

### Automation.load()
### automation.loadJobs()
### automation.startJob(jobName: string, callback: any)
### automation.cancelJob(jobName: string)
### Job.bootstrap()
### Job.process(result?: any, options?: any)
### Job.cancel()