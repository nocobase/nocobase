---
title: Configurer un environnement de développement local sous Windows avec WSL
description: Préparer Ubuntu, Docker Desktop, Node.js, Yarn et Codex CLI avec WSL 2 sous Windows pour le développement local NocoBase et les workflows AI Agent.
---

# Configurer un environnement de développement local sous Windows avec WSL

Pour développer NocoBase localement sous Windows, il est recommandé de préparer WSL 2. Node.js, Yarn, NocoBase CLI, les commandes Docker et les AI Agents peuvent alors fonctionner dans le même shell Linux, avec des chemins, permissions et builds de dépendances natives plus proches d’un environnement Linux courant.

Si tu ne sais pas encore si WSL est nécessaire, consulte d’abord [Configuration du développement local](./local-development-setup.md).

## Préparation

Avant de commencer, vérifie la version de Windows et l’état de la virtualisation.

### Vérifier la version de Windows

Appuie sur `Win + R`, saisis `winver`, puis confirme que le système correspond à l’un des cas suivants :

- Windows 11
- Windows 10 version 2004 ou plus récente, Build 19041 ou plus récent

Si la version est plus ancienne, mets d’abord Windows à jour.

### Vérifier la virtualisation

Ouvre le Gestionnaire des tâches, va dans Performance / CPU, puis vérifie que la virtualisation est activée.

Si elle n’est pas activée, active-la dans le BIOS / UEFI. Selon le fabricant, l’option peut s’appeler Intel VT-x, Intel Virtualization Technology, AMD-V ou SVM Mode.

## Étape 1 : installer WSL 2

Ouvre PowerShell en tant qu’administrateur et exécute :

```powershell
wsl --install
```

Redémarre l’ordinateur après l’installation. Par défaut, cette commande installe Ubuntu. Au premier démarrage, Ubuntu demande de créer un nom d’utilisateur et un mot de passe Linux. Ils sont propres à WSL et n’ont pas besoin d’être identiques au compte Windows.

Pour choisir une distribution précise, liste d’abord les distributions disponibles :

```powershell
wsl --list --online
```

Puis installe la distribution voulue, par exemple Ubuntu :

```powershell
wsl --install -d Ubuntu
```

## Étape 2 : confirmer la version de WSL

Dans PowerShell, exécute :

```powershell
wsl --list --verbose
```

La sortie doit indiquer `VERSION 2` pour la distribution utilisée :

```text
  NAME      STATE           VERSION
* Ubuntu    Running         2
```

Si une distribution utilise encore WSL 1, convertis-la :

```powershell
wsl --set-version Ubuntu 2
wsl --set-default-version 2
wsl --update
```

## Étape 3 : installer Docker Desktop

Si tu prévois d’installer ou d’exécuter NocoBase avec Docker, installe Docker Desktop for Windows.

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)

Pendant l’installation, le mode `Per-user` convient généralement au développement local. Sur l’écran de configuration, choisis `Use WSL 2 instead of Hyper-V`, puis démarre Docker Desktop depuis le menu Démarrer.

## Étape 4 : activer l’intégration WSL de Docker

Dans Docker Desktop, vérifie d’abord que le backend WSL 2 est activé :

1. Docker Desktop / Settings / General
2. Use the WSL 2 based engine
3. Apply

![Docker Desktop WSL 2 engine](https://static-docs.nocobase.com/2026-06-12-19-10-41.png)

Active ensuite l’intégration avec la distribution WSL :

1. Docker Desktop / Settings / Resources / WSL Integration
2. Enable integration with my default WSL distro
3. Active la distribution, par exemple `Ubuntu`
4. Apply & restart ou Apply

![Docker Desktop WSL integration](https://static-docs.nocobase.com/2026-06-12-19-11-09.png)

Si WSL Integration n’apparaît pas, Docker Desktop est souvent en mode Windows containers. Change vers Linux containers depuis l’icône Docker dans la zone de notification Windows, puis vérifie à nouveau.

## Étape 5 : vérifier Docker

Vérifie d’abord depuis PowerShell :

```powershell
wsl --list --verbose
docker version
docker compose version
docker run hello-world
```

Entre ensuite dans WSL :

```powershell
wsl
```

Puis exécute dans WSL :

```bash
docker version
docker compose version
docker run hello-world
```

Si le conteneur `hello-world` est téléchargé et lancé correctement, l’intégration Docker Desktop et WSL 2 fonctionne.

## Étape 6 : installer Node.js et Yarn dans WSL

WSL n’est pas un environnement Node.js par défaut. Ubuntu installé avec `wsl --install` ne contient généralement pas Node.js ni npm.

Dans WSL, vérifie d’abord :

```bash
node -v
npm -v
```

Si la commande est introuvable, installe Node.js 22 avec NodeSource :

```bash
sudo apt update
sudo apt install -y curl
curl -fsSL https://deb.nodesource.com/setup_22.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt install -y nodejs
node -v
npm -v
npx -v
```

Si tu dois changer de version Node.js selon les projets, utilise plutôt nvm :

```bash
sudo apt update
sudo apt install -y curl ca-certificates
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
npm -v
npx -v
```

:::warning Remarque

Choisis NodeSource ou nvm. Il n’est pas recommandé de mélanger les deux méthodes dans le même utilisateur WSL.

:::

Installe ensuite Yarn 1.x :

```bash
corepack enable
corepack prepare yarn@1.22.22 --activate
yarn -v
```

Si Corepack n’est pas disponible :

```bash
npm install -g yarn@1.22.22
yarn -v
```

## Étape 7 : installer Codex CLI

Codex CLI peut aussi fonctionner dans la ligne de commande Windows native. Ici, on l’installe dans WSL pour que Codex et la chaîne d’outils NocoBase restent dans le même environnement Linux.

Vérifie que tu es dans WSL :

```bash
echo $WSL_DISTRO_NAME
```

Installe Codex CLI dans WSL :

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

Installation non interactive :

```bash
curl -fsSL https://chatgpt.com/codex/install.sh | CODEX_NON_INTERACTIVE=1 sh
```

Lance et vérifie Codex :

```bash
codex
codex --version
```

Il est recommandé de lancer Codex depuis un dossier de projet dans WSL :

```bash
mkdir -p ~/projects
cd ~/projects/my-app
codex
```

:::tip Remarque

Comme Codex est installé dans WSL, exécute ensuite `codex` depuis le terminal WSL. PowerShell utilise l’environnement Windows natif, qui n’est pas le même environnement que celui préparé ici.

:::

## Où placer les fichiers du projet

Il est recommandé de placer les projets dans le système de fichiers WSL :

```bash
~/projects/my-app
```

Évite de les placer par défaut dans le chemin monté Windows :

```bash
/mnt/c/Users/<your-name>/projects/my-app
```

Cela donne généralement de meilleures performances et réduit les problèmes de permissions et de liens symboliques.

Pour accéder aux fichiers WSL depuis l’Explorateur Windows :

```text
\\wsl$\Ubuntu\home\<your-name>
```

## Questions fréquentes

### WSL ne trouve pas la commande docker

Vérifie que la distribution utilise WSL 2, puis active l’intégration correspondante dans Docker Desktop / Settings / Resources / WSL Integration.

```powershell
wsl --list --verbose
wsl --set-version Ubuntu 2
```

### WSL Integration n’apparaît pas

Docker Desktop est probablement en mode Windows containers. Depuis l’icône Docker, passe à Linux containers, puis rouvre les paramètres WSL Integration.

### Docker Desktop ne démarre pas ou WSL semble anormal

Essaie d’abord :

```powershell
wsl --shutdown
wsl --update
```

Puis redémarre Docker Desktop.

### Docker Engine a déjà été installé manuellement dans WSL

Docker recommande de supprimer Docker Engine ou Docker CLI installés directement dans la distribution WSL avant d’utiliser Docker Desktop, afin d’éviter les conflits avec l’intégration WSL.

### WSL ne trouve pas la commande codex

Vérifie que tu es bien dans WSL, puis vérifie le `PATH` :

```bash
echo $WSL_DISTRO_NAME
which codex
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

## Références officielles

- [Microsoft Learn: How to install Linux on Windows with WSL](https://learn.microsoft.com/en-us/windows/wsl/install)
- [Microsoft Learn: Install Node.js on Windows Subsystem for Linux](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl)
- [Docker Docs: Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Docker Docs: Docker Desktop WSL 2 backend on Windows](https://docs.docker.com/desktop/features/wsl/)
- [Docker Docs: Change your Docker Desktop settings](https://docs.docker.com/desktop/settings-and-maintenance/settings/)
- [OpenAI Developers: Codex CLI](https://developers.openai.com/codex/cli)
- [OpenAI Developers: Codex on Windows](https://developers.openai.com/codex/windows)
- [nvm: Node Version Manager](https://github.com/nvm-sh/nvm)
- [npm Docs: Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm/)
