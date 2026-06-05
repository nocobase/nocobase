---
pkg: "@nocobase/plugin-block-iframe"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Bloc Iframe

## Introduction

Le bloc Iframe vous permet d'intégrer des pages web ou du contenu externe dans la page actuelle. Vous pouvez intégrer facilement des applications externes en configurant une URL ou en insérant directement du code HTML. Avec le HTML, vous pouvez personnaliser le contenu de manière flexible pour répondre à des besoins d'affichage spécifiques, ce qui est idéal pour les scénarios personnalisés. Cette approche permet de charger des ressources externes sans redirection, améliorant ainsi l'expérience utilisateur et l'interactivité de la page.

## Installation

C'est un plugin intégré, aucune installation n'est requise.

## Ajouter des blocs

![20240408220259](https://static-docs.nocobase.com/20240408220259.png)

Configurez l'URL ou le HTML pour intégrer directement l'application externe.

![20240408220322](https://static-docs.nocobase.com/20240408220322.png)

## Moteur de template

### Template de chaîne

Le moteur de template par défaut.

### Handlebars

![20240811205239](https://static-docs.nocobase.com/20240811205239.png)

Pour plus d'informations, consultez la documentation du moteur de template Handlebars.

## Passer des variables

### Prise en charge de l'analyse des variables en HTML

#### Prise en charge de la sélection de variables à partir du sélecteur de variables dans le contexte du bloc actuel

![20240603120321](https://static-docs.nocobase.com/20240603120321.png)

![20240603120629](https://static-docs.nocobase.com/20240603120629.gif)

#### Prise en charge de l'injection et de l'utilisation de variables dans l'application via du code

Vous pouvez également injecter des variables personnalisées dans l'application via du code et les utiliser en HTML. Par exemple, pour créer une application de calendrier dynamique avec Vue 3 et Element Plus :

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

Exemple : Un composant de calendrier simple créé avec React et Ant Design (antd), utilisant dayjs pour gérer les dates

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

### L'URL prend en charge les variables

![20240603142219](https://static-docs.nocobase.com/20240603142219.png)

Pour plus d'informations sur les variables, consultez la documentation sur les variables.

## Créer des Iframes avec des blocs JS (NocoBase 2.0)

Dans NocoBase 2.0, vous pouvez utiliser des blocs JS pour créer dynamiquement des iframes avec plus de contrôle. Cette approche offre une meilleure flexibilité pour personnaliser le comportement et le style des iframes.

### Exemple de base

Créez un bloc JS et utilisez le code suivant pour créer une iframe :

```javascript
// Crée une iframe qui remplit le conteneur du bloc actuel
const iframe = document.createElement('iframe');
iframe.src = 'https://example.com';
iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
iframe.style.width = '100%';
iframe.style.height = '100%';
iframe.style.border = 'none';

// Remplace les éléments enfants existants pour que l'iframe soit le seul contenu
ctx.element.replaceChildren(iframe);
```

### Points clés

- **ctx.element** : L'élément DOM du conteneur du bloc JS actuel.
- **attribut sandbox** : Contrôle les restrictions de sécurité pour le contenu de l'iframe.
  - `allow-scripts` : Permet à l'iframe d'exécuter des scripts.
  - `allow-same-origin` : Permet à l'iframe d'accéder à sa propre origine.
- **replaceChildren()** : Remplace tous les enfants du conteneur par l'iframe.

### Exemple avancé avec état de chargement

Vous pouvez améliorer la création d'iframes avec des états de chargement et la gestion des erreurs :

```javascript
// Affiche un message de chargement
ctx.message.loading('正在加载外部内容...');

try {
  // Crée l'iframe
  const iframe = document.createElement('iframe');
  iframe.src = 'https://example.com';
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';

  // Ajoute un écouteur d'événement de chargement
  iframe.addEventListener('load', () => {
    ctx.message.success('内容加载成功');
  });

  // Ajoute un écouteur d'événement d'erreur
  iframe.addEventListener('error', () => {
    ctx.message.error('加载内容失败');
  });

  // Insère l'iframe dans le conteneur
  ctx.element.replaceChildren(iframe);
} catch (error) {
  ctx.message.error('创建 iframe 出错: ' + error.message);
}
```

### Considérations de sécurité

Lorsque vous utilisez des iframes, tenez compte des meilleures pratiques de sécurité suivantes :

1.  **Utilisez HTTPS** : Chargez toujours le contenu de l'iframe via HTTPS lorsque c'est possible.
2.  **Restreignez les permissions Sandbox** : N'activez que les permissions sandbox nécessaires.
3.  **Politique de sécurité du contenu (CSP)** : Configurez les en-têtes CSP appropriés.
4.  **Politique de même origine** : Soyez conscient des restrictions inter-origines.
5.  **Sources fiables** : Ne chargez du contenu qu'à partir de domaines fiables.