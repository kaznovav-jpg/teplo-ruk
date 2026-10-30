# 손길의 온기 — 핸드메이드 쇼핑몰 · 클래스 · 작가 커뮤니티

React + Vite + Firebase(Auth·Firestore·Storage) + Vercel 구조입니다.
**Firebase 설정이 없어도 바로 동작합니다.** 이때는 "로컬 모드"로 브라우저에만 저장하고, 환경변수를 넣으면 자동으로 Firebase를 사용합니다.

## 폴더 구조
```
src/
  main.jsx · App.jsx        진입점 · 라우트 목록
  lib/firebase.js           Firebase 초기화 (환경변수 없으면 비활성)
  lib/store.jsx             전역 상태 + 인증/주문/글/댓글 (화면은 useApp()만 사용)
  lib/data.js · data/*.json 상품·작가·클래스·아티클·일정 샘플 데이터
  components/               Layout(헤더·푸터), Cards, Comments
  pages/                    Home, Shop, Learn, Community, MyPage, Misc
firestore.rules · storage.rules · firebase.json   보안 규칙
vercel.json                 SPA 라우팅 설정
```

## 1) 내 컴퓨터에서 실행 (선택)
```
npm install
npm run dev
```

## 2) GitHub에 올리기
GitHub에서 새 저장소(Repository)를 만들고, 이 폴더의 파일을 올립니다.
(웹에서는 저장소 화면의 "uploading an existing file"로 드래그해서 올릴 수 있습니다. `node_modules`, `.env`는 올리지 마세요. `.gitignore`에 이미 제외돼 있습니다.)

## 3) Vercel로 배포
1. vercel.com 에서 GitHub로 로그인 → **Add New → Project** → 방금 만든 저장소 선택
2. Framework는 **Vite**로 자동 인식됩니다. **Deploy**만 누르면 배포됩니다. (Firebase 없이 로컬 모드로 뜸)

## 4) Firebase 연결 (로그인·저장을 실제로 쓰려면)
1. console.firebase.google.com 에서 프로젝트 생성
2. **Authentication** → 시작하기 → 로그인 방법에서 **이메일/비밀번호**, **Google** 사용 설정
3. **Firestore Database** 만들기 (프로덕션 모드), **Storage** 시작하기
4. 프로젝트 설정 → 내 앱 → **웹 앱(</>)** 추가 → 나오는 설정값을 `.env.example`의 이름대로 **Vercel → Settings → Environment Variables**에 입력 후 재배포
5. **Firestore → 규칙**에 `firestore.rules`, **Storage → 규칙**에 `storage.rules` 내용을 붙여넣고 게시
6. Authentication → 설정 → **승인된 도메인**에 Vercel 주소(`xxx.vercel.app`) 추가

## Firestore 구조
| 컬렉션 | 내용 |
|---|---|
| `users/{uid}` | 프로필(이름·연락처·배송지·적립금·쿠폰) + 장바구니·찜·팔로우·수강·진행률·메모·예약·좋아요 |
| `orders/{id}` | 주문 (uid 포함, 본인만 읽기) |
| `posts/{id}` | 커뮤니티 글 (사진은 Storage `posts/{uid}/…`) |
| `comments/{id}` | 댓글·답글 (`targetId`로 글/아티클 구분) |

## 실서비스 전에 꼭 바꿔야 할 것
- **적립금·쿠폰·주문 금액**: 지금은 클라이언트가 직접 씁니다. 사용자가 값을 바꿀 수 있으니 Cloud Functions(서버)에서 계산·검증해야 합니다.
- **결제**: 결제 화면은 UI뿐입니다. PG(토스페이먼츠·포트원 등) 연동 + 서버 승인 필요.
- **배송 상태**: 지금은 주문 후 경과 시간으로 보여주는 샘플입니다. 배송사/관리자 화면과 연동 필요.
- **카카오·네이버 로그인**: Firebase 기본 지원이 아니라 서버(커스텀 토큰) 구현이 필요합니다. 현재는 안내만 나옵니다.
- **좋아요·댓글 수**: 목록의 카운트는 샘플/클라이언트 계산입니다. 글 문서에 카운터를 두고 Functions로 갱신하세요.
- **카탈로그 데이터**: 상품·작가·클래스·아티클·일정은 `src/data/*.json`입니다. 관리자 화면과 함께 Firestore로 옮기려면 `src/lib/data.js`만 교체하면 됩니다.
- **비회원 주문**: 비회원 주문은 이 브라우저에만 저장됩니다. 회원 전용으로 바꾸려면 `Checkout`에서 로그인 여부를 확인하세요.
- **이미지**: 지금은 picsum 임시 이미지입니다(실패 시 내장 그림). 실제 사진 URL로 교체하세요.
- **SEO**: 클라이언트 렌더링이라 검색 노출에 한계가 있습니다. 필요하면 Next.js로 이전을 검토하세요.
