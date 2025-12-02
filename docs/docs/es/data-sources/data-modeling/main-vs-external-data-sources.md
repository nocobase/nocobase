:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Comparación entre Bases de Datos Principales y Externas

Las diferencias entre las bases de datos principales y las bases de datos externas en NocoBase se manifiestan principalmente en cuatro aspectos: el soporte de tipos de bases de datos, el soporte de tipos de colecciones, el soporte de tipos de campos y las capacidades de respaldo y migración.

## 1. Soporte de Tipos de Bases de Datos

Para más detalles, consulte: [Gestor de Fuentes de Datos](https://docs.nocobase.com/data-sources/data-source-manager)

### Tipos de Bases de Datos

| Tipo de Base de Datos | Soporte en Base de Datos Principal | Soporte en Base de Datos Externa |
|-----------------------|------------------------------------|----------------------------------|
| PostgreSQL | ✅ | ✅ |
| MySQL | ✅ | ✅ |
| MariaDB | ✅ | ✅ |
| KingbaseES | ✅ | ✅ |
| MSSQL | ❌ | ✅ |
| Oracle | ❌ | ✅ |

### Gestión de Colecciones

| Gestión de Colecciones | Soporte en Base de Datos Principal | Soporte en Base de Datos Externa |
|------------------------|------------------------------------|----------------------------------|
| Gestión Básica | ✅ | ✅ |
| Gestión Visual | ✅ | ❌ |

## 2. Soporte de Tipos de Colecciones

Para más detalles, consulte: [Colecciones](https://docs.nocobase.com/data-sources/data-modeling/collection)

| Tipo de Colección | Base de Datos Principal | Base de Datos Externa | Descripción |
|-------------------|-------------------------|-----------------------|-------------|
| General | ✅ | ✅ | Colección básica |
| Vista | ✅ | ✅ | Vista de fuente de datos |
| Herencia | ✅ | ❌ | Admite herencia de modelos de datos, solo para la fuente de datos principal |
| Archivo | ✅ | ❌ | Admite la carga de archivos, solo para la fuente de datos principal |
| Comentario | ✅ | ❌ | Sistema de comentarios integrado, solo para la fuente de datos principal |
| Calendario | ✅ | ❌ | Colección para vistas de calendario |
| Expresión | ✅ | ❌ | Admite cálculos de fórmulas |
| Árbol | ✅ | ❌ | Para modelado de datos con estructura de árbol |
| SQL | ✅ | ❌ | Colección definida mediante SQL |
| Conexión Externa | ✅ | ❌ | Colección de conexión para fuentes de datos externas, funcionalidad limitada |

## 3. Soporte de Tipos de Campos de Colección

Para más detalles, consulte: [Campos de Colección](https://docs.nocobase.com/data-sources/data-modeling/collection-fields)

### Tipos Básicos

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| Texto de una línea | ✅ | ✅ |
| Texto largo | ✅ | ✅ |
| Número de teléfono | ✅ | ✅ |
| Correo electrónico | ✅ | ✅ |
| URL | ✅ | ✅ |
| Entero | ✅ | ✅ |
| Número | ✅ | ✅ |
| Porcentaje | ✅ | ✅ |
| Contraseña | ✅ | ✅ |
| Color | ✅ | ✅ |
| Icono | ✅ | ✅ |

### Tipos de Selección

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| Casilla de verificación | ✅ | ✅ |
| Selección única (desplegable) | ✅ | ✅ |
| Selección múltiple (desplegable) | ✅ | ✅ |
| Grupo de radio | ✅ | ✅ |
| Grupo de casillas de verificación | ✅ | ✅ |
| Región de China | ✅ | ❌ |

### Tipos Multimedia

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| Multimedia | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| Markdown (Vditor) | ✅ | ✅ |
| Texto enriquecido | ✅ | ✅ |
| Adjunto (Asociación) | ✅ | ❌ |
| Adjunto (URL) | ✅ | ✅ |

### Tipos de Fecha y Hora

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| Fecha y hora (con zona horaria) | ✅ | ✅ |
| Fecha y hora (sin zona horaria) | ✅ | ✅ |
| Marca de tiempo Unix | ✅ | ✅ |
| Fecha (sin hora) | ✅ | ✅ |
| Hora | ✅ | ✅ |

### Tipos Geométricos

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| Punto | ✅ | ✅ |
| Línea | ✅ | ✅ |
| Círculo | ✅ | ✅ |
| Polígono | ✅ | ✅ |

### Tipos Avanzados

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| UUID | ✅ | ✅ |
| Nano ID | ✅ | ✅ |
| Orden | ✅ | ✅ |
| Fórmula | ✅ | ✅ |
| Secuencia | ✅ | ✅ |
| JSON | ✅ | ✅ |
| Selector de colección | ✅ | ❌ |
| Cifrado | ✅ | ✅ |

### Campos de Información del Sistema

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| Fecha de creación | ✅ | ✅ |
| Última fecha de modificación | ✅ | ✅ |
| Creado por | ✅ | ❌ |
| Última modificación por | ✅ | ❌ |
| OID de tabla | ✅ | ❌ |

### Tipos de Asociación

| Tipo de Campo | Base de Datos Principal | Base de Datos Externa |
|---------------|-------------------------|-----------------------|
| Uno a uno | ✅ | ✅ |
| Uno a muchos | ✅ | ✅ |
| Muchos a uno | ✅ | ✅ |
| Muchos a muchos | ✅ | ✅ |
| Muchos a muchos (array) | ✅ | ✅ |

:::info
Los campos de adjunto dependen de las colecciones de archivos, que solo son compatibles con las bases de datos principales. Por lo tanto, las bases de datos externas no admiten actualmente los campos de adjunto.
:::

## 4. Comparación del Soporte de Respaldo y Migración

| Característica | Base de Datos Principal | Base de Datos Externa |
|----------------|-------------------------|-----------------------|
| Respaldo y Restauración | ✅ | ❌ (Gestión por el usuario) |
| Gestión de Migración | ✅ | ❌ (Gestión por el usuario) |

:::info
NocoBase ofrece capacidades de respaldo, restauración y migración de estructura para las bases de datos principales. Para las bases de datos externas, estas operaciones deben ser completadas de forma independiente por los usuarios, de acuerdo con sus propios entornos de base de datos. NocoBase no proporciona soporte integrado para estas.
:::

## Resumen Comparativo

| Elemento de Comparación | Base de Datos Principal | Base de Datos Externa |
|-------------------------|-------------------------|-----------------------|
| Tipos de Bases de Datos | PostgreSQL, MySQL, MariaDB, KingbaseES | PostgreSQL, MySQL, MariaDB, MSSQL, Oracle, KingbaseES |
| Soporte de Tipos de Colección | Todos los tipos de colección | Solo colecciones generales y de vista |
| Soporte de Tipos de Campo | Todos los tipos de campo | Todos los tipos de campo, excepto los campos de adjunto |
| Respaldo y Migración | Soporte integrado | Gestión por el usuario |

## Recomendaciones

- **Si está utilizando NocoBase para construir un sistema de negocio completamente nuevo**, le recomendamos usar la **base de datos principal**, ya que esto le permitirá aprovechar la funcionalidad completa de NocoBase.
- **Si está utilizando NocoBase para conectarse a bases de datos de otros sistemas y realizar operaciones CRUD básicas**, entonces use las **bases de datos externas**.