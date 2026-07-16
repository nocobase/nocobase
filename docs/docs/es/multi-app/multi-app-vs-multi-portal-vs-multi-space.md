# Multiaplicación, Multiportal y Multiespacio

NocoBase ofrece tres capacidades: Multiportal, Multiaplicación y Multiespacio.

Resuelven problemas en distintas dimensiones y pueden usarse por separado o en combinación.

## Diferencias clave

| Capacidad | Multiportal | Multiaplicación | Multiespacio |
|------|------|------|------|
| Qué problema resuelve | Ofrece múltiples entradas de acceso | Divide el negocio en múltiples sistemas | Aísla los datos del negocio |
| Enfoque principal | Desde dónde entra el usuario | Cómo se divide el sistema | A quién pertenecen los datos |
| Datos | Compartidos | Independientes por defecto | Aislados |
| Páginas y menús | Independientes | Independientes | Compartidos |
| Configuración de plugins | Compartida | Independiente | Compartida |
| Sistema de usuarios | Compartido | Puede compartirse mediante SSO | Compartido |
| Escenarios típicos | Distintos roles necesitan distintas entradas | Diferentes negocios requieren gestión independiente | Varias organizaciones, tiendas o inquilinos |
| Se puede combinar | Sí | Sí | Sí |

## Multiportal

Multiportal ofrece múltiples entradas de acceso dentro de la misma aplicación.

Por ejemplo:

```text
Aplicación ERP

├─ Portal de administración (/v/admin)
├─ Portal de tienda (/v/store)
├─ Portal de distribuidor (/v/dealer)
└─ Portal móvil (/v/mobile)
```

Características:

- Usa la misma aplicación
- Comparte los mismos datos
- Comparte la configuración de plugins
- Las páginas y los menús pueden configurarse de forma independiente

Es adecuado para escenarios en los que diferentes roles necesitan diferentes entradas de acceso, por ejemplo:

- Administradores
- Empleados
- Clientes
- Distribuidores

## Multiaplicación

Multiaplicación divide el negocio en múltiples aplicaciones independientes.

Por ejemplo:

```text
Sistema del grupo

├─ CRM
├─ ERP
├─ OA
└─ Analítica
```

Características:

- Cada aplicación se gestiona de forma independiente
- Configuración de plugins independiente
- Conexión de base de datos independiente
- Actualización y mantenimiento independientes

Adecuado para:

- Dividir sistemas empresariales grandes
- Desarrollo colaborativo de múltiples equipos
- Creación masiva de aplicaciones para plataformas SaaS
- Aplicaciones independientes para distintos clientes

## Multiespacio

Multiespacio aísla los datos del negocio dentro de la misma aplicación.

Por ejemplo:

```text
Aplicación de gestión de tiendas

Espacios
├─ Tienda de Pekín
├─ Tienda de Shanghái
└─ Tienda de Shenzhen
```

Características:

- Páginas compartidas
- Menús compartidos
- Flujos compartidos
- Configuración compartida
- Datos aislados

Para las tablas con el campo de espacio habilitado, el sistema filtra automáticamente los datos según el espacio actual.

Desde la perspectiva del usuario:

- La tienda de Pekín solo puede ver los datos de Pekín
- La tienda de Shanghái solo puede ver los datos de Shanghái
- La tienda de Shenzhen solo puede ver los datos de Shenzhen

Pero todas las tiendas siguen usando el mismo sistema.

## Relación entre las tres

Estas tres capacidades no entran en conflicto. Actúan en dimensiones diferentes.

Pueden usarse juntas:

```text
Sistema del grupo

Aplicación CRM
├─ Portal de administración
├─ Portal de ventas
└─ Portal de clientes

Espacios
├─ Sucursal de Pekín
├─ Sucursal de Shanghái
└─ Sucursal de Shenzhen
```

Conceptualmente:

```text
Portal
    ↓
Desde dónde entra el usuario al sistema

Aplicación
    ↓
Cómo se divide el sistema

Espacio
    ↓
A quién pertenecen los datos
```

## Cómo elegir

Si solo quiere ofrecer distintas entradas para distintos roles, elija **Multiportal**.

Si quiere dividir el negocio en múltiples sistemas independientes, elija **Multiaplicación**.

Si quiere aislar los datos de distintas organizaciones o inquilinos dentro del mismo sistema, elija **Multiespacio**.

En proyectos reales, estas tres capacidades suelen combinarse en lugar de sustituirse entre sí.

En una frase:

> Multiportal resuelve las entradas de acceso, Multiaplicación resuelve la división del sistema y Multiespacio resuelve el aislamiento de datos.
