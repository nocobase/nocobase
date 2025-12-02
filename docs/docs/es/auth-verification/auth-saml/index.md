---
pkg: '@nocobase/plugin-auth-saml'
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



# Autenticación: SAML 2.0

## Introducción

El plugin de Autenticación: SAML 2.0 sigue el estándar del protocolo SAML 2.0 (Security Assertion Markup Language 2.0), permitiendo a los usuarios iniciar sesión en NocoBase utilizando cuentas proporcionadas por proveedores de servicios de autenticación de identidad (IdP) de terceros.

## Activar el plugin

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

## Añadir autenticación SAML

Acceda a la página de gestión de plugins de autenticación de usuarios.

![](https://static-docs.nocobase.com/202411130004459.png)

Añadir - SAML

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

## Configuración

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- SSO URL - Proporcionada por el IdP, se utiliza para el inicio de sesión único.
- Certificado público - Proporcionado por el IdP.
- ID de entidad (Emisor de IdP) - Opcional, proporcionado por el IdP.
- http - Si su aplicación NocoBase utiliza el protocolo http, marque esta opción.
- Usar este campo para vincular al usuario - Este campo se utiliza para vincular con usuarios existentes. Puede seleccionar correo electrónico o nombre de usuario; el valor predeterminado es correo electrónico. La información de usuario proporcionada por el IdP debe incluir el campo `email` o `username`.
- Registrarse automáticamente si el usuario no existe - Define si se debe crear automáticamente un nuevo usuario cuando no se encuentra un usuario existente que coincida.
- Uso - `SP Issuer / EntityID` y `ACS URL` se utilizan para copiar y rellenar la configuración correspondiente en el IdP.

## Mapeo de campos

El mapeo de campos debe configurarse en la plataforma de configuración del IdP. Puede consultar el [ejemplo](./examples/google.md).

Los campos disponibles para mapear en NocoBase son:

- email (obligatorio)
- phone (solo efectivo para plataformas que soporten `phone` en su alcance, como Alibaba Cloud o Feishu)
- nickname
- username
- firstName
- lastName

`nameID` es transportado por el protocolo SAML y no necesita ser mapeado; se guardará como un identificador de usuario único.
La prioridad de las reglas para el apodo de un nuevo usuario es: `nickname` > `firstName lastName` > `username` > `nameID`
Actualmente, no se admite el mapeo de organizaciones o roles de usuario.

## Iniciar sesión

Visite la página de inicio de sesión y haga clic en el botón debajo del formulario de inicio de sesión para iniciar sesión con un tercero.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)