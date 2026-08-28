# Despliegue en Entorno de Producción

Al desplegar NocoBase en un entorno de producción, la instalación de dependencias puede ser complicada debido a las diferencias en los métodos de construcción entre distintos sistemas y entornos. Para una experiencia funcional completa, le recomendamos desplegarlo con **Docker**. Si su entorno de sistema no puede usar Docker, también puede desplegarlo utilizando **create-nocobase-app**.

:::warning Atención

No se recomienda desplegar directamente desde el código fuente en un entorno de producción. El código fuente tiene muchas dependencias, es de gran tamaño y una compilación completa exige altos requisitos de CPU y memoria. Si realmente necesita desplegar desde el código fuente, le sugerimos construir primero una imagen Docker personalizada y luego proceder con el despliegue.

:::

:::warning Atención

Si despliega varios servicios NocoBase independientes, utilice un `hostname` diferente para cada servicio, como subdominios distintos. No diferencie los servicios únicamente por el puerto, por ejemplo `https://example.com:13000` y `https://example.com:14000`.

NocoBase usa cookies para mantener el estado de inicio de sesión y los [permisos de acceso a archivos](../../file-manager/stable-url.md). Los navegadores no aíslan las cookies por puerto, por lo que los servicios en distintos puertos bajo el mismo `hostname` pueden compartir cookies con el mismo nombre. Esto puede sobrescribir el estado de inicio de sesión o provocar errores de autorización al previsualizar o descargar archivos.

Las subaplicaciones del mismo despliegue de NocoBase no están sujetas a esta restricción. Las cookies de inicio de sesión se distinguen por el nombre de la aplicación, por lo que la aplicación principal y las subaplicaciones con nombres diferentes pueden compartir un mismo `hostname`.

Sin embargo, los servicios independientes todavía deben aislarse. Si otro servicio NocoBase se ejecuta en otro puerto bajo el mismo `hostname` y contiene una aplicación principal o subaplicación con el mismo nombre, las cookies aún pueden entrar en conflicto.

Utilice direcciones como `app1.example.com` y `app2.example.com`, y diríjalas a los distintos servicios NocoBase mediante Nginx o Caddy.

:::

## Frontend separado / Acceso API entre orígenes

Se recomienda mantener las páginas y la API en el mismo origen: utilice un proxy inverso bajo el mismo dominio para reenviar `${APP_PUBLIC_PATH}api/` y `${APP_PUBLIC_PATH}files/` al servicio NocoBase, y deje `API_BASE_URL` vacío.

Si las páginas deben acceder a la API entre orígenes (`API_BASE_URL` apunta a otro origen), añada el origen de la página a `CORS_ORIGIN_WHITELIST`. De lo contrario, el navegador ignorará `Set-Cookie` en las respuestas de la API, la cookie de inicio de sesión no se almacenará y la previsualización y descarga mediante URL de archivo estables fallarán en la autorización.

Tenga en cuenta también que las cookies se almacenan por `hostname`: si las páginas y la API usan dominios completamente distintos, las solicitudes a `/files/` desde el dominio de la página no llevarán la cookie de inicio de sesión almacenada bajo el dominio de la API. En esos despliegues debe usarse un proxy inverso del mismo origen. Consulte [Variables de entorno](../installation/env.md#api_base_url).

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
