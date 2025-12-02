:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Actualización de una instalación de Docker

:::warning Antes de actualizar
- Asegúrese de hacer una copia de seguridad de su base de datos
:::

## 1. Navegue al directorio donde se encuentra docker-compose.yml

Por ejemplo

```bash
# MacOS, Linux...
cd /your/path/my-project/
# Windows
cd C:\your\path\my-project
```

## 2. Actualice el número de versión de la imagen

:::tip Acerca de los números de versión

- Las versiones con alias, como `latest`, `latest-full`, `beta`, `beta-full`, `alpha` y `alpha-full`, generalmente no necesitan ser modificadas.
- Los números de versión numéricos, como `1.7.14` y `1.7.14-full`, deben cambiarse al número de versión objetivo.
- Solo se admiten las actualizaciones; las reversiones (downgrades) no son compatibles. ¡¡¡
- En entornos de producción, se recomienda fijar una versión numérica específica para evitar actualizaciones automáticas no intencionadas. [Ver todas las versiones](https://hub.docker.com/r/nocobase/nocobase/tags)

:::

```yml
# ...
services:
  app:
    # Se recomienda usar un número de versión específico para producción
    image: nocobase/nocobase:1.7.14-full
    # También puede usar una versión con alias (puede actualizarse automáticamente, úsela con precaución en producción)
    # image: nocobase/nocobase:latest-full
    # image: nocobase/nocobase:beta-full
# ...
```

## 3. Reinicie el contenedor

```bash
# Descargue la última imagen
docker compose pull app

# Recree el contenedor
docker compose up -d app

# Verifique el estado del proceso de la aplicación
docker compose logs -f app
```

## 4. Actualización de plugins de terceros

Consulte [Instalar y actualizar plugins](../install-upgrade-plugins.mdx)

## 5. Instrucciones para la reversión

NocoBase no es compatible con las reversiones (downgrades). Si necesita revertir, por favor, restaure la copia de seguridad de la base de datos anterior a la actualización y cambie la versión de la imagen a la original.

## 6. Preguntas frecuentes (FAQ)

**P: Descarga de imagen lenta o fallida**

Esto a menudo se debe a problemas de red. Puede intentar configurar un mirror de Docker para acelerar las descargas o simplemente inténtelo de nuevo más tarde.

**P: La versión no ha cambiado**

Confirme que ha modificado `image` al nuevo número de versión y que ha ejecutado correctamente `docker compose pull app` y `up -d app`.

**P: Fallo en la descarga o actualización de un plugin comercial**

Para los plugins comerciales, por favor, verifique la clave de licencia en el sistema y luego reinicie el contenedor de Docker. Para más detalles, consulte la [Guía de activación de licencias comerciales de NocoBase](https://www.nocobase.com/blog/nocobase-commercial-license-activation-guide).