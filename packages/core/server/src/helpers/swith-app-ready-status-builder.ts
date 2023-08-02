import Application from '../application';

export function SwitchAppReadyStatus(appGetter: () => Application) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      appGetter().setReadyStatus(false, `start ${originalMethod.name}`);
      const result = await originalMethod.apply(this, args);
      appGetter().setReadyStatus(true, `end ${originalMethod.name}`);
      return result;
    };

    return descriptor;
  };
}
