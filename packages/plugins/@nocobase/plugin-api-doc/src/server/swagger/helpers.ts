export const createDefaultActionSwagger = ({ collection }) => {
  const responses = {
    default: {
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${collection.name}`,
          },
        },
      },
    },
  };
  const requestBody = {
    content: {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${collection.name}`,
        },
      },
    },
  };
  return {
    list: {
      method: 'get',
      responses,
    },
    create: {
      method: 'post',
      requestBody,
    },
    get: {
      method: 'get',
      responses,
    },
    update: {
      method: 'put',
      requestBody,
      responses,
    },
    destroy: {
      method: 'delete',
      responses,
    },
    add: {
      method: 'post',
      requestBody,
      responses,
    },
    set: {
      method: 'post',
      requestBody,
    },
    remove: {
      method: 'delete',
      responses,
    },
    toggle: {
      method: 'post',
      requestBody,
      responses,
    },
    move: {
      method: 'post',
      requestBody,
    },
  };
};

export const getInterfaceCollection = (options: Record<string, any>) => {
  const accessors = {
    // 常规 actions
    list: 'list',
    create: 'create',
    get: 'get',
    update: 'update',
    delete: 'destroy',
    // associate 操作
    add: 'add',
    set: 'set',
    remove: 'remove',
    toggle: 'toggle',
    move: 'move',
    ...(options.accessors || {}),
  };

  const single = {
    '/{resourceName}': [accessors.list, accessors.create, accessors.delete],
    '/{resourceName}/{resourceIndex}': [accessors.get, accessors.update, accessors.delete],
    '/{associatedName}/{associatedIndex}/{resourceName}': [
      accessors.list,
      accessors.create,
      accessors.delete,
      accessors.toggle,
      accessors.add,
      accessors.remove,
    ],
    '/{associatedName}/{associatedIndex}/{resourceName}/{resourceIndex}': [
      accessors.get,
      accessors.update,
      accessors.delete,
      accessors.remove,
      accessors.toggle,
      accessors.set,
      accessors.move,
    ],
  };

  return single;
};
