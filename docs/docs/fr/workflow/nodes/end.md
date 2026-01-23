:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Terminer le flux de travail

Lorsque ce nœud est exécuté, il met immédiatement fin au flux de travail en cours avec l'état configuré dans le nœud. Il est généralement utilisé pour le contrôle de flux basé sur une logique spécifique, permettant de quitter le flux de travail actuel lorsque certaines conditions sont remplies et d'arrêter l'exécution des processus ultérieurs. On peut le comparer à l'instruction `return` des langages de programmation, qui sert à quitter la fonction en cours d'exécution.

## Ajouter un nœud

Dans l'interface de configuration du flux de travail, cliquez sur le bouton plus (« + ») dans le flux pour ajouter un nœud « Terminer le flux de travail » :

![Terminer le flux de travail_Ajouter](https://static-docs.nocobase.com/672186ab4c8f7313dd3cf9c880b524b8.png)

## Configuration du nœud

![Terminer le flux de travail_Configuration du nœud](https://static-docs.nocobase.com/bb6a597f25e9afb72836a14a0fe0683e.png)

### État de fin

L'état de fin influencera l'état final de l'exécution du flux de travail. Vous pouvez le configurer comme « Réussi » ou « Échoué ». Lorsque l'exécution du flux de travail atteint ce nœud, elle se terminera immédiatement avec l'état configuré.

:::info{title=Note}
Lorsqu'il est utilisé dans un flux de travail de type « événement avant action », il interceptera la requête qui a initié l'action. Pour plus de détails, veuillez consulter [Utilisation de l'« événement avant action »](../triggers/pre-action).

De plus, en plus d'intercepter la requête qui a initié l'action, la configuration de l'état de fin affectera également l'état des informations de retour dans le « message de réponse » pour ce type de flux de travail.
:::