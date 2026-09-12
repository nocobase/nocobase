---
title: "Impresión de plantillas - Formateadores de campos multimedia"
description: "Formateadores de campos multimedia de impresión de plantillas: attachment y signature se utilizan para mostrar imágenes adjuntas y de firmas manuscritas en la plantilla."
keywords: "impresión de plantillas,campos multimedia,attachment,signature,NocoBase"
---

### Formateadores de campos multimedia

#### 1. :attachment

##### Descripción de sintaxis

Muestra las imágenes del campo de adjuntos. Normalmente se puede copiar la variable directamente desde la "lista de campos".

##### Ejemplo

```text
{d.contractFiles[0].id:attachment()}
```

##### Resultado

Muestra la imagen adjunta correspondiente.

#### 2. :signature

##### Descripción de sintaxis

Muestra la imagen de firma asociada al campo de firma manuscrita. Normalmente se puede copiar la variable directamente desde la "lista de campos".

##### Ejemplo

```text
{d.customerSignature:signature()}
```

##### Resultado

Muestra la imagen de firma manuscrita correspondiente.

> **Atención:** Para los campos de adjuntos y de firma manuscrita, se recomienda copiar la variable directamente desde la lista de campos en la "configuración de plantilla", para evitar errores tipográficos al escribirla manualmente.
