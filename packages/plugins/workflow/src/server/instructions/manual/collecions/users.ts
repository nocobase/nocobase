export default {
  name: 'users',
  fields: [
    {
      type: 'belongsToMany',
      name: 'jobs',
      through: 'users_jobs',
    },
    {
      type: 'hasMany',
      name: 'usersJobs',
      target: 'users_jobs',
    },
  ],
};
