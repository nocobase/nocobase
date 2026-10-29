# NocoBase 3

> Esta rama contiene NocoBase 3. Si buscas la plataforma sin código NocoBase 2, visita [NocoBase 2](https://nocode.nocobase.com/).

[English](./README.md) | Español | [Français](./README.fr-FR.md) | [Deutsch](./README.de-DE.md) | [Português](./README.pt-BR.md) | [Русский](./README.ru-RU.md) | [Bahasa Indonesia](./README.id-ID.md) | [Tiếng Việt](./README.vi-VN.md) | [简体中文](./README.zh-CN.md) | [繁體中文](./README.zh-TW.md) | [日本語](./README.ja-JP.md) | [한국어](./README.ko-KR.md)

**Crea sistemas empresariales confiables**

NocoBase es la plataforma de código abierto para crear, ejecutar y hacer evolucionar sistemas empresariales con IA. Los agentes escriben el código y hacen el trabajo, NocoBase aporta la base y la gobernanza, y las personas toman las decisiones.

[▶ Ver la demo](https://static-docs.nocobase.com/nocobase-3-es.mp4)

[Sitio web](https://www.nocobase.com/es-ES/) · [Documentación](https://docs.nocobase.com/) · [Inicio rápido](#quick-start) · [Comunidad](https://forum.nocobase.com/)

## Por qué NocoBase

**La IA escribe código rápido. Crear sistemas empresariales confiables sigue siendo difícil.**

Tu equipo ya desarrolla con IA o hace vibe coding. El código sale rápido, pero también surgen nuevos problemas.

- **Cada proyecto reconstruye la base**

  Aunque la IA escriba el código, los permisos, los motores de flujos de trabajo y las aprobaciones siguen siendo difíciles de diseñar desde cero. Están llenos de casos límite y exigen mucho mantenimiento.

- **La arquitectura se desvía sin control**

  Cambia de desarrollador, de modelo o incluso de sesión, y la IA puede improvisar de forma distinta cada vez. El sistema es cada vez más difícil de mantener.

- **Más trabajo en paralelo del que se puede revisar**

  Llevas varios proyectos y tareas a la vez, saltando entre terminales y chats, mientras los agentes entregan cada vez más cambios. Hay más de lo que nadie puede revisar, pero soltar el control parece demasiado arriesgado.

- **El conocimiento es difícil de capturar y compartir**

  El contexto de los requisitos, los documentos de negocio y las lecciones aprendidas quedan dispersos en chats de distintos dispositivos. Cuando cambian las personas o los agentes, cuesta encontrarlos.

<a id="quick-start"></a>

## Inicio rápido

Se requieren Node.js 24+ y pnpm 11. En Windows, utiliza WSL. Estos ejemplos usan SQLite, por lo que no necesitas un servidor de base de datos independiente.

### Con un agente de programación

Abre un agente de programación compatible con Skills en un directorio vacío e instala la Skill de creación de aplicaciones:

```bash
npx skills@latest add nocobase/skills-v3 --skill nocobase-create-app -g
```

Selecciona tu agente durante la instalación. Si no reconoce la nueva Skill, inicia una nueva sesión. Después, envía:

```text
Sigue la Skill nocobase-create-app para crear e iniciar una aplicación NocoBase 3 en el directorio vacío actual, con la plantilla predeterminada y SQLite.
```

### Desde la terminal

Ejecuta los siguientes comandos desde el directorio padre donde guardas tus proyectos:

```bash
PNPM_CONFIG_MINIMUM_RELEASE_AGE=0 pnpm create @nocobase/app@beta my-app --template-tag=beta
cd my-app
pnpm nocobase config init --dialect sqlite
pnpm nocobase config check
pnpm dev
```

Consulta la [documentación](https://docs.nocobase.com/) para obtener más instrucciones de instalación y guías de desarrollo.

## El ecosistema NocoBase

- **[NocoBase Core](https://www.nocobase.com/es-ES/core/)**

  **Deja que los agentes se centren en tu lógica de negocio. La base ya está lista.**

  NocoBase Core es la base de aplicaciones de código abierto para sistemas empresariales creados y operados con IA. Permisos, flujos de trabajo, archivos y otros componentes base vienen listos para usar, así que los agentes solo desarrollan lo específico de tu negocio, todo sobre una arquitectura coherente.

- **[NocoBase Studio](https://www.nocobase.com/es-ES/studio/)**

  **Los agentes hacen avanzar el trabajo. Tu equipo mantiene el control.**

  NocoBase Studio es la plataforma de gobernanza para personas y agentes que desarrollan software juntos. Reúne Claude Code, Codex y OpenCode en un solo equipo de agentes que hace avanzar las tareas por sí mismo. El progreso se ve de un vistazo y las personas toman las decisiones clave.

- **[NocoBase Solution](https://www.nocobase.com/es-ES/solutions/)**

  **Apps empresariales de código abierto. Impulsadas por IA, listas para usar.**

  NocoBase Solution es una línea de apps empresariales impulsadas por agentes y construidas sobre Core. Los agentes hacen la mayor parte del trabajo y las personas solo toman las decisiones clave.

## Comunidad y contribuciones

- Haz preguntas y comparte tu experiencia en el [foro de la comunidad](https://forum.nocobase.com/).
- Informa de errores reproducibles y solicita mejoras mediante [GitHub Issues](https://github.com/nocobase/nocobase/issues).
- Lee la [documentación](https://docs.nocobase.com/) para aprender cómo funcionan el framework y los plugins.

Las contribuciones son bienvenidas. Antes de modificar este repositorio, lee [AGENTS.md](./AGENTS.md) y las instrucciones de desarrollo pertinentes.
