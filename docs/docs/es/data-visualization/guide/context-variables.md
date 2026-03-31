:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Uso de variables de contexto

Con las variables de contexto, puede reutilizar directamente información de la página actual, el usuario, la hora o las condiciones de filtro. Esto le permite renderizar gráficos e interactuar con ellos según el contexto.

## Ámbito de aplicación
- En las condiciones de filtro del modo Builder de consulta de datos, seleccione las variables a utilizar.
![clipboard-image-1761486073](https://static-docs.nocobase.com/clipboard-image-1761486073.png)

- En la escritura de sentencias del modo SQL de consulta de datos, elija variables e inserte expresiones (por ejemplo, `{{ ctx.user.id }}`).
![clipboard-image-1761486145](https://static-docs.nocobase.com/clipboard-image-1761486145.png)

- En las opciones de gráficos del modo Custom, escriba directamente expresiones JS.
![clipboard-image-1761486604](https://static-docs.nocobase.com/clipboard-image-1761486604.png)

- En los eventos de interacción (por ejemplo, hacer clic para abrir un diálogo de desglose y pasar datos), escriba directamente expresiones JS.
![clipboard-image-1761486683](https://static-docs.nocobase.com/clipboard-image-1761486683.png)

**Nota:**
- No envuelva `{{ ... }}` entre comillas simples o dobles; el sistema gestiona el enlace de forma segura según el tipo de variable (cadena, número, fecha/hora, NULL).
- Cuando una variable sea `NULL` o indefinida, gestione explícitamente los valores nulos en SQL utilizando `COALESCE(...)` o `IS NULL`.