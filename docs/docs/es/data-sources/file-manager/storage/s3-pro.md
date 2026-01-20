---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



pkg: "@nocobase/plugin-file-storage-s3-pro"
---

# Almacenamiento de Archivos: S3 (Pro)

## Introducción

Basándose en el plugin de gestión de archivos, esta versión añade soporte para tipos de almacenamiento de archivos compatibles con el protocolo S3. Cualquier servicio de almacenamiento de objetos que soporte el protocolo S3 puede integrarse fácilmente, como Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, etc., mejorando aún más la compatibilidad y flexibilidad de los servicios de almacenamiento.

## Características

1.  **Carga desde el Cliente:** Los archivos se cargan directamente al servicio de almacenamiento sin pasar por el servidor de NocoBase, lo que permite una experiencia de carga más eficiente y rápida.

2.  **Acceso Privado:** Todas las URL de los archivos son direcciones de autorización temporal firmadas, lo que garantiza un acceso seguro y con límite de tiempo a los archivos.

## Casos de Uso

1.  **Gestión de colecciones de archivos:** Gestione y almacene de forma centralizada todos los archivos cargados, admitiendo varios tipos de archivos y métodos de almacenamiento para facilitar su clasificación y recuperación.

2.  **Almacenamiento de campos de adjuntos:** Utilizado para almacenar adjuntos cargados a través de formularios o registros, con soporte para la asociación con entradas de datos específicas.

## Configuración del plugin

1.  Habilite el plugin `plugin-file-storage-s3-pro`.

2.  Vaya a "Setting -> FileManager" para acceder a la configuración de gestión de archivos.

3.  Haga clic en el botón "Add new" y seleccione "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4.  En la ventana emergente, verá un formulario detallado para completar. Consulte la siguiente documentación para obtener los parámetros relevantes de su servicio de archivos e introdúzcalos correctamente en el formulario.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configuración del Proveedor de Servicios

### Amazon S3

#### Creación de Bucket

1.  Visite la [Consola de Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2.  Haga clic en el botón "Create bucket" en el lado derecho.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3.  Rellene el `Bucket Name` (Nombre del bucket), deje los demás campos por defecto, desplácese hasta la parte inferior y haga clic en el botón **"Create"** para completar el proceso.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuración de CORS

1.  En la lista de buckets, encuentre y haga clic en el bucket recién creado para acceder a sus detalles.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2.  Vaya a la pestaña "Permission" y desplácese hacia abajo hasta la sección de configuración de CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3.  Introduzca la siguiente configuración (personalícela según sea necesario) y guárdela.

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

#### Recuperación de AccessKey y SecretAccessKey

1.  Haga clic en el botón "Security credentials" en la esquina superior derecha.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2.  Desplácese hasta la sección "Access Keys" y haga clic en "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3.  Acepte los términos (se recomienda el uso de IAM para entornos de producción).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4.  Guarde el Access Key y el Secret Access Key mostrados.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Recuperación y Configuración de Parámetros

1.  Utilice el `AccessKey ID` y el `AccessKey Secret` recuperados.

2.  Visite el panel de propiedades del bucket para encontrar el `Bucket Name` y la `Region`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Acceso Público (Opcional)

Esta es una configuración opcional. Configúrela cuando necesite que los archivos cargados sean completamente públicos.

1.  En el panel de Permisos, desplácese hasta "Object Ownership", haga clic en "Editar" y habilite las ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2.  Desplácese hasta "Block public access", haga clic en "Editar" y configúrelo para permitir el control de ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3.  Marque "Public access" en NocoBase.

#### Configuración de Miniaturas (Opcional)

Esta configuración es opcional y debe utilizarse cuando necesite optimizar el tamaño o el efecto de la vista previa de la imagen. **Tenga en cuenta que esta implementación puede generar costos adicionales. Para más detalles, consulte los términos y precios de AWS.**

1.  Visite [Transformación Dinámica de Imágenes para Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2.  Haga clic en el botón `Launch in the AWS Console` en la parte inferior de la página para iniciar la implementación.

![](https://static-docs.nocobase.com/20250221164214117.png)

3.  Siga las indicaciones para completar la configuración. Las siguientes opciones requieren especial atención:
    1.  Al crear la pila, debe especificar el nombre del bucket de Amazon S3 que contiene las imágenes de origen. Por favor, introduzca el nombre del bucket que creó anteriormente.
    2.  Si eligió implementar la interfaz de usuario de demostración, después de la implementación, podrá usarla para probar la funcionalidad de procesamiento de imágenes. En la consola de AWS CloudFormation, seleccione su pila, vaya a la pestaña "Outputs", busque el valor correspondiente a la clave `DemoUrl` y haga clic en el enlace para abrir la interfaz de demostración.
    3.  Esta solución utiliza la biblioteca `sharp` de Node.js para un procesamiento eficiente de imágenes. Puede descargar el código fuente del repositorio de GitHub y personalizarlo según sea necesario.

![](https://static-docs.nocobase.com/20250221164315472.png)

![](https://static-docs.nocobase.com/20250221164404755.png)

4.  Una vez completada la configuración, espere a que el estado de la implementación cambie a `CREATE_COMPLETE`.

5.  En la configuración de NocoBase, tenga en cuenta lo siguiente:
    1.  `Thumbnail rule`: Rellene los parámetros de procesamiento de imágenes, como `?width=100`. Para más detalles, consulte la [documentación de AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
    2.  `Access endpoint`: Introduzca el valor de Outputs -> ApiEndpoint después de la implementación.
    3.  `Full access URL style`: Seleccione **Ignore** (ya que el nombre del bucket ya se ha rellenado en la configuración, no es necesario para el acceso).

![](https://static-docs.nocobase.com/20250414152135514.png)

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Creación de Bucket

1.  Abra la [Consola de OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2.  Seleccione "Buckets" en el menú de la izquierda y haga clic en "Create Bucket".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3.  Rellene los detalles del bucket y haga clic en "Create".
    -   `Bucket Name`: Elija según sus necesidades comerciales.
    -   `Region`: Seleccione la región más cercana para sus usuarios.
    -   Otras configuraciones pueden permanecer por defecto o personalizarse según sea necesario.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Configuración de CORS

1.  Vaya a la página de detalles del bucket que acaba de crear.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2.  Haga clic en "Content Security -> CORS" en el menú central.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3.  Haga clic en el botón "Create Rule", complete los campos, desplácese hacia abajo y haga clic en "OK". Puede consultar la captura de pantalla a continuación o configurar ajustes más detallados.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Recuperación de AccessKey y SecretAccessKey

1.  Haga clic en "AccessKey" debajo del avatar de su cuenta en la esquina superior derecha.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2.  Para fines de demostración, crearemos un AccessKey utilizando la cuenta principal. En un entorno de producción, se recomienda utilizar RAM para crear el AccessKey. Para obtener instrucciones, consulte la [documentación de Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).

3.  Haga clic en el botón "Create AccessKey".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4.  Complete la verificación de la cuenta.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5.  Guarde el Access Key y el Secret Access Key mostrados.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Recuperación y Configuración de Parámetros

1.  Utilice el `AccessKey ID` y el `AccessKey Secret` obtenidos en el paso anterior.

2.  Vaya a la página de detalles del bucket para obtener el nombre del `Bucket`.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3.  Desplácese hacia abajo para obtener la `Region` (la parte ".aliyuncs.com" final no es necesaria).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4.  Obtenga la dirección del endpoint y añada el prefijo `https://` al introducirla en NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuración de Miniaturas (Opcional)

Esta configuración es opcional y solo debe utilizarse cuando se necesite optimizar el tamaño o el efecto de la vista previa de la imagen.

1.  Rellene los parámetros relevantes para `Thumbnail rule`. Para la configuración específica de los parámetros, consulte la [documentación de Alibaba Cloud sobre Procesamiento de Imágenes](https://www.alibabacloud.com/help/en/oss/user-guide/image-processing).

2.  Mantenga la misma configuración para `Full upload URL style` y `Full access URL style`.

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Creación de Bucket

1.  Haga clic en el menú **Buckets** de la izquierda -> Haga clic en **Create Bucket** para abrir la página de creación.
2.  Introduzca el nombre del Bucket y luego haga clic en el botón **Guardar**.

#### Recuperación de AccessKey y SecretAccessKey

1.  Vaya a **Access Keys** -> Haga clic en el botón **Create access key** para abrir la página de creación.

![](https://static-docs.nocobase.com/20250106111922957.png)

2.  Haga clic en el botón **Guardar**.

![](https://static-docs.nocobase.com/20250106111850639.png)

3.  Guarde el **Access Key** y el **Secret Key** de la ventana emergente para futuras configuraciones.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuración de Parámetros

1.  Vaya a la página **File manager** en NocoBase.

2.  Haga clic en el botón **Add new** y seleccione **S3 Pro**.

3.  Rellene el formulario:
    -   **AccessKey ID** y **AccessKey Secret**: Utilice los valores guardados del paso anterior.
    -   **Region**: MinIO implementado de forma privada no tiene el concepto de región; puede configurarlo como `"auto"`.
    -   **Endpoint**: Introduzca el nombre de dominio o la dirección IP de su servicio implementado.
    -   Establezca `Full access URL style` en **Path-Style**.

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Consulte las configuraciones de los servicios de archivos anteriores. La lógica es similar.

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Consulte las configuraciones de los servicios de archivos anteriores. La lógica es similar.

#### Ejemplo de Configuración

![](https://static-docs.nocobase.com/20250414154500264.png)

## Guía del Usuario

Consulte la [documentación del plugin file-manager](/data-sources/file-manager).