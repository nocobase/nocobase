---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip
Ten dokument został przetłumaczony przez AI. W przypadku niedokładności, proszę odnieść się do [wersji angielskiej](/en)
:::



pkg: "@nocobase/plugin-block-iframe"
---
# Blok Iframe

## Wprowadzenie

Blok Iframe pozwala osadzać zewnętrzne strony internetowe lub treści w bieżącej stronie. Użytkownicy mogą łatwo integrować zewnętrzne aplikacje ze stroną, konfigurując adres URL lub bezpośrednio wstawiając kod HTML. Korzystając z kodu HTML, mogą Państwo elastycznie dostosowywać zawartość do konkretnych potrzeb wyświetlania, co sprawia, że jest to idealne rozwiązanie dla scenariuszy wymagających spersonalizowanej prezentacji. Takie podejście umożliwia ładowanie zasobów zewnętrznych bez przekierowań, co poprawia komfort użytkowania i interaktywność strony.

## Instalacja

Jest to wbudowana wtyczka, więc instalacja nie jest wymagana.

## Dodawanie bloków

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Aby osadzić zewnętrzną aplikację, wystarczy skonfigurować adres URL lub wstawić kod HTML.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Silnik szablonów

### Szablon tekstowy

Domyślny silnik szablonów.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Więcej informacji znajdą Państwo w dokumentacji szablonów Handlebars.

## Przekazywanie zmiennych

### Obsługa zmiennych w HTML

#### Wybieranie zmiennych z selektora zmiennych w kontekście bieżącego bloku

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Wstrzykiwanie i używanie zmiennych w aplikacji za pomocą kodu

Mogą Państwo również wstrzykiwać niestandardowe zmienne do aplikacji za pomocą kodu i używać ich w HTML-u. Na przykład, aby stworzyć dynamiczną aplikację kalendarza, używając Vue 3 i Element Plus:

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

Przykład: Prosty komponent kalendarza stworzony za pomocą React i Ant Design (antd), wykorzystujący dayjs do obsługi dat:

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

### Adres URL obsługuje zmienne

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Więcej informacji na temat zmiennych znajdą Państwo w dokumentacji zmiennych.

## Tworzenie Iframe za pomocą bloków JS (NocoBase 2.0)

W NocoBase 2.0 mogą Państwo używać bloków JS do dynamicznego tworzenia iframe'ów, co zapewnia większą kontrolę. Takie podejście oferuje większą elastyczność w dostosowywaniu zachowania i stylów iframe'ów.

### Podstawowy przykład

Proszę utworzyć blok JS i użyć poniższego kodu, aby stworzyć iframe:

```javascript
// Tworzy iframe, który wypełnia bieżący kontener bloku
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Zastępuje istniejące elementy potomne, tak aby iframe był jedyną zawartością
ctx.element.replaceChildren(iframe);
```

### Kluczowe punkty

- **ctx.element**: Element DOM bieżącego kontenera bloku JS
- **atrybut sandbox**: Kontroluje ograniczenia bezpieczeństwa dla zawartości iframe
  - `allow-scripts`: Pozwala iframe'owi wykonywać skrypty
  - `allow-same-origin`: Pozwala iframe'owi na dostęp do własnego źródła
- **replaceChildren()**: Zastępuje wszystkie elementy potomne kontenera iframe'em

### Zaawansowany przykład ze stanem ładowania

Mogą Państwo wzbogacić tworzenie iframe'ów o stany ładowania i obsługę błędów:

```javascript
// Wyświetla komunikat o ładowaniu
ctx.message.loading('Ładowanie zawartości zewnętrznej...');

try {
  // Tworzy iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Dodaje nasłuchiwanie zdarzenia ładowania
  iframe.addEventListener('load', () => {
    ctx.message.success('Zawartość załadowana pomyślnie');
  });

  // Dodaje nasłuchiwanie zdarzenia błędu
  iframe.addEventListener('error', () => {
    ctx.message.error('Nie udało się załadować zawartości');
  });

  // Wstawia iframe do kontenera
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Błąd podczas tworzenia iframe: ' + error.message);
}
```

### Kwestie bezpieczeństwa

Korzystając z iframe'ów, proszę wziąć pod uwagę następujące najlepsze praktyki bezpieczeństwa:

1.  **Używaj HTTPS**: Zawsze, gdy to możliwe, ładuj zawartość iframe przez HTTPS.
2.  **Ogranicz uprawnienia Sandbox**: Włączaj tylko niezbędne uprawnienia sandbox.
3.  **Polityka bezpieczeństwa treści (CSP)**: Skonfiguruj odpowiednie nagłówki CSP.
4.  **Polityka tego samego pochodzenia (Same-Origin Policy)**: Pamiętaj o ograniczeniach między domenami.
5.  **Zaufane źródła**: Ładuj treści tylko z zaufanych domen.