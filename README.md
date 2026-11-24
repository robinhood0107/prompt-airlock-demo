# Prompt Airlock 정적 대화 데모

Pages에는 정상 보호, 확인 대기, 정책 차단의 세 고정 합성 대화를 읽고 재생하는 설명 화면을 둡니다. 실제 채팅은 각 PC에서 수정하지 않은 공식 LibreChat을 실행해 사용합니다. 정적 데모는 Gateway, 저장소와 외부 언어모델 제공자를 호출하지 않고 입력·계정·자격 증명을 받지 않습니다.

첫 화면에는 정상 합성 대화가 보입니다. 왼쪽 사례 목록으로 흐름을 바꾸고 위 재생으로 입력부터 고정 단계를 표시하며, 아래 처음부터는 입력 메시지만 남깁니다. 모바일 메뉴는 사례 선택·Esc·덮개 닫기로 닫히고 포커스가 토글로 돌아옵니다.

HTML, CSS, JavaScript와 GitHub Actions에 이미 포함된 고정 checkout action만 사용합니다. 이미지·아이콘 파일·외부 폰트·외부 런타임·추가 패키지는 없습니다.

## 로컬 미리보기

Node.js가 이미 준비된 개발 환경에서 저장소 루트에서 실행합니다. 패키지 설치는 필요하지 않습니다.

~~~sh
node scripts/serve.mjs
~~~

서버는 충돌 없는 OS 배정 포트에서 127.0.0.1에만 바인딩하고 정해 둔 파일만 제공합니다. 시작 로그에 나온 주소의 / 또는 /prompt-airlock-demo/ 경로에서 확인합니다. 경로 검사는 자식 서버가 listen 성공을 알린 뒤 그 포트로 요청하므로 이미 열려 있는 다른 서버를 통과로 세지 않습니다.

실제 PC 채팅은 제품의 [LibreChat 로컬 설치 안내](https://github.com/robinhood0107/PromptAirlock/blob/main/deploy/librechat/README.md)를 따릅니다. Gateway와 mock의 첫 네이티브 요청은 [로컬 실행 안내](https://github.com/robinhood0107/PromptAirlock/blob/main/docs/local-mock-smoke.md)에서 확인합니다.

## 검사

아래 명령은 패키지를 설치하지 않습니다. GitHub Actions는 main 대상 pull request에서 세 job을 분리 실행합니다.

~~~sh
node --check scenarios.js
node --check app.js
node --check scripts/serve.mjs
node --check tests/check-static.mjs
node --check tests/check-scenarios.mjs
node --check tests/check-pages-paths.mjs
node tests/check-static.mjs
node tests/check-scenarios.mjs
node tests/check-pages-paths.mjs
~~~

1. 정적 자원과 네트워크 경계를 확인합니다.
2. 세 흐름의 판정 순서, mock 호출과 전송 수를 확인합니다.
3. 자식 미리보기 서버의 listen 성공을 확인한 뒤 Pages 하위 경로 HTTP와 제품 안내 링크를 확인합니다.

## Pages 경로

Pages를 main의 저장소 루트에서 제공하면 예상 주소는 https://robinhood0107.github.io/prompt-airlock-demo/ 입니다. 정적 자원은 상대 경로여서 저장소 하위 경로에서도 동작합니다. Pages 설정과 원격 게시는 이 작업에서 바꾸지 않습니다.

## 파일과 라이선스

| 파일 | 역할 |
|---|---|
| index.html | 왼쪽 사례 탐색과 대화 흐름 |
| styles.css | 데스크톱·모바일 레이아웃, 시스템 밝음·어두움, 키보드 포커스 |
| scenarios.js | 세 고정 합성 대화와 단계 |
| app.js | 사례 선택, 재생, 처음부터 다시 보기, 모바일 메뉴 |
| scripts/serve.mjs | loopback 정적 미리보기 서버 |
| tests/ | 설치 없는 정적·사례·경로 검사 |
| .github/workflows/check.yml | main 대상 PR용 세 검사 job |
| README.md | 실행, 검사와 Pages 하위 경로 |

이미지 파일과 이미지 라이선스 의존성은 없습니다. 외부 코드·자산을 포함하지 않습니다. 실제 화면을 제공하는 제품 UI는 별도 PC의 공식 LibreChat입니다.
