---
pkg: '@nocobase/plugin-workflow-mailer'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::


# Envío de correos electrónicos

## Introducción

Este plugin se utiliza para enviar correos electrónicos y admite contenido tanto en formato de texto como HTML.

## Crear nodo

En la interfaz de configuración del **flujo de trabajo**, haga clic en el botón de más ('+') en el flujo para añadir un nodo de 'Envío de correos electrónicos'.

![20251031130522](https://static-docs.nocobase.com/20251031130522.png)

## Configuración del nodo

![20251031131125](https://static-docs.nocobase.com/20251031131125.png)

Cada opción puede utilizar variables del contexto del **flujo de trabajo**. Para información sensible, también puede utilizar variables globales y secretos.

## Preguntas frecuentes

### Límite de frecuencia de envío de Gmail

Al enviar algunos correos electrónicos, puede encontrarse con el siguiente error:

```json
{
  "code": "ECONNECTION",
  "response": "421-4.7.0 Try again later, closing connection. (EHLO)\n421-4.7.0 For more information, go to\n421 4.7.0 About SMTP error messages - Google Workspace Admin Help 3f1490d57ef6-e7f7352f44csm831688276.30 - gsmtp",
  "responseCode": 421,
  "command": "EHLO"
}
```

Esto se debe a que Gmail aplica límites de frecuencia a las solicitudes de envío de dominios no especificados. Al desplegar la aplicación, debe configurar el nombre de host del servidor para que coincida con el dominio de envío que ha vinculado en Gmail. Por ejemplo, en un despliegue de Docker:

```yaml
services:
  app:
    image: nocobase/nocobase
    hostname: <your-custom-hostname> # Establezca aquí su dominio de envío vinculado
```

Referencia: [Google SMTP Relay - Intermittent problems](https://forum.nocobase.com/t/google-smtp-relay-intermittent-problems/5483/6)