---
pkg: "@nocobase/plugin-field-encryption"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Cifrado

## Introducción

Ciertos datos empresariales privados, como números de teléfono de clientes, direcciones de correo electrónico o números de tarjeta, pueden ser cifrados. Una vez cifrados, se almacenan en la base de datos en formato de texto cifrado.

![20251104192513](https://static-docs.nocobase.com/20251104192513.png)

## Métodos de Cifrado

:::warning
El plugin genera automáticamente una `clave de aplicación` que se guarda en el directorio `/storage/apps/main/encryption-field-keys`.

El nombre del archivo de la `clave de aplicación` es el ID de la clave, con la extensión `.key`. Por favor, no modifique el nombre del archivo.

Guarde el archivo de la `clave de aplicación` de forma segura. Si pierde este archivo, los datos cifrados no podrán descifrarse.

Si el plugin se activa en una subaplicación, la clave se guarda por defecto en el directorio `/storage/apps/${nombre-subaplicacion}/encryption-field-keys`.
:::

### Cómo funciona

Utiliza el método de cifrado de sobre (Envelope Encryption).

![20251118151339](https://static-docs.nocobase.com/20251118151339.png)

### Proceso de creación de claves
1. La primera vez que se crea un campo cifrado, el sistema genera automáticamente una `clave de aplicación` de 32 bits y la guarda codificada en Base64 en el directorio de almacenamiento predeterminado.
2. Cada vez que se crea un nuevo campo cifrado, se genera una `clave de campo` aleatoria de 32 bits para este campo. Luego, se cifra utilizando la `clave de aplicación` y un `vector de cifrado de campo` de 16 bits generado aleatoriamente (algoritmo de cifrado `AES`), y se guarda en el campo `options` de la tabla `fields`.

### Proceso de cifrado de campos
1. Cada vez que se escriben datos en un campo cifrado, primero se recuperan la `clave de campo` cifrada y el `vector de cifrado de campo` del campo `options` de la tabla `fields`.
2. Se descifra la `clave de campo` cifrada utilizando la `clave de aplicación` y el `vector de cifrado de campo`. Luego, se cifran los datos utilizando la `clave de campo` y un `vector de cifrado de datos` de 16 bits generado aleatoriamente (algoritmo de cifrado `AES`).
3. Se firman los datos utilizando la `clave de campo` descifrada (algoritmo de resumen `HMAC-SHA256`) y se convierten a una cadena codificada en Base64 (la `firma de datos` resultante se utilizará posteriormente para la recuperación de datos).
4. Se concatenan binariamente el `vector de cifrado de datos` de 16 bits y el `texto cifrado de datos` resultante, y se convierten a una cadena codificada en Base64.
5. Se concatenan la cadena codificada en Base64 de la `firma de datos` y la cadena codificada en Base64 del `texto cifrado de datos` utilizando un separador `.`.
6. Se guarda la cadena final concatenada en la base de datos.

## Variables de Entorno

Si desea especificar una `clave de aplicación` personalizada, puede usar la variable de entorno `ENCRYPTION_FIELD_KEY_PATH`. El plugin cargará el archivo en esa ruta como la `clave de aplicación`.

**Requisitos para el archivo de la `clave de aplicación`:**
1. La extensión del archivo debe ser `.key`.
2. El nombre del archivo se utilizará como ID de la clave; se recomienda usar un UUID para asegurar su unicidad.
3. El contenido del archivo debe ser datos binarios de 32 bits codificados en Base64.

```bash
ENCRYPTION_FIELD_KEY_PATH=/path/to/my/app-keys/270263524860909922913.key
```

## Configuración de campos

![20240802173721](https://static-docs.nocobase.com/20240802173721.png)

## Impacto en el filtrado después del cifrado

Los campos cifrados solo admiten los siguientes filtros: igual a, distinto de, existe, no existe.

![20240802174042](https://static-docs.nocobase.com/20240802174042.png)

Flujo de trabajo de filtrado de datos:
1. Recupere la `clave de campo` del campo cifrado y descífrela utilizando la `clave de aplicación`.
2. Utilice la `clave de campo` para firmar el texto de búsqueda introducido por el usuario (algoritmo de resumen `HMAC-SHA256`).
3. Concatene la firma con un separador `.` y realice una búsqueda por coincidencia de prefijo en el campo cifrado de la base de datos.

## Rotación de claves

:::warning
Antes de usar el comando de rotación de claves `nocobase key-rotation`, asegúrese de que el plugin esté cargado en la aplicación.
:::

Cuando migre una aplicación a un nuevo entorno y no desee seguir usando la misma clave que en el entorno anterior, puede utilizar el comando `nocobase key-rotation` para reemplazar la `clave de aplicación`.

Para ejecutar el comando de rotación de claves, debe especificar la `clave de aplicación` del entorno antiguo. Después de la ejecución, se generará una nueva `clave de aplicación` y reemplazará a la anterior. La nueva `clave de aplicación` se guardará codificada en Base64 en el directorio predeterminado.

```bash
# --key-path especifica el archivo de la clave de aplicación del entorno antiguo
 yarn nocobase key-rotation --key-path /path/to/old-app-keys/270263524860909922913.key
```

Si desea rotar la `clave de aplicación` de una subaplicación, añada el parámetro `--app-name` y especifique el `name` de la subaplicación.

```bash
 yarn nocobase key-rotation --app-name a_w0r211vv0az --key-path /path/to/old-app-keys/270263524860909922913.key
```