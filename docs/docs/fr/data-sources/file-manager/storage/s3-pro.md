---
title: "Stockage de fichiers : S3 (Pro)"
description: "Moteur de stockage S3 Pro, stockage d’entreprise compatible avec le protocole S3, prenant en charge les Endpoint personnalisés et les configurations avancées."
keywords: "S3 Pro, stockage d’objets, stockage cloud, compatible S3,NocoBase"
---

# Stockage de fichiers : S3 (Pro)

<PluginInfo commercial="true" name="file-storage-s3-pro"></PluginInfo>

## Présentation

En complément du plugin de gestion des fichiers, ce type de stockage de fichiers compatible avec le protocole S3 est désormais pris en charge. Tout service de stockage d’objets prenant en charge le protocole S3 peut être facilement intégré, notamment Amazon S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO et Cloudflare R2, ce qui améliore davantage la compatibilité et la flexibilité des services de stockage.

## Fonctionnalités

1. Téléversement côté client : le processus de téléversement des fichiers ne passe pas par le serveur NocoBase. Il se connecte directement au service de stockage de fichiers afin d’offrir une expérience de téléversement plus efficace et plus rapide.

2. Accès privé : lors de l’accès aux fichiers, toutes les URL sont des adresses temporaires autorisées et signées, ce qui garantit la sécurité et la durée de validité de l’accès aux fichiers.


## Cas d’utilisation

1. **Gestion des tables de fichiers** : gérez et stockez de manière centralisée tous les fichiers téléversés, avec la prise en charge de nombreux types de fichiers et modes de stockage, afin de faciliter leur classement et leur recherche.

2. **Stockage dans les champs de pièces jointes** : stockez les pièces jointes téléversées dans des formulaires ou des enregistrements, avec la possibilité de les associer aux enregistrements correspondants.


## Configuration du plugin

1. Activez le plugin plugin-file-storage-s3-pro

2. Cliquez sur "Setting-> FileManager" pour accéder aux paramètres de gestion des fichiers

3. Cliquez sur le bouton "Add new", puis sélectionnez "S3 Pro"

![](https://static-docs.nocobase.com/20250102160704938.png)

4. Après l’ouverture du panneau contextuel, vous constaterez que le formulaire comporte de nombreux champs à remplir. Consultez les sections suivantes pour obtenir les paramètres correspondant au service de fichiers utilisé et renseignez-les correctement dans le formulaire.

![](https://static-docs.nocobase.com/20250413190828536.png)


## Configuration des fournisseurs

### Amazon S3

#### Création d’un bucket

1. Ouvrez https://ap-southeast-1.console.aws.amazon.com/s3/home pour accéder à la console S3

2. Cliquez sur le bouton "Create bucket" à droite

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969452.png)

2. Renseignez le Bucket Name (nom du bucket). Vous pouvez conserver les valeurs par défaut des autres champs, puis faites défiler la page jusqu’en bas et cliquez sur le bouton **"**Create**"** pour terminer la création.

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969622.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969811.png)

#### Configuration de CORS

1. Accédez à la liste des buckets, recherchez le bucket que vous venez de créer et cliquez dessus pour accéder à sa page de détails

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355969980.png)

2. Cliquez sur l’onglet "Permission", puis faites défiler la page vers le bas jusqu’à la section de configuration CORS

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970155.png)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970303.png)

3. Renseignez la configuration suivante (vous pouvez l’affiner selon vos besoins), puis enregistrez

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

#### Obtention de l’AccessKey et de la SecretAccessKey

1. Cliquez sur le bouton "Security credentials" situé en haut à droite de la page

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970651.png)

2. Faites défiler la page vers le bas jusqu’à la section "Access Keys", puis cliquez sur le bouton "Create Access Key".

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970832.png)

3. Cliquez sur « Accepter » (cet exemple utilise le compte principal ; en environnement de production, il est recommandé d’utiliser IAM).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355970996.png)

4. Enregistrez l’Access key et la Secret access key affichées sur la page

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971168.png)

#### Obtention et configuration des paramètres

1. L’AccessKey ID et l’AccessKey Secret correspondent aux valeurs obtenues lors de l’étape précédente. Veillez à les renseigner correctement

2. Accédez au panneau properties de la page de détails du bucket pour obtenir le nom du Bucket et les informations de Region (région).

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971345.png)

#### Accès public (facultatif)

Cette configuration n’est pas obligatoire. Configurez-la lorsque vous souhaitez rendre les fichiers téléversés entièrement publics

1. Accédez au panneau Permissions, faites défiler jusqu’à Object Ownership, cliquez sur Modifier et activez les ACL

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971508.png)

2. Faites défiler jusqu’à Block public access, cliquez sur Modifier et autorisez le contrôle par les ACL

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355971668.png)

3. D בתוך NocoBase, cochez Public access


#### Configuration des miniatures (facultatif)

Cette configuration est facultative et permet d’optimiser la taille ou le rendu de l’aperçu des images. **Veuillez noter que cette solution de déploiement peut entraîner des frais supplémentaires. Consultez les conditions correspondantes d’AWS pour connaître les frais exacts.**

1. Accédez à [Dynamic Image Transformation for Amazon CloudFront](https://aws.amazon.com/solutions/implementations/dynamic-image-transformation-for-amazon-cloudfront/?nc1=h_ls).

2. Cliquez sur le bouton `Launch in the AWS Console` en bas de la page pour commencer le déploiement de la solution.
   ![](https://static-docs.nocobase.com/20250221164214117.png)

3. Suivez les instructions pour terminer la configuration. Portez une attention particulière aux options suivantes :
   1. Lors de la création de la pile, vous devez spécifier le nom d’un bucket Amazon S3 contenant les images source. Renseignez le nom du bucket créé précédemment.
   2. Si vous choisissez de déployer l’interface utilisateur de démonstration, vous pourrez tester les fonctions de traitement des images via cette interface une fois le déploiement terminé. Dans la console AWS CloudFormation, sélectionnez votre pile, accédez à l’onglet « Outputs », recherchez la valeur correspondant à la clé DemoUrl, puis cliquez sur ce lien pour ouvrir l’interface de démonstration.
   3. Cette solution utilise la bibliothèque `sharp` Node.js pour traiter efficacement les images. Vous pouvez télécharger le code source depuis le dépôt GitHub et le personnaliser selon vos besoins.

   ![](https://static-docs.nocobase.com/20250221164315472.png)
   ![](https://static-docs.nocobase.com/20250221164404755.png)

4. Une fois la configuration terminée, attendez que l’état du déploiement devienne `CREATE_COMPLETE`.

5. Dans la configuration de NocoBase, tenez compte des points suivants :
   1. `Thumbnail rule` : renseignez les paramètres liés au traitement des images, par exemple `?width=100`. Consultez [la documentation AWS](https://docs.aws.amazon.com/solutions/latest/serverless-image-handler/use-supported-query-param-edits.html) pour plus de détails.
   2. `Access endpoint` : renseignez la valeur de Outputs -> ApiEndpoint après le déploiement.
   3. `Full access URL style` : cochez **Ignore** (le nom du bucket ayant déjà été renseigné lors de la configuration, il n’est plus nécessaire lors de l’accès).

   ![](https://static-docs.nocobase.com/20250414152135514.png)

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152344959.png)


### Alibaba Cloud OSS

#### Création d’un bucket

1. Ouvrez la console OSS à l’adresse https://oss.console.aliyun.com/overview

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972149.png)

2. Cliquez sur "Buckets" dans le menu de gauche, puis sur le bouton "Create Bucket" pour commencer la création du bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972413.png)

3. Renseignez les informations relatives au bucket, puis cliquez sur le bouton Create

    1. Le Bucket Name doit correspondre à votre activité ; le nom est libre

    2. Pour Region, sélectionnez la région la plus proche de vos utilisateurs

    3. Vous pouvez conserver les autres paramètres par défaut ou les configurer selon vos besoins

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355972730.png)


#### Configuration de CORS

1. Accédez à la page de détails du bucket créé à l’étape précédente

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973018.png)

2. Cliquez sur "Content Security -> CORS" dans le menu central

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973319.png)

3. Cliquez sur le bouton "Create Rule", renseignez les informations nécessaires, faites défiler vers le bas et cliquez sur "OK". Vous pouvez vous référer à la capture ci-dessous ou effectuer une configuration plus détaillée

![](https://static-docs.nocobase.com/20250219171042784.png)

#### Obtention de l’AccessKey et de la SecretAccessKey

1. Cliquez sur "AccessKey" sous l’avatar situé en haut à droite

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355973884.png)

2. Pour faciliter la démonstration, un AccessKey est créé avec le compte principal. En environnement de production, il est recommandé d’utiliser RAM. Consultez https://help.aliyun.com/zh/ram/user-guide/create-an-accesskey-pair-1?spm=5176.28366559.0.0.1b5c3c2fUI9Ql8#section-rjh-18m-7kp

3. Cliquez sur le bouton "Create AccessKey"

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974171.png)

4. Effectuez la vérification du compte

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974509.png)

5. Enregistrez l’Access key et la Secret access key affichées sur la page

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355974781.png)


#### Obtention et configuration des paramètres

1. L’AccessKey ID et l’AccessKey Secret sont les valeurs obtenues lors de l’étape précédente

2. Accédez à la page de détails du bucket pour obtenir le Bucket

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975063.png)

3. Faites défiler vers le bas pour obtenir la Region (la partie ".aliyuncs.com" qui suit n’est pas nécessaire)

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975437.png)

4. Obtenez l’adresse endpoint. Lors de sa saisie dans NocoBase, ajoutez le préfixe https://

![](https://static-docs.nocobase.com/file-storage-s3-pro-1735355975715.png)

#### Configuration des miniatures (facultatif)

Cette configuration est facultative et s’utilise uniquement lorsque vous devez optimiser la taille ou le rendu de l’aperçu des images.

1. Renseignez les paramètres associés à `Thumbnail rule`. Consultez [les paramètres de traitement des images](https://help.aliyun.com/zh/oss/user-guide/img-parameters/?spm=a2c4g.11186623.help-menu-31815.d_4_14_1_1.170243033CdbSm&scm=20140722.H_144582._.OR_help-T_cn~zh-V_1) pour plus de détails.

2. `Full upload URL style` et `Full access URL style` peuvent être définis sur la même valeur.

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152525600.png)


### MinIO

#### Création d’un bucket

1. Cliquez sur le menu Buckets à gauche, puis sur Create Bucket pour accéder à la page de création
2. Renseignez le nom du bucket, puis cliquez sur le bouton d’enregistrement
#### Obtention de l’AccessKey et de la SecretAccessKey

1. Accédez à Access Keys, puis cliquez sur le bouton Create access key pour accéder à la page de création

![](https://static-docs.nocobase.com/20250106111922957.png)

2. Cliquez sur le bouton d’enregistrement

![](https://static-docs.nocobase.com/20250106111850639.png)

1. Enregistrez l’Access Key et la Secret Key affichées dans la fenêtre contextuelle pour les utiliser lors de la configuration

![](https://static-docs.nocobase.com/20250106112831483.png)

#### Configuration des paramètres

1. Accédez à la page NocoBase -> File manager

2. Cliquez sur le bouton Add new, puis sélectionnez S3 Pro

3. Renseignez le formulaire
   - **AccessKey ID** et **AccessKey Secret** correspondent aux valeurs enregistrées à l’étape précédente
   - **Region** : une instance MinIO déployée en local ne possède pas de notion de Region ; vous pouvez définir la valeur "auto"
   - **Endpoint** : renseignez le nom de domaine ou l’adresse IP du service déployé
   - Vous devez définir Full access URL style sur Path-Style

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414152700671.png)


### Tencent COS

Vous pouvez vous référer à la configuration des services de fichiers présentée ci-dessus ; le fonctionnement est similaire

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414153252872.png)


### Cloudflare R2

Vous pouvez vous référer à la configuration des services de fichiers présentée ci-dessus ; le fonctionnement est similaire

#### Exemple de configuration

![](https://static-docs.nocobase.com/20250414154500264.png)


## Utilisation

Référez-vous à l’utilisation du plugin file-manager : https://docs.nocobase.com/data-sources/file-manager/.