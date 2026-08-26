#Gestión de entornos múltiples

Si mantiene varias aplicaciones NocoBase como `dev`, `test`, `staging`, `prod`, etc., puede guardarlas como entorno CLI respectivamente. La mayoría de los futuros comandos `nb` actuarán en el entorno actual de forma predeterminada, por lo que es importante confirmar qué entorno está utilizando antes de ejecutar comandos como `nb app`, `nb api` y `nb db`.

A partir de esta versión, la CLI divide el concepto en `current env` y `last env`. Por lo general, solo necesita preocuparse por `current env`, que es el entorno que utiliza el shell o el tiempo de ejecución del agente actual. La CLI volverá a `last env` global solo cuando el modo de sesión no esté habilitado.

## Índice rápido

| Quiero... | Qué comando usar |
| --- | --- |
| Cree un nuevo entorno local y complete la inicialización sin problemas | [`nb init`](../../api/cli/init.md) |
| Registre una aplicación existente como CLI env | [`nb env add`](../../api/cli/env/add.md) |
| Ver qué envs se guardan localmente | [`nb env list`](../../api/cli/env/list.md) |
| Verifique el estado de conectividad y autenticación de todos los entornos | [`nb env status --all`](../../api/cli/env/status.md) |
| Cambie el entorno que utilizarán los comandos posteriores | [`nb env use`](../../api/cli/env/use.md) |
| Confirme en qué entorno caerá el comando actual | [`nb env current`](../../api/cli/env/current.md) y [`nb env status`](../../api/cli/env/status.md) |
| Ver configuraciones detalladas guardadas por un env | [`nb env info`](../../api/cli/env/info.md) |
| Actualice la configuración del entorno guardada y permita que la CLI resincronice el estado actual si es necesario | [`nb env update`](../../api/cli/env/update.md) |
| Vuelva a autenticarse después de que caduque el estado de inicio de sesión o utilice un nuevo método de autenticación | [`nb env auth`](../../api/cli/env/auth.md) |
| Elimine las configuraciones de entorno no utilizadas y limpie los recursos alojados locales si es necesario | [`nb env remove`](../../api/cli/env/remove.md) |

:::consejo Se recomienda habilitar primero el modo de sesión

De forma predeterminada, se recomienda ejecutar [`nb session setup`](../../api/cli/session/setup.md) primero. De esta manera, diferentes terminales, diferentes shells o diferentes tiempos de ejecución de agentes pueden mantener cada uno su propio `current env` y no se afectarán fácilmente entre sí durante las operaciones paralelas.

Si el modo de sesión no está habilitado, `nb env use` recurrirá a la actualización global `last env`. En este caso, si un terminal corta el entorno, el otro terminal también puede verse afectado.

```bash
nb session setup
```

:::

## Crea múltiples entornos

Si desea crear o restaurar una aplicación local, simplemente use `nb init`. Completará la inicialización y guardará los resultados en un nuevo entorno CLI.

```bash
nb init --env dev
nb init --env test
```

Si la aplicación ya existe y solo desea conectarla a la CLI, normalmente es más sencillo usar `nb env add`:

```bash
nb env add staging --api-base-url http://staging.example.com/api --auth-type oauth
nb env add prod --api-base-url https://api.example.com/api --auth-type token --access-token <token>
```

El primero se trata más de "iniciar un entorno", mientras que el segundo se trata más de "registrar un entorno existente". Si recién se está conectando a una aplicación existente, use `nb env add` de forma predeterminada.

## Ver el entorno configurado

Primero use `nb env list` para ver qué entornos se han guardado localmente:

```bash
nb env list
```

Este comando solo muestra la configuración en sí y no verifica activamente el estado de la aplicación. Cuando desee ver el estado de conectividad y autenticación, utilice `nb env status --all`:

```bash
nb env status --all
```

Normalmente verá valores de estado como `ok`, `auth failed`, `unreachable`.

## Cambiar el entorno actual

Utilice `nb env use` para cambiar de entorno:

```bash
nb env use dev
```

Una vez completado el cambio, los comandos posteriores que omitan `--env` usarán este entorno de forma predeterminada.

## Verifique el entorno actual

Si no está seguro de en qué entorno caerá el comando actual, primero ejecute estos dos comandos:

```bash
nb env current
nb env status
```

`nb env current` se usa para ver el nombre, `nb env status` se usa para ver si el entorno actual es accesible y la autenticación es normal.

## Ver detalles de un único entorno

Si desea ver qué configuraciones se guardan en un entorno determinado, use `nb env info`:

```bash
nb env info dev
nb env info dev --json
nb env info dev --field app.url
nb env info dev --show-secrets
```

Entre ellos, `--field` es adecuado para tomar solo un valor en el script. `--show-secrets` mostrará información confidencial, como tokens y contraseñas, en texto sin formato. Úsalos sólo cuando claramente necesites solucionar problemas.

## Actualizar la configuración del entorno

`nb env update` se utiliza para ajustar la configuración de un entorno guardado. Como dirección API, método de autenticación, código fuente, puerto de aplicación y parámetros de base de datos. Una vez que se completa la actualización, la CLI maneja automáticamente los pasos de seguimiento basados ​​en los cambios.

Si solo desea que la CLI se resincronice de acuerdo con el último estado del entorno actual, simplemente escriba así:

```bash
nb env update
nb env update prod
```

Si desea modificar la información de conexión o la configuración local guardada por este entorno, puede traer explícitamente los parámetros:

```bash
nb env update prod --api-base-url https://api.example.com/api
nb env update prod --access-token <token>
nb env update dev --app-port 13080 --timezone Asia/Shanghai
```

Aquí puede recordar primero una sentencia en rebeldía:

- Para modificar la información de conexión o la configuración local guardada por env, use `nb env update`
- Las capacidades disponibles de la interfaz de la aplicación, el complemento o la CLI acaban de cambiar; también puede ejecutar `nb env update` nuevamente
- El estado de inicio de sesión ha caducado o necesita realizar el proceso de autenticación nuevamente, use `nb env auth`
- Sólo para ver lo que está guardado actualmente, use `nb env info`

Si cambia las configuraciones de ejecución locales como `app-port`, `timezone` y `db-*`, `update` solo cambiará el valor guardado y no reiniciará automáticamente la aplicación. En términos generales, `nb app restart --env <name>` se ejecutará más tarde; si el cambio involucra la base de datos integrada administrada por CLI, use `nb app restart --env <name> --with-db`.

## Reautenticación

Si se guardó env, pero el estado de inicio de sesión expiró o si desea cambiar el método de autenticación, puede volver a autenticarse:

```bash
nb env auth
nb env auth prod
nb env auth prod --auth-type oauth
nb env auth prod --auth-type basic --username admin --password secret
nb env auth prod --auth-type token --access-token <api-key>
```

Cuando se omite el nombre del entorno, la CLI utiliza el entorno actual. Una vez que se completa la autenticación, la CLI maneja automáticamente la sincronización posterior.

## Eliminar entorno

Estos escenarios son los más confusos. Primero puedes recordar una sugerencia predeterminada:

- Si solo desea detener la aplicación, utilice `nb app stop`
- También quiero detener el tiempo de ejecución de la base de datos integrada en la máquina actual, use `nb app stop --with-db`
- Si está seguro de que este entorno ya no es necesario, pero primero desea conservar el almacenamiento y los archivos de la aplicación local, use `nb env remove`
- Limpia incluso los recursos de alojamiento local y usa `nb env remove --purge`

Si solo desea eliminar la configuración de entorno guardada:

```bash
nb env remove staging
```

Si se trata de un entorno local o alojado en Docker y también desea limpiar los recursos en ejecución y los datos de almacenamiento en la máquina local, puede agregar `--purge`:

```bash
nb env remove test --purge
```

En modo no interactivo, `nb env remove` debe pasarse explícitamente en `--force`:

```bash
nb env remove test --purge --force
```

`--purge` solo limpiará los recursos administrados por CLI en la máquina actual. Para el entorno de API remoto, no eliminará el servicio remoto en sí.

Si solo desea detener la aplicación y la base de datos integrada administrada por CLI, simplemente escriba:

```bash
nb app stop --env app1 --with-db
```

Si desea eliminar este entorno pero aún desea conservar el almacenamiento y los archivos de la aplicación local:

```bash
nb env remove app1 --force
```

Si realmente desea limpiar el contenido alojado de forma nativa de este entorno, agregue `--purge`:

```bash
nb env remove app1 --purge --force
```

Para el entorno npm/Git local administrado por descargas CLI, `--purge` también elimina archivos de aplicaciones locales alojados en CLI. Para el entorno HTTP o SSH, solo eliminará la configuración del entorno guardada en la CLI y no eliminará el servicio externo en sí.

## Enlaces relacionados

- [`nb env` Referencia de comando](../../api/cli/env/index.md)
- [`nb env update`](../../api/cli/env/update.md)
- [`nb session` Referencia de comando](../../api/cli/session/index.md)
- [nb intención de diseño de la aplicación] (../cli-design/nb-app-design-intent.md)
- [Administrar aplicación] (./manage-app.md)
