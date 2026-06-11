# Copia de seguridad y restauración

Si ha guardado una aplicación NocoBase como un entorno CLI, la copia de seguridad y la recuperación diarias se completan básicamente en el grupo de comandos `nb backup`. `nb backup create` se utiliza para crear una copia de seguridad en el entorno de destino y descargarla en el local. `nb backup restore` se utiliza para restaurar el archivo de copia de seguridad local en el entorno de destino.

La mayoría de las veces, basta con recordar el consejo predeterminado: hacer una copia de seguridad antes de actualizar, migrar o cambiar datos por lotes; realice la recuperación solo cuando sepa claramente que desea sobrescribir los datos actuales.

## Índice rápido

| Quiero... | Qué comando usar |
| --- | --- |
| Primero haga una copia de seguridad del entorno actual en local | [`nb backup create`](../../api/cli/backup/create.md) |
| Guarde la copia de seguridad en el directorio especificado | [`nb backup create --output ./backups`](../../api/cli/backup/create.md) |
| Deje que el script continúe consumiendo los resultados de la copia de seguridad | [`nb backup create --json-output`](../../api/cli/backup/create.md) |
| Restaurar la copia de seguridad local al entorno actual | [`nb backup restore --file ./backups/xxx.nbdata --force`](../../api/cli/backup/restore.md) |
| Restaurar la copia de seguridad local en otro entorno | [`nb backup restore --env app1 --file ./backups/xxx.nbdata --yes --force`](../../api/cli/backup/restore.md) |

::: consejo primero confirme el entorno actual

El comando `nb backup` actúa sobre el entorno actual de forma predeterminada. Si mantiene varios entornos al mismo tiempo, la recomendación predeterminada es echar un vistazo al entorno actual antes de realizar una copia de seguridad o una restauración.

```bash
nb env current
nb env use app1
```

Si pasa explícitamente un `--env` diferente, la CLI normalmente solicitará confirmación. En scripts o escenarios no interactivos, puede agregar `--yes` para omitir este paso.

:::

## Crea una copia de seguridad

El uso más sencillo es crear una copia de seguridad directamente:

```bash
nb backup create
```

Una vez que el comando regresa correctamente, el archivo de copia de seguridad se ha descargado localmente. Cuando se omite `--output`, la CLI guarda el archivo en el directorio de trabajo actual y utiliza el nombre de archivo devuelto por el extremo remoto, generalmente `backup_*.nbdata`.

Si desea colocar las copias de seguridad en un directorio, puede usar esto:

```bash
nb backup create --output ./backups
```

Si `./backups` ya existe y es un directorio, la CLI agregará automáticamente el nombre del archivo de copia de seguridad remota al directorio. Solo si la ruta no existe, la CLI la tratará como la ruta del archivo de destino.

Si desea seguir consumiendo los resultados de la copia de seguridad en scripts, CI o enlaces de agentes, puede agregar `--json-output`:

```bash
nb backup create --env app1 --yes --json-output
```

En este modo, la CLI ya no genera texto de progreso, sino que devuelve directamente el JSON final, que normalmente contiene tres campos: `env`, `name` y `output`.

## Restaurar copia de seguridad

El comando de restauración cargará el archivo de copia de seguridad local en el entorno de destino y sobrescribirá los datos de la aplicación actual:

```bash
nb backup restore --file ./backups/backup_20260520_190408_8397.nbdata --force
```

Si desea restaurar algo distinto al entorno actual, generalmente es más seguro escribir así:

```bash
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::nota de advertencia

La recuperación es una operación de cobertura total. De forma predeterminada, se recomienda realizar otra copia de seguridad del entorno de destino actual antes de restaurar.

```bash
nb backup create --env app1 --yes --output ./backups
nb backup restore --env app1 --file ./backups/backup_20260520_190408_8397.nbdata --yes --force
```

:::

`nb backup restore` primero verificará si la ruta señalada por `--file` existe y confirmará que es un archivo normal. Después de que la carga sea exitosa, la CLI continuará esperando a que la aplicación pase la verificación de estado nuevamente, de modo que cuando el comando regrese exitosamente, la aplicación generalmente se habrá restaurado a un estado accesible.

Si no se pasa `--force`, el terminal interactivo le pedirá confirmación nuevamente. En terminales no interactivos, scripts y sesiones de agente de IA, se requiere `--force`.

## Situaciones comunes

Si está más acostumbrado a operar en la interfaz o necesita capacidades como copias de seguridad programadas y sincronización del almacenamiento en la nube, puede ver directamente [Administración de copias de seguridad] (../../ops-management/backup-manager/index.mdx). En tales escenarios, la interfaz de usuario web suele ser más adecuada.

## Enlaces relacionados

- [`nb backup` Referencia de comando](../../api/cli/backup/index.md)
- [`nb env` Referencia de comando](../../api/cli/env/index.md)
- [Gestión de entornos múltiples] (./multi-environment.md)
- [Gestión de copias de seguridad](../../ops-management/backup-manager/index.mdx)
