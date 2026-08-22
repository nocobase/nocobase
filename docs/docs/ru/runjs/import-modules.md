# Импорт модулей

В RunJS вы можете использовать два типа модулей: **встроенные модули** — через `ctx.libs` (импорт не требуется) — и **внешние модули**, которые загружаются по запросу через `ctx.importAsync()` или `ctx.requireAsync()`.

---

## Встроенные модули — ctx.libs (без импорта)

RunJS предоставляет общие библиотеки через `ctx.libs`; вы можете использовать их напрямую **без** `import` или асинхронной загрузки.

| Свойство | Описание |
|----------|----------|
| **ctx.libs.React** | ядро React для JSX и хуков |
| **ctx.libs.ReactDOM** | ReactDOM (например, для createRoot) |
| **ctx.libs.antd** | компоненты Ant Design |
| **ctx.libs.antdIcons** | иконки Ant Design |
| **ctx.libs.math** | [Math.js](https://mathjs.org/): математические выражения, операции с матрицами и т. п. |
| **ctx.libs.formula** | [Formula.js](https://formulajs.github.io/): формулы в стиле Excel (SUM, AVERAGE и т. п.) |

### Пример: React и antd

```tsx
const { Button } = ctx.libs.antd;

ctx.render(<Button>Click</Button>);
```

### Пример: ctx.libs.math

```ts
const result = ctx.libs.math.evaluate('2 + 3 * 4');
// результат === 14
```

### Пример: ctx.libs.formula

```ts
const values = [1, 2, 3, 4];
const sum = ctx.libs.formula.SUM(values);
const avg = ctx.libs.formula.AVERAGE(values);
```

---

## Внешние модули

Для сторонних библиотек выберите загрузчик в зависимости от формата модуля:

- **ESM** → используйте `ctx.importAsync()`
- **UMD/AMD** → используйте `ctx.requireAsync()`

---

### Импорт ESM-модулей

Используйте **`ctx.importAsync()`** для загрузки ESM-модулей по URL во время выполнения. Подходит для **JS-блока**, **Поля JS**, **Действия JS** и т. д.

```ts
importAsync<T = any>(url: string): Promise<T>;
```

- **url**: URL ESM-модуля. Поддерживает сокращённую запись `<package>@<version>` или подпуть `<package>@<version>/<path>` (например, `vue@3.4.0`, `lodash@4/lodash.js`), которые резолвятся через настроенный префикс CDN; также поддерживаются полные URL.
- **Возвращает**: объект пространства имён загруженного модуля.

#### По умолчанию: https://esm.sh

Если не настроено, сокращённая форма использует **https://esm.sh** как префикс CDN. Например:

```ts
const Vue = await ctx.importAsync('vue@3.4.0');
// эквивалентно загрузке с https://esm.sh/vue@3.4.0
```

#### Развёрнутый локально esm.sh

Для интрасети или пользовательского CDN разверните сервис, совместимый с esm.sh, и задайте:

- **ESM_CDN_BASE_URL**: базовый URL ESM CDN (по умолчанию `https://esm.sh`)
- **ESM_CDN_SUFFIX**: необязательный суффикс (например, `/+esm` у jsDelivr)

Ссылка: [https://github.com/nocobase/esm-server](https://github.com/nocobase/esm-server)

---

### Импорт UMD/AMD-модулей

Используйте **`ctx.requireAsync()`** для загрузки скриптов UMD/AMD или скриптов, которые подключаются к глобальному объекту по URL.

```ts
requireAsync<T = any>(url: string): Promise<T>;
```

- **url**: может быть:
  - **Сокращённый путь**: `<package>@<version>/<path>` — так же, как `ctx.importAsync()`; резолвится через текущую конфигурацию ESM CDN; к запросу добавляется `?raw`, чтобы получить сырой файл (обычно UMD). Например, `echarts@5/dist/echarts.min.js` превращается в `https://esm.sh/echarts@5/dist/echarts.min.js?raw` при использовании esm.sh по умолчанию.
  - **Полный URL**: любой URL CDN (например, `https://cdn.jsdelivr.net/npm/xxx`).
- **Возвращает**: объект загруженной библиотеки (его структура зависит от экспортов библиотеки).

Многие библиотеки UMD подключаются к глобальному объекту (например, `window.xxx`); используйте их так, как указано в документации.

**Пример**

```ts
// Сокращённая форма (резолвится через esm.sh с ...?raw)
const echarts = await ctx.requireAsync('echarts@5/dist/echarts.min.js');

// Полный URL
const dayjs = await ctx.requireAsync('https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js');
```

**Примечание**: если библиотека предоставляет и ESM, и UMD, предпочитайте `ctx.importAsync()` ради более корректной модульной семантики и автоматического удаления неиспользуемого кода.