---
title: "Comparación entre la base de datos principal y las externas"
description: "Diferencias entre la base de datos principal y las externas: comparación de la compatibilidad con tipos de bases de datos, tipos de tablas de datos, tipos de campos y capacidades de copia de seguridad, restauración y migración."
keywords: "base de datos principal,base de datos externa,comparación de fuentes de datos,conexión de solo lectura,sincronización de tablas de datos,NocoBase"
---

# Comparación entre la base de datos principal y las externas

Las diferencias entre la base de datos principal y las bases de datos externas en NocoBase se manifiestan principalmente en los cuatro aspectos siguientes: compatibilidad con tipos de bases de datos, compatibilidad con tipos de tablas de datos, compatibilidad con tipos de campos y copia de seguridad, restauración y migración.

## I. Compatibilidad con tipos de bases de datos

Para obtener más información, consulta: [Gestión de fuentes de datos](https://docs.nocobase.com/data-sources/data-source-manager)

### Tipos de bases de datos

| Tipo de base de datos | Compatible con la base de datos principal | Compatible con bases de datos externas |
|-----------|-------------|--------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Gestión de tablas de datos

| Gestión de tablas de datos | Compatible con la base de datos principal | Compatible con bases de datos externas |
|-----------|-------------|--------------|
| Gestión básica | ✅ | ✅ |
| Gestión visual | ✅ | ❌ |

## II. Compatibilidad con tipos de tablas de datos

Para obtener más información, consulta: [Tablas de datos](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Tipo de tabla de datos | Base de datos principal | Base de datos externa | Descripción |
|-----------|---------|-----------|------|
| Tabla normal | ✅ | ✅ | Tabla de datos básica |
| Tabla de vista | ✅ | ✅ | Vista de la fuente de datos |
| Tabla heredada | ✅ | ❌ | Admite la herencia de modelos de datos; solo es compatible con la fuente de datos principal |
| Tabla de archivos | ✅ | ❌ | Admite la carga de archivos; solo es compatible con la fuente de datos principal |
| Tabla de comentarios | ✅ | ❌ | Sistema de comentarios integrado; solo es compatible con la fuente de datos principal |
| Tabla de calendario | ✅ | ❌ | Tabla de datos utilizada para las vistas de calendario |
| Tabla de expresiones | ✅ | ❌ | Admite cálculos mediante fórmulas |
| Tabla de árbol | ✅ | ❌ | Se utiliza para modelar datos con estructura de árbol |
| Tabla SQL | ✅ | ❌ | Tabla de datos que se puede definir mediante SQL |
| Tabla conectada a datos externos | ✅ | ❌ | Tabla de conexión a una fuente de datos externa, con funciones limitadas |

## III. Compatibilidad con tipos de campos

Para obtener más información, consulta: [Campos de las tablas de datos](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Tipos básicos

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| Texto de una sola línea | ✅ | ✅ |
| Texto multilínea | ✅ | ✅ |
| Número de teléfono móvil | ✅ | ✅ |
| Correo electrónico | ✅ | ✅ |
| URL | ✅ | ✅ |
| Entero | ✅ | ✅ |
| Número | ✅ | ✅ |
| Porcentaje | ✅ | ✅ |
| Contraseña | ✅ | ✅ |
| Color | ✅ | ✅ |
| Icono | ✅ | ✅ |

### Tipos de selección

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| Casilla de verificación | ✅ | ✅ |
| Menú desplegable (selección única) | ✅ | ✅ |
| Menú desplegable (selección múltiple) | ✅ | ✅ |
| Botón de opción | ✅ | ✅ |
| Casillas de verificación | ✅ | ✅ |
| División administrativa de China | ✅ | ❌ |

### Tipos multimedia

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| Multimedia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Texto enriquecido | ✅ | ✅ |
| Adjunto (relación) | ✅ | ❌ |
| Adjunto (URL) | ✅ | ✅ |

### Tipos de fecha y hora

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| Fecha y hora (con zona horaria) | ✅ | ✅ |
| Fecha y hora (sin zona horaria) | ✅ | ✅ |
| Marca de tiempo Unix | ✅ | ✅ |
| Fecha (sin hora) | ✅ | ✅ |
| Hora | ✅ | ✅ |

### Tipos geométricos

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| Punto | ✅ | ✅ |
| Línea | ✅ | ✅ |
| Círculo | ✅ | ✅ |
| Polígono | ✅ | ✅ |

### Tipos avanzados

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Orden | ✅ | ✅ |
| Fórmula de cálculo | ✅ | ✅ |
| Codificación automática | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Selector de tablas de datos | ✅ | ❌ |
| Cifrado | ✅ | ✅ |

### Campos de información del sistema

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| Fecha de creación | ✅ | ✅ |
| Fecha de última modificación | ✅ | ✅ |
| Creador | ✅ | ❌ |
| Último modificador | ✅ | ❌ |
| Table OID | ✅ | ❌ |

### Tipos de relaciones

| Tipo de campo | Base de datos principal | Base de datos externa |
|---------|---------|-----------|
| Uno a uno | ✅ | ✅ |
| Uno a muchos | ✅ | ✅ |
| Muchos a uno | ✅ | ✅ |
| Muchos a muchos | ✅ | ✅ |
| Muchos a muchos (matriz) | ✅ | ✅ |

:::info
Los campos de adjuntos dependen de las tablas de archivos, y estas solo son compatibles con la base de datos principal. Por lo tanto, las bases de datos externas no admiten actualmente campos de adjuntos.
:::

## IV. Comparación de la compatibilidad con copias de seguridad y migraciones

| Función | Base de datos principal | Base de datos externa |
|-----|---------|-----------|
| Copia de seguridad y restauración | ✅ | ❌ (debe gestionarse por cuenta propia) |
| Gestión de migraciones | ✅ | ❌ (debe gestionarse por cuenta propia) |

:::info
NocoBase proporciona funciones de copia de seguridad, restauración y migración de estructuras para la base de datos principal. En el caso de las bases de datos externas, el usuario debe realizar estas operaciones de forma independiente según el entorno de su propia base de datos; NocoBase no ofrece compatibilidad integrada.
:::

## Comparación resumida

| Elemento de comparación | Base de datos principal | Base de datos externa |
|-------|---------|-----------|
| Tipos de bases de datos | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Compatibilidad con tipos de tablas | Todos los tipos de tablas | Solo tablas normales y tablas de vista |
| Compatibilidad con tipos de campos | Todos los tipos de campos | Todos los tipos de campos excepto los campos de adjuntos |
| Copia de seguridad y migración | Compatibilidad integrada | Debe gestionarse por cuenta propia |

## Recomendaciones

- **Si vas a utilizar NocoBase para crear un sistema empresarial completamente nuevo**, utiliza la **base de datos principal**. Así podrás aprovechar todas las funciones de NocoBase.
- **Si vas a utilizar NocoBase para conectarte a la base de datos de otro sistema y realizar operaciones básicas de consulta, creación, modificación y eliminación de datos**, utiliza una **base de datos externa**.