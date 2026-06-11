---
title: "Entrada por Escaneo"
description: "Configuración de campo: habilita la entrada por escaneo para campos de texto en formularios y permite escribir valores mediante códigos QR o códigos de barras."
keywords: "entrada por escaneo,código QR,código de barras,configuración de campo,constructor de interfaces,NocoBase"
---

# Entrada por Escaneo

## Introducción

La entrada por escaneo se utiliza en campos de texto dentro de formularios editables. Después de activarla, aparece un botón de escaneo en el lado derecho del campo. Los usuarios pueden escanear un código QR o un código de barras, o seleccionar una imagen del álbum para reconocimiento, y escribir el resultado reconocido en el campo actual.

Normalmente es adecuada para introducir números de equipo, códigos de activos, números de pedido, números de seguimiento y otros valores que no son cómodos de escribir manualmente.

## Campos compatibles

La entrada por escaneo se utiliza principalmente en campos de texto, por ejemplo:

- Texto de una sola línea
- Teléfono móvil
- Correo electrónico
- URL
- UUID
- Nano ID

Si el campo está en modo de solo lectura, en modo lectura, o no admite entrada editable, no se mostrará la configuración de entrada por escaneo.

## Configuración

Seleccione el campo correspondiente en un bloque de formulario, abra el menú de configuración del campo y busque `Configuración de entrada por escaneo`.

Incluye:

- `Habilitar entrada por escaneo`: al activarlo, se muestra un botón de escaneo a la derecha del cuadro de entrada
- `Deshabilitar entrada manual`: al activarlo, los usuarios solo pueden escribir el valor del campo mediante escaneo y no pueden editar manualmente el cuadro de entrada

Después de desactivar `Habilitar entrada por escaneo`, `Deshabilitar entrada manual` también deja de surtir efecto.

## Uso

Después de que el usuario hace clic en el botón de escaneo a la derecha del campo, puede usar la cámara para reconocer un código QR o un código de barras. El escaneo en el navegador requiere permiso para acceder a la cámara. En entornos móviles que admiten capacidades nativas de escaneo, se usa primero la capacidad nativa del dispositivo.

Si no es conveniente usar la cámara directamente, el usuario también puede hacer clic en `Álbum` para seleccionar una imagen y reconocerla.
