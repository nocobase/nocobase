export default {
  info: {
    title: 'NocoBase API - ACL plugin',
  },
  tags: [
    {
      name: 'acl',
      description: 'ACL',
    },
  ],
  paths: {
    '/roles:list': {
      get: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/roles:get': {
      get: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/roles:create': {
      post: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/roles:update': {
      post: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/roles:destroy': {
      post: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/roles:check': {
      post: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/roles:setDefaultRole': {
      post: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/roles/{roleName}/collections:list': {
      get: {
        tags: ['acl'],
        responses: null,
      },
    },
    '/availableActions:list': {
      get: {
        tags: ['acl'],
        responses: null,
      },
    },
  },
};
