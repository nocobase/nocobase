---
pkg: "@nocobase/plugin-action-import-pro"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Import Pro

## Introduction

Le plugin Import Pro offre des fonctionnalités améliorées par rapport à la fonction d'importation standard.

## Installation

Ce plugin dépend du plugin de gestion des tâches asynchrones. Vous devez l'activer avant de pouvoir utiliser Import Pro.

## Améliorations des fonctionnalités

![20251029172052](https://static-docs.nocobase.com/20251029172052.png)

- Prend en charge les opérations d'importation asynchrones, exécutées dans un thread séparé, et permet l'importation de grandes quantités de données.

![20251029172129](https://static-docs.nocobase.com/20251029172129.png)

- Prend en charge les options d'importation avancées.

## Manuel d'utilisation

### Importation asynchrone

Une fois l'importation lancée, le processus s'exécute dans un thread d'arrière-plan séparé, sans nécessiter de configuration manuelle de votre part. Dans l'interface utilisateur, après avoir démarré une importation, la tâche d'importation en cours s'affiche en haut à droite, indiquant sa progression en temps réel.

![index-2024-12-30-09-21-05](https://static-docs.nocobase.com/index-2024-12-30-09-21-05.png)

Une fois l'importation terminée, vous pouvez consulter les résultats dans les tâches d'importation.

#### À propos des performances

Pour évaluer les performances de l'importation de données à grande échelle, nous avons effectué des tests comparatifs dans différents scénarios, types de champs et configurations de déclenchement (les résultats peuvent varier selon les configurations de serveur et de base de données et sont fournis à titre indicatif uniquement) :

| Volume de données | Types de champs | Configuration d'importation | Temps de traitement |
|------|---------|---------|---------|
| 1 million d'enregistrements | Chaîne de caractères, Nombre, Date, E-mail, Texte long | • Déclencher le flux de travail : Non<br>• Identifiant de doublon : Aucun | Environ 1 minute |
| 500 000 enregistrements | Chaîne de caractères, Nombre, Date, E-mail, Texte long, Plusieurs-à-plusieurs | • Déclencher le flux de travail : Non<br>• Identifiant de doublon : Aucun | Environ 16 minutes|
| 500 000 enregistrements | Chaîne de caractères, Nombre, Date, E-mail, Texte long, Plusieurs-à-plusieurs, Plusieurs-à-un | • Déclencher le flux de travail : Non<br>• Identifiant de doublon : Aucun | Environ 22 minutes |
| 500 000 enregistrements | Chaîne de caractères, Nombre, Date, E-mail, Texte long, Plusieurs-à-plusieurs, Plusieurs-à-un | • Déclencher le flux de travail : Notification de déclenchement asynchrone<br>• Identifiant de doublon : Aucun | Environ 22 minutes |
| 500 000 enregistrements | Chaîne de caractères, Nombre, Date, E-mail, Texte long, Plusieurs-à-plusieurs, Plusieurs-à-un | • Déclencher le flux de travail : Notification de déclenchement asynchrone<br>• Identifiant de doublon : Mettre à jour les doublons, avec 50 000 enregistrements en double | Environ 3 heures |

Sur la base des résultats des tests de performance ci-dessus et de certaines conceptions existantes, voici quelques explications et suggestions concernant les facteurs d'influence :

1.  **Mécanisme de gestion des enregistrements en double** : Lorsque vous choisissez les options **Mettre à jour les enregistrements en double** ou **Mettre à jour uniquement les enregistrements en double**, le système exécute des opérations de requête et de mise à jour ligne par ligne, ce qui réduit considérablement l'efficacité de l'importation. Si votre fichier Excel contient des données en double inutiles, cela aura un impact encore plus significatif sur la vitesse d'importation. Nous vous recommandons de nettoyer les données en double inutiles dans le fichier Excel (par exemple, en utilisant des outils de déduplication professionnels) avant de les importer dans le système, afin d'éviter de perdre du temps inutilement.

2.  **Efficacité du traitement des champs de relation** : Le système traite les champs de relation en interrogeant les associations ligne par ligne, ce qui peut devenir un goulot d'étranglement en termes de performances dans les scénarios de grandes quantités de données. Pour les structures de relation simples (telles qu'une association un-à-plusieurs entre deux collections), une stratégie d'importation en plusieurs étapes est recommandée : importez d'abord les données de base de la collection principale, puis établissez la relation entre les collections une fois cette étape terminée. Si les exigences métier nécessitent d'importer simultanément les données de relation, veuillez vous référer aux résultats des tests de performance du tableau ci-dessus pour planifier raisonnablement votre temps d'importation.

3.  **Mécanisme de déclenchement des flux de travail** : Il n'est pas recommandé d'activer les déclencheurs de flux de travail dans les scénarios d'importation de données à grande échelle, principalement pour les deux raisons suivantes :
    -   Même lorsque l'état de la tâche d'importation indique 100 %, elle ne se termine pas immédiatement. Le système a encore besoin de temps supplémentaire pour créer les plans d'exécution des flux de travail. Au cours de cette phase, le système génère un plan d'exécution de flux de travail correspondant pour chaque donnée importée, ce qui occupe le thread d'importation mais n'affecte pas l'utilisation des données déjà importées.
    -   Une fois la tâche d'importation entièrement terminée, l'exécution concurrente d'un grand nombre de flux de travail peut entraîner une tension sur les ressources système, affectant la réactivité globale du système et l'expérience utilisateur.

Ces trois facteurs d'influence seront pris en compte pour une optimisation future.

### Configuration d'importation

#### Options d'importation - Déclencher le flux de travail

![20251029172235](https://static-docs.nocobase.com/20251029172235.png)

Lors de l'importation, vous pouvez choisir de déclencher ou non les flux de travail. Si cette option est cochée et que la collection est liée à un flux de travail (événement de collection), l'importation déclenchera l'exécution du flux de travail pour chaque ligne.

#### Options d'importation - Identifier les enregistrements en double

![20251029172421](https://static-docs.nocobase.com/20251029172421.png)

Cochez cette option et sélectionnez le mode correspondant pour identifier et traiter les enregistrements en double lors de l'importation.

Les options de la configuration d'importation seront appliquées comme valeurs par défaut. Les administrateurs peuvent contrôler si l'utilisateur qui télécharge les données est autorisé à modifier ces options (à l'exception de l'option de déclenchement du flux de travail).

**Paramètres d'autorisation de l'utilisateur qui télécharge**

![20251029172516](https://static-docs.nocobase.com/20251029172516.png)

- Autoriser l'utilisateur qui télécharge à modifier les options d'importation

![20251029172617](https://static-docs.nocobase.com/20251029172617.png)

- Interdire à l'utilisateur qui télécharge de modifier les options d'importation

![20251029172655](https://static-docs.nocobase.com/20251029172655.png)

##### Description des modes

- Ignorer les enregistrements en double : Interroge les enregistrements existants en fonction du contenu du « champ d'identification ». Si l'enregistrement existe déjà, cette ligne est ignorée ; s'il n'existe pas, il est importé comme nouvel enregistrement.
- Mettre à jour les enregistrements en double : Interroge les enregistrements existants en fonction du contenu du « champ d'identification ». Si l'enregistrement existe déjà, il est mis à jour ; s'il n'existe pas, il est importé comme nouvel enregistrement.
- Mettre à jour uniquement les enregistrements en double : Interroge les enregistrements existants en fonction du contenu du « champ d'identification ». Si l'enregistrement existe déjà, il est mis à jour ; s'il n'existe pas, il est ignoré.

##### Champ d'identification

Le système identifie si une ligne est un enregistrement en double en fonction de la valeur de ce champ.

- [Règle de liaison](/interface-builder/actions/action-settings/linkage-rule) : Afficher/masquer dynamiquement les boutons ;
- [Bouton d'édition](/interface-builder/actions/action-settings/edit-button) : Modifier le titre, le type et l'icône du bouton ;