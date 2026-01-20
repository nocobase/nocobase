:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Flux d'événements

Dans FlowEngine, tous les composants de l'interface sont **pilotés par les événements**.
Le comportement, l'interaction et les changements de données des composants sont déclenchés par des événements et exécutés via un flux.

## Flux statique vs. Flux dynamique

Dans FlowEngine, les flux peuvent être divisés en deux types :

### **1. Flux statique**

- Défini par les développeurs dans le code ;
- Agit sur **toutes les instances d'une classe de modèle** ;
- Couramment utilisé pour gérer la logique générale d'une classe de modèle.

### **2. Flux dynamique**

- Configuré par les utilisateurs via l'interface ;
- Ne prend effet que sur une instance spécifique ;
- Couramment utilisé pour un comportement personnalisé dans des scénarios spécifiques.

En bref : **un flux statique est un modèle logique défini sur une classe, tandis qu'un flux dynamique est une logique personnalisée définie sur une instance.**

## Règles de liaison vs. Flux dynamique

Dans le système de configuration de FlowEngine, il existe deux manières d'implémenter la logique événementielle :

### **1. Règles de liaison**

- Sont des **encapsulations d'étapes de flux d'événements intégrées** ;
- Plus simples à configurer et plus sémantiques ;
- Essentiellement, elles restent une forme simplifiée de **flux d'événements**.

### **2. Flux dynamique**

- Capacités complètes de configuration de flux ;
- Personnalisable :
  - **Déclencheur (on)** : définit quand déclencher ;
  - **Étapes d'exécution (steps)** : définit la logique à exécuter ;
- Convient aux logiques métier plus complexes et flexibles.

Par conséquent, les **Règles de liaison ≈ Flux d'événements simplifié**, et leurs mécanismes fondamentaux sont cohérents.

## Cohérence des FlowAction

Que ce soient les **Règles de liaison** ou les **Flux d'événements**, ils doivent utiliser le même ensemble de **FlowAction**.
C'est-à-dire :

- Une **FlowAction** définit les actions qui peuvent être appelées par un flux ;
- Les deux partagent un seul système d'actions, plutôt que d'en implémenter deux distincts ;
- Cela garantit la réutilisation de la logique et une extension cohérente.

## Hiérarchie conceptuelle

Conceptuellement, la relation abstraite fondamentale de FlowModel est la suivante :

```bash
FlowModel
 └── FlowDefinition
      ├── FlowEventDefinition
      │     ├── Global Events
      │     └── Local Events
      └── FlowActionDefinition
            ├── Global Actions
            └── Local Actions
```

### Description de la hiérarchie

- **FlowModel**
  Représente une entité de modèle avec une logique de flux configurable et exécutable.

- **FlowDefinition**
  Définit un ensemble complet de logique de flux (incluant les conditions de déclenchement et les étapes d'exécution).

- **FlowEventDefinition**
  Définit la source de déclenchement du flux, incluant :
  - **Événements globaux** : comme le démarrage de l'application, la fin du chargement des données ;
  - **Événements locaux** : comme les changements de champ, les clics sur les boutons.

- **FlowActionDefinition**
  Définit les actions exécutables du flux, incluant :
  - **Actions globales** : comme le rafraîchissement de la page, les notifications globales ;
  - **Actions locales** : comme la modification des valeurs de champ, le changement d'état des composants.

## Résumé

| Concept | Rôle | Portée |
|---|---|---|
| **Flux statique** | Logique de flux définie dans le code | Toutes les instances de XXModel |
| **Flux dynamique** | Logique de flux définie sur l'interface | Une seule instance de FlowModel |
| **FlowEvent** | Définit le déclencheur (quand déclencher) | Globale ou locale |
| **FlowAction** | Définit la logique d'exécution | Globale ou locale |
| **Règle de liaison** | Encapsulation simplifiée des étapes de flux d'événements | Niveau bloc, niveau action |