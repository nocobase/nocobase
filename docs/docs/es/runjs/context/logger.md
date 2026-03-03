:::tip{title="Aviso de traducción IA"}
Este documento ha sido traducido por IA. Para información precisa, consulte la [versión en inglés](/runjs/context/logger).
:::

# ctx.logger

Un envoltorio de registro basado en [pino](https://github.com/pinojs/pino), que proporciona registros JSON estructurados de alto rendimiento. Se recomienda utilizar `ctx.logger` en lugar de `console` para facilitar la recopilación y el análisis de registros.

## Escenarios de uso

`ctx.logger` se puede utilizar en todos los escenarios de RunJS para depuración, seguimiento de errores, análisis de rendimiento, etc.

## Definición de tipo

```ts
logger: pino.Logger;
```

`ctx.logger` es una instancia de `engine.logger.child({ module: 'flow-engine' })`, es decir, un sub-logger de pino con un contexto de `module`.

## Niveles de registro

pino admite los siguientes niveles (de mayor a menor):

| Nivel | Método | Descripción |
|------|------|------|
| `fatal` | `ctx.logger.fatal()` | Error fatal, generalmente provoca la salida del proceso |
| `error` | `ctx.logger.error()` | Error, indica que una solicitud u operación ha fallado |
| `warn` | `ctx.logger.warn()` | Advertencia, indica riesgos potenciales o situaciones anómalas |
| `info` | `ctx.logger.info()` | Información general de tiempo de ejecución |
| `debug` | `ctx.logger.debug()` | Información de depuración, utilizada durante el desarrollo |
| `trace` | `ctx.logger.trace()` | Seguimiento detallado, utilizado para diagnósticos profundos |

## Uso recomendado

Se recomienda el formato `level(msg, meta)`: el mensaje primero, seguido de un objeto de metadatos opcional.

```ts
ctx.logger.info('Carga del bloque completada');
ctx.logger.info('Operación exitosa', { recordId: 456 });
ctx.logger.warn('Advertencia de rendimiento', { duration: 5000 });
ctx.logger.error('Operación fallida', { userId: 123, action: 'create' });
ctx.logger.error('Solicitud fallida', { err });
```

pino también admite `level(meta, msg)` (objeto primero) o `level({ msg, ...meta })` (un solo objeto), que pueden utilizarse según sea necesario.

## Ejemplos

### Uso básico

```ts
ctx.logger.info('Carga del bloque completada');
ctx.logger.warn('Solicitud fallida, usando caché', { err });
ctx.logger.debug('Guardando...', { recordId: ctx.record?.id });
```

### Creación de un sub-logger con child()

```ts
// Crear un sub-logger con contexto para la lógica actual
const log = ctx.logger.child({ scope: 'myBlock' });
log.info('Ejecutando paso 1');
log.debug('Ejecutando paso 2', { step: 2 });
```

### Relación con console

Se recomienda utilizar `ctx.logger` directamente para obtener registros JSON estructurados. Si usted está acostumbrado a utilizar `console`, las correspondencias son: `console.log` → `ctx.logger.info`, `console.error` → `ctx.logger.error`, `console.warn` → `ctx.logger.warn`.

## Formato de registro

pino genera JSON estructurado, donde cada entrada de registro contiene:

- `level`: Nivel de registro (numérico)
- `time`: Marca de tiempo (milisegundos)
- `msg`: Mensaje de registro
- `module`: Fijo como `flow-engine`
- Otros campos personalizados (pasados a través de objetos)

## Notas

- Los registros son JSON estructurados, lo que facilita su recopilación, búsqueda y análisis.
- Se recomienda que los sub-loggers creados mediante `child()` también sigan el formato `level(msg, meta)`.
- Algunos entornos de ejecución (como los flujos de trabajo) pueden utilizar diferentes métodos de salida de registros.

## Relacionado

- [pino](https://github.com/pinojs/pino) — La biblioteca de registro subyacente