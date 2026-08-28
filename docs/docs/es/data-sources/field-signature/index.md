---
pkg: "@nocobase/plugin-field-signature"
---

# Campo de tabla de datos: firma manuscrita

## Introducción

El campo de firma manuscrita permite a los usuarios escribir su firma en un lienzo con el ratón o una pantalla táctil. Después de guardarla, la imagen de la firma se escribe en la **tabla de datos de archivos** seleccionada y reutiliza el proceso de carga y almacenamiento de archivos proporcionado por el **gestor de archivos**.

## Instalación

1. Confirme que el entorno actual es **Edición Profesional o superior** y que la licencia es válida.
2. Abra el **gestor de plugins**, busque **Campo de tabla de datos: firma manuscrita** (`@nocobase/plugin-field-signature`) y actívelo.
3.  Asegúrese de que el **gestor de archivos** (`@nocobase/plugin-file-manager`) esté activado. El campo de firma manuscrita depende de las capacidades de tabla de datos de archivos, carga y almacenamiento que este proporciona; si no está activado, no será posible guardar las imágenes de las firmas.

## Instrucciones de uso

### Añadir un campo

En **Fuente de datos** → seleccione una tabla de datos → **Configurar campos** → **Añadir campo** → seleccione **Firma manuscrita** en el grupo multimedia.

### Configuración del campo

- **Tabla de datos de archivos**: obligatorio; seleccione una tabla de datos de archivos para guardar los archivos (por ejemplo, `attachments`). Las imágenes de las firmas se guardarán allí.
- La configuración de almacenamiento y las reglas de carga utilizadas realmente por las imágenes de las firmas dependen de la propia tabla de datos de archivos seleccionada.

### Configuración de la interfaz

- Después de añadir el campo de firma manuscrita a un formulario, puede ajustar la **configuración de la firma** en la configuración de la interfaz del campo, incluidos el color del trazo, el color de fondo, el ancho y la altura del lienzo de firma, así como el ancho y la altura de la miniatura.
- En los escenarios de visualización de solo lectura, también puede ajustar el ancho y la altura de la miniatura de la firma para controlar el tamaño de visualización de la imagen.
### Operaciones de la interfaz

- Haga clic en el área del campo para abrir el lienzo de firma. Cuando termine de escribir, confirme para cargar la firma y asociarla con el registro de archivo correspondiente.
- En dispositivos con pantallas pequeñas, puede utilizar una interfaz de firma en orientación horizontal o a pantalla completa para facilitar la escritura.
![20260709232226](https://static-docs.nocobase.com/20260709232226.png)
