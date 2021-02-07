import _ from 'lodash';
import { Model } from '@nocobase/database';
import schedule from 'node-schedule';

const scheduleJobs = new Map<string, any>();

export class AutomationModel extends Model {
  static async load() {
    const automations = await this.findAll({
      where: {
        enabled: true,
      }
    });
    for (const automation of automations) {
      await automation.startJobs();
    }
  }

  isEnabled() {
    if (!this.get('enabled')) {
      return false;
    }
    const type = this.get('type');
    if (!['collections:schedule', 'schedule'].includes(type)) {
      return true;
    }
    if (this.get('cron') === 'none') {
      return true;
    }
    return true;
  }

  async startJobs() {
    if (!this.get('enabled')) {
      return false;
    }
    const jobs = await this.getJobs();
    for (const job of jobs) {
      job.setDataValue('automation', this);
      await job.bootstrap();
    }
  }

  async cancelJobs() {
    const jobs = await this.getJobs();
    for (const job of jobs) {
      job.setDataValue('automation', this);
      await job.cancel();
    }
  }

  getRule() {
    const { type, startTime = {}, endTime = {}, cron = 'none', endMode = 'none' } = this.get();
    if (type !== 'schedule') {
      return;
    }
    if (!startTime || !startTime.value) {
      return;
    }
    let options: any = { start: new Date(startTime.value) };
    if (!cron || cron === 'none') {
      return options.start;
    }
    if ((!endMode || endMode === 'none') && endTime && endTime.value) {
      options.end = new Date(endTime.value);
    }
    if (typeof cron === 'object') {
      Object.assign(options, cron);
    } else if (typeof cron === 'string') {
      const map = {
        everysecond: '* * * * * *',
      };
      options.rule = map[cron] || cron;
    }
    return options;
  }

  startJob(jobName: string, callback: any) {
    const collectionName = this.get('collection_name');
    const hookName = `automation-${this.id}-${jobName}`;
    const filter = this.get('filter') || {};
    const changedFields = (this.get('changed') as any) || [];
    const M = this.database.getModel(collectionName);
    const automationType = this.get('type');
    switch (automationType) {
      case 'collections:afterCreate':
        M.addHook('afterCreate', hookName, async (model, options) => {
          filter[M.primaryKeyAttribute] = model[M.primaryKeyAttribute];
          const { where } = M.parseApiJson({
            filter,
          });
          const result = await M.findOne({
            ...options,
            where,
          });
          // console.log({M, filter, result});
          if (result) {
            await callback(model, { ...options, automationType });
          }
        });
        break;
      case 'collections:afterUpdate':
        M.addHook('afterUpdate', hookName, async (model, options) => {
          const changed = model.changed();
          if (!changed) {
            return;
          }
          if (changedFields.length) {
            const arr = _.intersection(changed, changedFields);
            console.log(arr);
            if (arr.length === 0) {
              return;
            }
          }
          filter[M.primaryKeyAttribute] = model[M.primaryKeyAttribute];
          const { where } = M.parseApiJson({
            filter,
          });
          const result = await M.findOne({
            ...options,
            where,
          });
          if (result) {
            await callback(model, {...options, automationType});
          }
        });
        break;
      case 'collections:afterCreateOrUpdate':
        M.addHook('afterCreate', hookName, async (model, options) => {
          filter[M.primaryKeyAttribute] = model[M.primaryKeyAttribute];
          const { where } = M.parseApiJson({
            filter,
          });
          const result = await M.findOne({
            ...options,
            where,
          });
          if (result) {
            await callback(model, {...options, automationType});
          }
        });
        M.addHook('afterUpdate', hookName, async (model, options) => {
          const changed = model.changed();
          if (!changed) {
            return;
          }
          if (changedFields.length) {
            const arr = _.intersection(changed, changedFields);
            if (arr.length === 0) {
              return;
            }
          }
          filter[M.primaryKeyAttribute] = model[M.primaryKeyAttribute]
          const { where } = M.parseApiJson({
            filter,
          });
          const result = await M.findOne({
            ...options,
            where,
          });
          if (result) {
            await callback(model, { ...options, automationType });
          }
        });
        break;
      case 'collections:schedule':
        // const job1 = schedule.scheduleJob({
        //   start: '2021-02-01T10:27:00.006Z',
        //   rule: '*/5 * * * * *',
        // }, () => {
        //   (async () => {
        //     // TODO: 需要优化大数据的处理
        //     const result = await M.findAll(M.parseApiJson({
        //       filter,
        //     }));
        //     if (result.length) {
        //       await callback(result, { automationType });
        //     }
        //   })();
        // });
        // scheduleJobs.set(hookName, job1);
        break;
      case 'schedule':
        const rule = this.getRule();
        console.log({rule});
        schedule.scheduleJob(hookName, rule, (date) => {
          (async () => {
            await callback(date, { automationType });
          })();
        });
        break;
    }
  }

  cancelJob(jobName: string) {
    const collectionName = this.get('collection_name');
    const hookName = `automation-${this.id}-${jobName}`;
    switch (this.get('type')) {
      case 'collections:afterCreate':
        const M1 = this.database.getModel(collectionName);
        M1.removeHook('afterCreate', hookName);
        break;
      case 'collections:afterCreate':
        const M2 = this.database.getModel(collectionName);
        M2.removeHook('afterUpdate', hookName);
        break;
      case 'collections:afterCreateOrUpdate':
        const M3 = this.database.getModel(collectionName);
        M3.removeHook('afterCreate', hookName);
        M3.removeHook('afterUpdate', hookName);
        break;
      case 'collections:schedule':
        break;
      case 'schedule':
        schedule.cancelJob(hookName);
        break;
    }
  }
}
