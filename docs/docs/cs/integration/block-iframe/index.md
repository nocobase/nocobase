---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Tento dokument byl přeložen umělou inteligencí. V případě nepřesností se prosím obraťte na [anglickou verzi](/en)
:::



# Blok Iframe

## Úvod

Blok Iframe umožňuje vkládat externí webové stránky nebo obsah do aktuální stránky. Uživatelé mohou snadno integrovat externí aplikace konfigurací URL adresy nebo přímým vložením HTML kódu. Při použití HTML mohou uživatelé flexibilně přizpůsobit obsah tak, aby vyhovoval specifickým potřebám zobrazení, což je ideální pro scénáře vyžadující přizpůsobené zobrazení. Tento přístup umožňuje načítání externích zdrojů bez přesměrování, čímž zlepšuje uživatelský zážitek a interaktivitu stránky.

## Instalace

Jedná se o vestavěný plugin, není nutná žádná instalace.

## Přidání bloku

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Nakonfigurujte URL adresu nebo HTML kód pro přímé vložení externí aplikace.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Šablonovací engine

### Řetězcová šablona

Výchozí šablonovací engine.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Více informací naleznete v dokumentaci šablonovacího enginu Handlebars.

## Předávání proměnných

### Podpora proměnných v HTML

#### Podpora výběru proměnných z voliče proměnných v kontextu aktuálního bloku

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Podpora pro vkládání proměnných do aplikace a jejich použití prostřednictvím kódu

Vlastní proměnné můžete do aplikace vkládat také prostřednictvím kódu a používat je v HTML. Například vytvoření dynamické kalendářové aplikace pomocí Vue 3 a Element Plus:

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue3 CDN Example</title>
    <script src="https://cdn.bootcdn.net/ajax/libs/vue/3.5.9/vue.global.prod.js"></script>
    <script src="https://unpkg.com/element-plus"></script>
    <script src="https://unpkg.com/element-plus/dist/locale/zh-cn"></script>
    <link
      rel="stylesheet"
      href="https://unpkg.com/element-plus/dist/index.css"
    />
  </head>
  <body>
    <div id="app">
      <el-container>
        <el-main>
          <el-calendar v-model="month">
            <div class="header-container">
              <div class="action-group">
                <span class="month-display">{{ month }}</span>
                <el-button-group>
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(-1)"
                    >Last month</el-button
                  >
                  <el-button
                    type="primary"
                    :loading="loading"
                    @click="changeMonth(1)"
                    >Next month</el-button
                  >
                </el-button-group>
              </div>
            </div>
          </el-calendar>
        </el-main>
      </el-container>
    </div>
    <script>
      const { createApp, ref, provide } = Vue;
      const app = createApp({
        setup() {
          const month = ref(new Date().toISOString().slice(0, 7));
          const loading = ref(false);

          const changeMonth = (offset) => {
            const date = new Date(month.value + '-01');
            date.setMonth(date.getMonth() + offset);
            month.value = date.toISOString().slice(0, 7);
          };
          provide('month', month);
          provide('changeMonth', changeMonth);
          return { month, loading, changeMonth };
        },
      });
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>
```

![20250320163250](https://static-docs.nocobase.com/20250320163250.png)

Příklad: Jednoduchá kalendářová komponenta vytvořená pomocí React a Ant Design (antd), která využívá dayjs pro práci s daty

```html
<!doctype html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>React CDN Example</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <link
      rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.css"
    />
    <script src="https://unpkg.com/dayjs/dayjs.min.js"></script>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/antd/dist/antd.min.js"></script>
    <script>
      document.addEventListener('DOMContentLoaded', function () {
        const { useState } = React;
        const { Calendar, Button, Space, Typography } = window.antd;
        const { Title } = Typography;
        const CalendarComponent = () => {
          const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
          const [loading, setLoading] = useState(false);
          const changeMonth = (offset) => {
            const newMonth = dayjs(month)
              .add(offset, 'month')
              .format('YYYY-MM');
            setMonth(newMonth);
          };
          return React.createElement(
            'div',
            { style: { padding: 20 } },
            React.createElement(
              'div',
              {
                style: {
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 16,
                },
              },
              React.createElement(Title, { level: 4 }, month),
              React.createElement(
                Space,
                null,
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(-1) },
                  'Last month',
                ),
                React.createElement(
                  Button,
                  { type: 'primary', loading, onClick: () => changeMonth(1) },
                  'Next month',
                ),
              ),
            ),
            React.createElement(Calendar, {
              fullscreen: false,
              value: dayjs(month),
            }),
          );
        };
        ReactDOM.createRoot(document.getElementById('app')).render(
          React.createElement(CalendarComponent),
        );
      });
    </script>
  </body>
</html>
```

![20250320164537](https://static-docs.nocobase.com/20250320164537.png)

### URL podporuje proměnné

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Více informací o proměnných naleznete v dokumentaci k proměnným.

## Vytváření Iframe pomocí JS bloků (NocoBase 2.0)

V NocoBase 2.0 můžete používat JS bloky k dynamickému vytváření iframe s větší kontrolou. Tento přístup poskytuje lepší flexibilitu pro přizpůsobení chování a stylu iframe.

### Základní příklad

Vytvořte JS blok a použijte následující kód pro vytvoření iframe:

```javascript
// 创建一个填充当前区块容器的 iframe
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// 替换现有子元素,使 iframe 成为唯一内容
ctx.element.replaceChildren(iframe);
```

### Klíčové body

- **ctx.element**: DOM element kontejneru aktuálního JS bloku
- **atribut sandbox**: Řídí bezpečnostní omezení pro obsah iframe
  - `allow-scripts`: Povoluje iframe spouštět skripty
  - `allow-same-origin`: Povoluje iframe přístup k vlastnímu původu
- **replaceChildren()**: Nahrazuje všechny potomky kontejneru iframe

### Pokročilý příklad se stavem načítání

Vytváření iframe můžete vylepšit o stavy načítání a zpracování chyb:

```javascript
// 显示加载提示
ctx.message.loading('正在加载外部内容...');

try {
  // 创建 iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // 添加加载事件监听器
  iframe.addEventListener('load', () => {
    ctx.message.success('内容加载成功');
  });

  // 添加错误事件监听器
  iframe.addEventListener('error', () => {
    ctx.message.error('加载内容失败');
  });

  // 将 iframe 插入容器
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('创建 iframe 出错: ' + error.message);
}
```

### Bezpečnostní aspekty

Při používání iframe zvažte následující osvědčené postupy zabezpečení:

1.  **Používejte HTTPS**: Kdykoli je to možné, vždy načítajte obsah iframe přes HTTPS
2.  **Omezte oprávnění Sandbox**: Povolte pouze nezbytná oprávnění sandboxu
3.  **Zásady zabezpečení obsahu (CSP)**: Nakonfigurujte příslušné hlavičky CSP
4.  **Same-Origin Policy (Politika stejného původu)**: Mějte na pamědomí omezení napříč doménami
5.  **Důvěryhodné zdroje**: Načítajte obsah pouze z důvěryhodných domén