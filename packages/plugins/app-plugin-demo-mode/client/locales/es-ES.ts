import type { DemoModeResource } from './en-US.js';
const resource: DemoModeResource = {
  authorization: {
    title: 'Datos de demostración',
    read: 'Ver',
    manage: 'Generar y borrar',
    configuration: 'Configuración de demostración',
    configure: 'Configurar',
  },
  menu: {
    label: 'Modo de demostración',
    switchAccount: 'Cambiar de cuenta',
    title: 'Este es un entorno de demostración',
    description:
      'Los datos se restablecen automáticamente cada día. Los cambios no se guardan.',
    accountsDescription:
      'Cambia a una de las cuentas siguientes para ver a qué puede acceder cada rol.',
    loading: 'Cargando cuentas…',
  },
  accounts: {
    title: 'Cuentas',
    description:
      'Entra en la demostración con cualquiera de estas cuentas para ver lo que ve cada una.',
    enter: 'Entrar',
    current: 'Actual',
    entering: 'Entrando…',
    failed: 'No se pudo acceder a esta cuenta.',
    unavailable: 'No hay cuentas disponibles en este momento.',
    password: 'Iniciar sesión con contraseña',
  },
  refused: {
    title: 'Esta es una demostración. No se pueden guardar cambios.',
    description: 'El resto funciona con normalidad.',
  },
  settings: {
    title: 'Entorno de demostración',
    refresh: 'Actualizar',
    retry: 'Reintentar',
    busy: 'Se están generando o borrando los datos de demostración',
    busyHelp: 'Espere a que finalice la operación de datos actual.',
    disabled: {
      title: 'Esta aplicación no es una demostración',
      help: 'El modo de demostración está desactivado. El despliegue lo activa con NOCOBASE_DEMO_MODE=true.',
    },
    errors: {
      failed: 'La solicitud no se completó. Inténtalo de nuevo.',
      demoModeRequired: 'Solo funciona con el modo de demostración activado.',
      signedOut: 'Tu sesión ha terminado. Inicia sesión de nuevo.',
      denied: 'No tiene permiso para ver la configuración de demostración.',
    },
    data: {
      title: 'Datos de demostración',
      state: {
        importing: 'Generando',
        clearing: 'Borrando',
        resetting: 'Restableciendo',
        failed: 'Error',
        ready: 'Listos',
        none: 'Sin generar',
      },
      presentSummary: 'Generados en {{language}} · {{time}}',
      resettingSummary:
        'Borrando los datos actuales para generarlos de nuevo en {{language}}.',
      phase: {
        clearing: 'Borrando',
        generating: 'Generando de nuevo',
      },
      absentSummary: 'Aún no se han generado datos de demostración.',
      failed: 'La última ejecución no terminó',
      unavailable: 'Sin datos de demostración',
      unavailableHelp:
        'Esta aplicación no registra un conjunto de datos de demostración.',
    },
    visitors: {
      unavailable: 'No hay cuentas disponibles en este momento.',
      title: 'Cuentas',
      username: 'Usuario {{username}}',
      copyLink: 'Copiar enlace',
      copyLinkFor: 'Copiar el enlace de acceso de {{name}}',
      openFor: 'Abrir la demostración como {{name}}',
      copied: 'Copiado',
      copyFailed:
        'No se pudo copiar. Copia el enlace desde la barra de direcciones.',
    },
    schedule: {
      title: 'Restablecimiento diario',
      description:
        'Los datos de demostración se restablecen automáticamente cada día. La programación se configura mediante variables de entorno.',
      time: 'Hora',
      language: 'Idioma',
      timezone: 'Zona horaria',
      next: 'Próximo restablecimiento: {{time}}',
    },
  },
};
export default resource;
