# Multi-portail, Multi-app et Multi-space

NocoBase fournit trois capacités : Multi-portail, Multi-app et Multi-space.

Elles répondent à des problèmes de dimensions différentes et peuvent être utilisées séparément ou ensemble.

## Différences clés

| Capacité | Multi-portail | Multi-app | Multi-space |
|------|------|------|------|
| Problème résolu | Fournir plusieurs points d'entrée | Découper le métier en plusieurs systèmes | Isoler les données métier |
| Point central | D'où l'utilisateur entre | Comment le système est découpé | À qui appartiennent les données |
| Données | Partagées | Indépendantes par défaut | Isolées |
| Pages et menus | Indépendants | Indépendants | Partagés |
| Configuration des plugins | Partagée | Indépendante | Partagée |
| Système d'utilisateurs | Partagé | Peut être partagé via SSO | Partagé |
| Scénarios typiques | Différents rôles ont besoin de différentes entrées | Différents métiers nécessitent une gestion indépendante | Plusieurs organisations, magasins ou locataires |
| Peut être combiné | Oui | Oui | Oui |

## Multi-portail

Multi-portail fournit plusieurs points d'entrée au sein d'une même application.

Par exemple :

```text
Application ERP

├─ Portail admin (/v/admin)
├─ Portail magasin (/v/store)
├─ Portail distributeur (/v/dealer)
└─ Portail mobile (/v/mobile)
```

Caractéristiques :

- Utilise la même application
- Partage les mêmes données
- Partage la configuration des plugins
- Les pages et les menus peuvent être configurés indépendamment

Convient aux scénarios où différents rôles ont besoin de différentes entrées, par exemple :

- Administrateurs
- Employés
- Clients
- Distributeurs

## Multi-app

Multi-app permet de découper le métier en plusieurs applications indépendantes.

Par exemple :

```text
Système de groupe

├─ CRM
├─ ERP
├─ OA
└─ Analyse
```

Caractéristiques :

- Chaque application est gérée indépendamment
- Configuration des plugins indépendante
- Connexion à la base de données indépendante
- Mise à niveau et maintenance indépendantes

Convient à :

- La division de grands systèmes métier
- Le développement collaboratif par plusieurs équipes
- La création en masse d'applications pour des plateformes SaaS
- Des applications indépendantes pour différents clients

## Multi-space

Multi-space isole les données métier au sein de la même application.

Par exemple :

```text
Application de gestion de magasin

Espaces
├─ Magasin de Pékin
├─ Magasin de Shanghai
└─ Magasin de Shenzhen
```

Caractéristiques :

- Pages partagées
- Menus partagés
- Workflows partagés
- Configuration partagée
- Données isolées

Pour les tables avec un champ d'espace activé, le système filtre automatiquement les données selon l'espace courant.

Du point de vue de l'utilisateur :

- Le magasin de Pékin ne peut voir que ses propres données
- Le magasin de Shanghai ne peut voir que ses propres données
- Le magasin de Shenzhen ne peut voir que ses propres données

Mais tous les magasins utilisent toujours le même système.

## Relation entre les trois

Ces trois capacités ne sont pas en conflit. Elles agissent sur des dimensions différentes.

Elles peuvent être utilisées ensemble :

```text
Système de groupe

Application CRM
├─ Portail admin
├─ Portail commercial
└─ Portail client

Espaces
├─ Agence de Pékin
├─ Agence de Shanghai
└─ Agence de Shenzhen
```

Conceptuellement :

```text
Portail
    ↓
D'où l'utilisateur entre dans le système

Application
    ↓
Comment le système est découpé

Espace
    ↓
À qui appartiennent les données
```

## Comment choisir

Si vous voulez seulement fournir différentes entrées pour différents rôles, choisissez **Multi-portail**.

Si vous voulez découper votre activité en plusieurs systèmes indépendants, choisissez **Multi-app**.

Si vous voulez isoler les données de différentes organisations ou de différents locataires dans le même système, choisissez **Multi-space**.

Dans les projets réels, ces trois capacités sont généralement combinées plutôt qu'utilisées comme des substituts les unes aux autres.

En une phrase :

> Multi-portail résout les points d'entrée, Multi-app résout le découpage du système et Multi-space résout l'isolation des données.
