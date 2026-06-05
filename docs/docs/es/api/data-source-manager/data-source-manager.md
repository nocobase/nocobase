:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# DataSourceManager

`DataSourceManager` es la clase de gestión para múltiples instancias de `dataSource`.

## API

### add()
Añade una instancia de `dataSource`.

#### Firma

- `add(dataSource: DataSource, options: any = {}): Promise<void>`

### use()

Añade middleware global a la instancia de `dataSource`.

### middleware()

Obtiene el middleware de la instancia actual de `dataSourceManager`, el cual puede utilizarse para responder a solicitudes HTTP.

### afterAddDataSource()

Una función *hook* que se ejecuta después de añadir una nueva `dataSource`.

#### Firma

- `afterAddDataSource(hook: DataSourceHook)`

```typescript
type DataSourceHook = (dataSource: DataSource) => void;
```

### registerDataSourceType()

Registra un tipo de fuente de datos y su clase.

#### Firma

- `registerDataSourceType(type: string, dataSourceClass: typeof DataSource)`

### getDataSourceType()

Obtiene la clase de la fuente de datos.

#### Firma

- `getDataSourceType(type: string): typeof DataSource`

### buildDataSourceByType()

Crea una instancia de fuente de datos basándose en el tipo de fuente de datos registrado y las opciones de la instancia.

#### Firma

- `buildDataSourceByType(type: string, options: any): DataSource`