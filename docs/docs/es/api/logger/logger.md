:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Logger

## Crear Logger

### `createLogger()`

Crea un logger personalizado.

#### Firma

- `createLogger(options: LoggerOptions)`

#### Tipo

```ts
interface LoggerOptions
  extends Omit<winston.LoggerOptions, 'transports' | 'format'> {
  dirname?: string;
  filename?: string;
  format?: 'logfmt' | 'json' | 'delimiter' | 'console' | winston.Logform.Format;
  transports?: ('console' | 'file' | 'dailyRotateFile' | winston.transport)[];
}
```

#### Detalles

| Propiedad    | Descripción                     |
| :----------- | :------------------------------ |
| `dirname`    | Directorio de salida del log    |
| `filename`   | Nombre del archivo de log       |
| `format`     | Formato del log                 |
| `transports` | Método de salida del log        |

### `createSystemLogger()`

Crea logs de tiempo de ejecución del sistema que se imprimen de una manera específica. Consulte [Logger - Log del sistema](/log-and-monitor/logger/index.md#system-log)

#### Firma

- `createSystemLogger(options: SystemLoggerOptions)`

#### Tipo

```ts
export interface SystemLoggerOptions extends LoggerOptions {
  seperateError?: boolean; // imprime el error por separado, por defecto true
}
```

#### Detalles

| Propiedad       | Descripción                                            |
| :-------------- | :----------------------------------------------------- |
| `seperateError` | Si se deben generar logs de nivel `error` por separado |

### `requestLogger()`

Middleware para el registro de solicitudes y respuestas de API.

```ts
app.use(requestLogger(app.name));
```

#### Firma

- `requestLogger(appName: string, options?: RequestLoggerOptions): MiddewareType`

#### Tipo

```ts
export interface RequestLoggerOptions extends LoggerOptions {
  skip?: (ctx?: any) => Promise<boolean>;
  requestWhitelist?: string[];
  responseWhitelist?: string[];
}
```

#### Detalles

| Propiedad           | Tipo                              | Descripción                                                              | Valor por defecto                                                                                                                                                 |
| :------------------ | :-------------------------------- | :----------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skip`              | `(ctx?: any) => Promise<boolean>` | Omite el registro de ciertas solicitudes basándose en el contexto de la solicitud. | -                                                                                                                                                       |
| `requestWhitelist`  | `string[]`                        | Lista blanca de información de solicitud a imprimir en el log.           | `[ 'action', 'header.x-role', 'header.x-hostname', 'header.x-timezone', 'header.x-locale','header.x-authenticator', 'header.x-data-source', 'referer']` |
| `responseWhitelist` | `string[]`                        | Lista blanca de información de respuesta a imprimir en el log.           | `['status']`                                                                                                                                            |

### app.createLogger()

#### Definición

```ts
class Application {
  createLogger(options: LoggerOptions) {
    const { dirname } = options;
    return createLogger({
      ...options,
      dirname: getLoggerFilePath(this.name || 'main', dirname || ''),
    });
  }
}
```

Cuando `dirname` es una ruta relativa, los archivos de log se generarán en el directorio con el nombre de la aplicación actual.

### plugin.createLogger()

Su uso es el mismo que el de `app.createLogger()`.

#### Definición

```ts
class Plugin {
  createLogger(options: LoggerOptions) {
    return this.app.createLogger(options);
  }
}
```

## Configuración del Logger

### getLoggerLevel()

`getLoggerLevel(): 'debug' | 'info' | 'warn' | 'error'`

Obtiene el nivel de log configurado actualmente en el sistema.

### getLoggerFilePath()

`getLoggerFilePath(...paths: string[]): string`

Concatena las rutas de los directorios basándose en el directorio de logs configurado actualmente en el sistema.

### getLoggerTransports()

`getLoggerTransports(): ('console' | 'file' | 'dailyRotateFile')[]`

Obtiene los métodos de salida de log configurados actualmente en el sistema.

### getLoggerFormat()

`getLoggerFormat(): 'logfmt' | 'json' | 'delimiter' | 'console'`

Obtiene el formato de log configurado actualmente en el sistema.

## Salida de Logs

### Transports

Métodos de salida predefinidos.

- `Transports.console`
- `Transports.file`
- `Transports.dailyRotateFile`

```ts
import { Transports } from '@nocobase/logger';

const transport = Transports.console({
  //...
});
```

## Documentación Relacionada

- [Guía de Desarrollo - Logger](/plugin-development/server/logger)
- [Logger](/log-and-monitor/logger/index.md)