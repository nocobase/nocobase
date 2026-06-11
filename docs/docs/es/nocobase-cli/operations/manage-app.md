#Administrar aplicaciones

Si ha guardado una aplicación NocoBase como un entorno CLI, la administración diaria se completa básicamente en el grupo de comandos `nb app`: iniciar, detener, reiniciar, ver registros y actualizar.

La mayoría de las veces, no es necesario recordar todos los parámetros. Primero deje claro si lo que quiere hacer es "ejecutar la aplicación", "leer los registros para solucionar problemas" o "actualizar a una nueva versión", y luego seleccione el comando correspondiente.

Si primero desea comprender por qué `nb app` está unificado en este conjunto de comandos y su relación con `nb app autostart`, primero lea [nb intención de diseño de la aplicación] (../cli-design/nb-app-design-intent.md). Esta página sólo conserva las operaciones diarias más comunes.

## Índice rápido

| Quiero... | Qué comando usar |
| --- | --- |
| Iniciar o reanudar la operación de la aplicación | [`nb app start`](../../api/cli/app/start.md) |
| Detener temporalmente la aplicación | [`nb app stop`](../../api/cli/app/stop.md) |
| Deténgase junto con la base de datos integrada administrada por CLI | [`nb app stop --with-db`](../../api/cli/app/stop.md) |
| Reinicie la aplicación después de modificar la configuración | [`nb app restart`](../../api/cli/app/restart.md) |
| Ver registros de aplicaciones en tiempo real | [`nb app logs`](../../api/cli/app/logs.md) |
| Actualizar a una nueva fuente o versión de imagen | [`nb app upgrade`](../../api/cli/app/upgrade.md) |

::: consejo primero confirme el entorno actual

El comando `nb app` actúa sobre el entorno actual de forma predeterminada. Si mantiene varios entornos al mismo tiempo, se recomienda de forma predeterminada confirmar el entorno de destino antes de iniciar, detener, registrar o actualizar operaciones.

Si pasa explícitamente un `--env` diferente, la CLI normalmente solicitará confirmación. En scripts o escenarios no interactivos, puede agregar `--yes` para omitir este paso. La conmutación, visualización y eliminación de entornos múltiples se presentan en [Gestión de entornos múltiples] (./multi-environment.md).

:::

## Iniciar aplicación

Abra la aplicación y use `nb app start` de forma predeterminada:

```bash
nb app start
```

Si desea operar en algo que no sea el entorno actual, puede especificarlo explícitamente:

```bash
nb app start --env app1 --yes
```

Varios otros parámetros de inicio de uso común:

- `nb app start` De forma predeterminada, primero se completarán automáticamente los preparativos necesarios para la instalación o actualización y luego se iniciará el servicio.

npm/Git env local iniciará el proceso de aplicación local y Docker env reconstruirá el contenedor de la aplicación de acuerdo con la configuración guardada. Para obtener parámetros detallados, consulte [`nb app start`](../../api/cli/app/start.md).

## Detener y reiniciar

Si solo desea detener la aplicación temporalmente, use `nb app stop`:

```bash
nb app stop
```

Si acaba de cambiar la configuración, las dependencias o el código, normalmente es más fácil usar `nb app restart` directamente:

```bash
nb app restart
nb app restart --env app1 --yes
```

`nb app restart` se detendrá primero y luego se reiniciará de la misma manera que `start`. Para conocer el uso detallado, consulte [`nb app stop`](../../api/cli/app/stop.md) y [`nb app restart`](../../api/cli/app/restart.md).

## Ver registro

Al solucionar problemas, normalmente mira primero los registros:

```bash
nb app logs
```

Si solo desea ver resultados más recientes o no desea continuar siguiendo el registro, puede usar esto:

```bash
nb app logs --tail 200
nb app logs --no-follow
nb app logs --env app1 --yes
```

El entorno npm/Git local lee los registros pm2 y el entorno Docker lee los registros del contenedor. De forma predeterminada, `nb app logs` continuará siguiendo la nueva salida del registro. Para obtener parámetros detallados, consulte [`nb app logs`](../../api/cli/app/logs.md).

## Actualizar aplicación

El comando de actualización es `nb app upgrade`:

```bash
nb app upgrade
```

Este comando hace más que simplemente "descargar la nueva versión". El proceso predeterminado suele incluir:

1. Detenga la aplicación actual
2. Descargue y reemplace el código fuente o la imagen guardados.
3. Sincronizar complementos comerciales
4. Actualice e inicie la aplicación.
5. Actualizar la información del entorno de ejecución

Si actualizó el código fuente o la imagen con anticipación y solo desea continuar con la actualización e iniciar la aplicación según el contenido actual, puede agregar `--skip-download`:

```bash
nb app upgrade --skip-download
```

Si desea especificar explícitamente la versión de destino, también puede agregar `--version`:

```bash
nb app upgrade --version beta
```

:::nota de advertencia

`nb app upgrade` Por lo general, también se le pedirá que confirme una vez antes de comenzar. En scripts, CI u otros escenarios no interactivos, `--force` debe pasarse explícitamente. Si también opera en todos los entornos al mismo tiempo, normalmente necesitará reunir `--yes`.

```bash
nb app upgrade --env app1 --yes --force
```

:::

Para obtener una descripción más completa de los parámetros, consulte [`nb app upgrade`](../../api/cli/app/upgrade.md).

## Enlaces relacionados

- [nb intención de diseño de la aplicación] (../cli-design/nb-app-design-intent.md)
- [Gestión de entornos múltiples] (./multi-environment.md)
- [`nb app` Referencia de comando](../../api/cli/app/index.md)
