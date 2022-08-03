import { extend } from '@nocobase/database';

export default extend({
  name: 'jobs',
  fields: [
    {
      type: 'belongsToMany',
      name: 'users',
      through: 'users_jobs',
    },
    {
      type: 'hasMany',
      name: 'usersJobs',
      target: 'users_jobs',
      foreignKey: 'jobId'
    }
  ]
});
