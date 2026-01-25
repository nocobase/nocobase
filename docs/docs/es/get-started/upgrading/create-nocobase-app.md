:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Actualización de una instalación de `create-nocobase-app`

:::warning Preparación antes de actualizar

- Asegúrese de hacer una copia de seguridad de la base de datos.
- Detenga la instancia de NocoBase en ejecución.

:::

## 1. Detenga la instancia de NocoBase en ejecución

Si el proceso no se está ejecutando en segundo plano, deténgalo con `Ctrl + C`. En un entorno de producción, ejecute el comando `pm2-stop` para detenerlo.

```bash
yarn nocobase pm2-stop
```

## 2. Ejecute el comando de actualización

Simplemente ejecute el comando de actualización `yarn nocobase upgrade`.

```bash
# Cambie al directorio correspondiente
cd my-nocobase-app
# Ejecute el comando de actualización
yarn nocobase upgrade
# Inicie
yarn dev
```

### Actualización a una versión específica

Modifique el archivo `package.json` en el directorio raíz de su proyecto y cambie los números de versión para `@nocobase/cli` y `@nocobase/devtools` (solo puede actualizar, no revertir a una versión anterior). Por ejemplo:

```diff
{
  "dependencies": {
-   "@nocobase/cli": "1.5.11"
+   "@nocobase/cli": "1.6.0-beta.8"
  },
  "devDependencies": {
-   "@nocobase/devtools": "1.5.11"
+   "@nocobase/devtools": "1.6.0-beta.8"
  }
}
```

Luego, ejecute el comando de actualización

```bash
yarn install
yarn nocobase upgrade --skip-code-update
```