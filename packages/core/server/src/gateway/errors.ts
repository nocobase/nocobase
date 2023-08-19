import { AppSupervisor } from '../app-supervisor';
import lodash from 'lodash';

interface AppError {
  status: number;
  message: any;
  command?: any;
  maintaining: boolean;
  code: any;
}

interface AppErrors {
  [key: string]: Omit<AppError, 'code'> & {
    code?: any;
  };
}

export const errors: AppErrors = {
  APP_NOT_FOUND: {
    status: 404,
    message: ({ appName }) => `application ${appName} not found`,
    maintaining: true,
  },

  APP_ERROR: {
    status: 503,
    message: ({ app }) => {
      return AppSupervisor.getInstance().appErrors[app.name]?.message;
    },
    code: ({ app }): string => {
      const error = AppSupervisor.getInstance().appErrors[app.name];
      return error['code'] || 'APP_ERROR';
    },
    command: ({ app }) => app.getMaintaining().command,
    maintaining: true,
  },

  APP_STARTING: {
    status: 503,
    message: ({ app }) => app.maintainingMessage,
    maintaining: true,
  },

  APP_STOPPED: {
    status: 503,
    message: ({ app }) => `application ${app.name} is stopped`,
    maintaining: true,
  },

  APP_INITIALIZED: {
    status: 503,
    message: ({ app }) => `application ${app.name} is initialized, waiting for command`,
    maintaining: true,
  },

  APP_INITIALIZING: {
    status: 503,
    message: ({ appName }) => `application ${appName} is initializing`,
    maintaining: true,
  },

  COMMAND_ERROR: {
    status: 503,
    maintaining: true,
    message: ({ app }) => app.getMaintaining().error.message,
    command: ({ app }) => app.getMaintaining().command,
  },

  COMMAND_END: {
    status: 503,
    maintaining: true,
    message: ({ app }) => `${app.getMaintaining().command.name} running end`,
    command: ({ app }) => app.getMaintaining().command,
  },

  APP_COMMANDING: {
    status: 503,
    maintaining: true,
    message: ({ app, message }) => message || app.maintainingMessage,
    command: ({ app, command }) => command || app.getMaintaining().command,
  },

  APP_RUNNING: {
    status: 200,
    maintaining: false,
    message: ({ message, app }) => message || `application ${app.name} is running`,
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

  if (!error.code) {
    error['code'] = errorCode == 'UNKNOWN_ERROR' ? rawCode : errorCode;
  }

  return error as AppError;
}

export function applyErrorWithArgs(error: AppError, options) {
  const functionKeys = Object.keys(error).filter((key) => typeof error[key] === 'function');
  const functionResults = functionKeys.map((key) => {
    return error[key](options);
  });

  return {
    ...error,
    ...lodash.zipObject(functionKeys, functionResults),
  };
}
