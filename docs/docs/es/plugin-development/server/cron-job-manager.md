:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# CronJobManager: Gestión de Tareas Programadas

`CronJobManager` es un gestor de tareas programadas que NocoBase le ofrece, basado en [cron](https://www.npmjs.com/package/cron). Permite que los `plugin`s registren tareas programadas en el servidor para ejecutar lógica específica de forma periódica.

## Uso Básico

```ts
import { Plugin } from '@nocobase/server';

export default class PluginCronDemo extends Plugin {
  async load() {
    this.app.cronJobManager.addJob({
      cronTime: '0 0 * * *', // Se ejecuta diariamente a las 00:00
      onTick: async () => {
        console.log('Tarea diaria: limpiar datos temporales');
        await this.cleanTemporaryData();
      },
      timeZone: 'Asia/Shanghai',
      start: true, // Inicio automático
    });
  }

  async cleanTemporaryData() {
    // Ejecute aquí la lógica de limpieza
  }
}
```

## Descripción de Parámetros

La definición del tipo `CronJobParameters` es la siguiente (tomada de [cron](https://www.npmjs.com/package/cron)):

```ts
export declare interface CronJobParameters {
  cronTime: string | Date | DateTime;
  onTick: CronCommand;
  onComplete?: CronCommand | null;
  start?: boolean;
  timeZone?: string;
  context?: any;
  runOnInit?: boolean;
  utcOffset?: string | number;
  unrefTimeout?: boolean;
}
```

| Parámetro        | Tipo                        | Descripción                                                                                              |
| ---------------- | --------------------------- | -------------------------------------------------------------------------------------------------------- |
| **cronTime**     | `string \| Date \| DateTime` | Expresión de tiempo para la tarea programada. Admite expresiones cron estándar, por ejemplo, `0 0 * * *` significa que se ejecuta diariamente a las 00:00. |
| **onTick**       | `function`                  | Función principal de la tarea. Se activará en el momento especificado.                                   |
| **onComplete**   | `function`                  | Se ejecuta cuando la tarea es detenida por `job.stop()` o después de que la función `onTick` se completa. |
| **timeZone**     | `string`                    | Especifica la zona horaria de ejecución (por ejemplo, `Asia/Shanghai`).                                  |
| **context**      | `any`                       | Contexto al ejecutar `onTick`.                                                                           |
| **runOnInit**    | `boolean`                   | Indica si se debe ejecutar una vez inmediatamente al inicializar.                                        |
| **utcOffset**    | `string \| number`          | Especifica el desplazamiento de la zona horaria.                                                         |
| **unrefTimeout** | `boolean`                   | Controla si el bucle de eventos permanece activo.                                                        |

## Ejemplos de Expresiones Cron

| Expresión         | Significado                     |
| ----------------- | ------------------------------- |
| `* * * * *`       | Se ejecuta cada minuto          |
| `0 * * * *`       | Se ejecuta cada hora            |
| `0 0 * * *`       | Se ejecuta diariamente a las 00:00 |
| `0 9 * * 1`       | Se ejecuta cada lunes a las 09:00 |
| `*/10 * * * *`    | Se ejecuta cada 10 minutos      |

> 💡 Puede usar [crontab.guru](https://crontab.guru/) para ayudarle a generar expresiones.

## Controlar el Inicio y la Detención de Tareas

```ts
const job = app.cronJobManager.addJob({ ... });
job.start(); // Inicia la tarea
job.stop();  // Detiene la tarea
```

:::tip

Las tareas programadas se inician y detienen junto con la aplicación. Por lo general, no necesita iniciarlas o detenerlas manualmente, a menos que sea estrictamente necesario.

:::