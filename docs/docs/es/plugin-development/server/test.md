:::tip Aviso de traducción por IA
Esta documentación ha sido traducida automáticamente por IA.
:::

# Pruebas

NocoBase le ofrece un conjunto completo de herramientas de prueba para ayudarle a verificar rápidamente la lógica de la base de datos, las interfaces API y la correcta implementación de las funcionalidades durante el desarrollo de sus **plugins**. Esta guía le mostrará cómo escribir, ejecutar y organizar estas pruebas.

## ¿Por qué escribir pruebas?

Beneficios de escribir pruebas automatizadas en el desarrollo de **plugins**:

- Verifique rápidamente que los modelos de base de datos, las API y la lógica de negocio sean correctos.
- Evite errores de regresión (detecte automáticamente la compatibilidad de los **plugins** después de las actualizaciones del núcleo).
- Permita que los entornos de integración continua (CI) ejecuten pruebas automáticamente.
- Pruebe la funcionalidad de los **plugins** sin necesidad de iniciar el servicio completo.

## Fundamentos del entorno de pruebas

NocoBase le proporciona dos herramientas de prueba principales:

| Herramienta | Descripción | Propósito |
|-------------|-------------|----------|
| `createMockDatabase` | Crea una instancia de base de datos en memoria | Para probar modelos y lógica de base de datos |
| `createMockServer` | Crea una instancia de aplicación completa (incluye base de datos, **plugins**, API, etc.) | Para probar procesos de negocio y comportamiento de interfaces |

## Uso de `createMockDatabase` para pruebas de base de datos

`createMockDatabase` es ideal para probar funcionalidades directamente relacionadas con las bases de datos, como definiciones de modelos, tipos de campos, relaciones, operaciones CRUD, etc.

### Ejemplo básico

```ts
import { createMockDatabase, Database } from '@nocobase/database';

describe('Database test', () => {
  let db: Database;

  beforeEach(async () => {
    db = await createMockDatabase();
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should create and query data', async () => {
    const User = db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'username' },
        { type: 'integer', name: 'age' },
      ],
    });

    await User.sync();

    const user = await db.getRepository('users').create({
      values: { username: 'testuser', age: 25 },
    });

    const found = await db.getRepository('users').findOne({
      filter: { username: 'testuser' },
    });

    expect(found.get('age')).toBe(25);
  });
});
```

### Pruebas de operaciones CRUD

```ts
const Posts = db.collection({
  name: 'posts',
  fields: [{ type: 'string', name: 'title' }],
});
await db.sync();

// Create
const post = await db.getRepository('posts').create({ values: { title: 'Initial Title' } });
expect(post.get('title')).toBe('Initial Title');

// Update
await db.getRepository('posts').update({
  filterByTk: post.get('id'),
  values: { title: 'Updated Title' },
});
const updated = await db.getRepository('posts').findOne({ filterByTk: post.get('id') });
expect(updated.get('title')).toBe('Updated Title');
```

### Pruebas de asociaciones de modelos

```ts
const Users = db.collection({
  name: 'users',
  fields: [
    { type: 'string', name: 'username' },
    { type: 'hasMany', name: 'posts' },
  ],
});

const Posts = db.collection({
  name: 'posts',
  fields: [
    { type: 'string', name: 'title' },
    { type: 'belongsTo', name: 'author' },
  ],
});
await db.sync();

const user = await db.getRepository('users').create({ values: { username: 'tester' } });
await db.getRepository('posts').create({
  values: { title: 'Post 1', authorId: user.get('id') },
});

const result = await db.getRepository('users').findOne({
  filterByTk: user.get('id'),
  appends: ['posts'],
});
expect(result.get('posts')).toHaveLength(1);
```

## Uso de `createMockServer` para pruebas de API

`createMockServer` crea automáticamente una instancia de aplicación completa que incluye base de datos, **plugins** y rutas de API, lo que la hace ideal para probar las interfaces de sus **plugins**.

### Ejemplo básico

```ts
import { createMockServer, MockServer } from '@nocobase/test';

describe('User API test', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['users', 'auth'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should create a user', async () => {
    const response = await app.agent()
      .post('/users:create')
      .send({ username: 'test', email: 'a@b.com', password: '123456' });

    expect(response.status).toBe(200);
    expect(response.body.username).toBe('test');
  });
});
```

### Pruebas de consultas y actualizaciones de API

```ts
// Query user list
const list = await app.agent().get('/users:list');
expect(list.body.rows.length).toBeGreaterThan(0);

// Update user
const update = await app.agent().post(`/users:update/${id}`).send({ username: 'newname' });
expect(update.body.username).toBe('newname');
```

### Simulación de estado de inicio de sesión o pruebas de permisos

Puede habilitar el **plugin** `auth` al crear `MockServer` y luego usar la interfaz de inicio de sesión para obtener un token o una sesión:

```ts
const res = await app
  .agent()
  .post('/auth:signin')
  .send({ 
    username: 'admin',
    password: 'admin123',
  });

const token = res.body.data.token;

await app
  .agent()
  .set('Authorization', `Bearer ${token}`)
  .get('/protected-endpoint');
```

También puede usar el método `login()` más simple:

```ts
await app.agent().login(userOrId);
```

## Organización de archivos de prueba en **plugins**

Le recomendamos almacenar los archivos de prueba relacionados con la lógica del lado del servidor en la carpeta `./src/server/__tests__` de su **plugin**.

```bash
packages/plugins/@my-project/plugin-hello/
├── src/                     # Directorio de código fuente
│   └── server/              # Código del lado del servidor
│       ├── __tests__/       # Directorio de archivos de prueba
│       │   ├── db.test.ts   # Pruebas relacionadas con la base de datos (usando createMockDatabase)
│       │   └── api.test.ts  # Pruebas relacionadas con la API
```

## Ejecución de pruebas

```bash
# Especificar directorio
yarn test packages/plugins/@my-project/plugin-hello/src/server
# Especificar archivo
yarn test packages/plugins/@my-project/plugin-hello/src/server/__tests__/db.test.ts
```