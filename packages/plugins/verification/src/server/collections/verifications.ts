export default {
  namespace: 'verification.verificationData',
  duplicator: 'optional',
  name: 'verifications',
  fields: [
    {
      type: 'uuid',
      name: 'id',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'receiver',
    },
    {
      type: 'integer',
      name: 'status',
      defaultValue: 0,
    },
    {
      type: 'date',
      name: 'expiresAt',
    },
    {
      type: 'string',
      name: 'content',
    },
    {
      type: 'belongsTo',
      name: 'provider',
      target: 'verifications_providers',
    },
  ],
};
