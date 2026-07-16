---
pkg: "@nocobase/plugin-field-signature"
---

# Campo de Collection: firma manuscrita

## Introducción

El campo de firma manuscrita permite al usuario escribir una firma en un lienzo con el ratón o pantalla táctil. Tras guardar, la imagen de la firma se escribe en la **Collection de archivos** seleccionada y se reutiliza el flujo de carga y almacenamiento de archivos proporcionado por el **Gestor de archivos**.

## Instalación

1. Confirme que el entorno actual sea **versión Profesional o superior**, con licencia válida.
2. Abra el **Gestor de Plugins**, busque **Campo de Collection: firma manuscrita** (`@nocobase/plugin-field-signature`) y actívelo.
3. Asegúrese de que el **Gestor de archivos** (`@nocobase/plugin-file-manager`) esté activado. El campo de firma manuscrita depende de él para proporcionar la Collection de archivos, la carga y el almacenamiento; si no está activado, no se podrán guardar las imágenes de firma.

## Instrucciones de uso

### Añadir campo

En **Fuentes de datos** → seleccionar la Collection → **Configurar campos** → **Añadir campo** → en el grupo de multimedia, seleccionar **Firma manuscrita**.

### Configuración del campo

- **Collection de archivos**: obligatorio; seleccione una Collection de archivos para almacenar archivos (por ejemplo, `attachments`); las imágenes de firma se guardarán aquí.
- La configuración real de almacenamiento y las reglas de carga utilizadas por la imagen de firma se determinan por la propia Collection de archivos seleccionada.

### Configuración de la interfaz

- Tras añadir el campo de firma manuscrita al formulario, en la configuración de interfaz del campo se pueden ajustar los **Ajustes de firma**, incluyendo color del trazo, color de fondo, ancho del lienzo de firma, alto del lienzo de firma, así como el ancho y alto de la miniatura.
- En escenarios de visualización de solo lectura, también se pueden ajustar el ancho y alto de la miniatura de la firma para controlar el tamaño de visualización de la imagen.

### Operaciones en la interfaz

- Al hacer clic en el área del campo se abre el lienzo de firma; tras finalizar la escritura, al confirmar se carga y se vincula al registro de archivo correspondiente.
- En dispositivos de pantalla pequeña se puede usar una interfaz de firma horizontal o de pantalla completa para facilitar la escritura.
