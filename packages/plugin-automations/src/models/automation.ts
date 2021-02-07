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
      await automation.loadJobs();
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

  async loadJobs() {
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
    if (endMode === 'customTime' && endTime && endTime.value) {
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
        const { startTime = {}, endTime = {}, cron = 'none', endMode = 'none' } = this.get();
        if (!startTime) {
          break;
        }
        const startField = startTime.byField;
        if (!startField) {
          break;
        }
        const endField = endTime ? endTime.byField : null;
        const { where = {} } = M.parseApiJson({
          filter,
        });
        const scheduleJob = (item: any) => {
          if (!item[startField]) {
            return;
          }
          let rule: any = {};
          if (!cron || cron === 'none') {
            rule = new Date(item[startField]);
          } else {
            rule.start = new Date(item[startField]);
            if (typeof cron === 'object') {
              Object.assign(rule, cron);
            } else if (typeof cron === 'string') {
              const map = {
                everysecond: '* * * * * *',
              };
              rule.rule = map[cron] || cron;
            }
            if (endMode === 'byField' && endField && item[endField]) {
              rule.end = new Date(item[endField]);
            }
          }
          console.log({rule});
          schedule.scheduleJob(`${hookName}-${item.id}`, rule, (date) => {
            (async () => {
              await callback(date, { automationType });
            })();
          });
        }
        M.addHook('afterCreate', hookName, async (model) => {
          scheduleJob(model);
        });
        M.addHook('afterUpdate', hookName, async (model) => {
          schedule.cancelJob(`${hookName}-${model.get('id')}`);
          scheduleJob(model);
        });
        M.addHook('afterDestroy', hookName, async (model) => {
          schedule.cancelJob(`${hookName}-${model.get('id')}`);
        });
        // TODO: 待优化，每条数据都要绑定上 scheduleJob
        M.findAll(where).then(items => {
          for (const item of items) {
            scheduleJob(item);
          }
        });
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

  async cancelJob(jobName: string) {
    const collectionName = this.get('collection_name');
    const hookName = `automation-${this.id}-${jobName}`;
    const M = this.database.getModel(collectionName);
    switch (this.get('type')) {
      case 'collections:afterCreate':
        M.removeHook('afterCreate', hookName);
        break;
      case 'collections:afterCreate':
        M.removeHook('afterUpdate', hookName);
        break;
      case 'collections:afterCreateOrUpdate':
        M.removeHook('afterCreate', hookName);
        M.removeHook('afterUpdate', hookName);
        break;
      case 'collections:schedule':
        M.removeHook('afterCreate', hookName);
        M.removeHook('afterUpdate', hookName);
        M.removeHook('afterDestroy', hookName);
        const items = await M.findAll();
        for (const item of items) {
          schedule.cancelJob(`${hookName}-${item.id}`);
        }
        break;
      case 'schedule':
        schedule.cancelJob(hookName);
        break;
    }
  }
}
