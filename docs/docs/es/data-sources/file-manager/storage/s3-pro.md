---
title: "Almacenamiento de archivos: S3 (Pro)"
description: "Motor de almacenamiento S3 Pro, almacenamiento empresarial compatible con el protocolo S3, con compatibilidad con endpoints personalizados y configuración avanzada."
keywords: "S3 Pro, almacenamiento de objetos, almacenamiento en la nube, compatible con S3, NocoBase"
---

# Almacenamiento de archivos: S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Introducción

Sobre la base del complemento de gestión de archivos, se añade compatibilidad con tipos de almacenamiento de archivos compatibles con el protocolo S3. Cualquier servicio de almacenamiento de objetos compatible con el protocolo S3 puede integrarse fácilmente, como Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO y Cloudflare R2, lo que mejora aún más la compatibilidad y flexibilidad del servicio de almacenamiento.

## Características

1. Carga desde el cliente: el proceso de carga de archivos no necesita pasar por el servidor de NocoBase, sino que se conecta directamente al servicio de almacenamiento de archivos para ofrecer una experiencia de carga más eficiente y rápida.

2. Acceso privado: al acceder a los archivos, todas las URL son direcciones temporales autorizadas mediante firma, lo que garantiza la seguridad y vigencia del acceso a los archivos.


## Casos de uso

1. **Gestión mediante tabla de archivos**: gestiona y almacena de forma centralizada todos los archivos cargados. Admite varios tipos de archivos y métodos de almacenamiento, lo que facilita su clasificación y búsqueda.

2. **Almacenamiento en campos de adjuntos**: almacena los datos de los archivos adjuntos cargados en formularios o registros, con compatibilidad para asociarlos a registros de datos específicos.


## Configuración del complemento

1. Habilita el complemento plugin-file-storage-s3-pro

2. Haz clic en "Setting-> FileManager" para acceder a la configuración de gestión de archivos

3. Haz clic en el botón "Add new" y selecciona "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Después de que aparezca la ventana emergente, verás que hay muchos campos que completar. Puedes consultar la documentación siguiente para obtener la información de los parámetros correspondientes de cada servicio de archivos y rellenarlos correctamente en el formulario.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Configuración de proveedores de servicios

### Amazon S3

#### Creación de un bucket

1. Abre https://ap-southeast-1.console.aws.amazon.com/s3/home para acceder a la consola de S3

2. Haz clic en el botón "Create bucket" situado a la derecha

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Completa Bucket Name (nombre del bucket). Los demás campos pueden mantener la configuración predeterminada. Desplázate hasta la parte inferior de la página y haz clic en el botón **"**Create**"** para finalizar la creación.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuración de CORS

1. Accede a la lista de buckets, busca el bucket que acabas de crear y haz clic en él para acceder a su página de detalles

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Haz clic en la pestaña "Permission" y desplázate hacia abajo hasta encontrar la sección de configuración de CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Introduce la siguiente configuración (puedes personalizarla con mayor detalle) y guárdala

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Cómo obtener AccessKey y SecretAccessKey

1. Haz clic en el botón "Security credentials" situado en la esquina superior derecha de la página

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Desplázate hacia abajo, busca la sección "Access Keys" y haz clic en el botón "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Haz clic en Aceptar (esta demostración utiliza la cuenta principal; en entornos de producción se recomienda utilizar IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Guarda el Access key y el Secret access key que aparecen en la página

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Obtención y configuración de parámetros

1. AccessKey ID y AccessKey Secret son los valores correspondientes obtenidos en el paso anterior. Introdúcelos correctamente

2. Accede al panel de propiedades de la página de detalles del bucket, donde podrás obtener el nombre del bucket y la información de Region (región).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Acceso público (opcional)

Esta configuración no es obligatoria. Configúrala cuando necesites que los archivos cargados sean completamente públicos

1. Accede al panel Permissions, desplázate hacia abajo hasta Object Ownership, haz clic en Edit y habilita ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Desplázate hasta Block public access, haz clic en Edit y configúralo para permitir el control mediante ACLs

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Marca Public access en NocoBase


#### Configuración de miniaturas (opcional)

Esta configuración es opcional y se utiliza para optimizar el tamaño o la calidad de la vista previa de las imágenes. **Ten en cuenta que esta solución de implementación puede generar costes adicionales. Consulta las condiciones correspondientes de AWS para conocer los costes específicos.**

1. Accede a [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Haz clic en el botón `Launch in the AWS Console` situado en la parte inferior de la página para comenzar a implementar la solución.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Sigue las indicaciones para completar la configuración. Presta especial atención a las siguientes opciones:
   1. Al crear la pila, debes especificar el nombre de un bucket de Amazon S3 que contenga las imágenes originales. Introduce el nombre del bucket que creaste anteriormente.
   2. Si eliges implementar la interfaz de demostración, podrás probar las funciones de procesamiento de imágenes desde ella una vez finalizada la implementación. En la consola de AWS CloudFormation, selecciona la pila, accede a la pestaña “Outputs”, busca el valor correspondiente a la clave DemoUrl y haz clic en el enlace para abrir la interfaz de demostración.
   3. Esta solución utiliza la biblioteca `sharp` de Node.js para procesar imágenes de forma eficiente. Puedes descargar el código fuente desde el repositorio de GitHub y personalizarlo según tus necesidades.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Una vez completada la configuración, espera hasta que el estado de implementación cambie a `CREATE_COMPLETE`.

5. En la configuración de NocoBase, ten en cuenta lo siguiente:
   1. `Thumbnail rule`: introduce los parámetros relacionados con el procesamiento de imágenes, como `?width=100`. Consulta la [documentación de AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) para obtener más información.
   2. `Access endpoint`: introduce el valor de Outputs -> ApiEndpoint después de la implementación.
   3. `Full access URL style`: marca **Ignore** (dado que el nombre del bucket ya se ha introducido durante la configuración, no es necesario especificarlo de nuevo al acceder).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ejemplo de configuración

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Creación de un bucket

1. Abre la consola de OSS en https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Accede a "Buckets" desde el menú izquierdo y haz clic en el botón "Create Bucket" para comenzar a crear el bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Completa la información del bucket y, finalmente, haz clic en el botón Create

    1. Bucket Name debe ser adecuado para tu negocio; el nombre es libre

    2. En Region, selecciona la región más cercana a tus usuarios

    3. Los demás campos pueden dejarse con sus valores predeterminados o configurarse según tus necesidades

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Configuración de CORS

1. Accede a la página de detalles del bucket creado en el paso anterior

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Haz clic en "Content Security -> CORS" en el menú central

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Haz clic en el botón "Create Rule", completa la información correspondiente, desplázate hacia abajo y haz clic en "OK". Puedes consultar la captura siguiente o realizar una configuración más detallada

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Cómo obtener AccessKey y SecretAccessKey

1. Haz clic en "AccessKey", debajo del avatar situado en la esquina superior derecha

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Para facilitar la demostración, aquí se utiliza la cuenta principal para crear el AccessKey. En entornos de producción se recomienda utilizar RAM; consulta https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp

3. Haz clic en el botón "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Realiza la verificación de la cuenta

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Guarda el Access key y el Secret access key que aparecen en la página

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Obtención y configuración de parámetros

1. AccessKey ID y AccessKey Secret son los valores obtenidos en el paso anterior

2. Accede a la página de detalles del bucket y obtén el Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Desplázate hacia abajo para obtener Region (la parte posterior ".aliyuncs.com" no es necesaria)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Obtén la dirección del endpoint. Al introducirla en NocoBase, debes añadir el prefijo https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuración de miniaturas (opcional)

Esta configuración es opcional y solo se utiliza cuando sea necesario optimizar el tamaño o la calidad de la vista previa de las imágenes.

1. Introduce los parámetros relacionados con `Thumbnail rule`. Consulta [Parámetros de procesamiento de imágenes](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1) para conocer la configuración específica.

2. `Full upload URL style` y `Full access URL style` pueden mantenerse iguales.

#### Ejemplo de configuración

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Creación de un bucket

1. Haz clic en el menú Buckets de la izquierda -> haz clic en Create Bucket para acceder a la página de creación
2. Introduce el nombre del bucket y haz clic en el botón de guardar
#### Cómo obtener AccessKey y SecretAccessKey

1. Accede a Access Keys -> haz clic en el botón Create access key para acceder a la página de creación

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Haz clic en el botón de guardar

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Guarda el Access Key y el Secret Key que aparecen en la ventana emergente para utilizarlos posteriormente en la configuración

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuración de parámetros

1. Accede a NocoBase -> File manager

2. Haz clic en el botón Add new y selecciona S3 Pro

3. Completa el formulario
   - **AccessKey ID** y **AccessKey Secret** son los valores guardados en el paso anterior
   - **Region**: MinIO en una implementación privada no tiene el concepto de región, por lo que puedes configurarlo como "auto"
   - **Endpoint**: introduce el dominio del servicio implementado o su dirección IP
   - Establece Full access URL style en Path-Style

#### Ejemplo de configuración

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Puedes consultar la configuración de los servicios de archivos anteriores; la lógica es similar

#### Ejemplo de configuración

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Puedes consultar la configuración de los servicios de archivos anteriores; la lógica es similar

#### Ejemplo de configuración

![](https://static-docs.nocobase.com/20250414154500264.png)


## Uso por parte del usuario

Consulta el uso del complemento file-manager en https://docs.nocobase.com/data-sources/file-manager/.