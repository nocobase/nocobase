:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Despliegue en Entorno de Producción

Al desplegar NocoBase en un entorno de producción, la instalación de dependencias puede ser complicada debido a las diferencias en los métodos de construcción entre distintos sistemas y entornos. Para una experiencia funcional completa, le recomendamos desplegarlo con **Docker**. Si su entorno de sistema no puede usar Docker, también puede desplegarlo utilizando **create-nocobase-app**.

:::warning

No se recomienda desplegar directamente desde el código fuente en un entorno de producción. El código fuente tiene muchas dependencias, es de gran tamaño y una compilación completa exige altos requisitos de CPU y memoria. Si realmente necesita desplegar desde el código fuente, le sugerimos construir primero una imagen Docker personalizada y luego proceder con el despliegue.

:::

## Proceso de Despliegue

Para el despliegue en un entorno de producción, puede consultar los pasos de instalación y actualización existentes.

### Nueva Instalación

- [Instalación con Docker](../installation/docker.mdx)
- [Instalación con create-nocobase-app](../installation/create-nocobase-app.mdx)

### Actualización de la Aplicación

- [Actualización de una instalación con Docker](../installation/docker.mdx)
- [Actualización de una instalación con create-nocobase-app](../installation/create-nocobase-app.mdx)

### Instalación y Actualización de plugins de Terceros

- [Instalación y Actualización de plugins](../install-upgrade-plugins.mdx)

## Proxy de Recursos Estáticos

En un entorno de producción, se recomienda gestionar los recursos estáticos con un servidor proxy, por ejemplo:

- [nginx](./static-resource-proxy/nginx.md) 
- [caddy](./static-resource-proxy/caddy.md)
- [cdn](./static-resource-proxy/cdn.md)

## Comandos Comunes de Operación y Mantenimiento

Según el método de instalación, puede usar los siguientes comandos para gestionar el proceso de NocoBase:

- [docker compose](./common-commands/docker-compose.md)
- [pm2](./common-commands/pm2.md)