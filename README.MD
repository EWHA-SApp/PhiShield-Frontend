# manifest.json 설명

### Permissions
- `identity`  
  사용자의 계정을 확인할 수 있는 권한
- `identity.email`  
  사용자의 이메일 주소에 접근할 수 있는 권한
- `notifications`  
  시스템 알림을 표시할 수 있는 권한

### Host Permissions
- `https://www.googleapis.com/*`  
  Gmail API를 사용하기 위한 권한

### Background
- `"service_worker": "background.js"`  
  백그라운드에서 실행되는 서비스 워커를 정의

### Action
- `"default_popup": "popup/popup.html"`  
  확장 프로그램 아이콘 클릭 시 열리는 팝업을 정의

### OAuth2
- `client_id: "###"`
- `scopes:`
  - `https://www.googleapis.com/auth/gmail.readonly`  
    Gmail API에 대한 읽기 전용 접근을 허용
