import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Datos de demostración',
    read: 'Ver',
    manage: 'Generar y borrar',
    configuration: 'Configuración de demostración',
    configure: 'Configurar',
  },
  accounts: {
    title: 'Cuentas de demostración',
    description:
      'Entra en la demostración con cualquiera de estas cuentas para ver lo que ve cada una.',
    enter: 'Entrar',
    signedInAs: 'Sesión de {{name}} · Cambiar',
    current: 'Actual',
    entering: 'Entrando…',
    failed: 'No se pudo entrar con esta cuenta de demostración.',
    unavailable: 'Ahora mismo no hay cuentas de demostración disponibles.',
    password: 'Iniciar sesión con contraseña',
  },
  refused: {
    title: 'Esta es una demostración. No se pueden guardar cambios.',
    description: 'El resto funciona con normalidad.',
  },
};
export default resource;
