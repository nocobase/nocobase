---
pkg: '@nocobase/plugin-workflow-subflow'
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Sortie du flux de travail

## Introduction

Le nœud « Sortie du flux de travail » est utilisé dans un flux de travail appelé pour définir sa valeur de sortie. Lorsqu'un flux de travail est appelé par un autre, vous pouvez utiliser le nœud « Sortie du flux de travail » pour renvoyer une valeur à l'appelant.

## Créer un nœud

Dans le flux de travail appelé, ajoutez un nœud « Sortie du flux de travail » :

![20241231002033](https://static-docs.nocobase.com/20241231002033.png)

## Configurer le nœud

### Valeur de sortie

Saisissez ou sélectionnez une variable comme valeur de sortie. La valeur de sortie peut être de n'importe quel type : il peut s'agir d'une constante (chaîne de caractères, nombre, booléen, date ou JSON personnalisé) ou d'une autre variable du flux de travail.

![20241231003059](https://static-docs.nocobase.com/20241231003059.png)

:::info{title=Conseil}
Si plusieurs nœuds « Sortie du flux de travail » sont ajoutés à un flux de travail appelé, lors de l'appel de ce flux de travail, la valeur du dernier nœud « Sortie du flux de travail » exécuté sera celle qui sera renvoyée.
:::