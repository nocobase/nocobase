# Motor de Almacenamiento: Aliyun OSS

Este motor de almacenamiento se basa en Aliyun OSS. Antes de usarlo, usted necesitará preparar la cuenta y los permisos correspondientes.


:::warning Nota

Este motor no admite acceso privado. Después de subir un archivo, NocoBase genera una URL de acceso directo, y cualquier persona que tenga esa URL puede acceder al archivo.

Aunque el bucket OSS sea privado, el motor integrado Aliyun OSS no genera URL firmadas temporales para el acceso a archivos. Si necesita acceso privado, utilice [S3 Pro](./s3-pro.md). Si ya existen archivos históricos, consulte [Migrar a S3 Pro](./migrate-to-s3-pro.md).

:::

## Parámetros de Configuración

![Ejemplo de Configuración del Motor de Almacenamiento Aliyun OSS](https://static-docs.nocobase.com/20240712220011.png)

:::info{title=Nota}
Aquí solo se presentan los parámetros específicos del motor de almacenamiento Aliyun OSS. Para conocer los parámetros generales, consulte [Parámetros Generales del Motor](./index.md#parámetros-comunes).
:::

### URL base

Introduzca el prefijo de acceso a los archivos, como un dominio personalizado vinculado al bucket actual: `https://oss.example.com`. El dominio predeterminado de Aliyun OSS puede hacer que el navegador descargue los PDF. Se recomienda vincular primero un dominio personalizado. Consulte los [Problemas comunes](#problemas-comunes) para obtener más información.

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

## Problemas comunes

### El PDF se descarga en lugar de mostrarse

NocoBase muestra los PDF de otro origen en un iframe. El navegador accede directamente a la URL de OSS, por lo que los encabezados de respuesta determinan si el archivo se muestra o se descarga.

Si el PDF se descarga desde el iframe, revise la solicitud en el panel «Red» de las herramientas de desarrollo. Una respuesta problemática habitual es:

```http
Content-Type: application/pdf
Content-Disposition: attachment
x-oss-force-download: true
```

`Content-Type: application/pdf` identifica correctamente el archivo, pero `Content-Disposition: attachment` indica al navegador que debe descargarlo. El dominio predeterminado de Aliyun OSS fuerza las descargas en algunos casos. Consulte la documentación oficial: [Configurar un PDF para que se muestre en lugar de descargarse](https://help.aliyun.com/zh/oss/user-guide/how-do-i-configure-an-object-to-be-previewed-instead-of-downloaded).

Se recomienda esta configuración:

1. Siga [Acceder a recursos de OSS mediante un dominio personalizado](https://help.aliyun.com/zh/oss/user-guide/access-buckets-via-custom-domain-names) para vincular un dominio al bucket
2. Configure DNS y el certificado HTTPS, y compruebe que el dominio pueda acceder directamente al archivo
3. Configure la URL de acceso del motor de almacenamiento utilizado por NocoBase

Para el paso 3:

- Con el motor integrado **Aliyun OSS**, establezca **URL base** en el dominio vinculado, como `https://oss.example.com`
- Con [S3 Pro](./s3-pro.md) conectado a Aliyun OSS, el endpoint de carga puede seguir usando el endpoint regional de OSS; establezca el endpoint de acceso en el dominio personalizado y `Full access URL style` en `Ignore`

Suba un PDF nuevo para verificar la configuración. Si un registro existente guarda una URL completa, compruebe también que la URL enviada al frontend ya usa el dominio personalizado.

:::tip Revisar los encabezados

La vista previa de un PDF de otro origen en un iframe no requiere CORS. La visualización integrada depende principalmente de `Content-Type` y `Content-Disposition`. Es un problema distinto del requisito CORS del botón de descarga descrito a continuación.

:::

### La imagen se muestra, pero el botón de descarga indica un error CORS

Las imágenes suelen mostrarse con `<img>` y los PDF de otro origen con un iframe. Ambos pueden mostrar recursos sin encabezados CORS. Sin embargo, el botón de descarga lee el archivo mediante `fetch` y crea un Blob. Esta solicitud está sujeta a la política de mismo origen del navegador.

El siguiente error indica que OSS no devolvió `Access-Control-Allow-Origin` para el sitio NocoBase actual:

```text
Access to fetch at 'https://oss.example.com/path/to/file.jpg' from origin
'https://example.com' has been blocked by CORS policy:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Siga la guía oficial [Configurar CORS](https://help.aliyun.com/zh/oss/user-guide/configure-cross-origin-resource-sharing) y cree una regla para el bucket. Para descargar desde el componente de vista previa, utilice valores como estos:

| Ajuste | Valor recomendado |
| --- | --- |
| Allowed Origins | El origin completo de NocoBase, como `https://example.com` |
| Allowed Methods | `GET`, `HEAD` |
| Allowed Headers | `*` |
| Expose Headers | `ETag`, `Content-Disposition` |
| MaxAgeSeconds | `600` |

Si S3 Pro también carga archivos directamente desde el navegador, añada métodos como `PUT` y `POST` según las solicitudes reales del panel «Red», o cree una regla de carga independiente.

Después de guardar la regla, solicite el archivo de nuevo con el origin del sitio NocoBase. La respuesta debe incluir al menos:

```http
Access-Control-Allow-Origin: https://example.com
Access-Control-Allow-Methods: GET, HEAD
```

Es posible que el navegador ya haya guardado en caché la respuesta utilizada para mostrar la imagen. Esa solicitud no incluía el encabezado `Origin`, y la respuesta almacenada puede no contener `Access-Control-Allow-Origin`. Si la descarga sigue fallando después de configurar CORS, borre la caché del archivo o active «Deshabilitar caché» en las herramientas de desarrollo y vuelva a intentarlo.

### Verificar los encabezados de respuesta

Utilice `curl` para simular una solicitud entre orígenes desde el sitio NocoBase. Sustituya el origin, la URL y los parámetros de firma de ejemplo por los valores reales:

```bash
curl -sS -D - -o /dev/null \
  -H 'Origin: https://example.com' \
  'https://oss.example.com/path/to/file.pdf?<signed-query>'
```

Compruebe lo siguiente:

- La vista previa devuelve `Content-Type: application/pdf` sin `Content-Disposition: attachment`
- La descarga entre orígenes devuelve un `Access-Control-Allow-Origin` que coincide con el sitio NocoBase
- La URL real usa el dominio personalizado en lugar del dominio predeterminado `*.oss-cn-*.aliyuncs.com`

Es normal que una solicitud sin `Origin` no reciba encabezados CORS. Mantenga el encabezado `Origin` del ejemplo al verificar la configuración.

## Enlaces relacionados

- [Vista previa de archivos](../file-preview/index.md)
- [S3 Pro](./s3-pro.md)
- [Migrar a S3 Pro](./migrate-to-s3-pro.md)
- [Motores de almacenamiento](./index.md)
