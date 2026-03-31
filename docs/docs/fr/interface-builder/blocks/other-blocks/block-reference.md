---
pkg: "@nocobase/plugin-block-reference"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Bloc de référence

## Introduction
Le bloc de référence affiche directement un bloc existant sur la page actuelle en spécifiant l'UID du bloc cible, sans avoir besoin de le reconfigurer.

## Activer le plugin
Ce plugin est intégré mais désactivé par défaut.
Ouvrez le « Gestionnaire de plugins » → trouvez « Bloc : Référence » → cliquez sur « Activer ».

![Activer le bloc de référence dans le Gestionnaire de plugins](https://static-docs.nocobase.com/block-reference-enable-20251102.png)

## Comment ajouter le bloc
1) Ajoutez un bloc → Groupe « Autres blocs » → sélectionnez « Bloc de référence ».  
2) Dans les « Paramètres de référence », configurez :
   - `UID du bloc` : l'UID du bloc cible
   - `Mode de référence` : choisissez `Référence` ou `Copie`

![Démonstration d'ajout et de configuration du bloc de référence](https://static-docs.nocobase.com/20251102193949_rec_.gif)

### Comment obtenir l'UID d'un bloc
- Ouvrez le menu des paramètres du bloc cible et cliquez sur `Copier l'UID` pour copier son UID.

![Copier l'UID depuis les paramètres du bloc](https://static-docs.nocobase.com/block-reference-copy-uid-20251102.png)

## Modes et comportements
- `Référence` (par défaut)
  - Partage la même configuration que le bloc original ; les modifications apportées à l'original ou à l'une de ses références mettront à jour toutes les références de manière synchronisée.

- `Copie`
  - Crée un bloc indépendant, identique à l'original au moment de la copie ; les modifications ultérieures n'affectent pas les autres blocs et ne sont pas synchronisées.

## Configuration
- Bloc de référence :
  - « Paramètres de référence » : pour spécifier l'UID du bloc cible et choisir le mode Référence/Copie ;
  - Vous verrez également l'ensemble des paramètres du bloc référencé lui-même (ce qui équivaut à configurer directement le bloc original).

![Paramètres du bloc de référence](https://static-docs.nocobase.com/block-reference-settings-20251102.png)

- Bloc copié :
  - Le nouveau bloc obtenu après copie est du même type que l'original et ne contient que ses propres paramètres ;
  - Il n'inclut plus les « Paramètres de référence ».

## États d'erreur et de repli
- Cible manquante/invalide : affiche un message d'erreur. Vous pouvez reconfigurer l'UID du bloc dans les paramètres du bloc de référence (Paramètres de référence → UID du bloc) et enregistrer pour restaurer l'affichage.  

![État d'erreur lorsque le bloc cible est invalide](https://static-docs.nocobase.com/block-reference-error-20251102.png)

## Remarques et limitations
- Fonctionnalité expérimentale — à utiliser avec prudence en environnement de production.
- Lors de la copie d'un bloc, certaines configurations dépendant de l'UID cible peuvent nécessiter une reconfiguration.
- Toutes les configurations d'un bloc de référence sont automatiquement synchronisées, y compris celles liées à la portée des données. Cependant, un bloc de référence peut avoir sa propre [configuration de flux d'événements](/interface-builder/event-flow/). Grâce aux flux d'événements et aux actions JavaScript personnalisées, vous pouvez indirectement obtenir différentes portées de données ou des configurations associées pour chaque référence.