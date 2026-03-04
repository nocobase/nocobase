---
pkg: '@nocobase/plugin-workflow-approval'
---

:::tip{title="Avis de traduction IA"}
Ce document a été traduit par IA. Pour des informations précises, veuillez consulter la [version anglaise](/workflow/nodes/approval).
:::

# Approbation

## Introduction

Dans un **flux de travail** d'approbation, un nœud « Approbation » dédié est nécessaire pour configurer la logique opérationnelle permettant aux approbateurs de traiter (approuver, rejeter ou retourner) l'approbation initiée. Le nœud « Approbation » ne peut être utilisé que dans les processus d'approbation.

:::info{title=Conseil}
Différence avec le nœud « Traitement manuel » ordinaire : le nœud « Traitement manuel » ordinaire s'adresse à des scénarios plus généralistes, tels que la saisie manuelle de données ou les processus de décision manuelle pour poursuivre ou non le flux dans divers types de **flux de travail**. Le « nœud d'approbation » est un nœud de traitement spécialisé exclusivement dédié aux processus d'approbation, traitant uniquement les données de l'approbation initiée, et ne peut pas être utilisé dans d'autres **flux de travail**.
:::

## Créer un nœud

Cliquez sur le bouton plus (« + ») dans le processus, ajoutez un nœud « Approbation », puis sélectionnez l'un des modes de validation pour créer le nœud d'approbation :

![审批节点_创建](https://static-docs.nocobase.com/20251107000938.png)

## Configuration du nœud

### Mode de validation

Il existe deux modes de validation :

1.  Mode direct : Généralement utilisé pour des processus simples. La validation ou non du nœud d'approbation détermine uniquement si le processus se termine ; en cas de non-validation, le processus s'arrête directement.

    ![审批节点_通过模式_直通模式](https://static-docs.nocobase.com/20251107001043.png)

2.  Mode branche : Généralement utilisé pour une logique de données plus complexe. Quel que soit le résultat produit par le nœud d'approbation, d'autres nœuds peuvent continuer à être exécutés dans sa branche de résultat.

    ![审批节点_通过模式_分支模式](https://static-docs.nocobase.com/20251107001234.png)

    Une fois ce nœud « approuvé », en plus d'exécuter la branche d'approbation, le processus suivant continuera également. Après une action de « rejet », le processus suivant peut également continuer par défaut, ou vous pouvez configurer le nœud pour terminer le processus après l'exécution de la branche.

:::info{title=Conseil}
Le mode de validation ne peut pas être modifié après la création du nœud.
:::

### Approbateur

L'approbateur est l'ensemble des utilisateurs responsables de l'action d'approbation de ce nœud. Il peut s'agir d'un ou de plusieurs utilisateurs. La source peut être une valeur statique sélectionnée dans la liste des utilisateurs, ou une valeur dynamique spécifiée par une variable :

![审批节点_审批人](https://static-docs.nocobase.com/20251107001433.png)

Lors de la sélection d'une variable, vous ne pouvez choisir que la clé primaire ou la clé étrangère des données utilisateur provenant du contexte et des résultats du nœud. Si la variable sélectionnée est un tableau lors de l'exécution (relation de type "à plusieurs"), chaque utilisateur du tableau sera fusionné dans l'ensemble des approbateurs.

En plus de sélectionner directement des utilisateurs ou des variables, vous pouvez également filtrer dynamiquement les utilisateurs répondant aux critères en vous basant sur les conditions de requête de la table des utilisateurs :

![20251107001703](https://static-docs.nocobase.com/20251107001703.png)

### Mode de concertation

S'il n'y a qu'un seul approbateur lors de l'exécution finale (y compris après déduplication de plusieurs variables), quel que soit le mode de concertation choisi, seul cet utilisateur effectuera l'opération d'approbation et le résultat sera déterminé uniquement par lui.

Lorsque l'ensemble des approbateurs contient plusieurs utilisateurs, le choix de différents modes de concertation représente différentes méthodes de traitement :

1. Signature unique : Il suffit qu'une seule personne approuve pour que le nœud soit validé ; il faut que tout le monde rejette pour que le nœud soit rejeté.
2. Contre-signature : Tout le monde doit approuver pour que le nœud soit validé ; il suffit qu'une seule personne rejette pour que le nœud soit rejeté.
3. Vote : Le nombre de personnes approuvant doit dépasser un ratio défini pour que le nœud soit validé ; sinon, le nœud est rejeté.

Concernant l'action de retour, quel que soit le mode, si un utilisateur de l'ensemble des approbateurs choisit le retour, le nœud quittera directement le processus.

### Ordre de traitement

De même, lorsque l'ensemble des approbateurs contient plusieurs utilisateurs, le choix de différents ordres de traitement représente différentes méthodes de traitement :

1. Parallèle : Tous les approbateurs peuvent traiter dans n'importe quel ordre, la séquence n'a pas d'importance.
2. Séquentiel : Les approbateurs traitent successivement selon l'ordre défini dans l'ensemble des approbateurs ; l'approbateur suivant ne peut traiter qu'après la soumission du précédent.

Qu'il soit configuré en traitement « séquentiel » ou non, les résultats produits selon l'ordre réel de traitement suivent également les règles du « mode de concertation » mentionné ci-dessus. Le nœud termine son exécution une fois les conditions correspondantes remplies.

### Quitter le flux de travail après la fin de la branche de rejet

Lorsque le « Mode de validation » est défini sur « Mode branche », vous pouvez choisir de quitter le **flux de travail** après la fin de la branche de rejet. Une fois cette option cochée, un « ✗ » s'affichera à la fin de la branche de rejet, indiquant que le flux ne continuera pas vers les nœuds suivants après cette branche :

![审批节点_拒绝后退出](https://static-docs.nocobase.com/20251107001839.png)

### Configuration de l'interface de l'approbateur

La configuration de l'interface de l'approbateur sert à fournir une interface d'opération à l'approbateur lorsque le **flux de travail** d'approbation atteint ce nœud. Cliquez sur le bouton de configuration pour ouvrir la fenêtre contextuelle :

![审批节点_界面配置_弹窗](https://static-docs.nocobase.com/20251107001958.png)

Dans la fenêtre de configuration, vous pouvez ajouter des blocs tels que le contenu de la soumission originale, les informations d'approbation, le formulaire de traitement et du texte d'invite personnalisé :

![审批节点_界面配置_添加区块](https://static-docs.nocobase.com/20251107002604.png)

#### Contenu de la soumission originale

Le bloc de détails du contenu d'approbation correspond aux données soumises par l'initiateur. Similaire à un bloc de données ordinaire, vous pouvez ajouter librement des composants de champ de la **collection** et les organiser à votre guise pour structurer le contenu que l'approbateur doit consulter :

![审批节点_界面配置_详情区块](https://static-docs.nocobase.com/20251107002925.png)

#### Formulaire de traitement

Dans le bloc du formulaire d'action, vous pouvez ajouter les boutons d'action pris en charge par ce nœud, notamment « Approuver », « Rejeter », « Retourner », « Réaffecter » et « Ajouter un signataire » :

![审批节点_界面配置_操作表单区块](https://static-docs.nocobase.com/20251107003015.png)

De plus, des champs modifiables par l'approbateur peuvent être ajoutés au formulaire d'action. Ces champs s'afficheront lors du traitement de l'approbation ; l'approbateur peut en modifier les valeurs et, après soumission, les données d'approbation ainsi que l'instantané des données correspondantes dans le processus seront mis à jour simultanément.

![审批节点_界面配置_操作表单_修改审批内容字段](https://static-docs.nocobase.com/20251107003206.png)

#### « Approuver » et « Rejeter »

Parmi les boutons d'action, « Approuver » et « Rejeter » sont des actions décisives. Une fois soumis, le traitement de l'approbateur pour ce nœud est terminé. Les champs supplémentaires à remplir lors de la soumission, comme les « commentaires », peuvent être ajoutés dans la fenêtre de « Configuration du traitement » du bouton d'action.

![审批节点_界面配置_操作表单_处理配置](https://static-docs.nocobase.com/20251107003314.png)

#### « Retourner »

Le « Retourner » est également une action décisive. En plus de configurer des commentaires, vous pouvez configurer les nœuds vers lesquels le retour est possible :

![20251107003555](https://static-docs.nocobase.com/20251107003555.png)

#### « Réaffecter » et « Ajouter un signataire »

« Réaffecter » et « Ajouter un signataire » sont des actions non décisives utilisées pour ajuster dynamiquement les approbateurs dans le processus. « Réaffecter » consiste à confier la tâche d'approbation de l'utilisateur actuel à un autre utilisateur. « Ajouter un signataire » consiste à ajouter un approbateur avant ou après l'approbateur actuel pour continuer l'approbation ensemble.

Après avoir activé les boutons « Réaffecter » ou « Ajouter un signataire », vous devez définir la « Portée d'affectation » dans le menu de configuration du bouton :

![审批节点_界面配置_操作表单_指派人员范围](https://static-docs.nocobase.com/20241226232321.png)

Comme pour la configuration initiale des approbateurs, la portée d'affectation peut être une sélection directe d'utilisateurs ou basée sur des conditions de requête de la **collection** d'utilisateurs. Elle sera finalement fusionnée en un ensemble excluant les utilisateurs déjà présents parmi les approbateurs.

:::warning{title=Important}
Si vous activez ou désactivez un bouton d'action, ou si vous modifiez la portée d'affectation, vous devez enregistrer la configuration du nœud après avoir fermé la fenêtre de configuration de l'interface, sinon les changements ne seront pas effectifs.
:::

### Carte « Mes approbations » <Badge>2.0+</Badge>

Peut être utilisée pour configurer les cartes de tâches dans la liste « Mes approbations » du centre de tâches.

![20260214141554](https://static-docs.nocobase.com/20260214141554.png)

Vous pouvez configurer librement dans la carte les champs métier que vous souhaitez afficher (à l'exception des champs de relation) ou des informations liées à l'approbation.

Une fois que l'approbation entre dans ce nœud, la carte de tâche personnalisée sera visible dans la liste du centre de tâches :

![20260214141722](https://static-docs.nocobase.com/20260214141722.png)

## Résultat du nœud

Une fois l'approbation terminée, les statuts et données associés sont enregistrés dans le résultat du nœud et peuvent être utilisés comme variables par les nœuds suivants.

![20250614095052](https://static-docs.nocobase.com/20250614095052.png)

### Statut d'approbation du nœud

Représente le statut de traitement du nœud d'approbation actuel, le résultat est une valeur énumérée.

### Données après approbation

Si l'approbateur a modifié le contenu de l'approbation dans le formulaire de traitement, les données modifiées sont enregistrées dans le résultat du nœud pour les nœuds suivants. Pour utiliser des champs de relation, vous devez configurer le préchargement de ces champs dans le déclencheur.

### Historique des approbations

> v1.8.0+

L'historique de traitement est un tableau contenant les enregistrements de tous les approbateurs de ce nœud. Chaque enregistrement comprend les champs suivants :

| Champ | Type | Description |
| --- | --- | --- |
| id | number | Identifiant unique de l'enregistrement de traitement |
| userId | number | ID de l'utilisateur ayant traité cet enregistrement |
| status | number | Statut du traitement |
| comment | string | Commentaire lors du traitement |
| updatedAt | string | Heure de mise à jour de l'enregistrement |

Vous pouvez utiliser ces champs comme variables dans les nœuds suivants selon vos besoins.