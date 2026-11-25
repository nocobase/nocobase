import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  nav: {
    plugins: 'Plugins',
    pluginsDescription:
      'Los plugins que usa esta aplicación, sus versiones y cómo habilitar los demás.',
  },
  access: {
    section: 'Sistema',
    settings: {
      plugins: 'Plugins',
    },
    actions: {
      read: 'Ver',
    },
  },
  page: {
    title: 'Plugins',
    description:
      'Los plugins que usa esta aplicación. Habilitar o deshabilitar uno cambia el código de la aplicación y surte efecto tras reiniciarla, por eso esta página muestra los comandos que hay que ejecutar en lugar de interruptores.',
    deployed:
      'Para habilitar un plugin, regístralo en el proyecto de origen y vuelve a desplegar la aplicación.',
    attention_one: '{{count}} plugin requiere atención y aparece primero.',
    attention_other: '{{count}} plugins requieren atención y aparecen primero.',
    attention_many: '{{count}} plugins requieren atención y aparecen primero.',
    search: 'Buscar por nombre o paquete',
    loading: 'Cargando plugins…',
    loadFailed: 'No se pudieron cargar los plugins.',
    retry: 'Reintentar',
    empty: 'Ningún plugin coincide.',
  },
  filters: {
    label: 'Mostrar',
    all: 'Todos {{count}}',
    enabled: 'Habilitados {{count}}',
    disabled: 'No habilitados {{count}}',
    attention: 'Requieren atención {{count}}',
  },
  columns: {
    plugin: 'Plugin',
    version: 'Versión',
    status: 'Estado',
    actions: 'Acciones',
  },
  groups: {
    enabled: 'Habilitados {{count}}',
    disabled: 'No habilitados {{count}}',
  },
  status: {
    enabled: 'Habilitado',
    skillsOnly: 'Habilitado · Solo Skills',
    enabledAttention: 'Habilitado · Requiere atención',
    disabled: 'No habilitado',
    disabledAttention: 'No habilitado · Requiere atención',
    unknown: 'No se puede saber · Recompilar',
  },
  reasons: {
    partial:
      'Solo está habilitado en parte: sus páginas se abren, pero sus datos no se cargan. Ejecute de nuevo el comando de habilitación para corregirlo.',
    devDependency:
      'Está habilitado, pero no se incluye al desplegar la aplicación, así que faltará en la aplicación en producción. Ejecute de nuevo el comando de habilitación para corregirlo.',
    missingRequires: '«{{title}}» necesita {{names}}, que no está habilitado.',
    other:
      'No está configurado por completo en esta aplicación. Ejecute de nuevo el comando de habilitación para corregirlo.',
    requiresFirst:
      'Habilite antes: {{names}} (el comando de habilitación lo incluye)',
    unknown:
      'Esta aplicación se compiló antes de que la compilación registrara qué plugins de línea de comandos usa, así que aquí no se puede saber si este está habilitado. Ejecuta pnpm build de nuevo y vuelve a desplegar.',
  },
  actions: {
    commands: 'Comandos',
    commandsFor: 'Comandos de {{title}}',
    enable: 'Cómo habilitar',
    enableFor: 'Cómo habilitar {{title}}',
  },
  commands: {
    title: 'Comandos de {{title}}',
    description:
      'Ejecútelos en el directorio del código de la aplicación y reiníciela; en producción, vuelva a compilar y desplegar.',
    fix: 'Corrige lo que requiere atención',
    update: 'Actualiza a la versión más reciente',
    unregister: 'Lo deshabilita; sus datos se conservan',
    dependents:
      'Plugins habilitados que dependen de él: {{names}}. Deshabilítelos junto con él.',
    noDependents:
      'Ningún plugin habilitado depende de él, así que puede deshabilitarse por sí solo.',
    optionalDependents:
      'Plugins habilitados que lo usan de forma opcional: {{names}}. Siguen funcionando sin él, pero pierden las funciones que lo necesitan.',
  },
  enable: {
    title: 'Habilitar {{title}}',
    description: 'Ejecútelo en el directorio del código de la aplicación:',
    requires:
      '{{title}} depende de {{names}}, que tampoco está habilitado todavía; el comando lo incluye.',
    development:
      'Desarrollo local: reinicie pnpm dev después de ejecutarlo y recargue esta página para verlo habilitado.',
    live: 'Aplicación en producción: confirme el cambio, ejecute pnpm build --tar y actualice con el instalador.',
    data: 'Su primer arranque crea sus tablas. Si después lo deshabilita con plugin unregister, sus datos se conservan.',
  },
  dialog: {
    copy: 'Copiar comando',
    copied: 'Copiado',
    copyFailed: 'No se pudo copiar; seleccione el comando y cópielo.',
    close: 'Entendido',
  },
};

export default esES;
