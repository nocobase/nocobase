---
pkg: "@nocobase/plugin-auth-ldap"
---
:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::



pkg: '@nocobase/plugin-auth-ldap'
---

# Autenticación: LDAP

## Introducción

El plugin de Autenticación: LDAP sigue el estándar del protocolo LDAP (Lightweight Directory Access Protocol), permitiendo a los usuarios iniciar sesión en NocoBase utilizando sus credenciales del servidor LDAP.

## Activar el plugin

<img src="https://static-docs.nocobase.com/202405101600789.png"/>

## Añadir autenticación LDAP

Vaya a la página de gestión de plugins de autenticación de usuario.

<img src="https://static-docs.nocobase.com/202405101601510.png"/>

Añadir - LDAP

<img src="https://static-docs.nocobase.com/202405101602104.png"/>

## Configuración

### Configuración básica

<img src="https://static-docs.nocobase.com/202405101605728.png"/>

- `Registrarse automáticamente si el usuario no existe` - Indica si se debe crear automáticamente un nuevo usuario cuando no se encuentra un usuario existente que coincida.
- `URL de LDAP` - Dirección del servidor LDAP.
- `DN de enlace (Bind DN)` - DN utilizado para probar la conectividad del servidor y buscar usuarios.
- `Contraseña de enlace (Bind password)` - Contraseña del DN de enlace.
- `Probar conexión` - Haga clic en el botón para probar la conectividad del servidor y validar el DN de enlace.

### Configuración de búsqueda

<img src="https://static-docs.nocobase.com/202405101609984.png"/>

- `DN de búsqueda (Search DN)` - DN utilizado para buscar usuarios.
- `Filtro de búsqueda (Search filter)` - Condición de filtrado para buscar usuarios. Utilice `{{account}}` para representar la cuenta de usuario utilizada al iniciar sesión.
- `Alcance (Scope)` - `Base`, `One level`, `Subtree`. El valor predeterminado es `Subtree`.
- `Límite de tamaño (Size limit)` - Tamaño de la página de búsqueda.

### Mapeo de atributos

<img src="https://static-docs.nocobase.com/202405101612814.png"/>

- `Usar este campo para vincular al usuario` - Campo utilizado para vincular a usuarios existentes. Si la cuenta de inicio de sesión es un nombre de usuario, seleccione "nombre de usuario"; si es una dirección de correo electrónico, seleccione "correo electrónico". El valor predeterminado es "nombre de usuario".
- `Mapeo de atributos` - Mapeo de atributos de usuario a los campos de la tabla de usuarios de NocoBase.

## Iniciar sesión

Visite la página de inicio de sesión e introduzca el nombre de usuario y la contraseña de LDAP en el formulario para iniciar sesión.

<img src="https://static-docs.nocobase.com/202405101614300.png"/>