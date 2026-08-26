#Instalación de intranet

Si su servidor no puede acceder a la red pública, el método de instalación requiere que prepare de antemano las imágenes, dependencias y paquetes de complementos necesarios para su uso sin conexión. De forma predeterminada, se recomienda utilizar primero Docker, que tiene la ruta más corta y es más fácil de reproducir.

## Recomendación predeterminada: preparar la imagen de Docker sin conexión

En una máquina que pueda acceder a la red pública, primero baje la imagen de la aplicación y la imagen de la base de datos:

```bash
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full
docker pull registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Luego exporte como archivo sin conexión:

```bash
docker save -o nocobase-app.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/nocobase:latest-full

docker save -o nocobase-postgres.tar \
  registry.cn-shanghai.aliyuncs.com/nocobase/postgres:16
```

Si aún necesita complementos comerciales, también se recomienda preparar el paquete de complementos en el entorno de red externo y luego incorporarlo a la intranet.

## Copie el archivo al servidor de intranet

Prepare al menos estos documentos:

- `nocobase-app.tar`
- `nocobase-postgres.tar`
- `docker-compose.yml`
- `.env` o sus propias instrucciones de implementación

## Importar la imagen al servidor de intranet

```bash
docker load -i nocobase-app.tar
docker load -i nocobase-postgres.tar
```

## Iniciar aplicación

Después de preparar `docker-compose.yml`, comience directamente:

```bash
docker compose up -d
docker compose logs -f app
```

Si aún no ha escrito un archivo de redacción, primero lea [Instalación mediante Docker Compose](./docker-compose.md) y guarde los ejemplos allí localmente.

## Qué hacer si no puedes usar Docker

Si Docker no se puede utilizar en su entorno de intranet, también puede usar `create-nocobase-app` para crear un proyecto completo en el entorno de red externo, instalar dependencias y empaquetarlo, y luego copiar todo el proyecto al servidor de intranet.

Este camino será más largo, pero más práctico en entornos sin capacidades de contenedores. El proceso general suele ser:

1. Cree un proyecto en un entorno de red externo e instale dependencias.
2. Empaquete el directorio del proyecto.
3. Copie al servidor de intranet.
4. Descomprima el archivo en la intranet, complete `.env` e inicie la aplicación.

## Dónde buscar a continuación

- Si no ha confirmado la configuración de la aplicación, continúe viendo [Variables de entorno de la aplicación] (./env.md)
- Si está listo para abrir oficialmente la aplicación a los usuarios empresariales, continúe leyendo [Nginx](../production/reverse-proxy/nginx.md) o [Caddy](../production/reverse-proxy/caddy.md)
