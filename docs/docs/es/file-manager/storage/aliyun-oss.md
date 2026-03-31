:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Motor de Almacenamiento: Aliyun OSS

Este motor de almacenamiento se basa en Aliyun OSS. Antes de usarlo, usted necesitará preparar la cuenta y los permisos correspondientes.

## Parámetros de Configuración

![Ejemplo de Configuración del Motor de Almacenamiento Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Nota}
Aquí solo se presentan los parámetros específicos del motor de almacenamiento Aliyun OSS. Para conocer los parámetros generales, por favor, consulte [Parámetros Generales del Motor](./index#引擎通用参数).
:::

### Región

Introduzca la región de almacenamiento de OSS, por ejemplo: `oss-cn-hangzhou`.

:::info{title=Nota}
Usted puede ver la información de la región de su bucket en la [Consola de Aliyun OSS](https://oss.console.aliyun.com/). Solo necesita usar el prefijo de la región (no el nombre de dominio completo).
:::

### AccessKey ID

Introduzca el ID de su clave de acceso de Aliyun.

### AccessKey Secret

Introduzca el Secret de su clave de acceso de Aliyun.

### Bucket

Introduzca el nombre del bucket de OSS.

### Tiempo de Espera

Introduzca el tiempo de espera para la carga a Aliyun OSS, en milisegundos. El valor predeterminado es de `60000` milisegundos (es decir, 60 segundos).