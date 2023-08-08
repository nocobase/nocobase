import Application from '../application';
import lodash from 'lodash';

export const errors = {
  APP_NOT_FOUND: {
    status: 404,
    message: (appName: string) => `application ${appName} not found`,
    maintaining: false,
  },

  APP_INSTALLING: {
    status: 503,
    message: (app: Application) => app.workingMessage,
    maintaining: true,
  },

  APP_STARTING: {
    status: 503,
    message: (app: Application) => app.workingMessage,
    maintaining: true,
  },

  APP_STOPPING: {
    status: 503,
    message: (app: Application) => app.workingMessage,
    maintaining: true,
  },

  APP_UPDATING: {
    status: 503,
    message: (app: Application) => app.workingMessage,
    maintaining: true,
  },

  APP_PM_ENABLING: {
    status: 503,
    message: (app: Application) => app.workingMessage,
    maintaining: true,
  },

  APP_PM_DISABLING: {
    status: 503,
    message: (app: Application) => app.workingMessage,
    maintaining: true,
  },

  APP_RUNNING: {
    status: 200,
    message: (app: Application) => `application ${app.name} is running`,
    maintaining: false,
  },

  APP_IDLE: {
    status: 503,
    message: (app: Application) => app.workingMessage || 'application is idle, waiting for command',
    maintaining: true,
  },

  APP_ERROR: {
    status: 503,
    message: (app: Application) => app.getFsmError().message,
    maintaining: true,
  },
};

export function getErrorWithCode(errorCode: string) {
  errorCode = errorCode.toUpperCase();

  const error = lodash.cloneDeep(
    errors[errorCode] || {
      status: 500,
      message: (app: Application) => `unknown error: ${errorCode}`,
      maintaining: false,
    },
  );

  error.code = errorCode;
  return error;
}
