:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

## Funcionalidades Avanzadas

### Paginación

#### 1. Actualización de números de página

##### Sintaxis
Simplemente insértelo en su software de Office.

##### Ejemplo
En Microsoft Word:
- Utilice la función "Insertar → Número de página".  
En LibreOffice:
- Utilice la función "Insertar → Campo → Número de página".

##### Resultado
En el informe generado, los números de página se actualizarán automáticamente en cada página.

#### 2. Generación de tabla de contenido

##### Sintaxis
Simplemente insértelo en su software de Office.

##### Ejemplo
En Microsoft Word:
- Utilice la función "Insertar → Índice y tabla → Tabla de contenido".  
En LibreOffice:
- Utilice la función "Insertar → Tabla de contenido e índice → Tabla, índice o bibliografía".

##### Resultado
La tabla de contenido del informe se actualizará automáticamente según el contenido del documento.

#### 3. Repetición de encabezados de tabla

##### Sintaxis
Simplemente insértelo en su software de Office.

##### Ejemplo
En Microsoft Word:
- Haga clic derecho en el encabezado de la tabla → Propiedades de la tabla → Marque "Repetir como fila de encabezado en la parte superior de cada página".  
En LibreOffice:
- Haga clic derecho en el encabezado de la tabla → Propiedades de la tabla → Pestaña Flujo de texto → Marque "Repetir encabezado".

##### Resultado
Cuando una tabla abarca varias páginas, el encabezado se repetirá automáticamente en la parte superior de cada página.

### Internacionalización (i18n)

#### 1. Traducción de texto estático

##### Sintaxis
Utilice la etiqueta `{t(texto)}` para internacionalizar texto estático:
```
{t(meeting)}
```

##### Ejemplo
En la plantilla:
```
{t(meeting)} {t(apples)}
```
Los datos JSON o un diccionario de localización externo (por ejemplo, para "fr-fr") proporcionan las traducciones correspondientes, como "meeting" → "rendez-vous" y "apples" → "Pommes".

##### Resultado
Al generar el informe, el texto se reemplazará con la traducción correspondiente según el idioma de destino.

#### 2. Traducción de texto dinámico

##### Sintaxis
Para el contenido de datos, puede usar el formateador `:t`, por ejemplo:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```

##### Ejemplo
En la plantilla:
```
{d.id:ifEQ(2):show({t(monday)}):elseShow({t(tuesday)})}
```
Los datos JSON y el diccionario de localización proporcionan las traducciones adecuadas.

##### Resultado
Según la condición, la salida será "lundi" o "mardi" (tomando el idioma de destino como ejemplo).

### Mapeo de clave-valor

#### 1. Conversión de enumeración (:convEnum)

##### Sintaxis
```
{datos:convEnum(nombreEnumeracion)}
```
Por ejemplo:
```
0:convEnum('ORDER_STATUS')
```

##### Ejemplo
En un ejemplo de opciones de API, se proporciona lo siguiente:
```json
{
  "enum": {
    "ORDER_STATUS": ["pending", "sent", "delivered"]
  }
}
```
En la plantilla:
```
0:convEnum('ORDER_STATUS')
```

##### Resultado
Devuelve "pending"; si el índice excede el rango de la enumeración, devuelve el valor original.

### Imágenes dinámicas
:::info
Actualmente, se admiten los tipos de archivo XLSX y DOCX.
:::
Usted puede insertar "imágenes dinámicas" en las plantillas de documentos. Esto significa que las imágenes de marcador de posición en la plantilla se reemplazarán automáticamente con imágenes reales durante la renderización, basándose en los datos. Este proceso es muy sencillo y solo requiere:

1. Insertar una imagen temporal como marcador de posición.
2. Editar el "Texto alternativo" de esa imagen para establecer la etiqueta del campo.
3. Renderizar el documento, y el sistema la reemplazará automáticamente con la imagen real.

A continuación, explicaremos los métodos de operación para DOCX y XLSX a través de ejemplos específicos.

#### Inserción de imágenes dinámicas en archivos DOCX

##### Reemplazo de una sola imagen

1. Abra su plantilla DOCX e inserte una imagen temporal (puede ser cualquier imagen de marcador de posición, como una [imagen azul sólido](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png)).

:::info
**Instrucciones sobre el formato de imagen**

- Actualmente, las imágenes de marcador de posición solo admiten el formato PNG. Le recomendamos utilizar nuestra [imagen azul sólido](https://static-docs.nocobase.com/solid-color-image-2025-04-14-11-00-26.png) de ejemplo.
- Las imágenes de destino renderizadas solo admiten los formatos PNG, JPG y JPEG. Otros tipos de imagen pueden fallar al renderizarse.

**Instrucciones sobre el tamaño de imagen**

Ya sea para DOCX o XLSX, el tamaño final de la imagen renderizada seguirá las dimensiones de la imagen temporal en la plantilla. Es decir, la imagen de reemplazo real se escalará automáticamente para coincidir con el tamaño de la imagen de marcador de posición que usted insertó. Si desea que la imagen renderizada tenga un tamaño de 150×150, utilice una imagen temporal en la plantilla y ajústela a ese tamaño.
:::

2. Haga clic derecho en esta imagen, edite su "Texto alternativo" y complete la etiqueta del campo de imagen que desea insertar, por ejemplo, `{d.imageUrl}`:
   
![20250414211130-2025-04-14-21-11-31](https://static-docs.nocobase.com/20250414211130-2025-04-14-21-11-31.png)

3. Utilice los siguientes datos de ejemplo para la renderización:
```json
{
  "name": "Apple",
  "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
}
```

4. En el resultado renderizado, la imagen temporal será reemplazada por la imagen real:

![20250414203444-2025-04-14-20-34-46](https://static-docs.nocobase.com/20250414203444-2025-04-14-20-34-46.png)

##### Reemplazo de múltiples imágenes en bucle

Si desea insertar un grupo de imágenes en la plantilla, como una lista de productos, también puede lograrlo mediante bucles. Los pasos específicos son los siguientes:
1. Suponga que sus datos son los siguientes:
```json
{
  "products": [
    {
      "name": "Apple",
      "imageUrl": "https://images.pexels.com/photos/206959/pexels-photo-206959.jpeg"
    },
    {
      "name": "Banana",
      "imageUrl": "https://images.pexels.com/photos/61127/pexels-photo-61127.jpeg"
    }
  ]
}
```

2. Configure un área de bucle en la plantilla DOCX e inserte imágenes temporales en cada elemento del bucle con el Texto alternativo establecido en `{d.products[i].imageUrl}`, como se muestra a continuación:

![20250414205418-2025-04-14-20-54-19](https://static-docs.nocobase.com/20250414205418-2025-04-14-20-54-19.png)

3. Después de la renderización, todas las imágenes temporales serán reemplazadas por sus respectivas imágenes de datos:
   
![20250414205503-2025-04-14-20-55-05](https://static-docs.nocobase.com/20250414205503-2025-04-14-20-55-05.png)

#### Inserción de imágenes dinámicas en archivos XLSX

El método de operación en las plantillas de Excel (XLSX) es básicamente el mismo, solo tenga en cuenta los siguientes puntos:

1. Después de insertar una imagen, asegúrese de seleccionar "imagen dentro de la celda" en lugar de que la imagen flote sobre la celda.

![20250414211643-2025-04-14-21-16-45](https://static-docs.nocobase.com/20250414211643-2025-04-14-21-16-45.png)

2. Después de seleccionar la celda, haga clic para ver el "Texto alternativo" y complete la etiqueta del campo, como `{d.imageUrl}`.

### Códigos de barras
:::info
Actualmente, se admiten los tipos de archivo XLSX y DOCX.
:::

#### Generación de códigos de barras (como códigos QR)

La generación de códigos de barras funciona de la misma manera que las imágenes dinámicas, requiriendo solo tres pasos:

1. Inserte una imagen temporal en la plantilla para marcar la posición del código de barras.
2. Edite el "Texto alternativo" de la imagen e introduzca la etiqueta del campo con el formato del código de barras, por ejemplo, `{d.code:barcode(qrcode)}`, donde `qrcode` es el tipo de código de barras (consulte la lista de tipos admitidos a continuación).

![20250414214626-2025-04-14-21-46-28](https://static-docs.nocobase.com/20250414214626-2025-04-14-21-46-28.png)

3. Después de la renderización, la imagen de marcador de posición se reemplazará automáticamente con la imagen del código de barras correspondiente:
   
![20250414214925-2025-04-14-21-49-26](https://static-docs.nocobase.com/20250414214925-2025-04-14-21-49-26.png)

#### Tipos de códigos de barras admitidos

| Nombre del código de barras | Tipo   |
| ------------------------- | ------ |
| Código QR                 | qrcode |