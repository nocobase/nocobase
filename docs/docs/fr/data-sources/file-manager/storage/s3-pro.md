---
pkg: "@nocobase/plugin-file-storage-s3-pro"
---
:::tip Avis de traduction IA
Cette documentation a été traduite automatiquement par IA.
:::



# Stockage de fichiers : S3 (Pro)

## Introduction

En complément du plugin de gestion de fichiers, cette version ajoute la prise en charge des types de stockage de fichiers compatibles avec le protocole S3. Tout service de stockage d'objets prenant en charge le protocole S3 peut être intégré facilement, comme Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, etc., ce qui améliore la compatibilité et la flexibilité des services de stockage.

## Fonctionnalités

1. **Téléchargement direct depuis le client** : Les fichiers sont téléchargés directement vers le service de stockage sans passer par le serveur NocoBase, offrant ainsi une expérience de téléchargement plus efficace et plus rapide.

2. **Accès privé** : Toutes les URL de fichiers sont des adresses d'autorisation temporaires signées, garantissant un accès sécurisé et limité dans le temps aux fichiers.

## Cas d'utilisation

1. **Gestion des collections de fichiers** : Gérez et stockez de manière centralisée tous les fichiers téléchargés, en prenant en charge divers types de fichiers et méthodes de stockage pour faciliter leur classification et leur récupération.

2. **Stockage des champs de pièce jointe** : Stockez les pièces jointes téléchargées via des formulaires ou des enregistrements, et associez-les à des entrées de données spécifiques.

## Configuration du plugin

1. Activez le plugin `plugin-file-storage-s3-pro`.

2. Accédez à "Paramètres -> Gestionnaire de fichiers" pour configurer la gestion des fichiers.

3. Cliquez sur le bouton "Ajouter" et sélectionnez "S3 Pro".

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Dans la fenêtre contextuelle, vous verrez un formulaire détaillé à remplir. Consultez la documentation suivante pour obtenir les paramètres pertinents de votre service de fichiers et saisissez-les correctement dans le formulaire.

![](https://static-docs.nocobase.com/20250413190828536.png)

## Configuration du fournisseur de services

### Amazon S3

#### Création d'un bucket

1. Rendez-vous sur la [console Amazon S3](https://ap-southeast-1.console.aws.amazon.com/s3/home).

2. Cliquez sur le bouton "Create bucket" (Créer un bucket) sur le côté droit.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

3. Saisissez le nom du bucket (Nom du compartiment), laissez les autres champs par défaut, faites défiler jusqu'en bas et cliquez sur le bouton **"Create"** (Créer) pour finaliser la création.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuration CORS

1. Dans la liste des buckets, trouvez et cliquez sur le bucket que vous venez de créer pour accéder à ses détails.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Accédez à l'onglet "Permissions" (Autorisations) et faites défiler jusqu'à la section de configuration CORS.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Saisissez la configuration suivante (personnalisez si nécessaire) et enregistrez.

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "POST",
            "PUT"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970494.png)

#### Récupération de l'AccessKey et du SecretAccessKey

1. Cliquez sur le bouton "Security credentials" (Identifiants de sécurité) dans le coin supérieur droit.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Faites défiler jusqu'à la section "Access Keys" (Clés d'accès) et cliquez sur "Create Access Key" (Créer une clé d'accès).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Acceptez les conditions (l'utilisation d'IAM est recommandée pour les environnements de production).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Enregistrez l'Access Key et le Secret Access Key affichés sur la page.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Récupération et configuration des paramètres

1. Utilisez l'AccessKey ID et le Secret AccessKey que vous avez récupérés lors de l'étape précédente.

2. Accédez au panneau des propriétés du bucket pour trouver le nom du bucket et la région.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Accès public (facultatif)

Cette configuration est facultative. Configurez-la si vous souhaitez rendre les fichiers téléchargés entièrement publics.

1. Dans le panneau "Permissions" (Autorisations), faites défiler jusqu'à "Object Ownership" (Propriété des objets), cliquez sur "Modifier" et activez les ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Faites défiler jusqu'à "Block public access" (Bloquer l'accès public), cliquez sur "Modifier" et configurez-le pour autoriser le contrôle des ACL.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. Cochez "Accès public" dans NocoBase.

#### Configuration des miniatures (facultatif)

Cette configuration est facultative et doit être utilisée lorsque vous avez besoin d'optimiser la taille ou l'effet de l'aperçu de l'image. **Veuillez noter que ce déploiement peut entraîner des coûts supplémentaires. Pour plus de détails, veuillez consulter les conditions et tarifs d'AWS.**

1. Rendez-vous sur [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Cliquez sur le bouton `Launch in the AWS Console` (Lancer dans la console AWS) en bas de la page pour démarrer le déploiement.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Suivez les invites pour compléter la configuration. Les options suivantes nécessitent une attention particulière :
   1. Lors de la création de la pile, vous devrez spécifier le nom du bucket Amazon S3 qui contient les images source. Veuillez saisir le nom du bucket que vous avez créé précédemment.
   2. Si vous avez choisi de déployer l'interface utilisateur de démonstration, vous pourrez l'utiliser après le déploiement pour tester la fonctionnalité de traitement d'image. Dans la console AWS CloudFormation, sélectionnez votre pile, accédez à l'onglet "Outputs" (Sorties), trouvez la valeur correspondant à la clé `DemoUrl` et cliquez sur le lien pour ouvrir l'interface de démonstration.
   3. Cette solution utilise la bibliothèque Node.js `sharp` pour un traitement efficace des images. Vous pouvez télécharger le code source depuis le dépôt GitHub et le personnaliser selon vos besoins.
   
   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Une fois la configuration terminée, attendez que l'état du déploiement passe à `CREATE_COMPLETE`.

5. Dans la configuration NocoBase, veuillez noter les points suivants :
   1. `Thumbnail rule` (Règle de miniature) : Saisissez les paramètres de traitement d'image, par exemple `?width=100`. Pour plus de détails, consultez la [documentation AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html).
   2. `Access endpoint` (Point d'accès) : Saisissez la valeur de Outputs -> ApiEndpoint après le déploiement.
   3. `Full access URL style` (Style d'URL d'accès complet) : Cochez **Ignorer** (car le nom du bucket a déjà été renseigné lors de la configuration et n'est plus nécessaire pour l'accès).
   
   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152344959.png)

### Alibaba Cloud OSS

#### Création d'un bucket

1. Ouvrez la [console OSS](https://oss.console.aliyun.com/overview).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Sélectionnez "Buckets" (Compartiments) dans le menu de gauche et cliquez sur "Create Bucket" (Créer un bucket).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Remplissez les détails du bucket et cliquez sur "Create" (Créer).
    - `Bucket Name` (Nom du bucket) : Choisissez un nom adapté à vos besoins métier.
    - `Region` (Région) : Sélectionnez la région la plus proche de vos utilisateurs.
    - Les autres paramètres peuvent rester par défaut ou être personnalisés selon vos besoins.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)

#### Configuration CORS

1. Accédez à la page de détails du bucket que vous venez de créer.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Cliquez sur "Content Security" (Sécurité du contenu) -> "CORS" dans le menu central.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Cliquez sur le bouton "Create Rule" (Créer une règle), remplissez les champs, faites défiler vers le bas et cliquez sur "OK". Vous pouvez vous référer à la capture d'écran ci-dessous ou configurer des paramètres plus détaillés.

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Récupération de l'AccessKey et du SecretAccessKey

1. Cliquez sur "AccessKey" sous l'avatar de votre compte, en haut à droite.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Pour des raisons de démonstration, nous allons créer une AccessKey en utilisant le compte principal. Dans un environnement de production, il est recommandé d'utiliser RAM pour créer l'AccessKey. Pour les instructions, veuillez vous référer à la [documentation Alibaba Cloud](https://www.alibabacloud.com/help/en/ram/user-guide/create-an-accesskey-pair).
    
3. Cliquez sur le bouton "Create AccessKey" (Créer une clé d'accès).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Effectuez la vérification du compte.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Enregistrez l'Access Key et le Secret Access Key affichés sur la page.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)

#### Récupération et configuration des paramètres

1. Utilisez l'AccessKey ID et le Secret AccessKey obtenus à l'étape précédente.
    
2. Accédez à la page de détails du bucket pour obtenir le nom du bucket.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Faites défiler vers le bas pour obtenir la région (le suffixe ".aliyuncs.com" n'est pas nécessaire).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Obtenez l'adresse du point d'accès (endpoint) et ajoutez le préfixe `https://` lorsque vous la saisissez dans NocoBase.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuration des miniatures (facultatif)

Cette configuration est facultative et ne doit être utilisée que pour optimiser la taille ou l'effet de l'aperçu de l'image.

1. Remplissez les paramètres pertinents pour la `Thumbnail rule` (Règle de miniature). Pour les réglages spécifiques des paramètres, consultez la [documentation Alibaba Cloud sur le traitement d'image](https://www.alibabacloud.com/help/en/oss/user-guide/image-processing).

2. Maintenez les paramètres `Full upload URL style` (Style d'URL de téléchargement complet) et `Full access URL style` (Style d'URL d'accès complet) identiques.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152525600.png)

### MinIO

#### Création d'un bucket

1. Cliquez sur le menu **Buckets** (Compartiments) à gauche -> Cliquez sur **Create Bucket** (Créer un bucket) pour ouvrir la page de création.
2. Saisissez le nom du bucket, puis cliquez sur le bouton **Save** (Enregistrer).

#### Récupération de l'AccessKey et du SecretAccessKey

1. Accédez à **Access Keys** (Clés d'accès) -> Cliquez sur le bouton **Create access key** (Créer une clé d'accès) pour ouvrir la page de création.

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Cliquez sur le bouton **Save** (Enregistrer).

![](https://static-docs.nocobase.com/20250106111850639.png)

3. Enregistrez l'**Access Key** et le **Secret Key** de la fenêtre contextuelle pour une configuration ultérieure.

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuration des paramètres

1. Accédez à la page **Gestionnaire de fichiers** dans NocoBase.

2. Cliquez sur le bouton **Ajouter** et sélectionnez **S3 Pro**.

3. Remplissez le formulaire :
   - **AccessKey ID** et **AccessKey Secret** : Utilisez les valeurs enregistrées à l'étape précédente.
   - **Region** (Région) : Un déploiement MinIO privé n'a pas de concept de région ; vous pouvez le définir sur `"auto"`.
   - **Endpoint** (Point d'accès) : Saisissez le nom de domaine ou l'adresse IP de votre service déployé.
   - Définissez le **Full access URL style** (Style d'URL d'accès complet) sur **Path-Style**.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152700671.png)

### Tencent COS

Vous pouvez vous référer aux configurations des services de fichiers ci-dessus. La logique est similaire.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414153252872.png)

### Cloudflare R2

Vous pouvez vous référer aux configurations des services de fichiers ci-dessus. La logique est similaire.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414154500264.png)

## Guide d'utilisation

Veuillez vous référer à la [documentation du plugin de gestionnaire de fichiers](/data-sources/file-manager).