:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# ACL

Les ACL (Access Control List) servent à contrôler les permissions d'accès aux ressources. Vous pouvez attribuer des permissions à des rôles, ou contourner les restrictions de rôle pour définir des permissions directes. Le système ACL offre un mécanisme de gestion des permissions flexible, prenant en charge les fragments de permission (snippets), les middlewares, les jugements conditionnels et d'autres approches.

:::tip Attention

Les objets ACL appartiennent aux sources de données (`dataSource.acl`). L'ACL de la source de données principale est accessible via `app.acl`. Pour l'utilisation des ACL des autres sources de données, veuillez consulter le chapitre [Gestion des sources de données](./data-source-manager.md).

:::

## Enregistrer des fragments de permission (Snippets)

Les fragments de permission (Snippets) permettent d'enregistrer des combinaisons de permissions fréquemment utilisées comme des unités de permission réutilisables. Lorsqu'un rôle est lié à un snippet, il obtient l'ensemble de permissions correspondant, ce qui réduit la duplication de configuration et améliore l'efficacité de la gestion des permissions.

```ts
acl.registerSnippet({
  name: 'ui.customRequests', // Le préfixe ui.* indique les permissions configurables via l'interface
  actions: ['customRequests:*'], // Opérations de ressource correspondantes, supporte les caractères génériques
});
```

## Permissions ignorant les contraintes de rôle (`allow`)

`acl.allow()` permet à certaines opérations de contourner les contraintes de rôle. Cette fonction est utile pour les API publiques, les scénarios nécessitant une évaluation dynamique des permissions, ou les cas où la décision de permission doit être basée sur le contexte de la requête.

```ts
// Accès public, aucune connexion requise
acl.allow('app', 'getLang', 'public');

// Accessible aux utilisateurs connectés
acl.allow('app', 'getInfo', 'loggedIn');

// Basé sur une condition personnalisée
acl.allow('orders', ['create', 'update'], (ctx) => {
  return ctx.auth.user?.isAdmin ?? false;
});
```

**Description du paramètre `condition` :**

- `'public'` : Tout utilisateur (y compris les utilisateurs non connectés) peut y accéder, sans aucune authentification.
- `'loggedIn'` : Seuls les utilisateurs connectés peuvent y accéder, une identité utilisateur valide est requise.
- `(ctx) => Promise<boolean>` ou `(ctx) => boolean` : Une fonction personnalisée qui détermine dynamiquement si l'accès est autorisé en fonction du contexte de la requête, permettant d'implémenter des logiques de permission complexes.

## Enregistrer un middleware de permission (`use`)

`acl.use()` est utilisé pour enregistrer un middleware de permission personnalisé, permettant d'insérer une logique spécifique dans le processus de vérification des permissions. Il est généralement utilisé avec `ctx.permission` pour définir des règles de permission personnalisées. Cette fonction est adaptée aux scénarios nécessitant un contrôle de permission non conventionnel, comme la validation de mot de passe personnalisée pour des formulaires publics, ou des vérifications de permission dynamiques basées sur les paramètres de requête.

**Scénarios d'application typiques :**

- Scénarios de formulaires publics : Aucun utilisateur ni rôle, mais les permissions doivent être contraintes par un mot de passe personnalisé.
- Contrôle des permissions basé sur des conditions telles que les paramètres de requête, les adresses IP, etc.
- Règles de permission personnalisées, permettant de sauter ou de modifier le processus de vérification des permissions par défaut.

**Contrôler les permissions via `ctx.permission` :**

```ts
acl.use(async (ctx, next) => {
  const { resourceName, actionName } = ctx.action;
  
  // Exemple : Un formulaire public nécessite une vérification de mot de passe pour ignorer la vérification des permissions
  if (resourceName === 'publicForms' && actionName === 'submit') {
    const password = ctx.request.body?.password;
    if (password === 'your-secret-password') {
      // Vérification réussie, ignorer la vérification des permissions
      ctx.permission = {
        skip: true,
      };
    } else {
      ctx.throw(403, 'Invalid password');
    }
  }
  
  // Exécuter la vérification des permissions (continuer le flux ACL)
  await next();
});
```

**Description des propriétés de `ctx.permission` :**

- `skip: true` : Ignore les vérifications de permission ACL ultérieures et autorise directement l'accès.
- Peut être défini dynamiquement dans le middleware en fonction d'une logique personnalisée pour un contrôle flexible des permissions.

## Ajouter des contraintes de données fixes pour des opérations spécifiques (`addFixedParams`)

`addFixedParams` permet d'ajouter des contraintes de portée de données (filtre) fixes à certaines opérations de ressources. Ces contraintes contournent les restrictions de rôle et sont appliquées directement, généralement pour protéger les données système critiques.

```ts
acl.addFixedParams('roles', 'destroy', () => {
  return {
    filter: {
      $and: [
        { 'name.$ne': 'root' },
        { 'name.$ne': 'admin' },
        { 'name.$ne': 'member' },
      ],
    },
  };
});

// Même si un utilisateur a la permission de supprimer des rôles, il ne pourra pas supprimer les rôles système comme root, admin, member.
```

> **Conseil :** `addFixedParams` peut être utilisé pour empêcher la suppression ou la modification accidentelle de données sensibles, telles que les rôles système intégrés, les comptes administrateur, etc. Ces contraintes s'appliquent en combinaison avec les permissions de rôle, garantissant que même avec les permissions, les données protégées ne peuvent pas être manipulées.

## Vérifier les permissions (`can`)

`acl.can()` est utilisé pour vérifier si un rôle a la permission d'exécuter une opération spécifiée, et retourne un objet de résultat de permission ou `null`. Cette fonction est couramment utilisée pour vérifier dynamiquement les permissions dans la logique métier, par exemple dans un middleware ou un gestionnaire d'opérations (Handler), afin de déterminer si certaines actions sont autorisées en fonction des rôles.

```ts
const result = acl.can({
  roles: ['admin', 'manager'], // Peut prendre un rôle unique ou un tableau de rôles
  resource: 'orders',
  action: 'delete',
});

if (result) {
  console.log(`Le rôle ${result.role} peut exécuter l'opération ${result.action}`);
  // result.params contient les paramètres fixes définis via addFixedParams
  console.log('Paramètres fixes :', result.params);
} else {
  console.log('Aucune permission pour exécuter cette opération');
}
```

> **Conseil :** Si plusieurs rôles sont fournis, chaque rôle sera vérifié séquentiellement, et le résultat du premier rôle ayant la permission sera retourné.

**Définitions de type :**

```ts
interface CanArgs {
  role?: string;      // Rôle unique
  roles?: string[];   // Plusieurs rôles (vérifiés séquentiellement, retourne le premier rôle avec permission)
  resource: string;   // Nom de la ressource
  action: string;    // Nom de l'opération
}

interface CanResult {
  role: string;       // Rôle avec permission
  resource: string;   // Nom de la ressource
  action: string;    // Nom de l'opération
  params?: any;       // Informations sur les paramètres fixes (si définis via addFixedParams)
}
```

## Enregistrer des opérations configurables (`setAvailableAction`)

Si vous souhaitez que des opérations personnalisées puissent être configurées via l'interface utilisateur (par exemple, affichées dans la page de gestion des rôles), vous devez les enregistrer à l'aide de `setAvailableAction`. Les opérations enregistrées apparaîtront dans l'interface de configuration des permissions, où les administrateurs pourront définir les permissions d'opération pour différents rôles.

```ts
acl.setAvailableAction('importXlsx', {
  displayName: '{{t("Import")}}', // Nom affiché dans l'interface, supporte l'internationalisation
  type: 'new-data',               // Type d'opération
  onNewRecord: true,              // Indique si l'opération prend effet lors de la création de nouvelles entrées
});
```

**Description des paramètres :**

- **displayName** : Nom affiché dans l'interface de configuration des permissions, supporte l'internationalisation (en utilisant le format `{{t("key")}}`).
- **type** : Type d'opération, détermine la classification de cette opération dans la configuration des permissions.
  - `'new-data'` : Opérations qui créent de nouvelles données (par exemple, importation, ajout, etc.).
  - `'existing-data'` : Opérations qui modifient des données existantes (par exemple, mise à jour, suppression, etc.).
- **onNewRecord** : Indique si l'opération prend effet lors de la création de nouvelles entrées, valide uniquement pour le type `'new-data'`.

Après l'enregistrement, cette opération apparaîtra dans l'interface de configuration des permissions, où les administrateurs pourront configurer les permissions de cette opération dans la page de gestion des rôles.