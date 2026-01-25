:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Éditeur de thèmes

> La fonctionnalité de thème actuelle est basée sur Ant Design 5.x. Nous vous recommandons de vous familiariser avec les concepts de [personnalisation de thème](https://ant.design/docs/react/customize-theme) avant de poursuivre la lecture de ce document.

## Introduction

Le **plugin** Éditeur de thèmes vous permet de modifier les styles de l'ensemble de l'interface utilisateur. Actuellement, il prend en charge l'édition des [SeedToken](https://ant.design/docs/react/customize-theme#seedtoken), [MapToken](https://ant.design/docs/react/customize-theme#maptoken) et [AliasToken](https://ant.design/docs/react/customize-theme#aliastoken) globaux, ainsi que la [commutation](https://ant.design/docs/react/customize-theme#use-preset-algorithms) vers le `Mode sombre` et le `Mode compact`. À l'avenir, la personnalisation de thèmes au [niveau des composants](https://ant.design/docs/react/customize-theme#component-level-customization) pourrait être prise en charge.

## Instructions d'utilisation

### Activer le **plugin** Éditeur de thèmes

Tout d'abord, mettez à jour NocoBase vers la dernière version (v0.11.1 ou supérieure). Ensuite, recherchez la carte `Éditeur de thèmes` sur la page de gestion des **plugins**. Cliquez sur le bouton `Activer` en bas à droite de la carte et attendez que la page se rafraîchisse.

![20240409132838](https://static-docs.nocobase.com/20240409132838.png)

### Accéder à la page de configuration des thèmes

Une fois le **plugin** activé, cliquez sur le bouton de paramètres en bas à gauche de la carte pour accéder à la page d'édition des thèmes. Quatre options de thème sont proposées par défaut : `Thème par défaut`, `Thème sombre`, `Thème compact` et `Thème sombre compact`.

![20240409133020](https://static-docs.nocobase.com/20240409133020.png)

### Ajouter un nouveau thème

Cliquez sur le bouton `Ajouter un nouveau thème` et sélectionnez `Créer un tout nouveau thème`. Un éditeur de thèmes apparaîtra sur le côté droit de la page, vous permettant de modifier les `Couleurs`, les `Tailles`, les `Styles` et d'autres options. Une fois les modifications effectuées, saisissez un nom pour le thème et cliquez sur Enregistrer pour finaliser sa création.

![20240409133147](https://static-docs.nocobase.com/20240409133147.png)

### Appliquer un nouveau thème

Déplacez votre souris vers le coin supérieur droit de la page pour voir le sélecteur de thèmes. Cliquez dessus pour basculer vers d'autres thèmes, comme celui que vous venez d'ajouter.

![20240409133247](https://static-docs.nocobase.com/20240409133247.png)

### Modifier un thème existant

Cliquez sur le bouton `Modifier` en bas à gauche de la carte. Un éditeur de thèmes apparaîtra sur le côté droit de la page (identique à celui utilisé pour ajouter un nouveau thème). Une fois les modifications effectuées, cliquez sur Enregistrer pour finaliser la modification du thème.

![20240409134413](https://static-docs.nocobase.com/20240409134413.png)

### Définir les thèmes sélectionnables par l'utilisateur

Les thèmes nouvellement ajoutés sont sélectionnables par les utilisateurs par défaut. Si vous ne souhaitez pas qu'un thème soit disponible pour les utilisateurs, désactivez l'interrupteur `Sélectionnable par l'utilisateur` en bas à droite de la carte du thème. Les utilisateurs ne pourront alors plus basculer vers ce thème.

![20240409133331](https://static-docs.nocobase.com/20240409133331.png)

### Définir comme thème par défaut

Initialement, le thème par défaut est `Thème par défaut`. Pour définir un thème spécifique comme thème par défaut, activez l'interrupteur `Thème par défaut` en bas à droite de la carte du thème. Ainsi, lorsque les utilisateurs ouvriront la page pour la première fois, ils verront ce thème. Remarque : Le thème par défaut ne peut pas être supprimé.

![20240409133409](https://static-docs.nocobase.com/20240409133409.png)

### Supprimer un thème

Cliquez sur le bouton `Supprimer` sous la carte, puis confirmez dans la boîte de dialogue qui apparaît pour supprimer le thème.

![20240409133435](https://static-docs.nocobase.com/20240409133435.png)