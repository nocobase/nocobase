---
pkg: '@nocobase/plugin-workflow-parallel'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::


# Branche parallèle

Le nœud de branche parallèle peut diviser un flux de travail en plusieurs branches. Chaque branche peut être configurée avec différents nœuds, et la méthode d'exécution varie en fonction du mode de la branche. Utilisez le nœud de branche parallèle dans les scénarios où plusieurs actions doivent être exécutées simultanément.

## Installation

Ce plugin est intégré, vous n'avez donc pas besoin de l'installer.

## Créer un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Branche parallèle » :

![Ajouter une branche parallèle](https://static-docs.nocobase.com/9e0f3faa0b9335270647a30477559eac.png)

Après avoir ajouté un nœud de branche parallèle au flux de travail, deux sous-branches sont ajoutées par défaut. Vous pouvez également ajouter d'autres branches en cliquant sur le bouton d'ajout de branche. Vous pouvez ajouter autant de nœuds que vous le souhaitez à chaque branche. Les branches inutiles peuvent être supprimées en cliquant sur le bouton de suppression au début de la branche.

![Gérer les branches parallèles](https://static-docs.nocobase.com/36088a8b7970c8a1771eb3ee9bc2a757.png)

## Configuration du nœud

### Mode de branche

Le nœud de branche parallèle dispose des trois modes suivants :

- **Tous réussissent** : Le flux de travail ne continuera à exécuter les nœuds après la fin des branches que si toutes les branches s'exécutent avec succès. Sinon, si une branche se termine prématurément (que ce soit en raison d'un échec, d'une erreur ou de tout autre état non réussi), l'ensemble du nœud de branche parallèle se terminera prématurément avec cet état. C'est également appelé « mode All ».
- **N'importe lequel réussit** : Le flux de travail continuera à exécuter les nœuds après la fin des branches dès qu'une branche s'exécutera avec succès. L'ensemble du nœud de branche parallèle ne se terminera prématurément que si toutes les branches se terminent prématurément (que ce soit en raison d'un échec, d'une erreur ou de tout autre état non réussi). C'est également appelé « mode Any ».
- **N'importe lequel réussit ou échoue** : Le flux de travail continuera à exécuter les nœuds après la fin des branches dès qu'une branche s'exécutera avec succès. Cependant, si un nœud échoue, l'ensemble du nœud de branche parallèle se terminera prématurément avec cet état. C'est également appelé « mode Race ».

Quel que soit le mode, chaque branche sera exécutée dans l'ordre de gauche à droite jusqu'à ce que les conditions du mode de branche prédéfini soient remplies, après quoi elle continuera vers les nœuds suivants ou se terminera prématurément.

## Exemple

Référez-vous à l'exemple dans [Nœud de délai](./delay.md).