# Capítulo 1: Conociendo NocoBase — listo en 5 minutos

En esta serie, partiremos desde cero para construir un **sistema HelpDesk de tickets minimalista** con NocoBase. Todo el sistema necesita solo **2 [tablas de datos](/data-sources/data-modeling/collection)**, sin escribir una línea de código, e incluye envío de tickets, gestión de categorías, seguimiento de cambios, control de permisos y un [dashboard](/data-visualization) de datos.

Este capítulo desplegará NocoBase con un solo paso usando [Docker](/get-started/installation/docker), completará el primer inicio de sesión, presentará la diferencia entre [modo de configuración y modo de uso](/get-started/how-nocobase-works) y mostrará una vista general del sistema de tickets.


## 1.1 ¿Qué es NocoBase?

¿Alguna vez se ha encontrado con escenarios como estos?

- El equipo necesita un sistema interno para gestionar el negocio, pero el software del mercado siempre se queda corto en algo
- Encargar el desarrollo a medida es muy caro y lento, y los requisitos siguen cambiando
- Apañarse con Excel, los datos se vuelven cada vez más caóticos y la colaboración se complica

**NocoBase nació para resolver este problema.** Es una **plataforma de desarrollo no-code con IA** de código abierto y altamente extensible. Puede construir sus propios sistemas de negocio mediante configuración y arrastrar y soltar, sin necesidad de escribir código.

Comparado con otras herramientas no-code, NocoBase tiene varios principios clave:

- **Orientado al modelo de datos**: primero defina la [fuente de datos](/data-sources) y la estructura de datos, luego use [Block](/interface-builder/blocks) para mostrar los datos, y finalmente use [Action](/interface-builder/actions) para procesarlos — la interfaz y los datos están totalmente desacoplados
- **WYSIWYG**: la página es el lienzo, donde se hace clic se modifica, tan intuitivo como construir una página de Notion
- **Todo es un Plugin**: todas las funciones son [Plugin](/development/plugin), similar a WordPress, instalación bajo demanda y extensión flexible
- **IA integrada en el negocio**: incluye [Empleados de IA](/ai-employees/quick-start) integrados que pueden ejecutar análisis, traducción, captura de datos y otras tareas, integrándose realmente en su flujo de trabajo
- **Código abierto + despliegue privado**: el código central es totalmente abierto y los datos residen completamente en sus propios servidores


## 1.2 Instalar NocoBase

NocoBase admite varias formas de instalación; elegimos la más sencilla: **[instalación con Docker](/get-started/installation/docker)**.

### Requisitos previos

Necesita tener instalados [Docker](https://docs.docker.com/get-docker/) y Docker Compose en su ordenador, y asegurarse de que el servicio Docker esté en ejecución. Compatible con Windows / Mac / Linux.

### Paso 1: Descargar el archivo de configuración

Abra una terminal (PowerShell en Windows, Terminal en Mac) y ejecute:

```bash
# Cree el directorio del proyecto y entre
mkdir my-project && cd my-project

# Descargue docker-compose.yml (usa PostgreSQL por defecto)
curl -fsSL https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml -o docker-compose.yml
```

> **¿Otra base de datos?** Reemplace `postgres` en el enlace anterior por `mysql` o `mariadb`.
> También puede elegir distintas versiones: `latest` (estable), `beta` (de prueba), `alpha` (en desarrollo); consulte la [documentación oficial de instalación](https://docs.nocobase.com/get-started/installation/docker).
>
> | Base de datos | Enlace de descarga |
> |---------------|--------------------|
> | PostgreSQL (recomendado) | `https://static-docs.nocobase.com/docker-compose/cn/latest-postgres.yml` |
> | MySQL | `https://static-docs.nocobase.com/docker-compose/cn/latest-mysql.yml` |
> | MariaDB | `https://static-docs.nocobase.com/docker-compose/cn/latest-mariadb.yml` |

### Paso 2: Iniciar

```bash
# Descargue las imágenes
docker compose pull

# Inicie en segundo plano (la primera vez se ejecutará la instalación automáticamente)
docker compose up -d

# Vea los logs para confirmar el inicio
docker compose logs -f app
```

Cuando vea la siguiente línea de salida, el inicio se ha completado correctamente:

```
🚀 NocoBase server running at: http://localhost:13000/
```

![01-getting-started-2026-03-11-07-49-19](https://static-docs.nocobase.com/01-getting-started-2026-03-11-07-49-19.png)

### Paso 3: Iniciar sesión

Abra el navegador en `http://localhost:13000` e inicie sesión con la cuenta predeterminada:

- **Cuenta**: `admin@nocobase.com`
- **Contraseña**: `admin123`

> Después del primer inicio de sesión, modifique la contraseña predeterminada cuanto antes.


## 1.3 Conociendo la interfaz

Tras iniciar sesión, verá una interfaz inicial limpia. No tenga prisa, primero conozca dos conceptos fundamentales.

### Modo de configuración vs modo de uso

La interfaz de NocoBase tiene dos modos:

| Modo | Descripción | ¿Quién lo usa? |
|------|-------------|----------------|
| **Modo de uso** | Interfaz para el uso diario de los usuarios | Todos |
| **Modo de configuración** | Modo de diseño para construir y ajustar la interfaz | Administradores |

Cómo cambiar: haga clic en el botón **«[Configuración de UI](/get-started/how-nocobase-works) (UI Editor)»** de la esquina superior derecha (un icono de rotulador fluorescente).

![01-getting-started-2026-03-11-08-17-26](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-17-26.png)

Tras activar el modo de configuración, observará que muchos elementos de la página aparecen rodeados por un **marco naranja resaltado** — esto indica que son configurables. Cada elemento configurable muestra un pequeño icono en la esquina superior derecha; haga clic para configurarlo.

Echemos un vistazo a un sistema de demostración para ver el efecto:

![01-getting-started-2026-03-11-08-19-24](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-19-24.png)

Como se ve en la imagen: el menú, la barra de operaciones de la tabla y la parte inferior de la página muestran indicaciones naranjas; al hacer clic se accede a las opciones de creación del siguiente paso.

> **Recuerde esta regla**: en NocoBase, si quiere modificar la pantalla, entre en el modo de configuración, busque el pequeño icono en la esquina superior derecha del elemento y haga clic en él.

### Estructura básica de la interfaz

La interfaz de NocoBase consta de tres áreas:

```
┌──────────────────────────────────────────┐
│           Barra de navegación superior    │
├──────────┬───────────────────────────────┤
│          │                               │
│  Menú    │       Área de contenido        │
│ lateral  │   (donde se colocan los Block) │
│ (group)  │                               │
│          │                               │
└──────────┴───────────────────────────────┘
```

- **Barra de navegación superior**: alberga el menú de primer nivel, para cambiar entre módulos
- **Menú lateral (group)**: si es un menú agrupado, contendrá este menú de segundo nivel para organizar la jerarquía de páginas
- **Área de contenido**: el cuerpo principal de la página, donde se colocan los **Block** para mostrar y operar sobre los datos

![01-getting-started-2026-03-11-08-24-34](https://static-docs.nocobase.com/01-getting-started-2026-03-11-08-24-34.png)

Ahora está vacío, no hay problema — desde el próximo capítulo empezaremos a llenarlo de contenido.


## 1.4 ¿Qué vamos a construir?

En los siguientes capítulos, construiremos paso a paso un **sistema de tickets de TI** que podrá:

- Enviar tickets: el [usuario](/users-permissions/user) rellena título, descripción, selecciona categoría y prioridad
- Lista de tickets: filtros por estado y categoría, todo visible de un vistazo
- Control de [permisos](/users-permissions/acl/role): los usuarios normales solo ven sus propios tickets, el administrador ve todos
- Panel de datos: estadísticas en tiempo real de la distribución y tendencias de tickets
- Registro de operaciones de datos (incorporado)

Todo el sistema necesita solo **2 tablas de datos**:

| Tabla de datos | Función | Número de campos personalizados |
|----------------|---------|---------------------------------|
| Categorías de tickets | Categoría del ticket (p. ej., problemas de red, fallos de software) | 2 |
| Tickets | Tabla principal, registra cada ticket | 7-8 |

No es un error, solo 2 tablas. Capacidades genéricas como gestión de usuarios, permisos, archivos, e incluso departamentos, correo electrónico y registros de operaciones, NocoBase las proporciona mediante plugins listos para usar, sin necesidad de reinventar la rueda. Solo nos centramos en nuestros datos de negocio.


## Resumen

En este capítulo hemos completado:

1. Conocimos qué es NocoBase: una plataforma no-code de código abierto
2. Instalamos e iniciamos NocoBase con un solo comando de Docker
3. Conocimos los dos modos de la interfaz (modo de configuración / modo de uso) y la estructura básica
4. Vimos una vista previa del plano del sistema de tickets que vamos a construir

**En el próximo capítulo**, pasaremos a la acción: entraremos en la gestión de fuentes de datos y crearemos nuestra primera tabla de datos. Este es el esqueleto de todo el sistema y la capacidad central de NocoBase.

¡Nos vemos en el próximo capítulo!

## Recursos relacionados

- [Detalles de instalación con Docker](/get-started/installation/docker) — Opciones completas de instalación y variables de entorno
- [Requisitos del sistema](/get-started/system-requirements) — Requisitos de hardware y software
- [Cómo funciona NocoBase](/get-started/how-nocobase-works) — Conceptos clave: fuentes de datos, Block, Action
