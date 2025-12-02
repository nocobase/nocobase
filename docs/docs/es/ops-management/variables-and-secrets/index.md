---
pkg: "@nocobase/plugin-environment-variables"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Variables y Claves Secretas

## Introducción

Configure y gestione de forma centralizada las variables de entorno y las claves secretas para el almacenamiento de datos sensibles, la reutilización de datos de configuración y el aislamiento de la configuración del entorno.

## Diferencias con `.env`

| **Característica** | **Archivo `.env`** | **Variables de Entorno y Claves Secretas Configuradas Dinámicamente** |
|---|---|---|
| **Ubicación de Almacenamiento** | Se almacenan en el archivo `.env` en el directorio raíz del proyecto. | Se almacenan en la tabla `environmentVariables` de la base de datos. |
| **Método de Carga** | Se cargan en `process.env` utilizando herramientas como `dotenv` durante el inicio de la aplicación. | Se leen dinámicamente y se cargan en `app.environment` durante el inicio de la aplicación. |
| **Método de Modificación** | Requiere la edición directa del archivo, y la aplicación debe reiniciarse para que los cambios surtan efecto. | Permite la modificación en tiempo de ejecución; los cambios surten efecto inmediatamente después de recargar la configuración de la aplicación. |
| **Aislamiento del Entorno** | Cada entorno (desarrollo, pruebas, producción) requiere el mantenimiento independiente de sus archivos `.env`. | Cada entorno (desarrollo, pruebas, producción) requiere el mantenimiento independiente de los datos en la tabla `environmentVariables`. |
| **Escenarios Aplicables** | Adecuado para configuraciones estáticas fijas, como la información de la base de datos principal de la aplicación. | Adecuado para configuraciones dinámicas que requieren ajustes frecuentes o están vinculadas a la lógica de negocio, como bases de datos externas, información de almacenamiento de archivos, etc. |

## Instalación

Es un plugin incorporado, por lo que no necesita instalarlo por separado.

## Uso

### Reutilización de Datos de Configuración

Por ejemplo, si varios puntos en un flujo de trabajo (workflow) requieren nodos de correo electrónico y configuración SMTP, puede almacenar la configuración SMTP común en variables de entorno.

![20250102181045](https://static-docs.nocobase.com/20250102181045.png)

### Almacenamiento de Datos Sensibles

Permite el almacenamiento de información de configuración de diversas bases de datos externas, claves de almacenamiento de archivos en la nube y otros datos sensibles.

![20250102103513](https://static-docs.nocobase.com/20250102103513.png)

### Aislamiento de la Configuración del Entorno

En diferentes entornos, como desarrollo, pruebas y producción, se utilizan estrategias de gestión de configuración independientes para asegurar que las configuraciones y los datos de cada entorno no interfieran entre sí. Cada entorno tiene sus propias configuraciones, variables y recursos independientes, lo que evita conflictos entre los entornos de desarrollo, pruebas y producción, y garantiza que el sistema funcione como se espera en cada uno.

Por ejemplo, la configuración de los servicios de almacenamiento de archivos puede variar entre los entornos de desarrollo y producción, como se muestra a continuación:

Entorno de Desarrollo

```bash
FILE_STORAGE_OSS_BASE_URL=dev-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=dev-storage
```

Entorno de Producción

```bash
FILE_STORAGE_OSS_BASE_URL=prod-storage.nocobase.com
FILE_STORAGE_OSS_BUCKET=prod-storage
```

## Gestión de Variables de Entorno

![20250102155314](https://static-docs.nocobase.com/20250102155314.png)

### Añadir Variables de Entorno

- Permite añadir variables individualmente o en lotes.
- Soporta almacenamiento en texto plano y cifrado.

![20250102155509](https://static-docs.nocobase.com/20250102155509.png)

Añadir Individualmente

![20250102155731](https://static-docs.nocobase.com/20250102155731.png)

Añadir en Lotes

![20250102155258](https://static-docs.nocobase.com/20250102155258.png)

## Consideraciones

### Reiniciar la Aplicación

Después de modificar o eliminar variables de entorno, aparecerá un aviso en la parte superior para reiniciar la aplicación. Los cambios en las variables de entorno solo surtirán efecto después de reiniciar la aplicación.

![20250102155007](https://static-docs.nocobase.com/20250102155007.png)

### Almacenamiento Cifrado

Los datos cifrados de las variables de entorno utilizan cifrado simétrico AES. La CLAVE PRIVADA para el cifrado y descifrado se almacena en el directorio `storage`. Por favor, guárdela de forma segura; si se pierde o se sobrescribe, los datos cifrados no podrán descifrarse.

```bash
./storage/environment-variables/<app-name>/aes_key.dat
```

## Plugins que Actualmente Soportan Variables de Entorno

### Acción: Solicitud Personalizada

![20250102180751](https://static-docs.nocobase.com/20250102180751.png)

### Autenticación: CAS

![20250102160129](https://static-docs.nocobase.com/20250102160129.png)

### Autenticación: DingTalk

![20250102160205](https://static-docs.nocobase.com/20250102160205.png)

### Autenticación: LDAP

![20250102160312](https://static-docs.nocobase.com/20250102160312.png)

### Autenticación: OIDC

![20250102160426](https://static-docs.nocobase.com/20250102160426.png)

### Autenticación: SAML

![20250102160652](https://static-docs.nocobase.com/20250102160652.png)

### Autenticación: WeCom

![20250102160758](https://static-docs.nocobase.com/20250102160758.png)

### Fuente de Datos: MariaDB Externa

![20250102160935](https://static-docs.nocobase.com/20250102160935.png)

### Fuente de Datos: MySQL Externa

![20250102173602](https://static-docs.nocobase.com/20250102173602.png)

### Fuente de Datos: Oracle Externa

![20250102174153](https://static-docs.nocobase.com/20250102174153.png)

### Fuente de Datos: PostgreSQL Externa

![20250102175630](https://static-docs.nocobase.com/20250102175630.png)

### Fuente de Datos: SQL Server Externo

![20250102175814](https://static-docs.nocobase.com/20250102175814.png)

### Fuente de Datos: KingbaseES

![20250102175951](https://static-docs.nocobase.com/20250102175951.png)

### Fuente de Datos: API REST

![20250102180109](https://static-docs.nocobase.com/20250102180109.png)

### Almacenamiento de Archivos: Local

![20250102161114](https://static-docs.nocobase.com/20250102161114.png)

### Almacenamiento de Archivos: Aliyun OSS

![20250102161404](https://static-docs.nocobase.com/20250102161404.png)

### Almacenamiento de Archivos: Amazon S3

![20250102163730](https://static-docs.nocobase.com/20250102163730.png)

### Almacenamiento de Archivos: Tencent COS

![20250102173109](https://static-docs.nocobase.com/20250102173109.png)

### Almacenamiento de Archivos: S3 Pro

No adaptado

### Mapa: AMap

![20250102163803](https://static-docs.nocobase.com/20250102163803.png)

### Mapa: Google

![20250102171524](https://static-docs.nocobase.com/20250102171524.png)

### Configuración de Correo Electrónico

No adaptado

### Notificación: Correo Electrónico

![20250102164059](https://static-docs.nocobase.com/20250102164059.png)

### Formularios Públicos

![20250102163849](https://static-docs.nocobase.com/20250102163849.png)

### Configuración del Sistema

![20250102164139](https://static-docs.nocobase.com/20250102164139.png)

### Verificación: SMS de Aliyun

![20250102164247](https://static-docs.nocobase.com/20250102164247.png)

### Verificación: SMS de Tencent

![20250102165814](https://static-docs.nocobase.com/20250102165814.png)

### Flujo de Trabajo

![20250102180537](https://static-docs.nocobase.com/20250102180537.png)