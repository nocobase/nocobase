# Instalación y actualización de complementos de terceros

Si obtiene un paquete de complemento de terceros, generalmente impórtelo al `storage/plugins` de la aplicación de destino, luego reinicie la aplicación y luego continúe habilitando o verificando si el complemento surte efecto.

## Índice rápido

| Quiero... | Dónde buscar |
| --- | --- |
| Primero cambie al entorno de destino, luego comience a importar o reiniciar el complemento | [Confirme primero el entorno de destino](#Confirme primero el entorno de destino) |
| Importe complementos de terceros desde paquetes comprimidos remotos, paquetes comprimidos locales o npm | [Utilice `nb plugin import` para importar paquetes de complementos](#Use -nb-plugin-import-Importar paquetes de complementos) |
| Especificar complemento de importación de almacenamiento | [Especificar ruta de almacenamiento para importar](#Especificar ruta de almacenamiento para importar) |
| Una vez completada la importación, deje que la aplicación vuelva a cargar el directorio del complemento | [`nb app restart`](../../api/cli/app/restart.md) |
| Habilite oficialmente el complemento después de la primera instalación | [`nb plugin enable`](../../api/cli/plugin/enable.md) |
| Actualizar un complemento de terceros habilitado | [Qué hacer al actualizar el complemento](#Qué hacer al actualizar el complemento) |
| Quiere confirmar si el complemento apareció en la aplicación actual | [`nb plugin list`](../../api/cli/plugin/list.md) |
| La máquina de destino no se puede conectar directamente a Internet y solo se puede cargar manualmente `.tgz` y luego importar | [Cuando no se puede conectar Internet directamente](#Cuando no se puede conectar Internet directamente) |

## Confirme primero el entorno de destino

Si administra varias aplicaciones localmente, primero cambie al entorno de destino y luego opere:

```bash
nb env use app1
```

## Utilice `nb plugin import` para importar el paquete del complemento

`nb plugin import` admite tres tipos de fuentes: paquetes comprimidos remotos, paquetes comprimidos locales y nombres de paquetes npm. Este comando solo es responsable de importar el complemento a `storage/plugins` y no lo habilitará automáticamente.

Si obtuvo la dirección de descarga del paquete del complemento, la ruta del archivo local o el complemento se publicó en npm, puede ejecutar:

```bash
# 远程压缩包
nb plugin import https://github.com/nocobase/plugin-auth-cas/releases/download/v1.4.0/plugin-auth-cas-1.4.0.tgz

# 本地压缩包
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz

# npm 包名或 tag
nb plugin import @my-scope/plugin-auth-cas@beta
```

Si está utilizando una fuente npm privada, generalmente inicie sesión primero y luego especifique el registro:

```bash
npm login --registry=https://registry.example.com
nb plugin import @my-scope/plugin-auth-cas@beta --npm-registry=https://registry.example.com
```

## Especifique la ruta de almacenamiento para importar

Si ya conoce el directorio raíz `storage` de la aplicación de destino, también puede pasar `--storage-path` directamente sin depender del entorno actual:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz --storage-path ./storage
```

La CLI escribirá el complemento en `<storage-path>/plugins`. En este momento, no puede ejecutar `nb env use` primero ni pasar `--env`.

## Reiniciar después de importar

Una vez completada la importación, reinicie la aplicación de destino:

```bash
nb app restart
```

Si no cambia primero el entorno actual, también puede pasar explícitamente `-e <env>` en el comando.

## Habilitar o verificar después de reiniciar

Si esta es la primera instalación, reinicie y luego habilite el complemento:

```bash
nb plugin enable @nocobase/plugin-auth-cas
```

La instalación se completará automáticamente cuando se habilite por primera vez.

## Qué hacer al actualizar complementos

Si el complemento ya está habilitado y esta vez simplemente cambia a una nueva versión, generalmente solo hay dos pasos:

```bash
nb plugin import /your/path/plugin-auth-cas-1.5.0.tgz
nb app restart
```

Lo mismo se aplica si importa un paquete npm:

```bash
nb plugin import @my-scope/plugin-auth-cas@latest
nb app restart
```

En otras palabras, el escenario de actualización no requiere la ejecución adicional de `nb plugin enable`. Simplemente importe el nuevo paquete y reinicie la aplicación.

## Cuando no se puede conectar Internet directamente

Si la máquina de destino no puede acceder directamente a la dirección de descarga del complemento, primero puede cargar el archivo `.tgz` en cualquier directorio de la máquina de destino y luego realizar la importación local en la máquina de destino.

Por ejemplo:

```bash
nb plugin import /your/path/plugin-auth-cas-1.4.0.tgz
nb app restart
```

:::nota de advertencia

No es necesario extraer manualmente a `storage/plugins` aquí. `nb plugin import` colocará automáticamente el complemento en el directorio correcto.

:::
