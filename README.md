# 팜체인(FarmChain) Supabase 연동 스타터

**유통사 전용 농산물 주문 관리 웹앱**이며,  
이 버전은 **Supabase PostgreSQL DB와 직접 연결**되도록 구성되어 있습니다.

- 백엔드: Node.js + Express + pg (Supabase 연결)
- 프론트엔드: Next.js(App Router) + TypeScript
- DB: Supabase PostgreSQL (schema.sql / seed.sql 제공)

## 1. Supabase 준비

1) Supabase 프로젝트 생성
2) 좌측 메뉴 → **SQL Editor** 에서 아래 파일들을 순서대로 실행
   - `backend/sql/schema.sql`  (테이블 생성)
   - `backend/sql/seed.sql`    (데모 데이터)

3) 좌측 메뉴 → **Settings → Database → Connection string → URI(psql)** 에서
   - 전체 connection string 복사 (postgres://... 형식)

## 2. 백엔드 설정 및 실행

```bash
cd backend
npm install
cp .env.example .env
```

`.env` 파일 수정:

```env
DATABASE_URL=여기에_Supabase_Connection_String_붙여넣기
JWT_SECRET=원하는_아무_문자열
PORT=3001
```

서버 실행:

```bash
npm run dev
```

- 헬스체크: `GET http://localhost:3001/api/health` → `{ "status": "ok" }` 응답

## 3. 프론트엔드 설정 및 실행

```bash
cd frontend
npm install
cp .env.example .env.local
# 필요 시 API URL 수정 (기본: http://localhost:3001/api)
npm run dev
```

브라우저에서 `http://localhost:3000` 접속

- `/login` 에서 데모 계정으로 로그인:

  - 배포용 유통사(DEMO)
    - 이메일: `test@farmchain.app`
    - 비밀번호: `test1234`

  - 관리자(DEMO, 아직 별도 Admin UI는 없음)
    - 이메일: `admin@farmchain.app`
    - 비밀번호: `admin1234`

## 4. 주요 플로우

### 4-1. 로그인 `/login`

- 이메일/비밀번호 입력 → `POST /api/auth/login`
- 성공 시:
  - `localStorage.fc_token`, `localStorage.fc_user` 저장
  - `/orders` 로 이동

### 4-2. 발주(상품 목록) `/orders`

- Supabase의 `products`, `product_options` 테이블에서 데이터를 읽어와서:
  - 상품 카드 + 옵션 칩(TAB/라디오 느낌)
  - 수량 선택 `[-] N [+]`
  - "장바구니 담기" → `POST /api/orders/cart/items`
- 유통사 계정은 **전체 상품/옵션 조회 가능**

### 4-3. 장바구니 `/cart`

- Supabase의 `orders`(status=DRAFT) + `order_items` 조합
- 수량 변경 / 삭제 / 총 금액 계산
- "주문 확정하기" → `POST /api/orders/cart/submit`
  - `status: DRAFT → SUBMITTED`
  - `/orders/{id}` 상세로 이동

### 4-4. 발주 내역 & 상세

- `/orders/history`
  - `GET /api/orders/history` (SUBMITTED만 조회)
- `/orders/[id]`
  - `GET /api/orders/:id`

### 4-5. 배차 & 알림 & 마이페이지

- `/dispatch` : 더미 데이터 기반 배차 현황
- `/notifications` : 더미 알림 목록
- `/mypage` : 로그인한 유저 정보 + 로그아웃

## 5. DB 구조 (요약)

- `distributors` : 유통사 마스터
- `stores`       : 매장(향후 확장용)
- `products`     : 상품
- `product_options` : 상품 옵션 (규격/가격 포함)
- `users`        : 관리자/유통사 계정
- `orders`       : 주문(장바구니 포함, status=DRAFT/SUBMITTED 등)
- `order_items`  : 주문의 각 상품/옵션/수량/금액

👉 전체 정의는 `backend/sql/schema.sql` 참고  
👉 샘플 데이터는 `backend/sql/seed.sql` 참고

## 6. 비밀번호 관련 주의

- 데모 용이므로 `users.password`에 **평문**으로 저장하고,
  백엔드에서도 평문 비교를 합니다.
- 실서비스 전환 시에는:
  - bcrypt로 해시 저장
  - 로그인 시 bcrypt.compare 사용
  - seed.sql도 해시된 비밀번호로 변경 필요

## 7. 다음 확장 포인트

- Admin 전용 프론트(`/admin/...`) 추가:
  - stores / distributors / products / product_options / users 마스터 관리
- 주문 상태 확장 (CONFIRMED, CANCELED, DELIVERED 등)
- 배차/알림을 실제 테이블로 분리하여 Supabase 연동
- RLS(Row Level Security) 정책 적용하여 유통사별 데이터 접근 제어

---

이 스타터는 **“Supabase와 실제 DB를 사용한 FarmChain(팜체인) 주문 플로우”**를  
바로 실행해보고, 그 위에 Admin/배차/정산 기능을 점진적으로 쌓아갈 수 있도록 설계되었습니다.
