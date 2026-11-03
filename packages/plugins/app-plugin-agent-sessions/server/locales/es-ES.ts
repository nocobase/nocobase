import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const esES: LocaleResource<typeof enUS> = {
  errors: {
    promptNotFound: 'No existe ningún mensaje con esta identidad en la sesión.',
    promptStarted:
      'El mensaje ha comenzado a procesarse y no se puede retirar.',
    withdrawalUnsupported:
      'Este mensaje anterior no se puede retirar de forma segura. Actualice la línea de comando y reinicie la conexión de la computadora.',
    bridgeReplaced:
      'Otro puente ha registrado esta computadora. Reinicie esta conexión.',
    submissionConflict: 'Este ID de envío ya se utiliza para otra solicitud.',
    authenticationRequired: 'Inicie sesión para utilizar sesiones de agente.',
    computerNotFound:
      'Ninguna computadora con esta identificación está conectada a su cuenta.',
    sessionNotFound: 'Ninguna sesión con esta identificación es tuya.',
    computerOffline:
      'La computadora está fuera de línea. Inicie el puente sobre él y vuelva a intentarlo.',
    agentUnavailable: 'La computadora no puede ejecutar este agente.',
    directoryNotAllowed:
      'Las sesiones en esta computadora funcionan solo en los directorios que permite su puente.',
    sessionArchived: 'La sesión está archivada. Restaurarlo primero.',
    permissionRequestNotFound:
      'Esta solicitud de permiso ya ha sido respondida o ya no está en espera.',
    choiceNotFound: 'El agente no ofrece esta opción o valor.',
    linkNotFound:
      'Nada de este tipo con esta identificación está vinculado a la sesión, o su trabajo no puede comenzar desde aquí.',
    invalidPageToken: 'Esta lista no emitió el token de página.',
    upgradeRequired:
      'El puente habla otra versión del protocolo. Actualice la línea de comando en esta computadora.',
    computerNotAnswering:
      'La computadora no respondió a tiempo. Verifique que su conexión esté funcionando y vuelva a intentarlo.',
    folderUnavailable: 'La carpeta no se puede abrir en la computadora.',
    discoveryFailed:
      'No se pudo cargar la configuración del agente. Verifique el agente en esta computadora y vuelva a intentarlo.',
    projectNotFound: 'No existe tal proyecto o no se puede ver.',
    referenceNotFound: 'Algo mencionado no existe o no se puede ver.',
    imageNotFound: 'No se envió ninguna imagen con este nombre en la sesión.',
    computerKeyInvalid:
      'Esta computadora ya no está conectada: fue eliminada o conectada nuevamente desde otro lugar. Ejecute `acp start` en él para conectarlo nuevamente.',
  },
};

export default esES;
