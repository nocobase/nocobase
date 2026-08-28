---
title: "Régions administratives de Chine"
description: "Le champ des régions administratives de Chine permet d’enregistrer les informations relatives aux divisions administratives telles que la province, la ville et le district ou le comté, avec une sélection en cascade sur trois niveaux et un affichage hiérarchique."
keywords: "régions administratives de Chine, province-ville-district, champ de division administrative, liaison à trois niveaux,NocoBase"
---

# Régions administratives de Chine

<PluginInfo name="field-china-region"></PluginInfo>

## Présentation

Dans NocoBase, **les régions administratives de Chine (China region)** permettent d’enregistrer les informations relatives aux divisions administratives chinoises, telles que la province, la ville et le district ou le comté.

Le champ des régions administratives de Chine repose sur la table de données intégrée `chinaRegions` des divisions administratives. La saisie s’effectue à l’aide d’un sélecteur en cascade dans la page. Les utilisateurs peuvent sélectionner successivement la province, la ville et le district selon la hiérarchie. Lors de l’affichage, les niveaux sont assemblés pour former un chemin complet.

Pour enregistrer une adresse détaillée comprenant la rue, le numéro, etc., vous pouvez l’utiliser avec les champs [Texte sur une ligne](../basic/input.md) ou [Texte multiligne](../basic/textarea.md).

## Scénarios d’utilisation

Les régions administratives de Chine conviennent aux scénarios métier suivants :

- Lieu d’implantation des clients, contacts, magasins et projets
- Lieu d’enregistrement du domicile, lieu d’origine, zone de livraison et autres informations d’adresse de base
- Zone de service, zone de vente et zone de mise en œuvre des projets
- Données nécessitant un filtrage ou des statistiques par province, ville et district

## Création et configuration

Sur la page « Configure fields » de la table de données, cliquez sur « Add field », puis sélectionnez « Régions administratives de Chine » pour créer un champ de régions administratives de Chine.

![](https://static-docs.nocobase.com/data-source-manager-main-NocoBase-04-29-2026_04_52_PM.png)

| Configuration | Description |
| --- | --- |
| Field interface | Type d’interface du champ. Les régions administratives de Chine correspondent à `chinaRegion`, qui détermine la manière dont les données sont saisies et affichées dans la page. |
| Field display name | Nom affiché du champ dans l’interface, par exemple « Région d’origine », « Zone de service » ou « Zone de livraison ». Il est recommandé d’utiliser un nom directement compréhensible par les équipes métier. |
| Field name | Nom d’identification du champ, utilisé pour les références internes dans les API, les champs de relation, les permissions, les workflows, etc. Il n’est généralement plus modifié après la création, accepte uniquement les lettres, les chiffres et les traits de soulignement, et doit commencer par une lettre. |
| Field type | Type du champ au niveau des données. Les régions administratives de Chine sont généralement enregistrées sous forme d’enregistrements liés ou de valeurs structurées, selon la configuration du champ. |
| Niveau de sélection | Contrôle le niveau hiérarchique le plus profond pouvant être sélectionné. Les niveaux actuellement pris en charge sont « Province », « Ville » et « District », avec « District » comme valeur par défaut. |
| Sélection obligatoire jusqu’au dernier niveau | Lorsque cette option est activée, l’utilisateur doit sélectionner le niveau le plus profond configuré pour pouvoir envoyer le formulaire ; lorsqu’elle est désactivée, la sélection peut s’arrêter à un niveau intermédiaire. |
| Validation rules | Règles de validation. Elles servent généralement à configurer l’obligation de saisie et le niveau de sélection. |
| Description | Description du champ. Elle peut préciser la signification du champ, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le nom du champ est référencé par les blocs de page, les permissions, les workflows et les API. Vérifiez le nom avant la création afin d’éviter des coûts d’ajustement de la configuration lors de modifications ultérieures.

:::

## Caractéristiques du champ

Le comportement par défaut du champ des régions administratives de Chine est le suivant :

| Caractéristique | Description |
| --- | --- |
| Field interface par défaut | `chinaRegion`. |
| Source des données | Table de données intégrée `chinaRegions` des divisions administratives. |
| Composant de page | Le mode édition utilise un sélecteur en cascade. |
| Niveau de sélection | Les trois niveaux Province, Ville et District sont actuellement pris en charge. |
| Mode d’affichage | En mode lecture, les niveaux sont affichés sous forme de `省 / 市 / 区`. |
| Filtrage | Le filtrage selon la valeur de région enregistrée est pris en charge ; les possibilités dépendent de la configuration du champ et du bloc de page. |
| Sélection multiple | La sélection multiple n’est pas prise en charge. |

## Modification de la configuration

Après la création, cliquez sur « Edit » à droite du champ pour modifier sa configuration. La modification du champ sert principalement à ajuster son affichage et son utilisation dans NocoBase, par exemple le nom affiché, la description, les règles de validation, le niveau de sélection ou l’obligation de sélectionner jusqu’au dernier niveau.

Si le champ provient d’une table déjà synchronisée depuis la base de données principale, sa modification consiste généralement à effectuer un mappage de champ, c’est-à-dire à mapper le champ de la base de données vers le Field type et le Field interface de NocoBase.

| Configuration | Modifiable | Description |
| --- | --- | --- |
| Field display name | Oui | Modifie le nom affiché du champ dans l’interface sans changer son nom d’identification. |
| Field name | Non | Le nom d’identification du champ ne peut généralement pas être modifié dans le formulaire d’édition après la création. |
| Field interface | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Cette modification affecte les modes de saisie, d’affichage et de validation dans les pages. |
| Field type | Selon les conditions | Les champs de la base de données principale ou les champs synchronisés peuvent être ajustés lors du mappage. Avant toute modification, vérifiez que les données existantes peuvent être utilisées avec le nouveau type. |
| Niveau de sélection | Oui | Modifie le niveau maximal sélectionnable : province, ville ou district. |
| Sélection obligatoire jusqu’au dernier niveau | Oui | Contrôle si la sélection doit atteindre le niveau le plus profond configuré lors de l’envoi. |
| Validation rules | Oui | Modifie les règles de validation, comme l’obligation de saisie. |
| Description | Oui | Complète la signification du champ, les consignes de saisie, la source des données ou la personne responsable de la maintenance. |

:::warning Attention

Le champ des régions administratives de Chine dépend de la table de données `chinaRegions` fournie par le plug-in. Avant toute utilisation, vérifiez que le plug-in de champ « Divisions administratives de Chine » est activé.

:::

## Suppression du champ

Cliquez sur « Delete » à droite du champ pour supprimer le champ des régions administratives de Chine. Dans la base de données principale, vous pouvez également sélectionner plusieurs champs et les supprimer par lot.

Lors de la suppression d’un champ de régions administratives de Chine créé dans la base de données principale, la colonne réelle correspondante ainsi que les données qu’elle contient sont généralement supprimées de la base de données. Pour un champ synchronisé depuis une base de données ou mappé depuis une source de données externe, l’étendue des effets dépend de la source de données et de l’origine du champ concernées.

:::danger Avertissement

La suppression d’un champ peut affecter les blocs de page, les formulaires, les filtres, les permissions, les workflows, les API, les importations et exportations, ainsi que les données existantes. Avant de le supprimer, vérifiez qu’il n’est plus référencé par une configuration métier.

:::

## Utilisation dans la configuration des pages

Le champ des régions administratives de Chine convient aux scénarios d’adresse, de zone et de statistiques.

| Scénario | Utilisation |
| --- | --- |
| Bloc de formulaire | Utiliser un sélecteur en cascade pour sélectionner la province, la ville et le district ou le comté. |
| Bloc de détails | Afficher le chemin des divisions administratives. |
| Bloc de tableau | Afficher la région à laquelle appartient l’enregistrement. |
| Bloc de filtrage | Filtrer les enregistrements par région. |
| Bloc de graphique | Établir des statistiques métier par province, ville et district. |

### Mode édition

En mode édition, le champ des régions administratives de Chine s’affiche sous forme de sélecteur en cascade.

![](https://static-docs.nocobase.com/%E7%9C%81%E5%B8%82%E5%8C%BA-04-29-2026_04_54_PM.png)

### Mode lecture

En mode lecture, le champ des régions administratives de Chine s’affiche sous forme de chemin textuel, par exemple :

```text
北京市 / 市辖区 / 东城区
```

## Liens associés

- [Champ](../index.md) — Comprendre le rôle, la classification et la logique de mappage des champs
- [Table ordinaire](../../../data-source-main/general-collection.md) — Créer et gérer des champs dans une table ordinaire
- [Texte sur une ligne](../basic/input.md) — Enregistrer une adresse détaillée
- [Texte multiligne](../basic/textarea.md) — Enregistrer une description d’adresse plus longue