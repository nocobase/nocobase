---
pkg: "@nocobase/plugin-field-encryption"
title: "Cifrado de campos"
description: "Almacena cifrados datos empresariales privados (números de teléfono, correos electrónicos, números de tarjeta, etc.) en la base de datos como texto cifrado para proteger la información confidencial."
keywords: "Cifrado de campos,Encryption,datos confidenciales,almacenamiento cifrado,NocoBase"
---
# Cifrado

## Introducción

Algunos datos empresariales privados, como los números de teléfono de clientes, las direcciones de correo electrónico y los números de tarjeta, pueden cifrarse y almacenarse en la base de datos como texto cifrado.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Métodos de cifrado

:::warning
El complemento generará automáticamente un`应用密钥`, y esta clave se guardará en el directorio `/storage/apps/main/encryption-field-keys`.

El nombre del archivo `应用密钥` corresponde al ID de la clave y su extensión es `.key`. No modifique el nombre del archivo arbitrariamente.

Guarde cuidadosamente el archivo `应用密钥`. Si se pierde el archivo `应用密钥`, los datos cifrados no podrán descifrarse.

Si el complemento está habilitado en una subaplicación, el directorio de almacenamiento predeterminado de la clave es `/storage/apps/${子应用name}/encryption-field-keys`
:::

### Funcionamiento

Se utiliza el cifrado de sobre.

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Proceso de creación de claves
1. La primera vez que se crea un campo cifrado, el sistema genera automáticamente un`应用密钥` de 32 bits y lo guarda codificado en base64 en el directorio de almacenamiento predeterminado.
2. Cada vez que se crea un nuevo campo cifrado, se genera un`字段密钥` aleatorio de 32 bits para ese campo. A continuación, se cifra mediante`应用密钥` y un`字段加密向量` aleatorio de 16 bits (algoritmo de cifrado `AES`), y se guarda en el campo `options` de la tabla `fields`.

### Proceso de cifrado de campos
1. Cada vez que se escriben datos en un campo cifrado, primero se obtienen el`字段密钥` y el`字段加密向量` cifrados del campo options de la tabla fields.
2. Se descifra el`字段密钥` cifrado mediante`应用密钥` y字段加密向量. A continuación, los datos se cifran mediante`字段密钥` y un数据加密向量 aleatorio de 16 bits (algoritmo de cifrado AES).
3. Se firma el contenido mediante el`字段密钥` descifrado (algoritmo de resumen `HMAC-SHA256`) y se convierte en una cadena codificada en base64 (el数据签名 generado se utilizará posteriormente para recuperar los datos).
4. Se concatenan en binario el数据加密向量 de 16 bits y el数据密文 cifrado, y el resultado se convierte en una cadena codificada en base64.
5. Se concatenan, separados por '.', la cadena codificada en base64 de数据签名 y la cadena codificada en base64 de数据密文.
6. Se guarda la cadena concatenada final en la base de datos.


## Variables de entorno

Si desea especificar`应用密钥`, puede utilizar la variable de entorno ENCRYPTION_FIELD_KEY_PATH. El complemento cargará el archivo ubicado en esa ruta como`应用密钥`.

应用密钥Requisitos del formato de archivo:
1. La extensión del archivo debe ser .key.
2. El nombre del archivo se utilizará como ID de la clave. Se recomienda usar un UUID para garantizar su unicidad.
3. El contenido del archivo debe ser datos binarios de 32 bits codificados en base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Configuración de campos

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impacto del cifrado en los filtros

Los campos cifrados solo admiten: igual, diferente, existe y no existe.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Método de filtrado de datos:
1. Obtenga el字段密钥 del campo cifrado y utilice应用密钥 para descifrar字段密钥.
2. Firme el texto de búsqueda introducido por el usuario mediante字段密钥 (algoritmo de resumen HMAC-SHA256).
3. Concatene el texto de búsqueda firmado con el separador. y realice una búsqueda por coincidencia de prefijo en el campo cifrado de la base de datos.

## Rotación de claves

:::warning
Antes de utilizar el comando de rotación de claves nocobase key-rotation, confirme que la aplicación ya ha cargado este complemento.
:::

Después de migrar la aplicación a un entorno nuevo, si no desea seguir utilizando la misma clave que en el entorno anterior, puede utilizar el comando nocobase key-rotation para reemplazar应用密钥.

Para ejecutar el comando de rotación de claves, debe especificar la clave de aplicación del entorno anterior. Tras su ejecución, se generará una nueva clave de aplicación que reemplazará la clave antigua. La nueva clave de aplicación se guardará codificada en base64 en el directorio de almacenamiento predeterminado.

```bash
# --key-path 指定的是和数据库加密数据对应的旧环境的应用密钥文件
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Si se reemplaza la subaplicación 应用密钥, es necesario añadir el parámetro `--app-name` para especificar `name`

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```
