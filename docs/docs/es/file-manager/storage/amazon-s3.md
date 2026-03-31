:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Motor de Almacenamiento: Amazon S3

Este es un motor de almacenamiento basado en Amazon S3. Antes de usarlo, usted necesita preparar la cuenta y los permisos correspondientes.

## Parámetros de Configuración

![Ejemplo de configuración del motor de almacenamiento Amazon S3](https://static-docs.nocobase.com/20251031092524.png)

:::info{title=Nota}
Aquí solo presentamos los parámetros específicos del motor de almacenamiento de Amazon S3. Para los parámetros generales, consulte [Parámetros Comunes del Motor](./index#引擎通用参数).
:::

### Región

Ingrese la región de almacenamiento de S3, por ejemplo: `us-west-1`.

:::info{title=Nota}
Usted puede ver la información de la región de su bucket en la [consola de Amazon S3](https://console.aws.amazon.com/s3/). Solo necesita usar el prefijo de la región (no el nombre de dominio completo).
:::

### ID de AccessKey

Ingrese el ID de la clave de acceso autorizada de Amazon S3.

### Secreto de AccessKey

Ingrese el secreto de la clave de acceso autorizada de Amazon S3.

### Bucket

Ingrese el nombre del bucket de almacenamiento de S3.