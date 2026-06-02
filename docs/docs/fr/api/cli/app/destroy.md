---
title: "nb app destroy"
description: "Référence de la commande nb app destroy : supprimer pour un env sélectionné les ressources de runtime gérées, les données de storage et la configuration env enregistrée."
keywords: "nb app destroy,NocoBase CLI,détruire un env,nettoyage,supprimer le storage"
---

# nb app destroy

Détruit un env sélectionné en supprimant les ressources de runtime gérées, les données de storage et la configuration CLI env enregistrée.

Pour les env locaux et Docker, la commande supprime d’abord sur cette machine les ressources de runtime applicatif gérées, supprime aussi le runtime de base de données intégrée lorsqu’il est présent, efface les données de storage, puis supprime la configuration CLI env enregistrée. Pour les env HTTP et SSH, elle supprime uniquement la configuration CLI env enregistrée et ne touche pas aux services externes.

Pour les env npm/Git locaux téléchargés, la commande supprime aussi les fichiers d’application locaux gérés par le CLI. Pour les chemins d’application locaux personnalisés, elle conserve les fichiers source locaux et supprime uniquement les ressources de runtime gérées, les données de storage et la configuration env enregistrée.

Par défaut, la commande demande une confirmation. En mode non interactif, vous devez transmettre explicitement `--env` et `--force`.

## Utilisation

```bash
nb app destroy [flags]
```

## Paramètres

| Paramètre | Type | Description |
| --- | --- | --- |
| `--env`, `-e` | string | Nom du CLI env à détruire ; en mode interactif, l’env courant est utilisé par défaut si ce paramètre est omis |
| `--force`, `-f` | boolean | Ignorer la confirmation et détruire immédiatement l’env sélectionné ; obligatoire en mode non interactif |
| `--verbose` | boolean | Afficher la sortie brute des commandes de destruction |

## Exemples

```bash
nb app destroy --env app1
nb app destroy --env app1 --force
```

## Commandes connexes

- [`nb app stop`](./stop.md)
- [`nb app down`](./down.md)
- [`nb env remove`](../env/remove.md)
