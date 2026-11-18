import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const koKR: LocaleResource<typeof enUS> = {
  errors: {
    promptNotFound: '세션에 이 ID의 메시지가 없습니다.',
    promptStarted: '메시지 처리가 이미 시작되어 철회할 수 없습니다.',
    withdrawalUnsupported:
      '이 이전 메시지는 안전하게 철회할 수 없습니다. 명령줄 도구를 업데이트하고 컴퓨터 연결을 다시 시작하세요.',
    bridgeReplaced:
      '다른 브리지가 이 컴퓨터를 등록했습니다. 이 연결을 다시 시작하세요.',
    submissionConflict: '이 제출 ID는 이미 다른 요청에 사용되었습니다.',
    authenticationRequired: 'Agent 세션을 사용하려면 로그인하세요.',
    computerNotFound: '계정에 이 ID로 연결된 컴퓨터가 없습니다.',
    sessionNotFound: '이 ID의 세션이 없습니다.',
    computerOffline:
      '컴퓨터가 오프라인입니다. 컴퓨터에서 브리지를 시작한 뒤 다시 시도하세요.',
    agentUnavailable: '이 컴퓨터에서는 이 Agent를 실행할 수 없습니다.',
    directoryNotAllowed:
      '이 컴퓨터의 세션은 브리지가 허용한 디렉터리 안에서만 작동합니다.',
    sessionArchived: '보관된 세션입니다. 먼저 복원하세요.',
    permissionRequestNotFound:
      '이 권한 요청은 이미 응답되었거나 더 이상 대기 중이 아닙니다.',
    choiceNotFound: 'Agent가 이 선택지나 값을 제공하지 않습니다.',
    linkNotFound:
      '이 ID의 항목이 세션에 연결되어 있지 않거나, 여기서 해당 작업을 시작할 수 없습니다.',
    invalidPageToken: '이 목록에서 발급한 페이지 토큰이 아닙니다.',
    upgradeRequired:
      '브리지의 프로토콜 버전이 다릅니다. 이 컴퓨터의 명령줄 도구를 업데이트하세요.',
    computerNotAnswering:
      '컴퓨터가 제때 응답하지 않았습니다. 연결이 실행 중인지 확인한 뒤 다시 시도하세요.',
    folderUnavailable: '컴퓨터에서 폴더를 열 수 없습니다.',
    discoveryFailed:
      'Agent 설정을 불러올 수 없습니다. 이 컴퓨터의 명령줄 도구를 업데이트하고 백그라운드 연결을 다시 시작한 뒤 다시 시도하세요.',
    projectNotFound: '해당 프로젝트가 없거나 볼 수 없습니다.',
    referenceNotFound: '언급한 항목이 없거나 볼 수 없습니다.',
    imageNotFound: '세션에서 이 이름의 이미지를 보낸 적이 없습니다.',
    computerKeyInvalid:
      '이 컴퓨터는 더 이상 연결되어 있지 않습니다. 삭제되었거나 다른 곳에서 다시 연결되었습니다. 다시 연결하려면 해당 컴퓨터에서 `acp start`를 실행하세요.',
  },
};

export default koKR;
