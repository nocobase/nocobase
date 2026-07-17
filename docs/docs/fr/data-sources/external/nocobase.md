---
title: 'NocoBase externe'
description: 'Connectez une autre application NocoBase à l’application actuelle en tant que source de données externe, et découvrez sa configuration, ses fonctionnalités disponibles ainsi que ses limitations dans les workflows.'
keywords: 'NocoBase externe,source de données NocoBase,gestion des sources de données,workflow,NocoBase'
---

#  NocoBase externe

##  Présentation

Une source de données NocoBase externe permet de connecter une autre application NocoBase à l’application actuelle, tout en conservant les métadonnées configurées dans l’application distante, telles que les tables de données, les interfaces de champs, les titres et les champs de relation.

Contrairement à une source de données de base de données externe, la connexion à NocoBase externe ne nécessite généralement pas de reconfigurer les interfaces de champs ni de créer manuellement les champs de relation. En plus de consulter, créer, modifier et supprimer des enregistrements, vous pouvez également téléverser et prévisualiser des fichiers, importer et exporter des données, effectuer des requêtes de graphiques et utiliser certains scénarios de workflow.

##  Ajouter une source de données

Après avoir activé le plugin, ajoutez une source de données NocoBase externe dans « Gestion des sources de données » et renseignez les informations d’accès de l’application distante.

| Élément de configuration | Description                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| Adresse API              | Adresse API complète de l’application NocoBase distante, par exemple `https://example.com/api`  |
| Origin                   | Origine d’accès de l’application NocoBase distante, par exemple `https://example.com`, principalement utilisée pour traiter les adresses de prévisualisation des fichiers locaux de l’application distante |
| API key                  | Identifiant utilisé par l’application actuelle pour accéder à NocoBase distante                |
| En-têtes de requête      | En-têtes de requête supplémentaires à transmettre à l’application distante, comme les informations d’espace |
| Délai d’expiration       | Délai d’expiration des requêtes vers l’application distante                                      |

Une fois la source de données activée, le système charge les tables de données de l’application distante.

![](https://static-docs.nocobase.com/202606101149185.png)

##  Autorisations

Une source de données NocoBase externe est soumise aux autorisations de l’application actuelle et de l’application distante.

-  L’application actuelle peut, comme pour les autres sources de données externes, configurer les autorisations d’accès à différentes tables et différents champs ;
-  l’application distante lit et manipule les données correspondantes selon les autorisations de l’API key configurée.

Une source de données NocoBase externe ne renvoie pas les métadonnées d’autorisation utilisées pour contrôler finement, côté frontend, l’affichage des boutons. Certains boutons peuvent donc ne pas être masqués automatiquement selon les autorisations, contrairement à la source de données principale. Que le bouton soit visible ou non, l’opération est toujours soumise au contrôle des autorisations côté serveur de l’application actuelle lors de son envoi ; les opérations non autorisées sont refusées.

:::warning{title=Attention}
Il est recommandé de préparer une API key dédiée à la source de données NocoBase externe et de lui accorder uniquement les autorisations nécessaires sur les tables et les opérations. Si l’application actuelle dispose des autorisations requises mais que l’opération échoue, vérifiez les autorisations de l’API key distante.
:::

##  Utiliser les tables de données

Une fois les tables de données chargées, sélectionnez cette source de données dans la configuration des pages, des blocs, des graphiques ou des workflows pour utiliser les tables de données de l’application distante.

Après toute modification de la structure des tables de données dans l’application distante, rechargez les tables de données dans l’application actuelle.

##  Fonctionnalités

Une source de données NocoBase externe sert principalement à utiliser, dans l’application actuelle, les tables de données et les données de l’application distante. La structure des tables de données, la configuration des champs et les données réelles restent gérées par l’application distante.

###  Tables de données et champs

L’application actuelle charge les métadonnées de l’application distante, notamment les tables de données, les interfaces de champs, les titres et les champs de relation. Contrairement à une source de données de base de données externe, il n’est généralement pas nécessaire de reconfigurer les interfaces de champs ni de créer manuellement les champs de relation dans l’application actuelle.

L’application actuelle ne permet pas de configurer directement les champs d’une source de données NocoBase externe. Pour ajouter un champ, modifier son type ou modifier un champ de relation, effectuez ces changements dans l’application distante, puis rechargez les tables de données dans l’application actuelle.

###  Enregistrements et données associées

Une source de données NocoBase externe permet de consulter, créer, modifier et supprimer des enregistrements dans les blocs de page, ainsi que de consulter et gérer les données associées. Les opérations sont lancées par l’application actuelle, qui envoie une requête à l’application distante à l’aide de l’API key configurée.

###  Fichiers et pièces jointes

Les fichiers sont téléversés dans le stockage utilisé par l’application distante. L’application actuelle se charge d’envoyer les requêtes de téléversement, de prévisualisation et de téléchargement ; les fichiers eux-mêmes ne sont pas enregistrés dans l’application actuelle.

Origin sert principalement à traiter les adresses de prévisualisation des fichiers du stockage local de l’application distante. Si l’application distante renvoie un chemin relatif, l’application actuelle utilise Origin pour compléter l’adresse d’accès au fichier. Origin doit contenir l’adresse d’accès publique de l’application NocoBase distante, par exemple :

```text
https://example.com
```

Ne renseignez pas l’adresse API dans Origin.

###  Importation et exportation

L’importation et l’exportation sont des opérations de lecture et d’écriture de la source de données via des fichiers externes ; elles sont exécutées par l’intermédiaire de l’application distante. L’application actuelle se charge de recevoir l’action de l’utilisateur, de transférer la requête et de renvoyer le résultat du téléchargement ; la lecture et l’écriture effectives des données sont réalisées par l’application distante.

-  Importer des enregistrements : l’application actuelle reçoit le fichier d’importation téléversé, puis le transmet à l’application distante pour exécuter l’importation ;
-  Exporter des enregistrements : l’application actuelle transmet la requête d’exportation des enregistrements à l’application distante. En mode synchrone, le flux du fichier d’enregistrements renvoyé par l’application distante est transmis au navigateur pour téléchargement ; en mode asynchrone, une tâche asynchrone locale est créée, l’exportation des enregistrements est lancée dans l’application distante et sa progression est synchronisée, puis le fichier d’enregistrements est récupéré depuis l’application distante sous forme de flux au moment du téléchargement.
-  Exporter des pièces jointes : l’application actuelle transmet la requête d’exportation des pièces jointes à l’application distante. En mode synchrone, le paquet de pièces jointes renvoyé par l’application distante est transmis au navigateur sous forme de flux pour téléchargement ; en mode asynchrone, une tâche asynchrone locale est créée, l’exportation des pièces jointes est lancée dans l’application distante et sa progression est synchronisée, puis le paquet de pièces jointes est récupéré depuis l’application distante sous forme de flux au moment du téléchargement.

###  Impression de modèles

L’impression de modèles peut utiliser les enregistrements d’une source de données NocoBase externe. Les modèles d’impression et la configuration des actions d’impression sont conservés dans l’application actuelle. Lors de l’impression, l’application actuelle lit les enregistrements distants et les données associées, puis génère le fichier d’impression dans l’application actuelle.

###  Graphiques

####  Panneau de requête

Une source de données NocoBase externe peut être utilisée dans un panneau de requête de graphique. L’application actuelle traite les paramètres de requête selon la configuration locale des graphiques, de la source de données, des tables et des autorisations sur les champs, puis envoie une requête à l’application distante pour obtenir le résultat.

L’API key distante doit également disposer des autorisations d’accès aux données correspondantes, faute de quoi la requête échouera.

####  Panneau SQL

Le panneau SQL est le mode de requête SQL des graphiques et sert uniquement aux requêtes. L’application actuelle conserve la configuration SQL et lance l’appel ; la requête SQL est exécutée par l’intermédiaire de l’application distante.

Lors de l’utilisation du panneau SQL, l’utilisateur local doit disposer des autorisations de configuration de l’interface utilisateur dans l’application actuelle, et l’API key distante doit également disposer de ces autorisations dans l’application distante. Contrairement au panneau de requête, le panneau SQL ne décompose pas les paramètres de requête selon les autorisations sur les tables et les champs. Accordez donc avec prudence les autorisations de configuration de l’interface utilisateur aux utilisateurs locaux et à l’API key concernée.

###  Workflows

Une source de données NocoBase externe peut impliquer deux ensembles de workflows : ceux de l’application actuelle et ceux de l’application distante. L’application actuelle répond aux événements des pages, des boutons et des chaînes de requêtes API locales ; après réception d’une requête relayée, l’application distante la traite selon sa propre configuration de workflows.

Notez que l’application actuelle n’écoute pas les événements de création, de mise à jour ou de suppression qui se produisent au sein des tables de données distantes. Les événements des tables de données distantes ne sont déclenchés que dans l’application distante.

####  Déclencheurs

Le tableau suivant indique, lorsque le workflow correspondant est activé, comment les déclencheurs affectés par une source de données NocoBase externe se déclenchent dans l’application actuelle et dans l’application distante.

| Déclencheur                          | Application actuelle | Application distante       | Description                                                                                 |
| ------------------------------------ | -------------------- | -------------------------- | ------------------------------------------------------------------------------------------- |
| Événement avant la requête            | Déclenché             | Déclenché uniquement en mode global | Dans l’application actuelle, déclenché en mode global ; en mode local, déclenché selon le bouton auquel il est associé dans l’application actuelle. Dans l’application distante, après réception de la requête relayée, déclenché uniquement en mode global |
| Événement après la requête            | Déclenché             | Déclenché uniquement en mode global | Dans l’application actuelle, déclenché en mode global ; en mode local, déclenché selon le bouton auquel il est associé dans l’application actuelle. Dans l’application distante, après réception de la requête relayée, déclenché uniquement en mode global |
| Événement d’opération personnalisée   | Déclenché             | Non déclenché               | Le bouton « Déclencher un workflow » associé dans l’application actuelle déclenche le processus local ; les requêtes CRUD relayées ne déclenchent pas l’événement d’opération personnalisée distant |
| Événement de table de données         | Non déclenché         | Déclenché                   | Les données sont modifiées à distance : l’application actuelle ne déclenche pas l’événement local de table de données ; l’application distante déclenche son propre événement de table de données |
| Déclenchement programmé par champ de date | Non déclenché      | Déclenché                   | L’application actuelle ne déclenche pas d’événement à partir des champs des tables de données distantes ; l’application distante se déclenche selon la configuration de ses propres champs de date |

Les déclencheurs qui ne dépendent pas d’une source de données se déclenchent dans l’application actuelle et dans l’application distante selon leur configuration respective.

Pour orchestrer dans l’application actuelle un processus qui manipule des données NocoBase externes, il est recommandé d’utiliser un événement avant la requête, un événement après la requête ou un événement d’opération personnalisée. Les workflows déjà présents dans l’application distante sont exécutés indépendamment par celle-ci.

####  Nœuds

Le tableau suivant répertorie uniquement les nœuds associés aux sources de données. Les nœuds génériques tels que les conditions, les calculs, les boucles et le traitement JSON ne dépendent pas du type de source de données et peuvent être utilisés comme dans un workflow normal.

| Nœud                 | Disponible | Description                                  |
| -------------------- | ---------- | -------------------------------------------- |
| Rechercher des enregistrements | Disponible | Rechercher des enregistrements dans l’application distante |
| Créer un enregistrement       | Disponible | Créer des enregistrements dans l’application distante |
| Mettre à jour un enregistrement | Disponible | Mettre à jour des enregistrements dans l’application distante |
| Supprimer un enregistrement    | Disponible | Supprimer des enregistrements dans l’application distante |
| Nœud SQL              | Non disponible | Le nœud SQL de workflow prend uniquement en charge les sources de données de base de données |
| Nœud d’agrégation     | Non disponible | Le nœud d’agrégation prend uniquement en charge les sources de données de base de données |

##  Questions fréquentes

###  La table de données n’apparaît pas

Vérifiez que la source de données est activée et que l’adresse API ainsi que l’API key sont correctes. L’application distante doit également autoriser cette API key à accéder à la table de données correspondante.

###  Le téléversement du fichier a réussi, mais il est impossible de le prévisualiser

Si l’application actuelle ou l’application distante utilise un stockage de fichiers local, vérifiez qu’Origin contient l’adresse d’accès publique de l’application concernée. Origin ne doit pas contenir l’adresse API.

###  L’application actuelle dispose des autorisations requises, mais l’opération échoue

Vérifiez les autorisations de l’API key de l’application distante. Une source de données NocoBase externe est soumise à la fois aux autorisations de l’application actuelle et à celles de l’application distante.

###  La table de données est inutilisable après une défaillance du service distant

Si l’application distante renvoie une erreur 502, redémarre ou devient temporairement indisponible, l’application actuelle peut ne plus pouvoir lire temporairement les métadonnées des tables de données distantes. Une fois le service distant rétabli, l’application actuelle recharge automatiquement les métadonnées lors du prochain accès aux tables de données de cette source.

###  Pourquoi est-il impossible de configurer les champs dans l’application actuelle ?

Une source de données NocoBase externe utilise la structure des tables de données et la configuration des champs de l’application distante. Modifiez les champs dans l’application distante, puis rechargez les tables de données dans l’application actuelle.
