:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::

# Stockage local

Les fichiers téléchargés sont enregistrés dans un répertoire local sur le serveur. Cette option convient aux scénarios à petite échelle ou expérimentaux où le volume total de fichiers gérés par le système est relativement faible.

## Paramètres de configuration

![Exemple de paramètres du moteur de stockage de fichiers](https://static-docs.nocobase.com/20240529115151.png)

:::info{title=Remarque}
Cette section ne couvre que les paramètres spécifiques au moteur de stockage local. Pour les paramètres généraux, veuillez vous référer aux [Paramètres généraux du moteur](./index.md#general-engine-parameters).
:::

### Chemin

Le chemin représente à la fois le chemin relatif du fichier stocké sur le serveur et le chemin d'accès URL. Par exemple, « `user/avatar` » (sans le « `/` » de début et de fin) représente :

1. Le chemin relatif du fichier téléchargé stocké sur le serveur : `/path/to/nocobase-app/storage/uploads/user/avatar`.
2. Le préfixe URL pour accéder au fichier : `http://localhost:13000/storage/uploads/user/avatar`.