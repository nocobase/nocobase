---
pkg: "@nocobase/plugin-collection-sql"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Collection SQL

## Introduction

La collection SQL offre une méthode puissante pour récupérer des données à l'aide de requêtes SQL. En extrayant les champs de données via des requêtes SQL et en configurant les métadonnées de champ associées, vous pouvez utiliser ces champs comme s'il s'agissait d'une table standard dans des tableaux, des graphiques, des flux de travail, etc. Cette fonctionnalité est particulièrement utile pour les scénarios impliquant des requêtes de jointure complexes, des analyses statistiques, et bien plus encore.

## Guide d'utilisation

### Créer une nouvelle collection SQL

<img src="https://static-docs.nocobase.com/202405191452918.png"/>

<p>1. Saisissez votre requête SQL dans le champ de saisie prévu à cet effet, puis cliquez sur `Exécuter`. Le système analysera la requête pour déterminer les tables et les champs impliqués, et extraira automatiquement les métadonnées de champ pertinentes des tables sources.</p>

<img src="https://static-docs.nocobase.com/202405191453556.png"/>

<p>2. Si l'analyse automatique des tables et des champs sources par le système est incorrecte, vous pouvez sélectionner manuellement les tables et les champs appropriés pour garantir l'utilisation des métadonnées correctes. Commencez par sélectionner la table source, puis choisissez les champs correspondants dans la section des sources de champs ci-dessous.</p>

<img src="https://static-docs.nocobase.com/202405191453579.png"/>

<p>3. Pour les champs qui n'ont pas de source directe, le système déduira le type de champ en fonction du type de données. Si cette déduction est incorrecte, vous pouvez sélectionner manuellement le type de champ approprié.</p>

<img src="https://static-docs.nocobase.com/202405191454703.png"/>

<p>4. Au fur et à mesure que vous configurez chaque champ, vous pouvez prévisualiser son affichage dans la zone d'aperçu, ce qui vous permet de voir l'impact immédiat de vos réglages.</p>

<img src="https://static-docs.nocobase.com/202405191455439.png"/>

<p>5. Une fois la configuration terminée et confirmée comme correcte, cliquez sur le bouton `Confirmer` sous le champ de saisie SQL pour finaliser la soumission.</p>

<img src="https://static-docs.nocobase.com/202405191455302.png"/>

### Modifier

1. Si vous devez modifier la requête SQL, cliquez sur le bouton `Modifier` pour altérer directement l'instruction SQL et reconfigurer les champs si nécessaire.

2. Pour ajuster les métadonnées de champ, utilisez l'option `Configurer les champs`, qui vous permet de mettre à jour les paramètres de champ comme vous le feriez pour une table normale.

### Synchronisation

Si la requête SQL reste inchangée mais que la structure de la table de la base de données sous-jacente a été modifiée, vous pouvez synchroniser et reconfigurer les champs en sélectionnant `Configurer les champs` - `Synchroniser depuis la base de données`.

<img src="https://static-docs.nocobase.com/202405191456216.png"/>

### Collection SQL vs. Vues de base de données liées

| Type de modèle | Cas d'utilisation | Méthode d'implémentation | Support des opérations CRUD |
| :--- | :--- | :--- | :--- |
| SQL | Modèles simples, cas d'utilisation légers<br />Interaction limitée avec la base de données<br />Éviter la maintenance des vues<br />Opérations privilégiant l'interface utilisateur | Sous-requête SQL | Non pris en charge |
| Connexion à une vue de base de données | Modèles complexes<br />Nécessite une interaction avec la base de données<br />Modification des données requise<br />Nécessite un support de base de données plus robuste et stable | Vue de base de données | Partiellement pris en charge |

:::warning
Lorsque vous utilisez une collection SQL, assurez-vous de sélectionner des tables gérables au sein de NocoBase. L'utilisation de tables de la même base de données qui ne sont pas connectées à NocoBase peut entraîner une analyse imprécise des requêtes SQL. Si cela vous préoccupe, envisagez de créer et de lier une vue.
:::