# Actualización de una instalación desde código fuente (Git)

:::warning Preparación antes de actualizar

- Es fundamental que primero haga una copia de seguridad de su base de datos.
- Detenga la instancia de NocoBase que esté en ejecución (`Ctrl + C`).
- Si está habilitada la recuperación de contraseña por correo, comprueba el dominio de cada subaplicación y configura [APP_PUBLIC_ORIGIN](../installation/env.md#app_public_origin) para la aplicación principal y las subaplicaciones sin dominio propio.

:::

## 1. Cambie al directorio del proyecto de NocoBase

```bash
cd my-nocobase-app
```

## 2. Extraiga el código más reciente

```bash
git pull
```

## 3. Elimine la caché y las dependencias antiguas (opcional)

Si el proceso de actualización habitual falla, puede intentar limpiar la caché y las dependencias y luego volver a descargarlas.

```bash
# Eliminar la caché de nocobase
yarn nocobase clean
# Eliminar dependencias
yarn rimraf -rf node_modules # equivalente a rm -rf node_modules
```

## 4. Actualice las dependencias

📢 Tenga en cuenta que, debido a factores como el entorno de red y la configuración del sistema, este paso podría tardar más de diez minutos.

```bash
yarn install
```

## 5. Ejecute el comando de actualización

```bash
yarn nocobase upgrade
```

## 6. Inicie NocoBase

```bash
yarn dev
```

:::tip Consejo para entornos de producción

No se recomienda desplegar una instalación de NocoBase desde código fuente directamente en un entorno de producción (para más información sobre entornos de producción, consulte [Implementación en producción](../deployment/production.md)).

:::

## 7. Actualización de plugins de terceros

Consulte [Instalar y actualizar plugins](../install-upgrade-plugins.mdx)