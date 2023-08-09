import Application from '../application';
import lodash from 'lodash';

interface AppError {
  status: number;
  message: any;
  command?: any;
  maintaining: boolean;
  code: string;
}

interface AppErrors {
  [key: string]: Omit<AppError, 'code'>;
}

export const errors: AppErrors = {
  APP_NOT_FOUND: {
    status: 404,
    message: (appName: string) => `application ${appName} not found`,
    maintaining: true,
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

  APP_INITIALIZED: {
    status: 503,
    message: (app: Application) => app.workingMessage || 'application is initialized, waiting for command',
    maintaining: true,
  },

  APP_INITIALIZING: {
    status: 503,
    message: (appName: string) => `application ${appName} is initializing`,
    maintaining: true,
  },

  COMMAND_ERROR: {
    status: 503,
    maintaining: true,
    message: (app: Application) => app.getMaintaining().error.message,
    command: (app: Application) => app.getMaintaining().command,
  },

  COMMAND_END: {
    status: 503,
    maintaining: true,
    message: (app: Application) => `${app.getMaintaining().command.name} running end`,
    command: (app: Application) => app.getMaintaining().command,
  },

  COMMAND_RUNNING: {
    status: 503,
    maintaining: true,
    message: (app: Application) => app.workingMessage,
    command: (app: Application) => app.getMaintaining().command,
  },

  UNKNOWN_ERROR: {
    status: 500,
    message: 'unknown error',
    maintaining: true,
  },
};

export function getErrorWithCode(errorCode: string): AppError {
  const rawCode = errorCode;
  errorCode = lodash.snakeCase(errorCode).toUpperCase();

  if (!errors[errorCode] && errors[`APP_${errorCode}`]) {
    errorCode = `APP_${errorCode}`;
  }

  if (!errors[errorCode]) {
    errorCode = 'UNKNOWN_ERROR';
  }

  const error = lodash.cloneDeep(errors[errorCode]);
  error['code'] = errorCode == 'UNKNOWN_ERROR' ? rawCode : errorCode;
  return error as AppError;
}

export function applyErrorWithArgs(error: AppError, ...args: any[]) {
  const functionKeys = Object.keys(error).filter((key) => typeof error[key] === 'function');
  const functionResults = functionKeys.map((key) => error[key].apply(null, args));

  return {
    ...error,
    ...lodash.zipObject(functionKeys, functionResults),
  };
}
