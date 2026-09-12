---
title: "Utilisez NocoBase pour créer un tableau de bord opérationnel pouvant être lié"
description: "En prenant le tableau de bord des opérations des bons de travail comme exemple, le bloc graphique, le bloc filtre et le bloc JS sont combinés pour obtenir un filtrage unifié, des KPI, une analyse détaillée des graphiques et des styles personnalisés."
keywords: "NocoBase, tableau de bord opérationnel, visualisation des données, bloc graphique, bloc filtre, bloc JS, exploration graphique"
---

# Utilisez NocoBase pour créer un tableau de bord opérationnel pouvant être lié

Cet article prend le tableau de bord d'exploitation du « système de bons de travail » comme exemple pour présenter comment utiliser le bloc de graphique, le bloc de filtre et le bloc JS de NocoBase en combinaison pour créer un tableau de bord de données qui prend en charge la liaison de filtres, l'exploration des graphiques et les styles personnalisés.

Bien que les exemples proviennent de scénarios d'ordres de travail, ces méthodes sont également applicables aux systèmes d'entreprise tels que le CRM, les opérations d'équipement, la gestion de projet, le flux d'approbation, la réussite des clients, etc.

:::tip
Ce que cet article veut présenter n'est pas « comment utiliser les blocs JS pour écrire un grand écran », mais comment combiner les capacités de blocs natifs de NocoBase et les blocs JS : laissez les blocs natifs être responsables des capacités standard et laissez les blocs JS compléter l'expérience personnalisée.
:::

![](https://static-docs.nocobase.com/202607121920705.png)

## cible de la scène

Nous espérons créer un tableau de bord des opérations pour aider l'équipe d'exploitation ou de service à déterminer rapidement la charge de travail actuelle :

- Combien de bons de travail ouverts y a-t-il actuellement ?
- Quels ordres de travail présentent un risque SLA ?
- Quelle est la tendance des nouveaux bons de travail ?
- Quel est le statut et la répartition des priorités des bons de travail ?
- Après avoir cliqué sur un graphique, vous pouvez visualiser les détails correspondants

La page peut être grossièrement divisée en quatre couches :

1. Zone de filtre supérieure : heure, groupe de services, type de demande, priorité, statut SLA
2. Zone de statistiques KPI : Backlog ouvert, Non attribué, avertissement SLA, etc.
3. Zone d'analyse du graphique : tendance, statut, SLA, répartition des priorités
4. Zone de détail détaillée : cliquez sur le graphique pour afficher les enregistrements correspondants.

## Tout d’abord, clarifiez une idée de construction

Lorsque de nombreuses personnes créent des tableaux de bord de données, elles ont tendance à considérer le problème comme l'une des deux options suivantes :

Soit vous utilisez tous les blocs natifs de NocoBase, simples à configurer, mais craignez que le style et l'interaction ne soient pas assez flexibles ; ou écrivez simplement un gros bloc JS et contrôlez vous-même la requête, le graphique, le filtrage et l'exploration, mais cela perdra la commodité apportée par la configuration low-code.

En fait, la méthode la plus recommandée consiste à combiner les deux.

Dans ce tableau de bord Opérations, nous n'avons pas écrit la page entière sous la forme d'un grand écran JS, mais l'avons divisée selon les responsabilités :

- Le filtrage supérieur utilise le bloc de filtrage fourni avec le système NocoBase ;
- Les graphiques de tendances, la distribution des statuts et la distribution SLA utilisent des blocs de graphiques natifs ;
- Les cartes KPI et les détails détaillés utilisent des blocs JS ;
- Les blocs de filtre affectent à la fois les blocs de graphiques et les blocs JS ;
- Après avoir cliqué sur le graphique, les conditions d'exploration sont transmises au bloc de détails JS ci-dessous.

L'avantage est que les statistiques et le filtrage standards conservent toujours les capacités de configuration de NocoBase, tandis que l'affichage personnalisé et les interactions complexes sont complétés par des blocs JS. La page n'est ni "configurable uniquement" ni "tout le code", mais la configuration et le code remplissent chacun leurs propres tâches.

---

## 1. Comment personnaliser le style du bloc graphique

![](https://static-docs.nocobase.com/202607121920941.png)

Le bloc graphique de NocoBase peut d'abord utiliser le générateur de requêtes pour définir le calibre statistique, puis utiliser l'option ECharts personnalisée pour ajuster le style.

En prenant comme exemple les « statistiques sur l'état des bons de travail », le générateur de requêtes peut être configuré comme :

- Fiche technique : billets
- Métriques : nombre d'identifiants, alias ticketCount
- Dimensions : statut

La clé est que lors de la personnalisation du style, vous n'avez pas besoin de réécrire la requête, il vous suffit de traiter l'affichage du graphique en fonction de `ctx.data.objects`.

```javascript
const rows = Array.isArray(ctx.data?.objects) ? ctx.data.objects : [];
```

Cette ligne de code lit les résultats de la requête de graphique. Définissez ensuite les étiquettes d'état et les couleurs :

```javascript
const labels = {
  new: ctx.t('New'),
  open: ctx.t('Open'),
  pending_customer: ctx.t('Pending customer'),
  resolved: ctx.t('Resolved'),
  closed: ctx.t('Closed'),
};

const colors = {
  new: '#1677ff',
  open: '#22a06b',
  pending_customer: '#f59f00',
  resolved: '#13c2c2',
  closed: '#8c8c8c',
};
```

Il est recommandé que toutes les rédactions visibles utilisent `ctx.t()` pour faciliter la prise en charge multilingue ultérieure.

Lors de la génération de données de graphique, vous pouvez joindre des informations détaillées à chaque point de données du graphique :

```javascript
const data = rows.map((row) => ({
  value: Number(row.ticketCount || 0),
  itemStyle: {
    color: colors[row.status] || '#8c8c8c',
    borderRadius: [6, 6, 0, 0],
  },
  ticketingDrilldown: {
    label: ctx.t('Status') + ': ' + (labels[row.status] || row.status),
    filter: { status: { $eq: row.status } },
  },
}));
```

La chose la plus critique ici est `ticketingDrilldown`. Il ne s'agit pas d'un champ standard d'ECharts, mais d'un contexte métier que nous mettons nous-mêmes, qui sera utilisé ultérieurement en cliquant sur le graphique.

Revenez enfin à l’option ECharts :

```javascript
return {
  grid: { top: 28, right: 22, bottom: 48, left: 42 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  xAxis: {
    type: 'category',
    data: rows.map((row) => labels[row.status] || row.status),
  },
  yAxis: {
    type: 'value',
    minInterval: 1,
  },
  series: [
    {
      name: ctx.t('Tickets'),
      type: 'bar',
      barWidth: 36,
      data,
    },
  ],
};
```

L'idée centrale de cette partie est :

- Le générateur de requêtes est responsable des statistiques ;
- L'option personnalisée est responsable de l'expression visuelle ;
- Les champs personnalisés sont chargés de transmettre le contexte d'exploration.

---

## 2. Laissez le bloc de filtre système devenir la portée d'observation de la page entière

![](https://static-docs.nocobase.com/202607121920687.png)

La zone de filtre dans le tableau de bord opérationnel ne doit pas être simplement un formulaire isolé. Il représente le diamètre d'observation actuel de la page entière.

Par exemple, si l'utilisateur sélectionne un groupe de services, un type de demande et une heure de création, les KPI, les graphiques de tendance, la distribution des statuts et les détails détaillés doivent tous être affichés en fonction du même ensemble de conditions. Sinon, les nombres dans les différents blocs de la page se combattront et il sera difficile pour les utilisateurs de juger quelles données constituent le résultat dans la plage actuelle.

Ici, nous utilisons directement le bloc de filtrage fourni avec le système NocoBase au lieu d'écrire nous-mêmes un composant de filtrage. Les blocs de filtre natifs peuvent être naturellement liés aux blocs de graphique, permettant au bloc de graphique de continuer à utiliser le générateur de requêtes, les autorisations, les mécanismes d'actualisation et de filtrage.

Top `Dashboard scope` peut configurer ces éléments de filtre :

- Created at
- Service group
- Request type
- Priority
- SLA status

Pour les blocs JS, il vous suffit de lire le même ensemble de conditions de filtre dans le code, puis de les convertir en filtres de requête. De cette manière, les KPI et les détails détaillés peuvent également être cohérents avec le graphique natif.

La combinaison des conditions de filtre peut être encapsulée dans une petite fonction :

```javascript
function combineFilters(...filters) {
  const parts = filters.filter(Boolean);
  if (!parts.length) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}
```

Compter par filtre :

```javascript
async function countTickets(filter) {
  const resource = ctx.makeResource('MultiRecordResource');
  resource.setResourceName('tickets');
  resource.setPageSize(1);

  if (filter) {
    resource.setFilter(filter);
  }

  await resource.refresh();

  const meta = resource.getMeta?.() || {};
  return Number(meta.count || meta.total || 0);
}
```

Les points clés ici sont :

```javascript
resource.setFilter(filter);
await resource.refresh();
```

Le bloc JS interroge les données commerciales via des ressources au lieu d'écrire directement du SQL. Cela facilite le maintien de la cohérence avec les autorisations, les sources de données et les durées d'exécution des pages de NocoBase.

---

## 3. Utilisez des blocs JS pour afficher les cartes KPI

![](https://static-docs.nocobase.com/202607121920374.png)

Les KPI sont mieux adaptés à l’utilisation des blocs JS. Parce que les KPI ne sont généralement pas une requête unique, mais une combinaison de plusieurs calibres commerciaux : inachevé, non attribué, avertissement SLA, violation du SLA, nouveau, résolu, etc.

Le bloc JS peut réinterroger les données en fonction de la plage de filtrage actuelle et les restituer dans une carte statistique.

```javascript
const { Card, Col, Row, Statistic, Tag } = ctx.libs.antd;

const scopeFilter = getDashboardScopeFilter();

const openBacklog = await countTickets(
  combineFilters(scopeFilter, {
    status: { $notIn: ['resolved', 'closed', 'cancelled'] },
  }),
);

ctx.render(
  <Row gutter={[12, 12]}>
    <Col span={6}>
      <Card size="small">
        <Tag color="blue">{ctx.t('Active')}</Tag>
        <Statistic title={ctx.t('Open backlog')} value={openBacklog} />
      </Card>
    </Col>
  </Row>,
);
```

Les points clés des blocs JS sont :

- Utilisez `ctx.makeResource()` pour interroger les données ;
- Utilisez `ctx.libs.antd` pour restituer l'interface ;
- Utilisez `ctx.render()` pour générer du contenu ;
- Rendre les morceaux JS après avoir filtré les modifications.

Dans une page réelle, le bouton de filtre et le bouton de réinitialisation peuvent configurer le flux d'événements afin qu'ils actualisent le bloc KPI JS et le bloc JS approfondi en même temps après avoir terminé l'action de filtre native. De cette façon, l'utilisateur clique une fois pour filtrer, et les graphiques et le contenu personnalisé seront mis à jour sur la même plage.

---

## 4. Bloc JS de liaison graphique pour l'exploration

![](https://static-docs.nocobase.com/202607121921577.png)

Cliquer sur le graphique pour explorer est une interaction très pratique dans le tableau de bord.

Dans le scénario d'ordre de travail, l'utilisateur clique sur la colonne « Statut : Ouvert » et tous les ordres de travail ouverts sont affichés dans la zone de détail ci-dessous ; lorsque l'utilisateur clique sur « SLA rompu », tous les ordres de travail d'heures supplémentaires sont affichés ci-dessous.

L'idée de mise en œuvre est la suivante :

1. Les points de données du graphique portent `ticketingDrilldown` ;
2. L'événement graphique lit ces informations détaillées ;
3. Écrivez les informations détaillées dans le contexte du bloc JS cible ;
4. Déclenchez le bloc JS cible pour effectuer un nouveau rendu.

Le code clé dans l'événement graphique est le suivant. Recherchez d’abord le bloc JS détaillé :

```javascript
const DRILLDOWN_TARGET_UID = 'v7mioopm6rm';

function getDrilldownTarget() {
  if (typeof ctx.getModel === 'function') {
    return ctx.getModel(DRILLDOWN_TARGET_UID);
  }

  const engine =
    ctx.model?.flowEngine || ctx.model?.context?.flowEngine || ctx.engine;
  return engine?.getModel?.(DRILLDOWN_TARGET_UID);
}
```

Écrivez ensuite les conditions de forage obtenues en cliquant sur le graphique dans le bloc cible :

```javascript
function applyDrilldown(drilldown) {
  if (!drilldown?.filter) return;

  const target = getDrilldownTarget();
  if (!target?.context?.defineProperty) return;

  target.context.defineProperty('ticketingDashboardDrilldown', {
    value: drilldown,
  });

  target.rerender?.();
}
```

Les plus critiques sont ces deux lignes :

```javascript
target.context.defineProperty('ticketingDashboardDrilldown', {
  value: drilldown,
});
target.rerender?.();
```

La première ligne transmet la condition d'exploration au bloc JS et la deuxième ligne déclenche l'actualisation du bloc JS.

Enfin, liez l'événement de clic sur le graphique :

```javascript
const clickHandler = (params) => {
  applyDrilldown(params?.data?.ticketingDrilldown);
};

chart.on('click', clickHandler);

return () => chart.off('click', clickHandler);
```

Il est recommandé ici de renvoyer le nettoyage :

```javascript
return () => chart.off('click', clickHandler);
```

De cette manière, lorsque le graphique est reconfiguré ou restitué, les anciens événements peuvent être nettoyés pour éviter des liaisons répétées.

Le code lié à l'événement de clic ci-dessus s'applique aux versions [v2.2.0-beta.10](https://github.com/nocobase/nocobase/releases/tag/v2.2.0-beta.10) et supérieures. Référence au code de l'ancienne version :

```javascript
chart.off('click');
chart.on('click', clickHandler);
```

---

## 5. Comment afficher les détails dans les blocs JS détaillés

![](https://static-docs.nocobase.com/202607121921601.png)

Explorez le bloc JS pour lire le `ticketingDashboardDrilldown` qui vient d'être écrit, puis interrogez les données en fonction du filtre qu'il contient.

```javascript
const drilldown = ctx.model?.context?.ticketingDashboardDrilldown;

if (!drilldown) {
  ctx.render(
    <Alert
      type="info"
      showIcon
      message={ctx.t('Select a chart segment to inspect matching tickets')}
    />,
  );
  return;
}
```

Si l'utilisateur n'a pas cliqué sur le graphique, affichez une invite. Après avoir cliqué, interrogez le bon de travail basé sur `drilldown.filter` :

```javascript
const resource = ctx.makeResource('MultiRecordResource');
resource.setResourceName('tickets');
resource.setFilter(drilldown.filter);
resource.setPageSize(10);
await resource.refresh();

const rows = resource.getData?.() || [];
```

Ensuite, restituez le tableau :

```javascript
const { Table, Typography } = ctx.libs.antd;

ctx.render(
  <>
    <Typography.Title level={5}>
      {ctx.t('Drilldown')}: {drilldown.label}
    </Typography.Title>

    <Table
      size="small"
      rowKey="id"
      dataSource={rows}
      pagination={false}
      columns={[
        { title: ctx.t('Ticket No'), dataIndex: 'ticketNo' },
        { title: ctx.t('Title'), dataIndex: 'title' },
        { title: ctx.t('Status'), dataIndex: 'status' },
        { title: ctx.t('Priority'), dataIndex: 'priority' },
      ]}
    />
  </>,
);
```

Si vous devez effacer les conditions d'exploration, vous pouvez vous référer à

```javascript
function clearChartDrilldown() {
  if (ctx.model?.context?.defineProperty) {
    ctx.model.context.defineProperty('ticketingDashboardDrilldown', {
      value: null,
    });
  }
  if (typeof ctx.model?.rerender === 'function') {
    ctx.model.rerender();
  }
}
```

Les points clés de cette partie sont :

- Le graphique est uniquement responsable du passage du filtre ;
- Le bloc JS est responsable de l'interrogation et de l'affichage des détails ;
- Cliquez sur différents graphiques pour partager le même bloc d'exploration.

---

## Suggestions pratiques

### 1. Ne vous précipitez pas pour coder la page complexe dans son ensemble

La leçon la plus importante de cette page est la suivante : n’opposez pas les capacités natives aux capacités JS.

Si une fonctionnalité est déjà une fonctionnalité native de NocoBase, telle que le filtrage, la requête de graphique, l'affichage de tableaux et le contrôle des autorisations, le bloc natif sera utilisé en premier. De cette manière, lorsque les champs, les conditions de filtrage et le calibre du graphique sont ensuite ajustés, ils peuvent toujours être configurés sur l'interface.

Les blocs JS sont plus adaptés au traitement de parties pour lesquelles les blocs natifs ne sont pas bons, comme la combinaison de plusieurs indicateurs dans un ensemble de KPI, des styles de cartes spéciaux, l'affichage d'un ensemble de détails personnalisés après avoir cliqué sur le graphique ou la transmission du contexte commercial entre différents blocs.

En d'autres termes, le bloc natif est responsable des « capacités standard configurables » et le bloc JS est responsable de « l'expérience personnalisée orientée métier ». C'est aussi l'idée de construction la plus réutilisable pour ce tableau de bord.

### 2. Pour des statistiques simples, utilisez d'abord le générateur de requêtes de bloc graphique.

Cela préserve les capacités de requête, d'autorisations, de filtrage et d'actualisation standard de NocoBase. Uniquement lorsque le style de graphique par défaut ne peut pas exprimer l'orientation commerciale, utilisez l'option ECharts personnalisée pour l'optimisation visuelle.

### 3. Les cartes KPI donnent la priorité à l'utilisation des blocs JS

Les KPI nécessitent souvent plusieurs requêtes, combinaisons de conditions et mises en page personnalisées, et les blocs JS sont plus flexibles. Surtout lorsque les KPI doivent répondre au même ensemble de conditions de filtrage du système, il sera plus clair d'utiliser des blocs JS pour les gérer de manière uniforme.

### 4. Les événements graphiques devraient renvoyer un nettoyage

Méthode d'écriture recommandée :

```javascript
const handler = (params) => {
  // handle click
};

chart.on('click', handler);

return () => chart.off('click', handler);
```

N'utilisez pas directement `chart.off('click')` pour effacer tous les événements de clic, car cela pourrait accidentellement supprimer le bloc graphique ou configurer la propre surveillance du panneau.

---

## Laissez l'IA vous aider à le construire

Ce type de tableau de bord est très adapté à la génération assistée par l'IA car il implique à la fois des modèles de données, des calibres statistiques, des styles de graphiques et des interactions de pages. Vous pouvez lui remettre le contenu de cet article et poser des questions en utilisant les mots-clés ci-dessous.

Vous pouvez poser des questions comme celle-ci :

```markdown
J'utilise NocoBase pour créer un tableau de bord opérationnel pour un système de bons de travail.
Veuillez prendre le scénario du bon de travail comme exemple et aidez-moi à concevoir un tableau de bord des opérations.

Les tickets de table de données contiennent :
ticketNo、title、status、priority、slaStatus、
requestType、serviceGroup、assignee、createdAt、updatedAt。

La page nécessite :

1. Filtre supérieur : Créé à, Groupe de services, Type de demande, Priorité, Statut SLA.
2. Cartes KPI : carnet de commandes ouvert, non attribué, avertissement SLA, violation du SLA, nouveaux tickets, tickets résolus.
3. Graphique : tendance des tickets créés, statut du ticket, statut SLA, mélange de priorités.
4. Après avoir cliqué sur le graphique, le bloc JS ci-dessous affiche le tableau détaillé des tickets correspondant.
5. Le style du graphique doit être adapté au marché opérationnel, avec des couleurs claires et une présentation compacte.
6. Utilisez ctx.t() pour toutes les copies JS.
7. Les événements de graphique utilisent chart.on et renvoient la fonction de nettoyage.
8. Priorisez l’utilisation des blocs de filtres et des blocs graphiques natifs de NocoBase. Utilisez uniquement des blocs JS pour les KPI, les détails détaillés, les styles spéciaux et les interactions entre blocs. N'écrivez pas la page entière comme un seul gros bloc JS.

Veuillez donner les idées de configuration pour chaque bloc et marquer le code JS clé.
```

Si vous possédez déjà une page, vous pouvez également laisser l’IA vous aider à l’optimiser :

```markdown
Voici la conception actuelle de mon tableau de bord NocoBase :
En haut se trouve la zone de filtre, au milieu se trouvent 4 graphiques et en dessous se trouve le bloc JS détaillé.
S'il vous plaît, aidez-moi à optimiser du point de vue de l'expérience de l'opérateur :

1. Quels indicateurs le KPI doit-il afficher ?
2. S'il est nécessaire d'établir des liens entre les graphiques ;
3. Quelles colonnes doivent être affichées dans les détails détaillés ;
4. Comment les événements de bloc et de graphique JS doivent-ils être organisés ?
5. Quel code doit être placé dans l'option personnalisée du graphique et lequel doit être placé dans le bloc JS.
```

De cette manière, le contenu généré par l’IA sera plus proche de l’activité réelle, plutôt que de simplement fournir du code isolé.

:::warning
Si vous choisissez de laisser l'IA vous aider à le construire, veuillez utiliser le gestionnaire de sauvegarde pour sauvegarder le projet avant de commencer.
:::

## Documentation de référence

- [Configuration de la carte ](/data-visualization/guide/chart-options)
- [Exécution frontaleJS](/runjs/)
- [Formulaire de filtre ](/interface-builder/blocks/filter-blocks/form)
- [Construction IA - Construction d'interface ](/ai-builder/ui-builder)
- [ECharts Options](https://echarts.apache.org/en/option.html)
