---
pkg: "@nocobase/plugin-ip-restriction"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



pkg: '@nocobase/plugin-ip-restriction'
---

# Restrictions IP

## Introduction

NocoBase permet aux administrateurs de configurer des listes blanches ou des listes noires pour les adresses IP d'accès des utilisateurs. Cela permet de restreindre les connexions réseau externes non autorisées ou de bloquer les adresses IP malveillantes connues, réduisant ainsi les risques de sécurité. Vous pouvez également consulter les journaux de refus d'accès pour identifier les adresses IP à risque.

## Règles de configuration

![2025-01-23-10-07-34-20250123100733](https://static-docs.nocobase.com/2025-01-23-10-07-34-20250123100733.png)

### Modes de filtrage IP

- **Liste noire** : Lorsque l'adresse IP d'un utilisateur correspond à une IP de la liste, le système **refusera** l'accès. Les adresses IP non correspondantes sont **autorisées** par défaut.
- **Liste blanche** : Lorsque l'adresse IP d'un utilisateur correspond à une IP de la liste, le système **autorisera** l'accès. Les adresses IP non correspondantes sont **refusées** par défaut.

### Liste IP

Permet de définir les adresses IP autorisées ou refusées pour l'accès au système. Sa fonction spécifique dépend du mode de filtrage IP sélectionné. Vous pouvez saisir des adresses IP ou des segments de réseau CIDR. Séparez plusieurs adresses par des virgules ou des sauts de ligne.

## Consulter les journaux

Lorsqu'un utilisateur se voit refuser l'accès, l'adresse IP d'accès est enregistrée dans les journaux système. Vous pouvez télécharger le fichier journal correspondant pour analyse.

![2025-01-17-13-33-51-20250117133351](https://static-docs.nocobase.com/2025-01-17-13-33-51-20250117133351.png)

Exemple de journal :

![2025-01-14-14-42-06-20250114144205](https://static-docs.nocobase.com/2025-01-14-14-42-06-20250114144205.png)

## Recommandations de configuration

### Recommandations pour le mode Liste noire

- Ajoutez les adresses IP malveillantes connues pour prévenir les attaques réseau potentielles.
- Vérifiez et mettez à jour régulièrement la liste noire, en supprimant les adresses IP invalides ou qui n'ont plus besoin d'être bloquées.

### Recommandations pour le mode Liste blanche

- Ajoutez les adresses IP de réseau interne fiables (comme les segments de réseau de bureau) pour garantir un accès sécurisé aux systèmes critiques.
- Évitez d'inclure des adresses IP attribuées dynamiquement dans la liste blanche afin de prévenir les interruptions d'accès.

### Recommandations générales

- Utilisez les segments de réseau CIDR pour simplifier la configuration, par exemple en utilisant `192.168.0.0/24` au lieu d'ajouter des adresses IP individuelles.
- Sauvegardez régulièrement les configurations de la liste IP pour une récupération rapide en cas de mauvaise manipulation ou de défaillance du système.
- Surveillez régulièrement les journaux d'accès pour identifier les adresses IP anormales et ajustez rapidement les listes noire et blanche.