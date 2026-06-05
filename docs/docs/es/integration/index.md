:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Integración

## Resumen

NocoBase ofrece capacidades de integración completas, que le permiten conectar sin problemas con sistemas externos, servicios de terceros y diversas fuentes de datos. Gracias a sus métodos de integración flexibles, usted puede ampliar la funcionalidad de NocoBase para satisfacer una amplia gama de necesidades empresariales.

## Métodos de Integración

### Integración de API

NocoBase le ofrece potentes capacidades de API para integrar con aplicaciones y servicios externos:

![20250301003106](https://static-docs.nocobase.com/20250301003106.png)

- **[Claves de API](/integration/api-keys/)**: Utilice claves de API para una autenticación segura y acceda a los recursos de NocoBase de forma programática.
- **[Documentación de API](/integration/api-doc/)**: Documentación de API integrada para explorar y probar los puntos finales.

### Inicio de Sesión Único (SSO)

Integre con sistemas de identidad empresariales para una autenticación unificada:

![auth_sso-2025-11-24-08-26-46](https://static-docs.nocobase.com/auth_sso-2025-11-24-08-26-46.png)

- **[Integración de SSO](/integration/sso/)**: Compatible con la autenticación SAML, OIDC, CAS, LDAP y plataformas de terceros.
- Gestión de usuarios y control de acceso centralizados.
- Experiencia de autenticación fluida entre sistemas.

### Integración de Flujos de Trabajo

Conecte los flujos de trabajo de NocoBase con sistemas externos:

![auth_sso-2025-11-24-12-02-01](https://static-docs.nocobase.com/auth_sso-2025-11-24-12-02-01.png)

- **[Webhook de flujo de trabajo](/integration/workflow-webhook/)**: Reciba eventos de sistemas externos para activar flujos de trabajo.
- **[Solicitud HTTP de flujo de trabajo](/integration/workflow-http-request/)**: Envíe solicitudes HTTP a API externas desde los flujos de trabajo.
- Automatice procesos de negocio entre plataformas.

### Fuentes de Datos Externas

Conecte con bases de datos y sistemas de datos externos:

![20240512085558](https://static-docs.nocobase.com/20240512085558.png)

- **[Bases de Datos Externas](/data-sources/)**: Conecte directamente con bases de datos MySQL, PostgreSQL, MariaDB, MSSQL, Oracle y KingbaseES.
- Reconozca las estructuras de tablas de bases de datos externas y realice operaciones CRUD directamente sobre los datos externos dentro de NocoBase.
- Interfaz de gestión de datos unificada.

### Contenido Incrustado

Incruste contenido externo dentro de NocoBase:

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

- **[Bloque Iframe](/integration/block-iframe/)**: Incruste páginas web y aplicaciones externas.
- **Bloques JS**: Ejecute código JavaScript personalizado para integraciones avanzadas.

## Escenarios Comunes de Integración

### Integración de Sistemas Empresariales

- Conecte NocoBase con sistemas ERP, CRM u otros sistemas empresariales.
- Sincronice datos bidireccionalmente.
- Automatice flujos de trabajo entre sistemas.

### Integración de Servicios de Terceros

- Consulte el estado de pagos de pasarelas de pago, integre servicios de mensajería o plataformas en la nube.
- Aproveche las API externas para ampliar la funcionalidad.
- Cree integraciones personalizadas utilizando webhooks y solicitudes HTTP.

### Integración de Datos

- Conecte con múltiples fuentes de datos.
- Agregue datos de diferentes sistemas.
- Cree paneles e informes unificados.

## Consideraciones de Seguridad

Al integrar NocoBase con sistemas externos, tenga en cuenta las siguientes mejores prácticas de seguridad:

1. **Utilice HTTPS**: Utilice siempre conexiones cifradas para la transmisión de datos.
2. **Proteja las claves de API**: Almacene las claves de API de forma segura y rótelas periódicamente.
3. **Principio de mínimo privilegio**: Conceda solo los permisos necesarios para las integraciones.
4. **Registro de auditoría**: Supervise y registre las actividades de integración.
5. **Validación de datos**: Valide todos los datos procedentes de fuentes externas.