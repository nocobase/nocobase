[English](./README.md) | [简体中文](./README.zh-CN.md) | [日本語](./README.ja-JP.md) | [Français](./README.fr.md) | Español | [Português](./README.pt.md) | [Bahasa Indonesia](./README.id.md) | [Tiếng Việt](./README.vi.md) | [Deutsch](./README.de.md)

https://github.com/user-attachments/assets/3b89d965-f60f-48e0-8110-24186c2911d2

<p align="center">
<a href="https://trendshift.io/repositories/4112" target="_blank"><img src="https://trendshift.io/api/badge/repositories/4112" alt="nocobase%2Fnocobase | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>
<a href="https://www.producthunt.com/posts/nocobase?embed=true&utm_source=badge-top-post-topic-badge&utm_medium=badge&utm_souce=badge-nocobase" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/top-post-topic-badge.svg?post_id=456520&theme=light&period=weekly&topic_id=267" alt="NocoBase | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
</p>

## Índice

- [Qué es NocoBase](#qué-es-nocobase)
- [Notas de versión](#notas-de-versión)
- [Características diferenciales](#características-diferenciales)
- [Conexión de AI Agent](#conexión-de-ai-agent)
- [Instalación](#instalación)

## Qué es NocoBase

NocoBase es una plataforma open source de desarrollo con IA + no-code pensada para crear sistemas de negocio con rapidez. En lugar de pedir a la IA que genere todo el código desde cero, NocoBase aporta una infraestructura probada en producción y una interfaz no-code WYSIWYG para que IA y personas colaboren con eficiencia, sin sacrificar fiabilidad.

Sitio oficial:  
https://www.nocobase.com/es

Demo online:  
https://demo.nocobase.com/new

Documentación:  
https://docs.nocobase.com/es/

Foro:  
https://forum.nocobase.com/

Historias de clientes:  
https://www.nocobase.com/es/blog/tags/customer-stories

## Notas de versión

Las [notas de versión](https://www.nocobase.com/es/blog/timeline) se actualizan regularmente en el blog.

## Características diferenciales

### 1. Colaborativo: IA y personas construyen juntas

Los agentes de código tienen CLI y skills, mientras que las personas cuentan con una interfaz no-code WYSIWYG para colaborar con eficiencia.

#### Desarrolla con los agentes de código con IA que ya conoces

Con los principales agentes de código, pasas del despliegue a un sistema operativo en minutos.

- Compatible con Claude Code, Cursor, Codex, OpenCode, TRAE y otros agentes destacados
- Los agentes pueden encargarse del setup, desarrollo, migración y puesta en producción

![coding-agent](https://static-docs.nocobase.com/coding-agent.png)

#### Construye manualmente en una interfaz no-code WYSIWYG

Las personas pueden construir y modificar visualmente en una interfaz WYSIWYG, incluso sin IA.

- Cambia con un clic entre modo de uso y modo de configuración
- Modelo de datos, páginas, flujos y permisos se revisan y configuran visualmente
- Diseñado para usuarios de negocio, no solo para desarrolladores

![wysiwyg](https://static-docs.nocobase.com/wysiwyg.gif)

#### Combina como quieras desarrollo con IA y construcción manual

Reparte el trabajo según lo necesites: las personas afinan lo que crea la IA, y la IA continúa desde lo configurado por el equipo.

- La IA puede crear rápidamente modelos de datos, páginas y flujos
- Las personas pueden ajustar con rapidez la interfaz y las interacciones
- Colabora según haga falta y sigue iterando

![ai-no-coding](https://static-docs.nocobase.com/ai-no-coding.png)

### 2. Inteligente: la IA ayuda a operar, no solo a construir

NocoBase incorpora empleados de IA para que la IA trabaje directamente dentro del sistema.

#### Empleados de IA integrados en los procesos de negocio

Los empleados de IA obtienen automáticamente el contexto del negocio y ejecutan tareas directamente dentro del sistema.

- Front office: ayuda con análisis, respuestas inteligentes y formularios
- Back office: procesamiento automático de documentos, riesgos y reparto de tareas
- Integrados con los flujos, participan en decisiones y ejecución

![AI-employee](https://static-docs.nocobase.com/ai-employee-home.png)

#### Interfaces abiertas para conectar con el ecosistema de agentes

MCP, API HTTP, CLI y un amplio sistema de skills permiten conectar agentes externos de forma segura.

- Plataformas como OpenClaw, Hermes, Dify, Coze o n8n se conectan mediante protocolos estándar
- La integración con Telegram, WhatsApp, Slack o Gmail permite consultar datos, lanzar acciones y ejecutar procesos
- Un modelo de interfaz único mantiene a agentes internos y externos dentro de los mismos límites

![agents](https://static-docs.nocobase.com/f-agents-logos.jpeg)

#### Permisos granulares para mantener el control

Todas las acciones de la IA siguen los mismos permisos detallados que los usuarios humanos.

- Cada empleado de IA tiene su propio rol, con permisos hasta nivel de campo
- Los registros de auditoría hacen trazable cada cambio de datos y cada ejecución de flujo
- Los administradores pueden ajustar los permisos de IA en cualquier momento para mantener límites claros

![permission](https://static-docs.nocobase.com/f-permission.png)

### 3. Fiable: infraestructura lista para negocio real

Modelos de datos, permisos y flujos son complejos y sensibles al error.  
NocoBase los ofrece como infraestructura integrada, probada y validada en producción.

#### Infraestructura completa, sin empezar de cero cada vez

Decenas de módulos integrados cubren las necesidades de negocio más habituales.

- Modelo de datos, permisos, flujos y auditoría funcionan desde el primer momento
- Probado en producción, en lugar de regenerarse como código opaco en cada proyecto
- Las salvaguardas integradas mantienen a la IA dentro de la arquitectura del sistema

![core](https://static-docs.nocobase.com/f-core.png)

#### Impulsado por el modelo de datos, con datos desacoplados de la interfaz

Los datos de negocio permanecen en estructuras relacionales estándar, separadas de la interfaz.

- La base principal, bases externas y API de terceros pueden ser fuentes de datos
- IA y personas trabajan sobre el mismo modelo de datos, con resultados transparentes
- Tus datos siguen en tu propia base, sin bloqueo de plataforma

![model](https://static-docs.nocobase.com/model.png)

#### Arquitectura de plugins para crecer de forma sostenible

Con un diseño de microkernel, todo es un plugin y el sistema puede crecer sin perder el control.

- Las nuevas funciones se añaden con plugins componibles y convenciones comunes
- Combina plugins propios y oficiales según tu negocio
- La misma arquitectura sirve tanto para plugins creados por IA como para los desarrollados a mano

![plugins](https://static-docs.nocobase.com/plugins.png)

## Conexión de AI Agent

La forma más simple es instalar NocoBase CLI, completar la inicialización y luego iniciar o reiniciar la sesión del AI Agent dentro de ese directorio.

- NocoBase CLI se encarga de instalar, conectar y gestionar aplicaciones NocoBase
- Durante la inicialización, la CLI instala automáticamente NocoBase Skills para que el agente entienda modelos de datos, páginas, workflows, permisos y plugins
- Una vez completada la inicialización, el AI Agent puede empezar a trabajar siempre que su espacio de trabajo apunte a ese directorio

```bash
npm install -g @nocobase/cli@beta
mkdir my-nocobase && cd my-nocobase
nb init --ui
cd my-nocobase && codex
```

Más información:  
https://docs.nocobase.com/es/ai/quick-start

## Instalación

NocoBase ofrece tres métodos de instalación:

- <a target="_blank" href="https://docs.nocobase.com/es/welcome/getting-started/installation/docker-compose">Instalar con Docker (recomendado)</a>

  Es la mejor opción para escenarios no-code y no requiere escribir código. Para actualizar, solo necesitas descargar la imagen más reciente y reiniciar.

- <a target="_blank" href="https://docs.nocobase.com/es/welcome/getting-started/installation/create-nocobase-app">Instalar con create-nocobase-app</a>

  El código de negocio del proyecto permanece completamente independiente y es adecuado para desarrollo low-code.

- <a target="_blank" href="https://docs.nocobase.com/es/welcome/getting-started/installation/git-clone">Instalar desde el código fuente Git</a>

  Si quieres probar la última versión aún no publicada o contribuir modificando y depurando el código fuente directamente, este método es el más recomendable. Requiere una mayor base de desarrollo, y cuando el código se actualice podrás obtener la versión más reciente con Git.
