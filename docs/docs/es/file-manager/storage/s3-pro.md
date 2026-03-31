---
pkg: '@nocobase/plugin-file-storage-s3-pro'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Motor de Almacenamiento: S3 (Pro)

## Introducción

Basándose en el **plugin** de gestión de archivos, se añade soporte para tipos de almacenamiento de archivos compatibles con el protocolo S3. Cualquier servicio de almacenamiento de objetos que soporte el protocolo S3 puede integrarse fácilmente, como Amazon S3, Aliyun OSS, Tencent COS, MinIO, Cloudflare R2, entre otros, mejorando aún más la compatibilidad y flexibilidad de los servicios de almacenamiento.

## Características

1.  **Carga desde el cliente**: El proceso de carga de archivos no necesita pasar por el servidor de NocoBase, sino que se conecta directamente al servicio de almacenamiento de archivos, lo que permite una experiencia de carga más eficiente y rápida.
2.  **Acceso privado**: Al acceder a los archivos, todas las URL son direcciones temporales autorizadas y firmadas, lo que garantiza la seguridad y la vigencia del acceso a los archivos.

## Casos de Uso

1.  **Gestión de colecciones de archivos**: Gestione y almacene de forma centralizada todos los archivos cargados, con soporte para diversos tipos y métodos de almacenamiento, facilitando la clasificación y recuperación de archivos.
2.  **Almacenamiento de campos de adjuntos**: Se utiliza para el almacenamiento de datos de adjuntos cargados en formularios o registros, permitiendo la asociación con registros de datos específicos.

## Configuración del Plugin

1.  Habilite el **plugin** `plugin-file-storage-s3-pro`.
2.  Haga clic en "Setting -> FileManager" para acceder a la configuración del gestor de archivos.
3.  Haga clic en el botón "Add new" y seleccione "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  Una vez que aparezca la ventana emergente, verá un formulario con muchos campos que deberá completar. Puede consultar la documentación posterior para obtener la información de los parámetros relevantes para el servicio de archivos correspondiente y rellenarlos correctamente en el formulario.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configuración del Proveedor de Servicios

### Amazon S3

#### Creación de un Bucket

1.  Abra https://ap-southeast-1.console.aws.amazon.com/s3/home para acceder a la consola de S3.
2.  Haga clic en el botón "Create bucket" (Crear bucket) a la derecha.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2.  Rellene el "Bucket Name" (Nombre del bucket). Los demás campos pueden dejarse con la configuración predeterminada. Desplácese hasta la parte inferior de la página y haga clic en el botón **"**Create**"** (Crear) para finalizar la creación.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuración de CORS

1.  Vaya a la lista de buckets, busque y haga clic en el bucket que acaba de crear para acceder a su página de detalles.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  Haga clic en la pestaña "Permission" (Permisos) y, a continuación, desplácese hacia abajo hasta encontrar la sección de configuración de CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  Introduzca la siguiente configuración (puede personalizarla aún más) y guárdela.

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

#### Obtención de AccessKey y SecretAccessKey

1.  Haga clic en el botón "Security credentials" (Credenciales de seguridad) en la esquina superior derecha de la página.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  Desplácese hacia abajo hasta la sección "Access Keys" (Claves de acceso) y haga clic en el botón "Create Access Key" (Crear clave de acceso).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  Haga clic en "Agree" (Aceptar) (esto es una demostración con la cuenta raíz; se recomienda usar IAM en un entorno de producción).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  Guarde el "Access key" y el "Secret access key" que se muestran en la página.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Obtención y Configuración de Parámetros

1.  El "AccessKey ID" y el "AccessKey Secret" son los valores que obtuvo en el paso anterior. Por favor, rellénelos con precisión.
2.  Vaya al panel de propiedades de la página de detalles del bucket, donde podrá obtener el nombre del bucket y la información de la "Region" (región).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Acceso Público (Opcional)

Esta es una configuración opcional. Configúrela cuando necesite que los archivos cargados sean completamente públicos.

1.  Vaya al panel de "Permissions" (Permisos), desplácese hasta "Object Ownership" (Propiedad de objetos), haga clic en "Edit" (Editar) y habilite las ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  Desplácese hasta "Block public access" (Bloquear acceso público), haga clic en "Edit" (Editar) y configúrelo para permitir el control de ACLs.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  Marque "Public access" (Acceso público) en NocoBase.

#### Configuración de Miniaturas (Opcional)

Esta configuración es opcional y se utiliza para optimizar el tamaño o los efectos de la vista previa de las imágenes. **Tenga en cuenta que esta solución de despliegue puede generar costos adicionales. Para conocer las tarifas específicas, consulte los términos relevantes de AWS.**

1.  Visite [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2.  Haga clic en el botón `Launch in the AWS Console` (Lanzar en la Consola de AWS) en la parte inferior de la página para iniciar el despliegue de la solución.
    ![](https://static-docs.nocobase.com/20250221164214117.png)

3.  Siga las instrucciones para completar la configuración. Preste especial atención a las siguientes opciones:
    1.  Al crear la pila, deberá especificar el nombre de un bucket de Amazon S3 que contenga las imágenes de origen. Por favor, introduzca el nombre del bucket que creó anteriormente.
    2.  Si elige desplegar la interfaz de usuario de demostración, podrá probar las funciones de procesamiento de imágenes a través de esta interfaz una vez finalizado el despliegue. En la consola de AWS CloudFormation, seleccione su pila, vaya a la pestaña "Outputs" (Salidas), busque el valor correspondiente a la clave "DemoUrl" y haga clic en el enlace para abrir la interfaz de demostración.
    3.  Esta solución utiliza la biblioteca `sharp` de Node.js para procesar imágenes de manera eficiente. Puede descargar el código fuente del repositorio de GitHub y personalizarlo según sus necesidades.

    ![](https://static-docs.nocobase.com/20250221164315472.png)
    ![](https://static-docs.nocobase.com/20250221164404755.png)

4.  Una vez completada la configuración, espere a que el estado del despliegue cambie a `CREATE_COMPLETE`.

5.  En la configuración de NocoBase, hay varios puntos a tener en cuenta:
    1.  `Thumbnail rule` (Regla de miniatura): Rellene los parámetros relacionados con el procesamiento de imágenes, por ejemplo, `?width=100`. Para más detalles, consulte la [documentación de AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
    2.  `Access endpoint` (Punto de acceso): Rellene el valor de Outputs -> ApiEndpoint después del despliegue.
    3.  `Full access URL style` (Estilo de URL de acceso completo): Debe marcar **Ignore** (Ignorar) (ya que el nombre del bucket ya se rellenó durante la configuración, no es necesario para el acceso).

    ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414152344959.png)

### Aliyun OSS

#### Creación de un Bucket

1.  Abra la consola de OSS https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  Haga clic en "Buckets" en el menú de la izquierda y luego en el botón "Create Bucket" (Crear bucket) para comenzar a crear un bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  Rellene la información relacionada con el bucket y finalmente haga clic en el botón "Create" (Crear).
    1.  El "Bucket Name" (Nombre del bucket) debe adaptarse a sus necesidades comerciales; el nombre puede ser arbitrario.
    2.  Elija la "Region" (Región) más cercana a sus usuarios.
    3.  Otras configuraciones pueden dejarse por defecto o configurarse según sus requisitos.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Configuración de CORS

1.  Vaya a la página de detalles del bucket creado en el paso anterior.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  Haga clic en "Content Security -> CORS" (Seguridad del contenido -> CORS) en el menú central.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  Haga clic en el botón "Create Rule" (Crear regla), rellene el contenido relevante, desplácese hacia abajo y haga clic en "OK". Puede consultar la captura de pantalla a continuación o configurar ajustes más detallados.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Obtención de AccessKey y SecretAccessKey

1.  Haga clic en "AccessKey" debajo de su foto de perfil en la esquina superior derecha.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  Para fines de demostración, estamos creando un "AccessKey" utilizando la cuenta principal. En un entorno de producción, se recomienda utilizar RAM para crearlo. Puede consultar https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp.

3.  Haga clic en el botón "Create AccessKey" (Crear clave de acceso).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  Realice la verificación de la cuenta.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  Guarde el "Access key" y el "Secret access key" que se muestran en la página.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Obtención y Configuración de Parámetros

1.  El "AccessKey ID" y el "AccessKey Secret" son los valores obtenidos en el paso anterior.
2.  Vaya a la página de detalles del bucket para obtener el nombre del Bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  Desplácese hacia abajo para obtener la "Region" (Región) (el sufijo ".aliyuncs.com" no es necesario).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  Obtenga la dirección del "endpoint" y añada el prefijo `https://` al introducirla en NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuración de Miniaturas (Opcional)

Esta configuración es opcional y solo debe utilizarse cuando necesite optimizar el tamaño o los efectos de la vista previa de las imágenes.

1.  Rellene los parámetros relacionados con `Thumbnail rule` (Regla de miniatura). Para la configuración específica de los parámetros, consulte [Parámetros de procesamiento de imágenes](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1).

2.  `Full upload URL style` (Estilo de URL de carga completa) y `Full access URL style` (Estilo de URL de acceso completo) pueden mantenerse iguales.

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Creación de un Bucket

1.  Haga clic en el menú "Buckets" a la izquierda -> haga clic en "Create Bucket" (Crear bucket) para acceder a la página de creación.
2.  Después de rellenar el nombre del Bucket, haga clic en el botón "Save" (Guardar).

#### Obtención de AccessKey y SecretAccessKey

1.  Vaya a "Access Keys" (Claves de acceso) -> haga clic en el botón "Create access key" (Crear clave de acceso) para acceder a la página de creación.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  Haga clic en el botón "Save" (Guardar).

![](https://static-docs.nocobase.com/20250106111850639.png)

1.  Guarde el "Access Key" y el "Secret Key" de la ventana emergente para su posterior configuración.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuración de Parámetros

1.  Vaya a la página de NocoBase -> "File manager" (Gestor de archivos).

2.  Haga clic en el botón "Add new" (Añadir nuevo) y seleccione "S3 Pro".

3.  Rellene el formulario:
    -   El **AccessKey ID** y el **AccessKey Secret** son los textos guardados en el paso anterior.
    -   **Region**: Un MinIO autoalojado no tiene el concepto de región, por lo que puede configurarse como "auto".
    -   **Endpoint**: Rellene el nombre de dominio o la dirección IP de su despliegue.
    -   El "Full access URL style" (Estilo de URL de acceso completo) debe configurarse como "Path-Style".

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Puede consultar la configuración de los servicios de archivos mencionados anteriormente, ya que la lógica es similar.

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Puede consultar la configuración de los servicios de archivos mencionados anteriormente, ya que la lógica es similar.

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414154500264.png)