import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  authorization: {
    title: 'Ejemplos de horarios de trabajos',
    update: 'Reglas de inicio y parada',
  },
  navigation: {
    group: 'Ejemplo de trabajos',
    jobs: 'Trabajos puntuales',
    schedules: 'Programaciones',
  },
  jobs: {
    title: 'Trabajos en segundo plano',
    description:
      'Cada trabajo espera en la cola, luego funciona durante diez segundos e informa el 10% del progreso cada segundo. El progreso llega a WebSocket mientras esta página está abierta.',
    create: 'Crear trabajo',
    creating: 'Creando…',
    listTitle: 'Tus trabajos',
    count: 'Trabajos {{count}}',
    empty: 'Aún no hay trabajos. Crea uno para observar su progreso.',
    loading: 'Cargando…',
    job: 'Trabajo {{id}}',
    createdAt: 'Creado {{time}}',
    attempt: 'Intento {{attempt}}',
    progress: 'Progreso',
    live: 'En directo',
    offline: 'Reconexión',
  },
  schedules: {
    title: 'Programaciones',
    description:
      'Reglas recurrentes en un ScheduleExecutor. Cada regla que esta página puede iniciar está definida en código, por lo que su controlador se registra antes de que comience el ejecutor; una regla iniciada antes de un reinicio sigue ejecutándose después. Los cambios llegan a través de WebSocket mientras esta página está abierta.',
    listTitle: 'Reglas',
    loading: 'Cargando…',
    start: 'Iniciar',
    stop: 'Detener',
    builtIn: 'Incorporado',
    every: 'Cada {{seconds}}s',
    cron: 'Cron {{cron}} (UTC)',
    limit: 'como máximo veces {{limit}}',
    nextRun: 'Siguiente ejecución en {{seconds}}s',
    nextRunDue: 'La próxima ejecución debe realizarse ahora',
    noNextRun: 'No más carreras',
    firings: '{{count}} se ejecuta en esta instancia',
    delay: 'inició {{ms}} ms tarde',
    noRuns: 'Aún no hay ejecuciones.',
    live: 'En directo',
    offline: 'Reconexión',
    rule: {
      heartbeat: 'Latido del corazón',
      interval: 'Intervalo',
      limited: 'Limitado',
      cron: 'Cron',
    },
    ruleDescription: {
      heartbeat:
        'El complemento escribe esta regla en cada inicio y nunca la detiene.',
      interval:
        'Cambia el intervalo mientras se ejecuta; la siguiente ejecución se planifica a partir de la nueva.',
      limited:
        'Termina solo después de cinco carreras. Comience de nuevo por cinco más.',
      cron: 'Se ejecuta al inicio de cada minuto.',
    },
    state: {
      active: 'Activo',
      ended: 'Finalizado',
      stopped: 'Detenido',
    },
    outcome: {
      running: 'En ejecución',
      succeeded: 'Tuvo éxito',
      failed: 'Falló',
    },
  },
  status: {
    queued: 'En cola',
    running: 'En ejecución',
    completed: 'Completado',
    failed: 'Falló',
  },
};

export default esES;
