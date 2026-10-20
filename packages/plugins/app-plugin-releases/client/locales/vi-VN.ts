import type { LocaleResource } from '@nocobase/i18n';

import type enUS from './en-US.js';

const viVN: LocaleResource<typeof enUS> = {
  access: {
    section: 'Bản phát hành',
    pages: {
      'rel-apps': 'Ứng dụng',
    },
    businessSection: 'Bản phát hành',
    businesses: {
      apps: {
        title: 'Ứng dụng',
        description:
          'Ứng dụng, bản phát hành, quá trình triển khai và thời gian chạy của chúng.',
        actions: {
          view: {
            title: 'Xem ứng dụng',
            description:
              'Xem Ứng dụng, bản phát hành, hoạt động triển khai và trạng thái thời gian chạy của chúng',
            related: 'Xem ứng dụng (những ứng dụng liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Xem ứng dụng (tất cả)',
          },
          readLogs: {
            title: 'Đọc nhật ký',
            description: 'Đọc nhật ký ứng dụng và triển khai',
            related: 'Đọc nhật ký (những nhật ký liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Đọc nhật ký (tất cả)',
          },
          create: {
            title: 'Tạo ứng dụng',
            description: 'Tạo ứng dụng trong môi trường',
            all: 'Tạo ứng dụng',
          },
          configure: {
            title: 'Cấu hình ứng dụng',
            description:
              'Đọc và thay đổi cấu hình của Ứng dụng, có thể chứa bí mật',
            related: 'Cấu hình ứng dụng (những ứng dụng liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Cấu hình ứng dụng (tất cả)',
          },
          upload: {
            title: 'Tải lên bản phát hành',
            description: 'Tải lên và quảng bá các bản phát hành',
            related:
              'Tải lên các bản phát hành (những bản liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Tải lên bản phát hành (tất cả)',
          },
          deploy: {
            title: 'Triển khai',
            description:
              'Triển khai và khôi phục trên môi trường không được bảo vệ, yêu cầu triển khai cho môi trường được bảo vệ',
            related: 'Triển khai (những cái liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Triển khai (tất cả)',
          },
          deployProtected: {
            title: 'Phê duyệt triển khai được bảo vệ',
            description:
              'Phê duyệt việc triển khai vào các môi trường được bảo vệ mà không có người phê duyệt; chỉ có người',
            related:
              'Phê duyệt các triển khai được bảo vệ (những triển khai liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Phê duyệt triển khai được bảo vệ (tất cả)',
          },
          operate: {
            title: 'Bắt đầu và dừng',
            description: 'Bắt đầu, dừng và khởi động lại Ứng dụng',
            related: 'Bắt đầu và dừng (những cái liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Bắt đầu và dừng (tất cả)',
          },
          delete: {
            title: 'Xóa ứng dụng',
            description: 'Xóa ứng dụng cùng với dữ liệu của nó',
            related: 'Xóa ứng dụng (những ứng dụng liên quan đến chúng)',
            relatedLabel: 'Những cái tôi đã tạo ra',
            relatedHint:
              'Ứng dụng tôi đã tạo và mọi ứng dụng liên quan đến tôi',
            all: 'Xóa ứng dụng (tất cả)',
          },
        },
      },
    },
    recordAccess: {
      owned: 'Ứng dụng họ đã tạo',
    },
    settings: {
      rel: {
        environments: 'Triển khai môi trường',
      },
    },
    keyScopes: {
      apps: {
        title: 'Ứng dụng và triển khai',
        description:
          'Đọc: xem ứng dụng, bản phát hành, triển khai và nhật ký. Đọc và viết: cũng tải lên các bản phát hành. Quản trị viên: cũng triển khai và khởi động hoặc dừng ứng dụng.',
        objects: 'Ứng dụng',
      },
      environments: {
        title: 'Triển khai môi trường',
        description: 'Đọc: liệt kê các môi trường. Đọc và viết: quản lý chúng.',
      },
      presets: {
        ciDeploy: {
          title: 'Triển khai CI',
          description:
            'Tải bản phát hành lên các ứng dụng đã chọn và triển khai chúng trong 90 ngày.',
        },
        ciUpload: {
          title: 'Tải lên CI',
          description:
            'Tải bản phát hành lên ứng dụng đã chọn mà không cần triển khai chúng trong 90 ngày.',
        },
      },
    },
    actions: {
      read: 'Xem',
      manage: 'Quản lý',
      view: 'Xem',
      'read-logs': 'Đọc nhật ký',
      create: 'Tạo',
      configure: 'Cấu hình',
      upload: 'Tải lên bản phát hành',
      deploy: 'Triển khai',
      'deploy-protected': 'Phê duyệt triển khai được bảo vệ',
      operate: 'Bắt đầu và dừng',
      delete: 'Xóa',
    },
  },
  drivers: {
    host: 'Máy chủ này',
  },
  ui: {
    nav: {
      apps: 'Ứng dụng',
      environments: 'Triển khai môi trường',
    },
    apps: {
      title: 'Ứng dụng',
      description: 'Các ứng dụng, bản phát hành và nơi chúng được triển khai.',
      search: 'Tìm kiếm theo ID hoặc tên',
      create: 'Tạo ứng dụng',
      id: 'ID ứng dụng',
      name: 'Tên',
      environment: 'Môi trường',
      version: 'Phiên bản',
      state: 'Trạng thái',
      url: 'Địa chỉ',
      labels: 'Nhãn',
      loadFailed: 'Không thể tải ứng dụng.',
      loadOneFailed: 'Không thể tải ứng dụng.',
      emptyTitle: 'Chưa có ứng dụng nào',
      emptyNoAccess: 'Yêu cầu quản trị viên tạo ứng dụng.',
      emptyDescription:
        'Tạo một ứng dụng, sau đó tải bản phát hành lên và triển khai nó vào một môi trường.',
      noResults: 'Không có ứng dụng nào phù hợp với tìm kiếm.',
      created: '{{name}} đã được tạo.',
      createDescription:
        'Một ứng dụng được triển khai trên một môi trường; bản phát hành của nó được tải lên sau đó.',
      idHint:
        'Chữ cái, chữ số, dấu gạch dưới và dấu gạch nối; một phần địa chỉ của nó. Nó không thể thay đổi sau này.',
      noEnvironment: 'Chưa có môi trường',
      lastAccess: 'Lần cuối ghé thăm',
    },
    advanced: 'Nâng cao (tùy chọn)',
    labels: {
      name: 'Tên',
      value: 'Giá trị',
      nameOf: 'Tên nhãn {{index}}',
      valueOf: 'Giá trị của nhãn {{index}}',
      remove: 'Xóa nhãn {{index}}',
      add: 'Thêm nhãn',
      hint: 'Nhãn cho phép các công cụ và mọi người tìm cũng như nhóm các ứng dụng và bản phát hành.',
      count_one: 'Nhãn {{count}}',
      count_other: 'Nhãn {{count}}',
      system: 'Nhãn được hệ thống thêm vào',
      systemHint: 'Được hệ thống thêm vào; nó không thể thay đổi ở đây.',
      errors: {
        keyRequired: 'Nhập tên cho giá trị này.',
        keyInvalid:
          'Sử dụng các chữ cái, chữ số, ".", "_", "/" hoặc "-", bắt đầu bằng một chữ cái hoặc chữ số (nhiều nhất là 63).',
        keyDuplicate: 'Tên này đã được sử dụng.',
        valueTooLong: 'Tối đa {{max}} ký tự.',
        tooMany: 'Nhiều nhất là nhãn {{max}}.',
      },
    },
    policy: {
      title: 'Môi trường chạy',
      activationLabel: 'Bắt đầu',
      activation: {
        eager: 'Luôn luôn chạy',
        onDemand: 'Bắt đầu chuyến thăm',
      },
      activationHint: {
        eager:
          'Bắt đầu khi được triển khai và bất cứ khi nào thời gian chạy khởi động lại.',
        onDemand:
          'Bắt đầu bằng lượt truy cập đầu tiên sau khi triển khai hoặc khởi động lại thời gian chạy.',
      },
      idleLabel: 'Dừng lại khi không được ghé thăm',
      dormantLabel: 'Ngủ đông khi không được truy cập',
      minutes: 'phút',
      hours: 'giờ',
      neverIdle: 'Không bao giờ',
      neverDormant: 'Không bao giờ',
      idleSummary: 'dừng sau phút {{minutes}} không được truy cập',
      dormantSummary: 'ngủ đông sau {{hours}} h',
      timersHint:
        'Ứng dụng đã dừng sẽ giải phóng bộ nhớ và khởi động lại vào lần truy cập tiếp theo. Một ứng dụng đang ngủ đông cũng bị xóa các tệp đã giải nén; cấu hình và dữ liệu được giữ lại và lần truy cập tiếp theo sẽ chuẩn bị lại, việc này sẽ mất nhiều thời gian hơn.',
      unsupported:
        'Môi trường này không hỗ trợ bắt đầu khi truy cập; ứng dụng tiếp tục chạy.',
      errors: {
        idleInvalid: 'Nhập toàn bộ số phút từ 1 đến {{max}} hoặc để trống.',
        dormantInvalid:
          'Nhập số giờ từ 0,02 (một phút) đến {{max}} hoặc để trống.',
        dormantBeforeIdle: 'Ngủ đông phải đến sau khi dừng lại.',
      },
    },
    state: {
      pending: 'Bắt đầu',
      starting: 'Bắt đầu',
      running: 'Đang chạy',
      stopped: 'Đã dừng',
      stoppedOnDemand: 'Đã dừng (bắt đầu truy cập)',
      dormant: 'Ngủ đông (chuẩn bị khi ghé thăm)',
      failed: 'Thất bại',
      unknown: 'Không rõ',
      deploying: 'Triển khai',
    },
    operate: {
      refreshFailed:
        'Không thể làm mới trạng thái ứng dụng. Hoạt động không có sẵn cho đến khi trạng thái được làm mới. Hãy kiểm tra kết nối và quyền truy cập của bạn rồi thử lại.',
      disabled: {
        busy: 'Một hoạt động đang được tiến hành.',
        unavailable:
          'Trạng thái ứng dụng không khả dụng. Làm mới trạng thái trước khi vận hành ứng dụng.',
        deploying: 'Quá trình triển khai đang được tiến hành.',
        starting: 'Ứng dụng đang khởi động.',
        notDeployed: 'Trước tiên hãy triển khai bản phát hành.',
        alreadyRunning: 'Ứng dụng đã chạy.',
        notRunning: 'Ứng dụng không chạy.',
      },
      start: 'Bắt đầu',
      stop: 'Dừng',
      restart: 'Khởi động lại',
      done: {
        start: 'Ứng dụng đang khởi động.',
        stop: 'Ứng dụng đã dừng.',
        restart: 'Ứng dụng đang khởi động lại.',
      },
    },
    releases: {
      title: 'Bản phát hành',
      upload: 'Tải lên bản phát hành',
      uploadAction: 'Tải lên',
      commit: 'Commit',
      commitHint:
        'Tùy chọn: cam kết kho lưu trữ này được xây dựng từ đó, được lưu dưới dạng nhãn sha.',
      uploaded: 'Đã tải lên bản phát hành.',
      checksum: 'Tổng kiểm tra',
      size: 'Kích thước',
      created: 'Đã tạo',
      empty:
        'Chưa có bản phát hành nào. Tải lên gói .tar.gz được tạo cho ứng dụng này.',
      loadFailed: 'Không thể tải các bản phát hành.',
    },
    deploy: {
      deploy: 'Triển khai',
      started: 'Triển khai {{version}}.',
      confirmProtected:
        'Môi trường này được bảo vệ. Gõ {{appId}} để triển khai.',
    },
    deployments: {
      title: 'Triển khai',
      kind: 'Loại',
      status: 'Trạng thái',
      by: 'Bởi',
      current: 'Hiện tại',
      logs: 'Nhật ký',
      rollback: 'Quay lại',
      rollbackStarted: 'Quay lại.',
      confirmRollbackTitle: 'Quay lại {{name}}?',
      confirmRollback:
        'Ứng dụng quay lại bản phát hành triển khai đó; những gì đã được triển khai kể từ đó sẽ được lấy lại.',
      loadFailed: 'Không thể tải các triển khai.',
      empty: 'Chưa được triển khai.',
      hideLogs: 'Ẩn nhật ký',
      noLogs: 'Không có dòng nhật ký.',
      statuses: {
        queued: 'Đã xếp hàng',
        deploying: 'Triển khai',
        succeeded: 'Đã thành công',
        failed: 'Thất bại',
      },
    },
    actors: {
      human: 'người',
      agent: 'đại lý',
      key: 'phím',
      rule: 'quy tắc',
      system: 'hệ thống',
    },
    requests: {
      title: 'Yêu cầu triển khai',
      pendingApproval: 'Đang chờ phê duyệt',
      notice: {
        deploy: 'đã yêu cầu triển khai {{version}} lên {{environment}}',
        rollback: 'đã yêu cầu đưa {{environment}} trở lại {{version}}',
      },
      someone: 'Ai đó',
      review: 'Đánh giá',
      view: 'Xem',
      comment: 'Bình luận (tùy chọn)',
      decideFailed: 'Quyết định không được thông qua',
      request: 'Yêu cầu triển khai',
      created: 'Yêu cầu triển khai.',
      approve: 'Phê duyệt',
      confirmApproveTitle: 'Phê duyệt việc triển khai {{appId}}?',
      reject: 'Từ chối',
      cancel: 'Rút lại',
      requestedBy: 'Được yêu cầu bởi',
      decidedBy: 'Quyết định bởi',
      note: 'Ghi chú',
      approvedToast: 'Phê duyệt việc triển khai {{appId}}.',
      rejectedToast: 'Đã từ chối triển khai {{appId}}.',
      app: 'Ứng dụng',
      commit: 'Commit',
      build: 'Xây dựng',
      ciLog: 'Nhật ký CI',
      requestedAt: 'Đã yêu cầu',
      decisionNote: 'Biên bản quyết định',
      pinned:
        'tổng kiểm tra {{checksum}}; phê duyệt triển khai chính xác điều này',
      loadFailed: 'Không thể tải yêu cầu triển khai.',
      detailTitle: {
        deploy: 'Yêu cầu triển khai cho {{appId}}',
        rollback: 'Yêu cầu khôi phục cho {{appId}}',
      },
      reviewTitle: {
        deploy: 'Xem lại yêu cầu triển khai cho {{appId}}',
        rollback: 'Xem lại yêu cầu khôi phục cho {{appId}}',
      },
      done: {
        approve: 'Yêu cầu đã được phê duyệt.',
        reject: 'Yêu cầu bị từ chối.',
        cancel: 'Yêu cầu đã được rút lại.',
      },
      kind: {
        deploy: 'Triển khai',
        rollback: 'Khôi phục',
      },
      status: {
        pending: 'Đang chờ',
        approved: 'Đã phê duyệt',
        rejected: 'Đã từ chối',
        cancelled: 'Đã rút lại',
        deployed: 'Đã triển khai',
        failed: 'Thất bại',
      },
    },
    variables: {
      title: 'Biến',
      description:
        'Biến môi trường mà ứng dụng này chạy cùng. Mỗi thay đổi được lưu cùng một lúc và tiếp cận ứng dụng trong lần triển khai tiếp theo.',
      environmentDescription:
        'Mọi ứng dụng trong môi trường này, bao gồm cả bản xem trước yêu cầu kéo, đều nhận được những bản xem trước này trừ khi nó tự thiết lập. Được liệt kê với nội dung mà bản dựng gần đây nhất của mỗi ứng dụng khai báo. Các thay đổi được lưu cùng một lúc và tiếp cận ứng dụng trong lần triển khai tiếp theo.',
      add: 'Thêm biến',
      name: 'Tên',
      value: 'Giá trị',
      source: 'Nguồn',
      secret: 'Bí mật',
      secretHint:
        'Một bí mật sẽ không bao giờ được hiển thị lại sau khi được lưu.',
      nameHint:
        'Chữ in hoa, chữ số và dấu gạch dưới, bắt đầu bằng một chữ cái.',
      invalidName:
        'Sử dụng chữ in hoa, chữ số và dấu gạch dưới, bắt đầu bằng một chữ cái.',
      valueOf: 'Giá trị của {{name}}',
      set: 'Bộ',
      notSet: 'Chưa đặt',
      sources: {
        app: 'Ứng dụng',
        environment: 'Từ môi trường',
        configFile: 'config.yml',
        generated: 'Đã tạo',
        default: 'Mặc định',
        unset: 'Bỏ đặt',
      },
      tags: {
        required: 'Bắt buộc',
        secret: 'Bí mật',
        firstStartOnly: 'Chỉ bắt đầu lần đầu tiên',
        changed: 'Đã thay đổi — cần khởi động lại',
        missing: 'Thiếu',
        undeclared: 'Không được khai báo',
      },
      setValue: 'Đặt giá trị',
      replace: 'Thay thế',
      override: 'Ghi đè',
      overrideOf: 'Ghi đè {{name}}',
      overrideTitle: 'Ghi đè {{name}}',
      overrideHint:
        'Ứng dụng này lấy giá trị này thay vì giá trị của môi trường. Lưu cùng một lúc; ứng dụng sẽ có được nó trong lần triển khai tiếp theo.',
      savedAtOnce:
        'Lưu cùng một lúc; ứng dụng sẽ có được nó trong lần triển khai tiếp theo.',
      updated: 'Đã cập nhật',
      clear: 'Xóa',
      addTitle: 'Thêm biến',
      setTitle: 'Đặt {{name}}',
      save: 'Lưu',
      cancel: 'Hủy',
      saved: '{{name}} đã được lưu.',
      cleared: '{{name}} đã xóa.',
      loadFailed: 'Không thể tải các biến.',
      emptyTitle: 'Không có biến',
      emptyDescription:
        'Bản phát hành tuyên bố không có và không có gì được đặt. Thêm một cái để chuyển nó vào ứng dụng.',
      emptyEnvironmentTitle: 'Chưa có biến',
      emptyEnvironment:
        'Thêm một cái để chuyển nó tới mọi ứng dụng trong môi trường này.',
      emptyEnvironmentReadOnly: 'Yêu cầu quản trị viên thêm một.',
      noManifest:
        'Bản phát hành này không khai báo các biến của nó, vì vậy không có biến nào được kiểm tra trước khi triển khai.',
      basis:
        'Được liệt kê là bản dựng gần đây nhất ({{version}}) tuyên bố chúng. Giá trị riêng của ứng dụng có trước giá trị của môi trường.',
      noBuildTitle: 'Chưa có công trình nào',
      noBuildDescription:
        'Các biến xuất hiện ở đây sau khi bản dựng đầu tiên của ứng dụng được tải lên. Bây giờ bạn có thể thêm một cái bằng tay.',
      noBuild: 'Chưa có bản dựng nào: đây là những giá trị được đặt bằng tay.',
      undeclaredTitle: 'Không khai báo',
      undeclaredDescription:
        'Bản dựng gần đây nhất không khai báo những điều này. Họ vẫn tiếp cận ứng dụng; xóa giá trị riêng của ứng dụng khi không cần thiết.',
      setOnEnvironment: 'Đặt trên môi trường',
      setOnApp: 'Đặt trên ứng dụng này',
      declaredBy: 'Tuyên bố bởi',
      status: 'Trạng thái',
      noApps: 'Không có ứng dụng nào khai báo điều đó',
      moreApps: '+{{count}}',
      appGroup: '{{label}} ×{{count}}',
      missingIn_one: 'Thiếu trong ứng dụng {{count}}',
      missingIn_other: 'Thiếu trong ứng dụng {{count}}',
      missingInTitle: 'Bắt buộc và không có giá trị cho: {{apps}}',
      environmentSet: 'Đặt ở đây',
      environmentNotSet: 'Không được đặt ở đây',
      missingTitle: 'Các biến bắt buộc không được đặt',
      missingDescription:
        '{{names}} phải được đặt trước khi có thể triển khai bản dựng gần đây nhất: trên môi trường cho mọi ứng dụng ở đó hoặc chỉ trên ứng dụng này.',
      review: 'Xem lại biến',
      changedTitle: 'Các thay đổi về biến không được áp dụng',
      changedDescription:
        'Một biến đã thay đổi kể từ khi ứng dụng được triển khai. Nó có hiệu lực khi ứng dụng được triển khai lại.',
      apply: 'Áp dụng và khởi động lại',
      applied: 'Triển khai lại với các biến mới.',
      needs_one: 'Cần biến {{count}}',
      needs_other: 'Cần biến {{count}}',
      missing: 'Thiếu {{count}}',
      bulk: {
        edit: 'Chỉnh sửa hàng loạt',
        title: 'Chỉnh sửa hàng loạt biến',
        reviewTitle: 'Xem xét các thay đổi',
        description:
          'Dán hoặc chỉnh sửa các dòng KEY=value, như trong tệp .env. Các dòng bắt đầu bằng # sẽ bị bỏ qua.',
        appHint:
          'Liệt kê các giá trị mà ứng dụng này tự đặt ra. Các giá trị từ môi trường và Bí mật của nó không được hiển thị: thêm một dòng để ghi đè hoặc thay thế một dòng. Xóa một dòng sẽ xóa giá trị đó.',
        environmentHint:
          'Liệt kê các giá trị của môi trường này. Bí mật không được hiển thị: thêm một dòng để thay thế một dòng. Xóa một dòng sẽ xóa giá trị đó.',
        label: 'Biến (.env)',
        review: 'Xem xét các thay đổi',
        back: 'Quay lại',
        changes: 'Thay đổi',
        noChanges: 'Văn bản đặt những gì đã có ở đó.',
        nothing: 'Chẳng còn gì để cứu',
        unchanged_one: 'Biến {{count}} vẫn giữ nguyên.',
        unchanged_other: 'Các biến {{count}} vẫn giữ nguyên.',
        save_one: 'Lưu thay đổi {{count}}',
        save_other: 'Lưu các thay đổi {{count}}',
        saved_one: 'Đã lưu thay đổi {{count}}.',
        saved_other: 'Đã lưu các thay đổi {{count}}.',
        secretOf: '{{name}} là một bí mật',
        failedTitle: 'Một số thay đổi chưa được lưu',
        kinds: {
          add: 'Thêm',
          change: 'Thay đổi',
          remove: 'Loại bỏ',
        },
        problems: {
          syntax: 'Dòng {{line}}: ghi là KEY=value.',
          name: 'Dòng {{line}}: {{name}} không phải là tên hợp lệ. Sử dụng chữ in hoa, chữ số và dấu gạch dưới, bắt đầu bằng một chữ cái.',
          reserved:
            'Dòng {{line}}: {{name}} được đặt theo thời gian chạy và không thể là một biến.',
          duplicate: 'Dòng {{line}}: {{name}} đã được đặt trên dòng trước đó.',
          unterminated:
            'Dòng {{line}}: báo giá xung quanh giá trị của {{name}} chưa được đóng.',
        },
      },
    },
    tabs: {
      label: 'Các phần của {{name}}',
      overview: 'Tổng quan',
      deployments: 'Triển khai',
      variables: 'Biến',
      settings: 'Cài đặt',
    },
    overview: {
      currentRelease: 'Bản phát hành hiện tại',
      recent: 'Triển khai gần đây',
      viewAll: 'Xem tất cả',
    },
    initialAdmin: {
      title: 'Người quản trị đầu tiên',
      expires:
        'Được tạo cho lần triển khai đầu tiên. Lưu ngay: nó đã bị xóa trong {{hours}} h.',
      kept: 'Được tạo cho lần triển khai đầu tiên; nó được giữ cho đến khi ứng dụng bị xóa.',
      username: 'Tên người dùng',
      email: 'Email',
      password: 'Mật khẩu',
      show: 'Hiển thị mật khẩu',
      hide: 'Ẩn mật khẩu',
      copy: 'Sao chép mật khẩu',
      copied: 'Đã sao chép mật khẩu.',
      dismiss: 'Tôi đã lưu nó rồi',
      dismissed:
        'Quản trị viên đầu tiên đã bị xóa khỏi trình quản lý phát hành.',
    },
    config: {
      title: 'Nâng cao',
      description:
        'config.yml của ứng dụng đã triển khai; lưu tải lại ứng dụng. Ưu tiên các biến có giá trị khác nhau tùy theo môi trường và theo bí mật.',
      loadFailed: 'Không thể tải cấu hình.',
      discard: 'Loại bỏ các thay đổi',
      save: 'Lưu và tải lại',
      saved: 'Đã lưu cấu hình.',
      external:
        'Ứng dụng này đọc cấu hình của nó từ quản lý phát hành bên ngoài nên không có config.yml để chỉnh sửa ở đây. Đặt các giá trị khác nhau tùy theo môi trường dưới dạng biến.',
      externalTitle: 'Không có config.yml để chỉnh sửa',
      noFileTitle: 'Chưa có config.yml',
      noFile:
        'config.yml được tạo trong lần triển khai đầu tiên. Cho đến lúc đó, hãy định cấu hình ứng dụng bằng các biến.\nTên',
      toVariables: 'Đi đến biến',
      maskedHint:
        'Giá trị bí mật hiển thị dưới dạng {{mask}}. Để mặt nạ tại chỗ để giữ giá trị được lưu trữ hoặc nhập một giá trị mới lên trên nó.',
      secrets: 'Bí mật',
      secretsHint:
        'Các giá trị được lưu trữ không bao giờ được hiển thị. Thay thế hoặc xóa một ở đây; nó có hiệu lực khi bạn lưu.',
      newValue: 'Giá trị mới cho {{path}}',
      replace: 'Thay thế {{path}}',
      clear: 'Xóa {{path}}',
    },
    settings: {
      edit: 'Thời gian chạy và nhãn',
      editShort: 'Chỉnh sửa',
      editDescription:
        'Thời điểm ứng dụng chạy và cách ứng dụng được gắn nhãn. Các thay đổi được áp dụng mà không cần khởi động lại nó.',
      save: 'Lưu',
      saved: 'Đã lưu cài đặt.',
      danger: 'Xóa ứng dụng',
      delete: 'Xóa cùng với dữ liệu của nó',
      deleteDescription:
        'Xóa ứng dụng, bản phát hành, hoạt động triển khai và dữ liệu của ứng dụng đó. Điều này không thể hoàn tác được.',
      deleted: '{{name}} đã bị xóa.',
      confirmDeleteTitle: 'Xóa {{name}}?',
      confirmDelete:
        'Thao tác này sẽ xóa {{appId}} và tất cả dữ liệu của nó. Gõ {{appId}} để xác nhận.',
    },
    common: {
      retry: 'Thử lại',
      refresh: 'Làm mới',
      actions: 'Thao tác',
      rowActions: 'Hành động dành cho {{name}}',
    },
    errors: {
      requestFailed: 'Yêu cầu không thành công.',
      reasons: {
        IMAGE_REQUIRED:
          'Môi trường này chạy hình ảnh phát hành và bản phát hành không có hình ảnh ở đó. Đăng ký hình ảnh CI của bạn đã đẩy (`release image`), sau đó triển khai nó.',
        ARCHIVE_REQUIRED:
          'Môi trường này đang chạy các bản lưu trữ phát hành; tải lên kho lưu trữ (`release upload`).',
        IMAGE_CONFLICT:
          'Bản phát hành đã có hình ảnh khác cho nền tảng này; hình ảnh của một bản phát hành không bao giờ thay đổi.',
        INVALID_IMAGE:
          'Đó không phải là tham chiếu hình ảnh với thông báo sha256.',
        REGISTRY_EXISTS: 'Sổ đăng ký có ID này đã tồn tại.',
        REGISTRY_IN_USE:
          'Môi trường lấy từ sổ đăng ký này; trước tiên hãy chọn một sổ đăng ký khác cho họ.',
        UNKNOWN_REGISTRY: 'Sổ đăng ký đó không tồn tại.',
        INVALID_REGISTRY_URL:
          'Nhập nguồn gốc của sổ đăng ký, chẳng hạn như https://ghcr.io hoặc localhost:5000.',
        INVALID_REGISTRY_NAMESPACE:
          'Không gian tên là các thành phần đường dẫn chữ thường, chẳng hạn như acme.',
        APP_EXISTS: 'Ứng dụng có ID này đã tồn tại.',
        APP_NOT_DEPLOYED: 'Ứng dụng chưa được triển khai.',
        APP_NOT_FOUND:
          'Ứng dụng này không tồn tại hoặc bạn có thể không nhìn thấy nó.',
        APPROVAL_REQUIRED:
          'Môi trường này được bảo vệ: thay vào đó hãy yêu cầu triển khai.',
        ARTIFACT_TOO_LARGE: 'Gói phát hành quá lớn.',
        BASE_PATH_MISMATCH:
          'Bản phát hành được xây dựng cho một đường dẫn cơ sở khác.',
        CHECKSUM_MISMATCH: 'Gói không khớp với tổng kiểm tra của nó.',
        CONFIG_NOT_EDITABLE:
          'Không thể chỉnh sửa cấu hình của ứng dụng này tại đây.',
        CONFIG_SECRET_NOT_STORED:
          'Một giá trị bị che giấu không có bí mật được lưu trữ tại vị trí của nó. Nhập giá trị của nó thay vì mặt nạ.',
        CONFIG_RELOAD_FAILED:
          'Cấu hình đã được lưu nhưng ứng dụng không thể tải lại.',
        CONFIG_TOO_LARGE: 'Cấu hình quá lớn.',
        CONFIRMATION_REQUIRED: 'Nhập ID ứng dụng để xác nhận.',
        DEPLOYMENT_IN_PROGRESS:
          'Quá trình triển khai ứng dụng này đang được tiến hành.',
        DEPLOYMENT_NOT_FOUND: 'Việc triển khai không tồn tại.',
        DRIVER_UNAVAILABLE: 'Trình điều khiển của môi trường không có sẵn.',
        ENVIRONMENT_DRIVER_FIXED:
          'Không thể thay đổi trình điều khiển của môi trường.',
        ENVIRONMENT_VARIANT_FIXED:
          'Không thể thay đổi chế độ chạy của môi trường; thay vào đó hãy tạo một môi trường khác.',
        ENVIRONMENT_EXISTS: 'Một môi trường có ID này đã tồn tại.',
        ENVIRONMENT_FULL: 'Môi trường đã đạt đến giới hạn ứng dụng.',
        ENVIRONMENT_IN_USE:
          'Các ứng dụng vẫn được triển khai trong môi trường này.',
        ENVIRONMENT_NOT_FOUND: 'Môi trường không tồn tại.',
        FORBIDDEN: 'Bạn không có quyền làm điều này.',
        IDEMPOTENCY_CONFLICT:
          'Yêu cầu tương tự đã được gửi với nội dung khác nhau.',
        INVALID_ACTIVATION_POLICY: 'Chính sách kích hoạt không hợp lệ.',
        INVALID_IDLE_STOP: 'Dừng không hoạt động không hợp lệ.',
        INVALID_DORMANCY: 'Thời gian ngủ đông không hợp lệ.',
        INVALID_APP_ID:
          'Sử dụng các chữ cái, chữ số, dấu gạch dưới và dấu gạch nối cho ID ứng dụng, không bắt đầu bằng "__" và không phải "mới".',
        INVALID_APPROVERS: 'Người phê duyệt không hợp lệ.',
        INVALID_ARTIFACT_SIZE: 'Kích thước gói không hợp lệ.',
        INVALID_ARTIFACT_VERSION: 'Phiên bản phát hành không hợp lệ.',
        INVALID_ARTIFACT: 'Tệp không phải là gói phát hành hợp lệ.',
        INVALID_CHECKSUM: 'Tổng kiểm tra không hợp lệ.',
        INVALID_CONFIG_FILE: 'Cấu hình YAML không hợp lệ.',
        INVALID_CONFIG_MODE: 'Chế độ cấu hình không hợp lệ.',
        INVALID_CONFIG_SECRET: 'Thay đổi bí mật không hợp lệ.',
        INVALID_CONTENT_TYPE: 'Tải lên gói .tar.gz.',
        INVALID_DEPLOYMENT_INPUT: 'Yêu cầu triển khai không hợp lệ.',
        INVALID_DRIVER: 'Trình điều khiển không hợp lệ.',
        INVALID_ENVIRONMENT_CONFIG:
          'Cài đặt môi trường không hợp lệ cho trình điều khiển của nó.',
        INVALID_ENVIRONMENT_ID:
          'Sử dụng chữ cái viết thường, chữ số, dấu gạch dưới và dấu gạch nối cho ID môi trường.',
        INVALID_ENVIRONMENT_SETTINGS: 'Cài đặt môi trường không hợp lệ.',
        INVALID_IDEMPOTENCY_KEY: 'Khóa yêu cầu không hợp lệ.',
        INVALID_INPUT: 'Một số trường của yêu cầu không hợp lệ.',
        INVALID_LABELS:
          'Viết nhãn dưới dạng khóa=giá trị, phân tách bằng dấu phẩy.',
        INVALID_LOG_CURSOR: 'Vị trí nhật ký không hợp lệ.',
        INVALID_LOG_ID: 'Nhật ký không tồn tại.',
        INVALID_NOTE: 'Ghi chú quá dài.',
        INVALID_PUBLIC_URL: 'Mẫu URL công khai không hợp lệ.',
        INVALID_REQUEST: 'Yêu cầu không hợp lệ.',
        INVALID_ROLLBACK_TARGET:
          'Không thể khôi phục hoạt động triển khai này.',
        INVALID_SEARCH: 'Tìm kiếm không hợp lệ.',
        INVALID_TICKET: 'Vé không hợp lệ.',
        RELEASE_EXISTS: 'Phiên bản này đã được tải lên.',
        RELEASE_NOT_FOUND: 'Bản phát hành không tồn tại.',
        REQUEST_DECIDED: 'Yêu cầu đã được quyết định.',
        REQUEST_NOT_FOUND: 'Yêu cầu không tồn tại.',
        REQUEST_PENDING: 'Yêu cầu cho ứng dụng này đang chờ phê duyệt.',
        RESTART_FAILED: 'Không thể khởi động lại ứng dụng.',
        SESSION_REQUIRED: 'Đăng nhập lại để tiếp tục.',
        START_FAILED: 'Không thể khởi động ứng dụng.',
        STOP_FAILED: 'Không thể dừng ứng dụng.',
        TICKET_DEPLOY_REFUSED: 'Vé không cho phép triển khai này.',
        TICKET_FORBIDDEN: 'Vé không cho phép điều này.',
        UNSAFE_ARTIFACT: 'Gói chứa đường dẫn không an toàn.',
        VARIABLES_MISSING:
          'Các biến bắt buộc không được đặt: {{names}}. Đặt chúng trong các biến của ứng dụng hoặc môi trường của ứng dụng, sau đó triển khai lại.',
        VARIABLE_RESERVED:
          'Tên này được đặt theo thời gian chạy và không thể là biến.',
        INVALID_VARIABLE_NAME:
          'Tên biến là chữ in hoa, chữ số và dấu gạch dưới, bắt đầu bằng một chữ cái.',
        INVALID_VARIABLE_VALUE: 'Giá trị quá dài.',
        VARIABLE_NOT_FOUND: 'Biến không được đặt.',
        INVALID_VARIABLES_MANIFEST:
          'Tệp kê khai các biến của bản phát hành (dist/variables.json) không hợp lệ.',
        INITIAL_ADMIN_UNAVAILABLE: 'Không có quản trị viên đầu tiên hiển thị.',
      },
      messages: {
        hostExited: 'Quá trình của ứng dụng đã dừng trước khi sẵn sàng.',
        hostDisabled: 'Máy chủ ứng dụng bị tắt.',
        hostShutDown: 'Máy chủ ứng dụng đã tắt.',
        hostEntryMissing: 'Thiếu tệp nhập của máy chủ ứng dụng.',
        cannotRestart: 'Máy chủ này không thể khởi động lại từ đây.',
        selfDeploy:
          'Máy chủ không thể triển khai ứng dụng mà nó chạy trong đó.',
        noStatus:
          'Máy chủ không báo cáo quá trình triển khai diễn ra như thế nào.',
        interrupted: 'Việc triển khai bị gián đoạn do khởi động lại.',
        notReported: 'Thời gian chạy không báo cáo ứng dụng.',
        notRunning: 'Ứng dụng không chạy sau khi khởi động lại.',
        deploymentNotReported: 'Thời gian chạy không báo cáo việc triển khai.',
        notReady: 'Nó vẫn chưa sẵn sàng; hãy thử lại sau giây lát.',
        checkTimeout: 'Bài kiểm tra không kết thúc trong vòng 20 giây.',
        hostNoSettings: 'Thời gian chạy cục bộ không có cài đặt kết nối.',
      },
      prefixed: {
        startFailed: 'Khởi động không thành công: {{detail}}',
        stopFailed: 'Dừng không thành công: {{detail}}',
        restartFailed: 'Khởi động lại không thành công: {{detail}}',
        outcomeUnreadable: 'Không thể đọc được kết quả: {{detail}}',
      },
    },
    confirm: {
      cancel: 'Hủy',
      typeLabel: 'Gõ {{text}} để xác nhận',
    },
    environments: {
      title: 'Triển khai môi trường',
      description:
        'Ứng dụng được triển khai ở đâu và ai có thể triển khai ở đó.',
      open: 'Mở',
      loadOneFailed: 'Không thể tải môi trường.',
      settingsTitle: 'Cài đặt môi trường',
      readOnly:
        'Bạn có thể xem cài đặt của môi trường này nhưng không thể thay đổi chúng.',
      danger: 'Xóa môi trường',
      deleteDescription:
        'Loại bỏ môi trường và các biến của nó. Các ứng dụng được triển khai ở đây phải được xóa trước tiên.',
      discard: 'Loại bỏ các thay đổi',
      anyone: 'Bất cứ ai có thể triển khai',
      unlimited: 'Không giới hạn',
      apps: 'Ứng dụng',
      appsDescription: 'Các ứng dụng được triển khai vào môi trường này.',
      appsEmpty: 'Chưa có ứng dụng nào được triển khai ở đây.',
      sampleData: 'Tải dữ liệu mẫu vào lần triển khai đầu tiên',
      sampleDataHint:
        'Lần triển khai đầu tiên của ứng dụng tại đây sẽ cài đặt dữ liệu mẫu của ứng dụng đó (APP_SAMPLE_DATA=true). Sử dụng nó để xem trước, không phải để sản xuất.',
      add: 'Thêm môi trường',
      edit: 'Chỉnh sửa',
      delete: 'Xóa',
      save: 'Lưu',
      cancel: 'Hủy',
      check: 'Kiểm tra',
      reachable: '{{name}} có thể truy cập được.',
      unreachable: 'Không thể truy cập {{name}}.',
      deleted: 'Môi trường {{name}} đã bị xóa.',
      saved: 'Đã lưu môi trường {{name}}.',
      added: 'Đã thêm môi trường {{name}}.',
      loadFailed: 'Không thể tải môi trường.',
      emptyTitle: 'Chưa có môi trường',
      emptyNoAccess: 'Yêu cầu quản trị viên thêm môi trường.',
      emptyDescription: 'Thêm môi trường để triển khai ứng dụng.',
      editTitle: 'Chỉnh sửa {{name}}',
      formDescription:
        'Ứng dụng được triển khai ở đâu, cách tiếp cận ứng dụng và ai có thể triển khai ở đó.',
      configHint: 'Cài đặt của trình điều khiển, dưới dạng đối tượng JSON.',
      secretHint:
        'Được lưu trữ được mã hóa và không bao giờ hiển thị lại; để trống để giữ.',
      invalidJson: 'Nhập đối tượng JSON, chẳng hạn như {}.',
      protectedHint:
        'Mọi hoạt động triển khai, bởi một người hoặc bởi CI, đều chờ người phê duyệt, người này nhập lại ID ứng dụng để phê duyệt.',
      approversColumn: 'Người phê duyệt',
      approversPlaceholder: 'Chọn người phê duyệt',
      approversHint:
        'Bất kỳ ai trong số họ cũng có thể chấp thuận, bao gồm cả yêu cầu của chính họ. Nếu không có lựa chọn nào, những người được phép phê duyệt triển khai được bảo vệ sẽ quyết định.',
      confirmDelete: 'Xóa môi trường {{id}}?',
      id: 'ID môi trường',
      name: 'Tên',
      driver: 'Lái xe',
      runsOn: 'Chạy tiếp',
      policy: 'Chính sách',
      publicUrl: 'Mẫu URL công khai',
      config: 'Cài đặt (JSON)',
      secret: 'Thông tin xác thực (JSON, chỉ ghi)',
      secretStored:
        'Thông tin xác thực được lưu trữ; nhập những cái mới để thay thế chúng.',
      protected: 'Được bảo vệ',
      approvers: 'Người phê duyệt',
      pickDriver:
        'Chọn cách ứng dụng trong môi trường này chạy. Một môi trường giữ trình điều khiển của nó.',
      next: 'Tiếp tục',
      addWith: 'Thêm môi trường {{driver}}',
      changeDriver: 'Thay đổi',
      basics: 'Môi trường',
      namePlaceholder: 'Dàn dựng',
      idHint:
        'Chữ thường, chữ số, dấu gạch dưới và dấu gạch ngang; sau này không thể thay đổi được.',
      policyDescription: 'Ai có thể triển khai ở đây.',
      appDefaults: 'Ứng dụng',
      appDefaultsDescription:
        'Nhiều nhất là nhiều Ứng dụng như vậy và khi một Ứng dụng được tạo mà không có chính sách thời gian chạy riêng sẽ dừng và không hoạt động. Trống rỗng: không có giới hạn, không bao giờ.',
      maxApps: 'Hầu hết ứng dụng',
      defaultIdle: 'Dừng sau (phút chưa truy cập)',
      defaultDormant: 'Không hoạt động sau (giờ không được thăm)',
      noForm:
        'Không có biểu mẫu cài đặt; cài đặt được nhập dưới dạng JSON ({{kind}}).',
      imageSource: 'Phát hành hình ảnh',
      imageSourceDescription:
        'Kéo hình ảnh của từng bản phát hành từ sổ đăng ký theo thông báo, với thông tin xác thực kéo của nó, để môi trường này chạy chính CI hình ảnh được đẩy và các môi trường khác chạy.',
      registry: 'Kho đăng ký',
      noRegistry: 'Không: kéo hình ảnh công khai ẩn danh',
      newRegistry: 'Đăng ký mới',
      editRegistry: 'Chỉnh sửa',
      cancelRegistryEdit: 'Hủy chỉnh sửa',
      registryShared:
        'Các thay đổi áp dụng cho mọi môi trường lấy từ sổ đăng ký này.',
    },
    registries: {
      check: 'Kiểm tra kết nối',
      url: 'Địa chỉ',
      urlHint:
        'Nguồn gốc của nó, chẳng hạn như https://ghcr.io;, một địa chỉ localhost được truy cập qua HTTP.',
      namespace: 'Không gian tên',
      namespaceHint:
        'Đường dẫn phát hành hình ảnh đi theo, chẳng hạn như acme.',
      pull: 'Kéo thông tin đăng nhập',
      pullHint:
        'Đối với các môi trường lấy từ sổ đăng ký này; để chúng ở nơi nó cho phép kéo ẩn danh.',
      username: 'Tên người dùng',
      password: 'Mật khẩu hoặc mã thông báo',
      checkOk: 'Đã kết nối',
      checkFailed: 'Kiểm tra kết nối không thành công.',
      checkFailedTitle: 'Không thể sử dụng sổ đăng ký',
      anonymous:
        'Cơ quan đăng ký trả lời mà không có thông tin xác thực: bất kỳ ai tiếp cận nó đều có thể kéo.',
      status: {
        ok: 'đã được chấp nhận',
        failed: 'từ chối',
        notSet: 'chưa được đặt',
      },
    },
    artifacts: {
      title: 'Cổ vật',
      tarball: 'Lưu trữ',
      image: 'Hình ảnh',
      ran: 'Chạy',
      ranTarball: 'Đang lưu trữ, đang xử lý',
    },
    driverForm: {
      advanced: 'Cài đặt nâng cao',
      advancedHint:
        'Mặc định phù hợp với hầu hết các môi trường; mở một nhóm để thay đổi nó.',
      on: 'Bật',
      off: 'Tắt',
      noLimit: 'Không giới hạn',
      writeOnly: '(chỉ viết)',
      secretSet: 'Bộ',
      secretCleared: 'Đã xóa khi bạn lưu',
      replace: 'Thay thế',
      clear: 'Loại bỏ',
      undo: 'Hoàn tác',
      keepStored: 'Giữ cái đã lưu',
      jsonTitle: 'Cài đặt trình điều khiển',
      jsonDescription:
        'Trình điều khiển này không có biểu mẫu cài đặt; nhập cài đặt của nó là JSON.',
      check: 'Kiểm tra kết nối',
      checkOk: 'Đã kết nối',
      checkFailed: 'Kiểm tra kết nối không thành công.',
      checkFailedTitle: 'Không thể kết nối',
      fixErrors: 'Một số cài đặt cần sửa; chúng được đánh dấu ở trên.',
      errors: {
        required: 'Bắt buộc.',
        number: 'Nhập một số.',
        integer: 'Nhập số nguyên.',
        range: 'Ngoài phạm vi cho phép.',
        mapLine: 'Viết một NAME=giá trị trên mỗi dòng.',
        mapName:
          'Tên là chữ cái, chữ số và dấu gạch dưới, không bắt đầu bằng chữ số.',
      },
    },
    driverForms: {
      host: {
        description:
          'Chạy các ứng dụng trên máy chủ này: trong quy trình con của Máy chủ ứng dụng, ứng dụng này khởi động hoặc mỗi ứng dụng trong vùng chứa Docker.',
        runtime: 'Chế độ chạy',
        backend: 'Chế độ chạy',
        backendInProcess: 'Đang trong quá trình',
        backendInProcessHint:
          'Chạy trong tiến trình con của Máy chủ ứng dụng mà máy chủ này khởi động, được chia sẻ bởi tất cả các ứng dụng đó. Thích hợp để xem trước.',
        backendDocker: 'Docker',
        backendDockerHint:
          'Một vùng chứa cho mỗi ứng dụng, cách ly với nhau. Thích hợp cho việc thử nghiệm và sản xuất.',
        dockerConnection: 'Kết nối Docker',
        dockerConnectionDescription:
          'Sử dụng Docker trên máy chủ này, được tìm thấy từ DOCKER_HOST hoặc ngữ cảnh Docker hiện tại, với cài đặt vùng chứa được đề xuất. Kiểm tra kết nối để xem nó tìm thấy Docker nào.',
        access: 'Địa chỉ truy cập',
        publicUrl: 'Mẫu URL công khai',
        publicUrlHint:
          'Nơi mọi người mở một ứng dụng, có {appId} trong đường dẫn hoặc tên máy chủ; trống sử dụng địa chỉ riêng của máy chủ.',
        check: {
          url: 'Địa chỉ',
          apps: 'Ứng dụng đang chạy',
          endpoint: 'Docker',
          version: 'Phiên bản Docker',
          platform: 'Nền tảng',
          errors: {
            unsupported:
              'Chỉ hỗ trợ Docker trên máy chủ này: DOCKER_HOST phải là ổ cắm unix:// hoặc proxy ổ cắm tcp://.',
            socketMissing:
              'Không có ổ cắm Docker ở đó. Docker có được cài đặt và chạy trên máy chủ này không?',
            permission:
              'Docker từ chối truy cập. Người dùng ứng dụng này chạy có thể không sử dụng ổ cắm Docker.',
            refused:
              'Không có gì chấp nhận kết nối tại địa chỉ đó. Kiểm tra xem Docker có đang chạy không.',
            timeout: 'Docker không trả lời kịp thời.',
          },
        },
      },
    },
  },
  actions: {
    close: 'Đóng',
  },
  status: {
    loading: 'Đang tải',
  },
};

export default viVN;
