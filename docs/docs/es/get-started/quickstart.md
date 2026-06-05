:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Comparación de métodos de instalación y versiones

Puede instalar NocoBase de diferentes maneras.

## Comparación de versiones

| Aspecto | **Latest (Estable)** | **Beta (Versión de prueba)** | **Alpha (Desarrollo)** |
|------|------------------------|----------------------|-----------------------|
| **Características** | Funcionalidades estables, completamente probadas, solo se corrigen errores. | Incluye nuevas funcionalidades próximas a lanzarse, con pruebas iniciales, pero podría contener algunos problemas menores. | Versión en desarrollo con las últimas funcionalidades, que pueden estar incompletas o ser inestables. |
| **Público objetivo** | Usuarios que buscan una experiencia estable y despliegues en entornos de producción. | Usuarios que desean probar nuevas funcionalidades de forma anticipada y proporcionar comentarios. | Usuarios técnicos y colaboradores interesados en el desarrollo de vanguardia. |
| **Estabilidad** | ★★★★★ | ★★★★☆ | ★★☆☆☆ |
| **Recomendado para producción** | Recomendado | Usar con precaución | Usar con precaución |

## Comparación de métodos de instalación

| Aspecto | **Instalación con Docker (Recomendado)** | **Instalación con create-nocobase-app** | **Instalación desde código fuente Git** |
|------|--------------------------|------------------------------|------------------|
| **Características** | No requiere escribir código, instalación sencilla, ideal para una prueba rápida. | Código de aplicación independiente, compatible con la extensión de plugins y la personalización de la interfaz. | Obtiene el código fuente más reciente directamente, permite contribuir y depurar. |
| **Escenarios de uso** | Usuarios sin código, usuarios que desean desplegar rápidamente en un servidor. | Desarrolladores frontend/full-stack, proyectos en equipo, desarrollo low-code. | Desarrolladores técnicos, usuarios que desean probar versiones no publicadas. |
| **Requisitos técnicos** | ★☆☆☆☆ | ★★★☆☆ | ★★★★★ |
| **Método de actualización** | Extraer la última imagen y reiniciar el contenedor. | Actualizar dependencias con yarn. | Sincronizar actualizaciones mediante el flujo de Git. |
| **Tutoriales** | [<code>Instalación</code>](#) [<code>Actualización</code>](#) [<code>Despliegue</code>](#) | [<code>Instalación</code>](#) [<code>Actualización</code>](#) [<code>Despliegue</code>](#) | [<code>Instalación</code>](#) [<code>Actualización</code>](#) [<code>Despliegue</code>](#) |