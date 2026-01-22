---
pkg: '@nocobase/plugin-workflow-approval'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Approbation

## Introduction

Dans un **flux de travail** d'approbation, vous devez utiliser un nœud « Approbation » dédié pour configurer la logique opérationnelle permettant aux approbateurs de traiter (approuver, rejeter ou retourner) l'approbation initiée. Le nœud « Approbation » ne peut être utilisé que dans les processus d'approbation.

:::info{title=Conseil}
Différence avec le nœud « Traitement manuel » standard : Le nœud « Traitement manuel » standard est conçu pour des scénarios plus génériques, comme la saisie manuelle de données ou la décision manuelle de poursuivre ou non un processus dans divers types de **flux de travail**. Le « nœud d'approbation » est un nœud de traitement spécialisé, exclusivement dédié aux processus d'approbation. Il ne traite que les données de l'approbation initiée et ne peut pas être utilisé dans d'autres **flux de travail**.
:::

## Créer un nœud

Cliquez sur le bouton plus (« + ») dans le processus, ajoutez un nœud « Approbation », puis sélectionnez l'un des modes de validation pour créer le nœud d'approbation :

![Créer un nœud d'approbation](https://static-docs.nocobase.com/20251107000938.png)

## Configuration du nœud

### Mode de validation

Il existe deux modes de validation :

1.  **Mode direct (Pass-through)** : Généralement utilisé pour les processus plus simples. Le fait que le nœud d'approbation soit validé ou non détermine uniquement si le processus se termine. En cas de non-validation, le processus se termine directement.

    ![Mode de validation - Mode direct](https://static-docs.nocobase.com/20251107001043.png)

2.  **Mode branche (Branch)** : Généralement utilisé pour une logique de données plus complexe. Une fois que le nœud d'approbation a produit un résultat, d'autres nœuds peuvent continuer à être exécutés au sein de sa branche de résultat.

    ![Mode de validation - Mode branche](https://static-docs.nocobase.com/20251107001234.png)

    Une fois ce nœud « validé », en plus d'exécuter la branche de validation, le processus se poursuivra également. Après une action de « rejet », le processus peut également se poursuivre par défaut, ou vous pouvez configurer le nœud pour qu'il se termine après l'exécution de la branche.

:::info{title=Conseil}
Le mode de validation ne peut pas être modifié après la création du nœud.
:::

### Approbateur

L'approbateur est l'ensemble des utilisateurs responsables de l'action d'approbation de ce nœud. Il peut s'agir d'un ou de plusieurs utilisateurs. La source peut être une valeur statique sélectionnée dans la liste des utilisateurs, ou une valeur dynamique spécifiée par une variable :

![Configuration de l'approbateur](https://static-docs.nocobase.com/20251107001433.png)

Lorsque vous sélectionnez une variable, vous ne pouvez choisir que la clé primaire ou la clé étrangère des données utilisateur provenant du contexte et des résultats du nœud. Si la variable sélectionnée est un tableau lors de l'exécution (une relation un-à-plusieurs), chaque utilisateur du tableau sera fusionné dans l'ensemble des approbateurs.

En plus de sélectionner directement des utilisateurs ou des variables, vous pouvez également filtrer dynamiquement les utilisateurs qui remplissent les conditions, en fonction des critères de recherche de la table des utilisateurs, pour qu'ils agissent en tant qu'approbateurs :

![Filtrage dynamique des approbateurs](https://static-docs.nocobase.com/20251107001703.png)

### Mode de concertation

S'il n'y a qu'un seul approbateur lors de l'exécution finale (y compris après déduplication de plusieurs variables), quel que soit le mode de concertation choisi, seul cet utilisateur effectuera l'action d'approbation, et le résultat sera déterminé uniquement par cet utilisateur.

Lorsque l'ensemble des approbateurs contient plusieurs utilisateurs, le choix de différents modes de concertation représente différentes méthodes de traitement :

1.  **Signature unique (Ou)** : Il suffit qu'une seule personne approuve pour que le nœud soit validé. Le nœud n'est rejeté que si toutes les personnes le rejettent.
2.  **Contre-signature (Tous)** : Toutes les personnes doivent approuver pour que le nœud soit validé. Il suffit qu'une seule personne rejette pour que le nœud soit rejeté.
3.  **Vote** : Le nombre de personnes qui approuvent doit dépasser un ratio défini pour que le nœud soit validé ; sinon, le nœud est rejeté.

Pour l'action de retour, quel que soit le mode, si un utilisateur de l'ensemble des approbateurs traite l'approbation comme un retour, le nœud quittera directement le processus.

### Ordre de traitement

De même, lorsque l'ensemble des approbateurs contient plusieurs utilisateurs, le choix de différents ordres de traitement représente différentes méthodes de traitement :

1.  **Parallèle** : Tous les approbateurs peuvent traiter dans n'importe quel ordre ; la séquence de traitement n'a pas d'importance.
2.  **Séquentiel** : Les approbateurs traitent séquentiellement selon l'ordre défini dans l'ensemble des approbateurs. L'approbateur suivant ne peut traiter qu'après que le précédent a soumis sa décision.

Que le traitement soit défini comme « Séquentiel » ou non, le résultat produit selon l'ordre de traitement réel suivra également les règles du « Mode de concertation » mentionné ci-dessus. Le nœud termine son exécution une fois les conditions correspondantes remplies.

### Quitter le flux de travail après la fin de la branche de rejet

Lorsque le « Mode de validation » est défini sur « Mode branche », vous pouvez choisir de quitter le **flux de travail** après la fin de la branche de rejet. Une fois cette option cochée, un « ✗ » s'affichera à la fin de la branche de rejet, indiquant que les nœuds suivants ne se poursuivront pas après la fin de cette branche :

![Quitter après rejet](https://static-docs.nocobase.com/20251107001839.png)

### Configuration de l'interface de l'approbateur

La configuration de l'interface de l'approbateur est utilisée pour fournir une interface d'opération à l'approbateur lorsque le **flux de travail** d'approbation atteint ce nœud. Cliquez sur le bouton de configuration pour ouvrir la fenêtre contextuelle :

![Fenêtre contextuelle de configuration de l'interface de l'approbateur](https://static-docs.nocobase.com/20251107001958.png)

Dans la fenêtre contextuelle de configuration, vous pouvez ajouter des blocs tels que le contenu de la soumission originale, les informations d'approbation, le formulaire de traitement et le texte d'invite personnalisé :

![Ajouter des blocs à l'interface de l'approbateur](https://static-docs.nocobase.com/20251107002604.png)

#### Contenu de la soumission originale

Le bloc de détails du contenu d'approbation est le bloc de données soumis par l'initiateur. Similaire à un bloc de données standard, vous pouvez y ajouter librement des composants de champ de la **collection** et les organiser comme vous le souhaitez pour présenter le contenu que l'approbateur doit consulter :

![Configuration du bloc de détails](https://static-docs.nocobase.com/20251107002925.png)

#### Formulaire de traitement

Dans le bloc du formulaire d'action, vous pouvez ajouter les boutons d'action pris en charge par ce nœud, notamment « Approuver », « Rejeter », « Retourner », « Réaffecter » et « Ajouter un signataire » :

![Bloc du formulaire d'action](https://static-docs.nocobase.com/20251107003015.png)

De plus, des champs modifiables par l'approbateur peuvent également être ajoutés au formulaire d'action. Ces champs s'afficheront dans le formulaire d'action lorsque l'approbateur traitera l'approbation. L'approbateur pourra modifier les valeurs de ces champs, et après soumission, les données utilisées pour l'approbation ainsi que l'instantané des données correspondantes dans le processus d'approbation seront mis à jour simultanément.

![Modifier les champs de contenu d'approbation](https://static-docs.nocobase.com/20251107003206.png)

#### « Approuver » et « Rejeter »

Parmi les boutons d'action d'approbation, « Approuver » et « Rejeter » sont des actions décisives. Après soumission, le traitement de l'approbateur pour ce nœud est terminé. Des champs supplémentaires à remplir lors de la soumission, tels que « Commentaire », peuvent être ajoutés dans la fenêtre contextuelle de « Configuration du traitement » du bouton d'action.

![Configuration du traitement](https://static-docs.nocobase.com/20251107003314.png)

#### « Retourner »

« Retourner » est également une action décisive. En plus de pouvoir configurer des commentaires, vous pouvez également configurer les nœuds vers lesquels il est possible de retourner :

![Configuration des nœuds de retour](https://static-docs.nocobase.com/20251107003555.png)

#### « Réaffecter » et « Ajouter un signataire »

« Réaffecter » et « Ajouter un signataire » sont des actions non décisives utilisées pour ajuster dynamiquement les approbateurs dans le processus d'approbation. « Réaffecter » consiste à confier la tâche d'approbation de l'utilisateur actuel à un autre utilisateur pour traitement. « Ajouter un signataire » consiste à ajouter un approbateur avant ou après l'approbateur actuel, et le nouvel approbateur poursuivra l'approbation conjointement.

Après avoir activé les boutons d'action « Réaffecter » ou « Ajouter un signataire », vous devez sélectionner la « Portée d'affectation » dans le menu de configuration du bouton pour définir la plage d'utilisateurs pouvant être désignés comme nouveaux approbateurs :

![Portée d'affectation](https://static-docs.nocobase.com/20241226232321.png)

Comme pour la configuration originale des approbateurs du nœud, la portée d'affectation peut également être des approbateurs directement sélectionnés ou basée sur des critères de recherche de la **collection** d'utilisateurs. Elle sera finalement fusionnée en un seul ensemble et n'inclura pas les utilisateurs déjà présents dans l'ensemble des approbateurs.

:::warning{title=Important}
Si un bouton d'action est activé ou désactivé, ou si la portée d'affectation est modifiée, vous devez enregistrer la configuration du nœud après avoir fermé la fenêtre contextuelle de configuration de l'interface d'action. Dans le cas contraire, les modifications apportées au bouton d'action ne prendront pas effet.
:::

## Résultat du nœud

Une fois l'approbation terminée, les statuts et données pertinents seront enregistrés dans le résultat du nœud et pourront être utilisés comme variables par les nœuds suivants.

![Résultat du nœud](https://static-docs.nocobase.com/20250614095052.png)

### Statut d'approbation du nœud

Représente le statut de traitement du nœud d'approbation actuel. Le résultat est une valeur énumérée.

### Données après approbation

Si l'approbateur a modifié le contenu de l'approbation dans le formulaire d'action, les données modifiées seront enregistrées dans le résultat du nœud pour être utilisées par les nœuds suivants. Si vous souhaitez utiliser des champs d'association, vous devez configurer le préchargement de ces champs dans le déclencheur.

### Historique des approbations

> v1.8.0+

L'historique de traitement des approbations est un tableau qui contient les enregistrements de traitement de tous les approbateurs de ce nœud. Chaque enregistrement de traitement comprend les champs suivants :

| Champ     | Type   | Description                                     |
| --------- | ------ | ----------------------------------------------- |
| id        | number | Identifiant unique de l'enregistrement de traitement |
| userId    | number | ID de l'utilisateur ayant traité cet enregistrement |
| status    | number | Statut de traitement                            |
| comment   | string | Commentaire au moment du traitement             |
| updatedAt | string | Heure de mise à jour de l'enregistrement de traitement |

Vous pouvez utiliser ces champs comme variables dans les nœuds suivants, selon vos besoins.