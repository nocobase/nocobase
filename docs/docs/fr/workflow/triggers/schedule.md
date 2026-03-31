:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Tâches planifiées

## Introduction

Une tâche planifiée est un événement déclenché par une condition temporelle. Elle se présente sous deux modes :

- **Temps personnalisé** : Un déclenchement régulier, similaire à `cron`, basé sur l'heure système.
- **Champ temporel de collection** : Un déclenchement basé sur la valeur d'un champ temporel dans une **collection** lorsque l'heure est atteinte.

Lorsque le système atteint le moment (précis à la seconde) qui correspond aux conditions de déclenchement configurées, le **flux de travail** correspondant est activé.

## Utilisation de base

### Créer une tâche planifiée

Lors de la création d'un **flux de travail** dans la liste des **flux de travail**, sélectionnez le type « Tâche planifiée » :

![Créer une tâche planifiée](https://static-docs.nocobase.com/e09b6c9065167875b2ca7de5f5a799a7.png)

### Mode Temps personnalisé

Pour le mode standard, vous devez d'abord configurer l'heure de début à n'importe quel moment (précis à la seconde). L'heure de début peut être définie dans le futur ou dans le passé. Si elle est configurée dans le passé, le système vérifiera si l'heure est due en fonction de la condition de répétition configurée. Si aucune condition de répétition n'est définie et que l'heure de début est dans le passé, le **flux de travail** ne sera plus déclenché.

Il existe deux façons de configurer la règle de répétition :

- **Par intervalle** : Le déclenchement se produit à un intervalle fixe après l'heure de début, par exemple toutes les heures, toutes les 30 minutes, etc.
- **Mode avancé** : Il s'agit des règles `cron`, qui peuvent être configurées pour un cycle atteignant une date et une heure fixes basées sur une règle.

Après avoir configuré la règle de répétition, vous pouvez également définir une condition de fin. La tâche peut se terminer à un moment précis ou être limitée par le nombre de fois où elle a été exécutée.

### Mode Champ temporel de collection

L'utilisation d'un champ temporel de **collection** pour déterminer l'heure de début est un mode de déclenchement qui combine les tâches planifiées classiques avec les champs temporels de **collection**. Ce mode permet de simplifier les nœuds dans certains processus spécifiques et est également plus intuitif en termes de configuration. Par exemple, pour modifier le statut des commandes impayées en retard en « annulé », vous pouvez simplement configurer une tâche planifiée en mode « Champ temporel de **collection** », en sélectionnant l'heure de début à 30 minutes après la création de la commande.

## Conseils associés

### Tâches planifiées en état inactif ou arrêté

Si la condition temporelle configurée est remplie, mais que le service de l'application NocoBase est en état inactif ou arrêté, la tâche planifiée qui aurait dû être déclenchée à ce moment-là sera manquée. De plus, après le redémarrage du service, les tâches manquées ne seront plus déclenchées. Par conséquent, lors de l'utilisation, vous devrez peut-être envisager de gérer ces situations ou de prévoir des mesures de secours.

### Nombre de répétitions

Lorsque la condition de fin « par nombre de répétitions » est configurée, elle calcule le nombre total d'exécutions pour toutes les versions du même **flux de travail**. Par exemple, si une tâche planifiée a été exécutée 10 fois dans la version 1, et que le nombre de répétitions est également défini à 10, ce **flux de travail** ne sera plus déclenché. Même s'il est copié vers une nouvelle version, il ne sera pas déclenché, à moins que le nombre de répétitions ne soit modifié pour un chiffre supérieur à 10. Cependant, s'il est copié en tant que nouveau **flux de travail**, le nombre d'exécutions sera réinitialisé à 0. Sans modifier la configuration pertinente, le nouveau **flux de travail** pourra être déclenché 10 fois supplémentaires.

### Différence entre le mode intervalle et le mode avancé dans les règles de répétition

L'intervalle dans la règle de répétition est relatif au moment du dernier déclenchement (ou à l'heure de début), tandis que le mode avancé déclenche à des moments fixes. Par exemple, si vous configurez un déclenchement toutes les 30 minutes, et que le dernier déclenchement a eu lieu le 2021-09-01 à 12:01:23, alors le prochain déclenchement aura lieu le 2021-09-01 à 12:31:23. Le mode avancé, c'est-à-dire le mode `cron`, est configuré pour déclencher à des moments précis et fixes. Par exemple, vous pouvez le configurer pour qu'il se déclenche à la 01e et à la 31e minute de chaque heure.

## Exemple

Supposons que nous devions vérifier chaque minute les commandes qui n'ont pas été payées plus de 30 minutes après leur création, et modifier automatiquement leur statut en « annulé ». Nous allons implémenter cela en utilisant les deux modes.

### Mode Temps personnalisé

Créez un **flux de travail** basé sur une tâche planifiée. Dans la configuration du déclencheur, sélectionnez le mode « Temps personnalisé », définissez l'heure de début à n'importe quel moment non postérieur à l'heure actuelle, choisissez « Chaque minute » pour la règle de répétition et laissez la condition de fin vide :

![Tâche planifiée_Configuration du déclencheur_Mode Temps personnalisé](https://static-docs.nocobase.com/71131e3f2034263f883062389b356cbd.png)

Ensuite, configurez les autres nœuds selon la logique du processus : calculez l'heure il y a 30 minutes, puis modifiez le statut des commandes impayées créées avant cette heure en « annulé » :

![Tâche planifiée_Configuration du déclencheur_Mode Temps personnalisé](https://static-docs.nocobase.com/188bc5287ffa1fb24a4e7baa1de6eb29.png)

Une fois le **flux de travail** activé, il sera déclenché une fois par minute à partir de l'heure de début. Il calculera l'heure il y a 30 minutes pour mettre à jour le statut des commandes créées avant ce moment en « annulé ».

### Mode Champ temporel de collection

Créez un **flux de travail** basé sur une tâche planifiée. Dans la configuration du déclencheur, sélectionnez le mode « Champ temporel de **collection** », choisissez la **collection** « Commandes », définissez l'heure de début à 30 minutes après l'heure de création de la commande, et sélectionnez « Ne pas répéter » pour la règle de répétition :

![Tâche planifiée_Configuration du déclencheur_Mode Champ temporel de collection_Déclencheur](https://static-docs.nocobase.com/d40d5aef57f42799d31cc5882dd94246.png)

Ensuite, configurez les autres nœuds selon la logique du processus pour mettre à jour le statut de la commande dont l'ID correspond à l'ID de la donnée déclenchée et dont le statut est « impayé » en « annulé » :

![Tâche planifiée_Configuration du déclencheur_Mode Champ temporel de collection_Nœud de mise à jour](https://static-docs.nocobase.com/491dde9df8f773f5b14a4fd8ceac9d3e.png)

Contrairement au mode Temps personnalisé, il n'est pas nécessaire de calculer l'heure il y a 30 minutes ici, car le contexte des données déclenchées du **flux de travail** contient déjà la ligne de données qui remplit la condition temporelle. Vous pouvez donc directement mettre à jour le statut de la commande correspondante.