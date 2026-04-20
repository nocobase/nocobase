:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/runjs/context/import-async).
:::

# ctx.importAsync()

Chargez dynamiquement des **modules ESM** ou du **CSS** via une URL, applicable à divers scénarios RunJS. Utilisez `ctx.importAsync()` lorsque des bibliothèques ESM tierces sont requises, et `ctx.requireAsync()` pour les bibliothèques UMD/AMD. Passer une adresse `.css` chargera et injectera les styles dans la page.

## Cas d'utilisation

| Scénario | Description |
|------|------|
| **JSBlock** | Chargez dynamiquement des bibliothèques ESM telles que Vue, ECharts ou Tabulator pour implémenter des graphiques, tableaux ou tableaux de bord personnalisés, etc. |
| **JSField / JSItem / JSColumn** | Chargez des bibliothèques utilitaires ESM légères (ex : plugins dayjs) pour faciliter le rendu. |
| **Flux de travail / Événements d'action** | Chargez les dépendances à la demande avant d'exécuter la logique métier. |

## Définition du type

```ts
importAsync<T = any>(url: string): Promise<T>;
```

## Paramètres

| Paramètre | Type | Description |
|------|------|------|
| `url` | `string` | L'adresse du module ESM ou du CSS. Prend en charge le format abrégé `<paquet>@<version>` ou les sous-chemins `<paquet>@<version>/<chemin-du-fichier>` (ex : `vue@3.4.0`, `dayjs@1/plugin/relativeTime.js`), qui seront concaténés avec le préfixe CDN selon la configuration. Les URLs complètes sont également prises en charge. Lorsqu'un fichier `.css` est passé, il sera chargé et injecté en tant que style. Pour les bibliothèques dépendant de React, vous pouvez ajouter `?deps=react@18.2.0,react-dom@18.2.0` pour vous assurer qu'elles partagent la même instance React que la page. |

## Valeur de retour

- Une Promise qui se résout en l'objet d'espace de noms (namespace) du module.

## Description du format d'URL

- **ESM et CSS** : En plus des modules ESM, le chargement de CSS est également pris en charge (passez une URL `.css` pour le charger et l'injecter dans la page).
- **Format abrégé** : Par défaut, **https://esm.sh** est utilisé comme préfixe CDN s'il n'est pas configuré. Par exemple, `vue@3.4.0` appelle réellement `https://esm.sh/vue@3.4.0`.
- **?deps** : Les bibliothèques qui dépendent de React (comme `@dnd-kit/core`, `react-big-calendar`) doivent ajouter `?deps=react@18.2.0,react-dom@18.2.0` pour éviter les conflits avec l'instance React de la page, ce qui pourrait entraîner des erreurs "Invalid hook call".
- **CDN auto-hébergé** : Vous pouvez spécifier un réseau interne ou un service auto-hébergé via des variables d'environnement :
  - **ESM_CDN_BASE_URL** : L'URL de base pour le CDN ESM (par défaut `https://esm.sh`).
  - **ESM_CDN_SUFFIX** : Suffixe optionnel (ex : `/+esm` pour jsDelivr).
  - Pour les services auto-hébergés, consultez : [nocobase/esm-server](https://github.com/nocobase/esm-server)

## Différence avec ctx.requireAsync()

- **ctx.importAsync()** : Charge des **modules ESM** et renvoie l'espace de noms du module. Adapté aux bibliothèques modernes (builds ESM comme Vue, dayjs, etc.).
- **ctx.requireAsync()** : Charge des modules **UMD/AMD** ou des scripts qui s'attachent à la portée globale. Souvent utilisé pour des bibliothèques UMD comme ECharts ou FullCalendar. Si une bibliothèque fournit à la fois ESM et UMD, `ctx.importAsync()` est préférable.

## Exemples

### Usage de base

Démontre l'utilisation la plus simple du chargement dynamique de modules ESM et de CSS par nom de paquet ou URL complète.

```javascript
const Vue = await ctx.importAsync('vue@3.4.0');
// Équivalent au chargement depuis https://esm.sh/vue@3.4.0

const relativeTime = await ctx.importAsync('dayjs@1/plugin/relativeTime.js');
// Avec sous-chemin (ex : plugin dayjs)

const pkg = await ctx.importAsync('https://cdn.example.com/my-module.js');
// URL complète

await ctx.importAsync('https://cdn.example.com/theme.css');
// Charge le CSS et l'injecte dans la page
```

### Exemple ECharts

Utilisez ECharts pour dessiner un graphique d'aperçu des ventes avec des diagrammes en barres et des courbes.

```ts
// 1. Charger dynamiquement le module ECharts
const echarts = await ctx.importAsync('echarts@5.4.3');

// 2. Créer le conteneur du graphique et effectuer le rendu
const chartEl = document.createElement('div');
chartEl.style.width = '100%';
chartEl.style.height = '400px';
ctx.render(chartEl);

// 3. Initialiser l'instance ECharts
const chart = echarts.init(chartEl);

// 4. Configurer le graphique
const option = {
  title: {
    text: 'Aperçu des ventes',
    left: 'center',
  },
  tooltip: {
    trigger: 'axis',
  },
  legend: {
    data: ['Ventes', 'Profit'],
    top: '10%',
  },
  xAxis: {
    type: 'category',
    data: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
  },
  yAxis: {
    type: 'value',
  },
  series: [
    {
      name: 'Ventes',
      type: 'bar',
      data: [120, 200, 150, 80, 70, 110],
    },
    {
      name: 'Profit',
      type: 'line',
      data: [20, 40, 30, 15, 12, 25],
    },
  ],
};

// 5. Appliquer les options et rendre le graphique
chart.setOption(option);

// 6. Optionnel : Redimensionnement réactif
window.addEventListener('resize', () => {
  chart.resize();
});

// 7. Optionnel : Écouteur d'événement
chart.on('click', (params) => {
  ctx.message.info(`Clic sur ${params.seriesName} pour ${params.name}, valeur : ${params.value}`);
});
```

### Exemple Tabulator

Démontre le rendu d'un tableau de données avec pagination et événements de clic sur les lignes dans un bloc à l'aide de Tabulator.

```ts
// 1. Charger les styles Tabulator
await ctx.importAsync('tabulator-tables@6.2.5/dist/css/tabulator.min.css');

// 2. Charger dynamiquement le module Tabulator
const { TabulatorFull } = await ctx.importAsync('tabulator-tables@6.2.5');

// 3. Créer le conteneur du tableau et effectuer le rendu
const tableEl = document.createElement('div');
ctx.render(tableEl);

// 4. Initialiser le tableau Tabulator
const table = new TabulatorFull(tableEl, {
  data: [
    { id: 1, name: 'Alice', age: 25, city: 'Paris' },
    { id: 2, name: 'Bob', age: 30, city: 'Lyon' },
    { id: 3, name: 'Charlie', age: 28, city: 'Marseille' },
  ],
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    { title: 'Nom', field: 'name', width: 150 },
    { title: 'Âge', field: 'age', width: 100 },
    { title: 'Ville', field: 'city', width: 150 },
  ],
  layout: 'fitColumns',
  pagination: true,
  paginationSize: 10,
});

// 5. Optionnel : Écouteur d'événement
table.on('rowClick', (e, row) => {
  const rowData = row.getData();
  ctx.message.info(`Ligne cliquée : ${rowData.name}`);
});
```

### Exemple FullCalendar (ESM)

Montre comment charger FullCalendar et ses plugins via ESM et rendre un calendrier de base en vue mensuelle.

```ts
// 1. Charger dynamiquement le module core de FullCalendar
const { Calendar } = await ctx.importAsync('@fullcalendar/core@6.1.20');

// 2. Charger dynamiquement le plugin dayGrid
const dayGridPlugin = await ctx.importAsync('@fullcalendar/daygrid@6.1.20');

// 3. Créer le conteneur du calendrier et effectuer le rendu
const calendarEl = document.createElement('div');
calendarEl.id = 'calendar';
ctx.render(calendarEl);

// 4. Initialiser et rendre le calendrier
const calendar = new Calendar(calendarEl, {
  plugins: [dayGridPlugin.default || dayGridPlugin],
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth',
  },
});

calendar.render();
```

### Exemple de glisser-déposer simple dnd-kit

Utilise `@dnd-kit/core` pour implémenter un exemple minimal de déplacement d'une boîte (Box) vers une zone cible dans un bloc.

```ts
// 1. Charger React, react-dom, @dnd-kit/core (?deps assure la même instance React pour éviter Invalid hook call)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const core = await ctx.importAsync('@dnd-kit/core@6.3.1?deps=react@18.2.0,react-dom@18.2.0');
const { DndContext, closestCenter, PointerSensor, useSensor, useSensors, useDraggable, useDroppable } = core;

function DraggableBox() {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'box' });
  const style = {
    padding: 12,
    marginBottom: 8,
    background: '#e6f7ff',
    cursor: 'grab',
    transform: transform ? 'translate3d(' + transform.x + 'px,' + transform.y + 'px,0)' : undefined,
  };
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, 'Glissez-moi');
}

function DropZone() {
  const { setNodeRef, isOver } = useDroppable({ id: 'zone' });
  return React.createElement(
    'div',
    {
      ref: setNodeRef,
      style: { padding: 24, background: isOver ? '#b7eb8f' : '#f5f5f5', borderRadius: 8, minHeight: 80 },
    },
    'Déposez ici',
  );
}

function App() {
  const sensors = useSensors(useSensor(PointerSensor));
  function onDragEnd(e) {
    if (e.over && e.over.id === 'zone') ctx.message.success('Déposé dans la zone');
  }
  return React.createElement(
    DndContext,
    { sensors, collisionDetection: closestCenter, onDragEnd },
    React.createElement(
      'div',
      { style: { maxWidth: 280 } },
      React.createElement(DraggableBox),
      React.createElement(DropZone),
    ),
  );
}

// 2. Rendu
ctx.render(<App />);
```

Cet exemple s'appuie uniquement sur `@dnd-kit/core` pour déclencher une notification lorsqu'une boîte est déposée dans une zone spécifique, illustrant l'interaction de glisser-déposer la plus simple combinant `ctx.importAsync` et React dans RunJS.

### Exemple de liste triable dnd-kit

Implémente une liste triable verticalement en utilisant le core, le module sortable et les utilitaires de dnd-kit.

```ts
// 1. Charger React et les paquets liés à dnd-kit (?deps assure la même instance React)
const React = await ctx.importAsync('react@18.2.0');
const { createRoot } = await ctx.importAsync('react-dom@18.2.0/client');
const dndCore = await ctx.importAsync('@dnd-kit/core@6.3.1?deps=react@18.2.0,react-dom@18.2.0');
const dndSortable = await ctx.importAsync('@dnd-kit/sortable@10.0.0?deps=react@18.2.0,react-dom@18.2.0');
const dndUtils = await ctx.importAsync('@dnd-kit/utilities@3.2.2');

const { useState } = React;
const { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } = dndCore;
const {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} = dndSortable;
const { CSS } = dndUtils;

// 2. Composant SortableItem (doit être à l'intérieur de SortableContext)
function SortableItem(props) {
  const { id, label } = props;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    padding: '12px 16px',
    marginBottom: 8,
    background: '#f5f5f5',
    borderRadius: 6,
    cursor: 'grab',
  };
  return React.createElement('div', { ref: setNodeRef, style, ...attributes, ...listeners }, label);
}

// 3. App : DndContext + SortableContext + Gestionnaire de fin de glissement
const labels = { 1: 'Premier', 2: 'Deuxième', 3: 'Troisième', 4: 'Quatrième' };
function App() {
  const [items, setItems] = useState([1, 2, 3, 4]);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
      ctx.message.success('Liste réordonnée');
    }
  }

  return React.createElement(
    DndContext,
    {
      sensors,
      collisionDetection: closestCenter,
      onDragEnd: handleDragEnd,
    },
    React.createElement(
      SortableContext,
      { items, strategy: verticalListSortingStrategy },
      React.createElement(
        'div',
        { style: { maxWidth: 320 } },
        items.map((id) => React.createElement(SortableItem, { key: id, id, label: labels[id] })),
      ),
    ),
  );
}

// 4. Créer le conteneur et monter React
const rootEl = document.createElement('div');
ctx.render(rootEl);
createRoot(rootEl).render(React.createElement(App));
```

Cet exemple utilise `@dnd-kit/core`, `@dnd-kit/sortable` et `@dnd-kit/utilities` pour implémenter une liste triable qui met à jour son ordre et affiche un message "Liste réordonnée" après le glissement.

### Exemple react-big-calendar

Affiche un composant de calendrier prenant en charge l'affichage d'événements dans le bloc actuel en utilisant `react-big-calendar` et `date-fns` pour la localisation.

```tsx
// 1. Charger les styles (ctx.importAsync utilise ctx.loadCSS pour les fichiers .css)
await ctx.importAsync('react-big-calendar@1.11.4/lib/css/react-big-calendar.css');

// 2. Charger React, react-dom, react-big-calendar, date-fns et la locale (en assurant la même instance React)
const React = await ctx.importAsync('react@18.2.0');
const { Calendar, dateFnsLocalizer } = await ctx.importAsync('react-big-calendar@1.11.4?deps=react@18.2.0,react-dom@18.2.0');
const { format, parse, startOfWeek, getDay } = await ctx.importAsync('date-fns@2.30.0');
const enUS = await ctx.importAsync('date-fns@2.30.0/locale/en-US.js');

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { 'en-US': enUS },
});

const events = [
  { title: 'Événement toute la journée', start: new Date(2026, 0, 28), end: new Date(2026, 0, 28), allDay: true },
  { title: 'Réunion', start: new Date(2026, 0, 29, 10, 0), end: new Date(2026, 0, 29, 11, 0) },
];

// 3. Rendu du calendrier React
ctx.render(
  <Calendar
    localizer={localizer}
    events={events}
    startAccessor="start"
    endAccessor="end"
    style={{ height: '80vh' }}
  />
);
```

### Exemple frappe-gantt

Utilise `frappe-gantt` pour afficher une vue de diagramme de Gantt montrant les heures de début/fin des tâches et leur progression.

```ts
// 1. Charger dynamiquement les styles et le constructeur de Gantt
// Dépend de ESM_CDN_BASE_URL (par défaut https://esm.sh), les chemins abrégés peuvent être utilisés
await ctx.importAsync('frappe-gantt@1.0.4/dist/frappe-gantt.css');
const Gantt = await ctx.importAsync('frappe-gantt@1.0.4');

// 2. Préparer les données des tâches
let tasks = [
  {
    id: '1',
    name: 'Refonte du site web',
    start: '2016-12-28',
    end: '2016-12-31',
    progress: 20,
  },
  {
    id: '2',
    name: 'Développement nouvelle fonctionnalité',
    start: '2017-01-01',
    end: '2017-01-05',
    progress: 40,
    dependencies: '1',
  },
  {
    id: '3',
    name: 'QA & tests',
    start: '2017-01-06',
    end: '2017-01-10',
    progress: 10,
    dependencies: '2',
  },
];

// 3. Créer le conteneur et effectuer le rendu
const ganttEl = document.createElement('div');
ganttEl.id = 'gantt';
ganttEl.style.height = '400px';
ctx.render(ganttEl);

// 4. Initialiser le diagramme de Gantt
let gantt = new Gantt('#gantt', tasks, {
  view_mode: 'Day', // Granularité de la vue : 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'
  language: 'fr',
  bar_height: 24,
  padding: 18,
  custom_popup_html(task) {
    return `
      <div class="details-container">
        <h5>${task.name}</h5>
        <p>Début : ${task._start.toISOString().slice(0, 10)}</p>
        <p>Fin : ${task._end.toISOString().slice(0, 10)}</p>
        <p>Progression : ${task.progress}%</p>
      </div>
    `;
  },
});
```

### Exemple @asseinfo/react-kanban

Utilise `@asseinfo/react-kanban` pour afficher un tableau Kanban de base avec des colonnes comme Backlog et Doing dans un bloc.

```ts
// 1. Charger les styles (ctx.importAsync charge directement le .css)
await ctx.importAsync('@asseinfo/react-kanban@2.2.0/dist/styles.css');

// 2. Charger React, react-dom, @asseinfo/react-kanban (?deps assure la même instance React)
const React = await ctx.importAsync('react@18.2.0');
const { default: Board } = await ctx.importAsync('@asseinfo/react-kanban@2.2.0?deps=react@18.2.0,react-dom@18.2.0');

const board = {
  columns: [
    {
      id: 1,
      title: 'Backlog',
      cards: [
        { id: 1, title: 'Ajouter une carte', description: 'Ajouter la capacité d\'ajouter une carte dans une colonne' },
      ],
    },
    {
      id: 2,
      title: 'En cours',
      cards: [
        { id: 2, title: 'Support glisser-déposer', description: 'Déplacer une carte entre les colonnes' },
      ],
    },
  ],
};

// 4. Monter le tableau
ctx.render(<Board initialBoard={board} />);
```

## Remarques

- Cette fonctionnalité dépend d'un réseau externe ou d'un CDN. Dans les environnements réseau internes, **ESM_CDN_BASE_URL** doit être configuré pour pointer vers un service auto-hébergé.
- Lorsqu'une bibliothèque fournit à la fois ESM et UMD, préférez `ctx.importAsync()` pour une meilleure sémantique de module.
- Pour les bibliothèques dépendant de React, assurez-vous d'ajouter `?deps=react@18.2.0,react-dom@18.2.0`. La version doit correspondre à la version React utilisée par la page, sinon une erreur "Invalid hook call" peut survenir.

## Liens connexes

- [ctx.requireAsync()](./require-async.md) : Charge des scripts UMD/AMD ou attachés globalement, adapté aux bibliothèques UMD comme ECharts et FullCalendar.
- [ctx.render()](./render.md) : Rendu du contenu dans un conteneur.