---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip Aviso de tradução por IA
Esta documentação foi traduzida automaticamente por IA.
:::



# Bloco Iframe

## Introdução

O bloco Iframe permite incorporar páginas web ou conteúdo externo na página atual. Você pode integrar aplicativos externos facilmente configurando uma URL ou inserindo diretamente código HTML. Com HTML, você pode personalizar o conteúdo de forma flexível para atender a necessidades específicas de exibição, tornando-o ideal para cenários personalizados. Essa abordagem permite carregar recursos externos sem redirecionamento, melhorando a experiência do usuário e a interatividade da página.

## Instalação

É um plugin integrado, não é necessário instalá-lo.

## Adicionando Blocos

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Configure a URL ou o HTML para incorporar diretamente o aplicativo externo.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Mecanismo de template

### Template de String

O mecanismo de template padrão.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Para mais informações, consulte a documentação do template Handlebars.

## Passando Variáveis

### Suporte HTML para Análise de Variáveis

#### Suporte para Selecionar Variáveis do Seletor de Variáveis no Contexto do Bloco Atual

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Suporte para Injetar Variáveis no Aplicativo e Usá-las via Código

Você também pode injetar variáveis personalizadas no aplicativo via código e usá-las no HTML. Por exemplo, criando um aplicativo de calendário dinâmico usando Vue 3 e Element Plus:

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

Exemplo: Um componente de calendário simples criado com React e Ant Design (antd), usando dayjs para lidar com datas

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

### URL suporta variáveis

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Para mais informações sobre variáveis, consulte a documentação de Variáveis.

## Criando Iframes com Blocos JS (NocoBase 2.0)

No NocoBase 2.0, você pode usar blocos JS para criar iframes dinamicamente com mais controle. Essa abordagem oferece maior flexibilidade para personalizar o comportamento e o estilo do iframe.

### Exemplo Básico

Crie um bloco JS e use o seguinte código para criar um iframe:

```javascript
// Cria um iframe que preenche o contêiner do bloco atual
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Substitui os elementos filhos existentes para que o iframe seja o único conteúdo
ctx.element.replaceChildren(iframe);
```

### Pontos Chave

- **ctx.element**: O elemento DOM do contêiner do bloco JS atual
- **atributo sandbox**: Controla as restrições de segurança para o conteúdo do iframe
  - `allow-scripts`: Permite que o iframe execute scripts
  - `allow-same-origin`: Permite que o iframe acesse sua própria origem
- **replaceChildren()**: Substitui todos os filhos do contêiner pelo iframe

### Exemplo Avançado com Estado de Carregamento

Você pode aprimorar a criação do iframe com estados de carregamento e tratamento de erros:

```javascript
// Exibe uma mensagem de carregamento
ctx.message.loading('Carregando conteúdo externo...');

try {
  // Cria o iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Adiciona um listener para o evento de carregamento
  iframe.addEventListener('load', () => {
    ctx.message.success('Conteúdo carregado com sucesso');
  });

  // Adiciona um listener para o evento de erro
  iframe.addEventListener('error', () => {
    ctx.message.error('Falha ao carregar o conteúdo');
  });

  // Insere o iframe no contêiner
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('Erro ao criar iframe: ' + error.message);
}
```

### Considerações de Segurança

Ao usar iframes, considere as seguintes melhores práticas de segurança:

1. **Use HTTPS**: Sempre carregue o conteúdo do iframe via HTTPS, quando possível
2. **Restrinja as Permissões do Sandbox**: Habilite apenas as permissões de sandbox necessárias
3. **Política de Segurança de Conteúdo (CSP)**: Configure os cabeçalhos CSP apropriados
4. **Política de Mesma Origem**: Esteja ciente das restrições de cross-origin
5. **Fontes Confiáveis**: Carregue conteúdo apenas de domínios confiáveis