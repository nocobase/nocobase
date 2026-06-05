:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Gestion des versions

Une fois qu'un flux de travail configuré a été déclenché au moins une fois, si vous souhaitez modifier sa configuration ou ses nœuds, vous devrez créer une nouvelle version avant d'apporter des changements. Cette approche garantit que l'historique d'exécution des flux de travail précédemment déclenchés ne sera pas affecté par les modifications futures.

Sur la page de configuration du flux de travail, vous pouvez consulter les versions existantes du flux de travail depuis le menu des versions situé dans le coin supérieur droit :

![Voir les versions du flux de travail](https://static-docs.nocobase.com/ad93d2c08166b0e3e643fb148713a63f.png)

Dans le menu « Plus d'actions » (« ... ») situé à sa droite, vous pouvez choisir de copier la version actuellement affichée vers une nouvelle version :

![Copier le flux de travail vers une nouvelle version](https://static-docs.nocobase.com/2805798e6caca2af00483390a744256.png)

Après avoir copié vers une nouvelle version, cliquez sur le bouton bascule « Activer »/« Désactiver » pour passer la version correspondante à l'état activé. La nouvelle version du flux de travail prendra alors effet.

Si vous devez resélectionner une ancienne version, basculez vers celle-ci depuis le menu des versions, puis cliquez à nouveau sur le bouton bascule « Activer »/« Désactiver » pour la passer à l'état activé. La version actuellement affichée prendra effet, et les déclenchements ultérieurs exécuteront le processus de cette version.

Lorsque vous devez désactiver le flux de travail, cliquez sur le bouton bascule « Activer »/« Désactiver » pour le passer à l'état désactivé. Le flux de travail ne sera alors plus déclenché.

:::info{title=Conseil}
Contrairement à la fonction « Copier » un flux de travail depuis la liste de gestion des flux de travail, un flux de travail « copié vers une nouvelle version » reste regroupé au sein du même ensemble de flux de travail, se distinguant uniquement par sa version. En revanche, copier un flux de travail est traité comme un flux de travail entièrement nouveau, sans lien avec les versions du flux de travail précédent, et son compteur d'exécutions sera également remis à zéro.
:::