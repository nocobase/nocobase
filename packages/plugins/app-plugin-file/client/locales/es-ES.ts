import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  storage: {
    title: 'Almacenamiento de archivos',
    navDescription:
      'Dónde se guardan los archivos subidos y qué funciones los guardan',
    description:
      'Dónde se guardan los archivos subidos, el tamaño máximo de un archivo y qué funciones guardan archivos. El almacenamiento se define en la configuración de la aplicación (`drive`) y se aplica tras volver a desplegar; esta página muestra la configuración vigente y comprueba que el almacenamiento se puede leer y escribir de verdad.',
    checkAction: 'Comprobar almacenamiento',
    loading: 'Cargando el almacenamiento de archivos…',
    loadFailed: 'No se pudo cargar el almacenamiento de archivos.',
    retry: 'Reintentar',
    tabs: { disks: 'Almacenamiento', usages: 'Funciones' },
    hints: {
      title_one: '{{count}} aviso',
      title_many: '{{count}} avisos',
      title_other: '{{count}} avisos',
      incomplete:
        'El disco {{disk}} no está configurado por completo ({{problems}}): no causa problemas mientras no se use y falla cuando se elige.',
      localDefault:
        'El almacenamiento predeterminado es un disco local: la aplicación solo puede ejecutarse como una única instancia. Use almacenamiento compartido para varias instancias.',
      seeCluster: 'Consulte Clúster y distribuido.',
    },
    columns: {
      name: 'Nombre',
      type: 'Tipo · ubicación',
      visibility: 'Visibilidad',
      maxFileSize: 'Tamaño máximo de archivo',
      usages: 'Funciones',
      status: 'Estado',
      feature: 'Función',
      collection: 'Tabla de archivos',
      disk: 'Guardado en',
      download: 'Descarga',
      files: 'Archivos',
      setting: 'Ajuste',
      value: 'Valor actual',
      source: 'Origen',
    },
    default: 'Predeterminado',
    details: 'Detalles',
    usageCount_one: '{{count}} función',
    usageCount_many: '{{count}} funciones',
    usageCount_other: '{{count}} funciones',
    drivers: {
      fs: 'Disco local',
      s3: 'Almacenamiento compatible con S3',
      oss: 'Alibaba Cloud OSS',
      custom: 'Controlador personalizado',
    },
    location: {
      inApp: '{{path}} (en el directorio de la aplicación)',
      outsideApp: 'Fuera del directorio de la aplicación',
      bucketMissing: 'bucket sin definir',
      unknown: 'Definido en el código',
    },
    visibility: {
      private: 'Privado',
      public: 'Público',
      privateLong: 'Privado: solo se descarga a través de la aplicación',
      publicLong: 'Público: cualquiera con la URL puede descargarlo',
      unknown: 'Lo decide el controlador',
    },
    urls: {
      application: 'Servido por la aplicación (stream)',
      public: 'URL pública',
      signed: 'URL firmada que caduca',
    },
    sizeMb: '{{size}} MB',
    status: {
      ok: 'Lectura y escritura correctas',
      failed: 'Comprobación fallida',
      incomplete: 'Configuración incompleta',
      unchecked: 'Sin comprobar',
      checkedAgo: 'Comprobado {{time}}',
    },
    problems: {
      LOCATION_MISSING: 'location está vacío',
      BUCKET_MISSING: 'bucket está vacío',
      REGION_MISSING: 'region está vacío',
      CREDENTIALS_MISSING: 'faltan las credenciales',
      NOT_LOADED: 'la aplicación no lo ha cargado',
    },
    sources: {
      code: 'Código',
      config: 'Configuración',
      default: 'Valor predeterminado',
    },
    settings: {
      driver: 'Tipo',
      location: 'Ubicación',
      visibility: 'Visibilidad',
      maxFileSize: 'Tamaño máximo de archivo',
      urls: 'Enlaces de descarga',
    },
    backToList: 'Almacenamiento de archivos',
    defaultSubtitle:
      'Las nuevas subidas se guardan aquí de forma predeterminada.',
    notDefaultSubtitle: 'Solo lo usan las funciones que lo indican.',
    notFound: 'El disco {{disk}} no está configurado.',
    howToChange: 'Cómo cambiarlo',
    howToChangeNote:
      'También se admiten Alibaba Cloud OSS (`oss`) y controladores personalizados. Vuelva a desplegar tras el cambio y aumente el límite del cuerpo de la solicitud del proxy inverso al menos hasta el tamaño máximo de archivo.',
    check: {
      title: 'Comprobación',
      run: 'Comprobar',
      rerun: 'Comprobar de nuevo',
      running: 'Comprobando…',
      failed: 'No se pudo ejecutar la comprobación.',
      never:
        'Este disco no se ha comprobado en esta instancia desde que se inició.',
      scope:
        'Solo se escribe, lee y elimina un archivo temporal en el directorio `nocobase-check/` del disco; los archivos de negocio no se tocan. Con varias instancias, solo se comprueba esta instancia.',
      steps: {
        write: 'Escribir un archivo temporal',
        read: 'Leerlo y comparar',
        url: 'Crear un enlace de descarga',
        delete: 'Eliminar el archivo temporal',
      },
      details: {
        bytes: '{{bytes}} bytes coinciden',
        APPLICATION: 'Servido a través de la aplicación',
        PUBLIC: 'URL pública creada',
        SIGNED: 'URL firmada creada',
        deleted: 'Eliminado',
        skipped: 'Omitido',
      },
      reasons: {
        CONFIG_INCOMPLETE: 'Configuración incompleta: {{detail}}',
        DISK_UNAVAILABLE: 'No se pudo abrir el disco',
        WRITE_FAILED: 'Falló la escritura',
        READ_FAILED: 'Falló la lectura',
        CONTENT_MISMATCH: 'El contenido leído es distinto',
        URL_FAILED: 'No se pudo crear ningún enlace',
        DELETE_FAILED: 'Falló la eliminación',
        unknown: 'Fallido',
      },
    },
    usedBy: 'Funciones que usan este disco',
    noUsagesOnDisk: 'Ninguna función guarda archivos en este disco.',
    download: {
      authenticated: 'Inicio de sesión y permiso',
      public: 'Enlace público',
    },
    diskDefault: 'Predeterminado ({{disk}})',
    diskConfig: '{{path}} → {{disk}}',
    diskConfigDefault: '{{path}} → Predeterminado ({{disk}})',
    plugin: 'Plugin {{plugin}}',
    application: 'Aplicación',
    filesValue: '{{files}} archivos · {{size}}',
    filesUnavailable: 'No se pudo contar',
    empty: {
      title: 'Ninguna función guarda archivos todavía',
      description:
        'Las tablas de archivos las crean los plugins o el código de la aplicación. Cuando se instala un plugin con adjuntos (como proyectos, bases de conocimiento o agentes), aparece aquí sin más configuración.',
      defaultDisk:
        'La configuración de almacenamiento sigue aplicándose: las tablas de archivos que se añadan después guardarán los archivos en {{disk}} de forma predeterminada.',
    },
    notes: {
      title: 'Notas',
      firstUse:
        'El almacenamiento se conecta en el primer uso, así que un arranque correcto no demuestra que se pueda leer y escribir. Comprobar escribe, lee y elimina un archivo temporal para confirmarlo.',
      changeDefault:
        'Cambiar el almacenamiento predeterminado solo afecta a las subidas posteriores; los archivos existentes se siguen leyendo del almacenamiento que indican sus registros y no se mueven.',
      deleteRecords: 'Eliminar un registro no elimina su archivo del disco.',
      publicLinks:
        'Cualquiera que conozca un enlace público puede abrirlo sin iniciar sesión. Los archivos sensibles deben servirse mediante las rutas autenticadas propias del plugin.',
      noBrowser:
        'No hay un explorador de archivos global: los archivos pertenecen a sus funciones y se consultan según los permisos de cada función.',
      readOnly:
        'Las funciones las declara el código del plugin o de la aplicación (tabla de archivos, disco, método de descarga). Esta lista es de solo lectura; aquí no se pueden crear tablas de archivos.',
    },
  },
  'files.ooxmlLoadFailed': 'No se puede procesar este archivo Office Open XML.',
  'files.ooxmlLoadTimedOut':
    'La ​​vista previa no terminó de cargarse en {{minutes}} minutos.',
  'files.previewRequestFailed':
    'La solicitud de vista previa falló ({{status}}).',
  uploadFailed: 'Falló la carga del archivo.',
  fileLimitReached: 'Se alcanzó el número máximo de archivos.',
  fileTooLarge: 'El archivo excede el tamaño máximo.',
  fileTypeNotAllowed: 'El tipo de archivo no está permitido.',
  removalFailed: 'Falló la eliminación del archivo.',
  urlNotAllowed: 'El archivo URL no está permitido.',
  downloadFailed: 'Falló la descarga del archivo.',
  invalidUrl: 'Falta el archivo URL o no está permitido.',
  pdfPreviewFailed: 'No se puede cargar la vista previa del PDF.',
  pdfPreviewMarkup: 'El archivo URL devolvió HTML o XML en lugar de un PDF.',
  previewFailed: 'No se puede cargar la vista previa del archivo.',
  'files.empty': 'Sin archivos.',
  'files.preview': 'Vista previa',
  'files.download': 'Descargar',
  'files.remove': 'Quitar',
  'files.chooseMany': 'Elegir archivos',
  'files.chooseOne': 'Elegir archivo',
  'files.retry': 'Reintentar',
  'files.done': 'Hecho',
  'files.uploading': 'Subiendo',
  'files.failed': 'Falló',
  'files.pending': 'Pendiente',
  'files.previous': 'Archivo anterior',
  'files.next': 'Siguiente archivo',
  'files.loadingPreview': 'Cargando vista previa...',
  'files.downloadFile': 'Descargar archivo',
  'files.previewUnavailable':
    'La vista previa no está disponible para este tipo de archivo.',
  'files.imageFailed':
    'Esta imagen no se pudo mostrar. Puede que esté dañado o tenga un formato no compatible.',
  'files.officeFailed': 'Office Online no pudo cargar este archivo.',
  'files.officeUrl':
    'Office Online requiere un archivo absoluto accesible desde Internet URL.',
  'files.cancelFile': 'Cancelar {{filename}}',
  'files.status.uploading': 'Subiendo',
  'files.status.pending': 'Pendiente',
  'files.status.error': 'Falló',
};

export default esES;
