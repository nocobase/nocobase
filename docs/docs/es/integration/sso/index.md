:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Integración de inicio de sesión único (SSO)

NocoBase ofrece soluciones completas de inicio de sesión único (SSO), compatibles con múltiples protocolos de autenticación principales para una integración fluida con los sistemas de identidad empresariales existentes.

## Resumen

El inicio de sesión único (SSO) permite a los usuarios acceder a múltiples sistemas relacionados, pero independientes, utilizando un único conjunto de credenciales. Usted solo necesita iniciar sesión una vez para acceder a todas las aplicaciones autorizadas, sin tener que introducir su nombre de usuario y contraseña repetidamente. Esto no solo mejora la experiencia del usuario, sino que también refuerza la seguridad del sistema y la eficiencia administrativa.

## Protocolos de autenticación compatibles

NocoBase es compatible con los siguientes protocolos y métodos de autenticación a través de **plugins**:

### Protocolos SSO empresariales

- **[SAML 2.0](/auth-verification/auth-saml/)**: Un estándar abierto basado en XML, ampliamente utilizado para la autenticación de identidad empresarial. Es ideal para escenarios que requieren integración con proveedores de identidad (IdP) corporativos.

- **[OIDC (OpenID Connect)](/auth-verification/auth-oidc/)**: Una capa de autenticación moderna basada en OAuth 2.0, que proporciona mecanismos de autenticación y autorización. Permite la integración con los principales proveedores de identidad (como Google, Azure AD, etc.).

- **[CAS (Central Authentication Service)](/auth-verification/auth-cas/)**: Un protocolo SSO desarrollado por la Universidad de Yale, ampliamente adoptado en instituciones de educación superior.

- **[LDAP](/auth-verification/auth-ldap/)**: Protocolo ligero de acceso a directorios, utilizado para acceder y mantener servicios de información de directorios distribuidos. Es adecuado para escenarios que requieren integración con Active Directory u otros servidores LDAP.

### Autenticación de plataformas de terceros

- **[WeCom (WeChat Work)](/auth-verification/auth-wecom/)**: Compatible con el inicio de sesión mediante código QR de WeCom y la autenticación sin interrupciones dentro de la aplicación.

- **[DingTalk](/auth-verification/auth-dingtalk/)**: Compatible con el inicio de sesión mediante código QR de DingTalk y la autenticación sin interrupciones dentro de la aplicación.

### Otros métodos de autenticación

- **[Código de verificación por SMS](/auth-verification/auth-sms/)**: Un método de autenticación basado en códigos de verificación enviados por SMS al teléfono móvil.

- **[Nombre de usuario y contraseña](/auth-verification/auth/)**: El método de autenticación básico integrado en NocoBase.

## Pasos de integración

### 1. Instalar el **plugin** de autenticación

Según sus requisitos, busque e instale el **plugin** de autenticación adecuado desde el gestor de **plugins**. La mayoría de los **plugins** de autenticación SSO requieren una compra o suscripción por separado.

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

Por ejemplo, instale el **plugin** de autenticación SAML 2.0:

![](https://static-docs.nocobase.com/6a12f3d8073c47532a4f8aac900e4296.png)

O instale el **plugin** de autenticación OIDC:

![](https://static-docs.nocobase.com/202411122358790.png)

### 2. Configurar el método de autenticación

1. Diríjase a la página **Ajustes del sistema > Autenticación de usuario**

![](https://static-docs.nocobase.com/202411130004459.png)

2. Haga clic en **Añadir método de autenticación**
3. Seleccione el tipo de autenticación ya instalado (por ejemplo, SAML)

![](https://static-docs.nocobase.com/5076fe56086b7799be308bbaf7c4425d.png)

O seleccione OIDC:

![](https://static-docs.nocobase.com/1efbde1c0e2f4967efc1c4336be45ca2.png)

4. Configure los parámetros necesarios según las indicaciones.

### 3. Configurar el proveedor de identidad

Cada protocolo de autenticación requiere una configuración específica del proveedor de identidad:

- **SAML**: Configure los metadatos del IdP, los certificados, etc.

![](https://static-docs.nocobase.com/976b66e589973c322d81dcddd22c6146.png)

- **OIDC**: Configure el Client ID, Client Secret, el punto final de descubrimiento, etc.

![](https://static-docs.nocobase.com/202411130006341.png)

- **CAS**: Configure la dirección del servidor CAS.
- **LDAP**: Configure la dirección del servidor LDAP, el Bind DN, etc.
- **WeCom/DingTalk**: Configure las credenciales de la aplicación, el Corp ID, etc.

### 4. Probar la autenticación

Una vez completada la configuración, le recomendamos realizar una prueba de inicio de sesión:

1. Cierre la sesión actual.
2. En la página de inicio de sesión, seleccione el método SSO que ha configurado.

![](https://static-docs.nocobase.com/74963865c9d36a294948e6adeb5b24bc.png)

3. Complete el flujo de autenticación del proveedor de identidad.
4. Verifique que puede iniciar sesión en NocoBase correctamente.

## Mapeo de usuarios y asignación de roles

Tras una autenticación SSO exitosa, NocoBase gestiona automáticamente las cuentas de usuario:

- **Primer inicio de sesión**: Crea automáticamente una nueva cuenta de usuario y sincroniza la información básica (nombre de usuario, correo electrónico, etc.) desde el proveedor de identidad.
- **Inicios de sesión posteriores**: Utiliza la cuenta existente; opcionalmente, puede sincronizar la información de usuario actualizada.
- **Asignación de roles**: Puede configurar roles predeterminados o asignar roles automáticamente basándose en los atributos de usuario del proveedor de identidad.

## Recomendaciones de seguridad

1. **Utilice HTTPS**: Asegúrese de que NocoBase esté desplegado en un entorno HTTPS para proteger la transmisión de datos de autenticación.
2. **Actualice los certificados regularmente**: Actualice y rote puntualmente las credenciales de seguridad, como los certificados SAML.
3. **Configure la lista blanca de URL de devolución de llamada**: Configure correctamente las URL de devolución de llamada de NocoBase en el proveedor de identidad.
4. **Principio de mínimo privilegio**: Asigne roles y permisos adecuados a los usuarios de SSO.
5. **Habilite el registro de auditoría**: Registre y supervise las actividades de inicio de sesión SSO.

## Solución de problemas

### ¿Fallo en el inicio de sesión SSO?

1. Verifique que la configuración del proveedor de identidad sea correcta.
2. Asegúrese de que las URL de devolución de llamada estén configuradas correctamente.
3. Revise los registros de NocoBase para obtener mensajes de error detallados.
4. Confirme que los certificados y las claves sean válidos.

### ¿La información del usuario no se sincroniza?

1. Verifique los atributos de usuario devueltos por el proveedor de identidad.
2. Asegúrese de que la configuración del mapeo de campos sea correcta.
3. Confirme que la opción de sincronización de información de usuario esté habilitada.

### ¿Cómo admitir múltiples métodos de autenticación simultáneamente?

NocoBase permite configurar múltiples métodos de autenticación simultáneamente. Los usuarios pueden seleccionar el método que prefieran en la página de inicio de sesión.

## Recursos relacionados

- [Documentación de autenticación](/auth-verification/auth/)
- [Autenticación con claves API](/integration/api-keys/)
- [Gestión de usuarios y permisos](/plugins/@nocobase/plugin-users/)