-- FarmChain 기본 스키마 (Supabase용)
-- public 스키마 기준

-- 1. distributors (유통사)
CREATE TABLE IF NOT EXISTS distributors (
  id            BIGSERIAL PRIMARY KEY,
  code          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. stores (매장) - 아직 비사용, 확장용
CREATE TABLE IF NOT EXISTS stores (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  code          TEXT UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. products (상품)
CREATE TABLE IF NOT EXISTS products (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  category      TEXT NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'BOX',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. product_options (상품 옵션)
CREATE TABLE IF NOT EXISTS product_options (
  id            BIGSERIAL PRIMARY KEY,
  product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  spec          TEXT NOT NULL,
  price         INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. users (관리자 + 유통사 계정)
CREATE TABLE IF NOT EXISTS users (
  id             BIGSERIAL PRIMARY KEY,
  email          TEXT UNIQUE NOT NULL,
  password       TEXT NOT NULL, -- 데모용: 평문 저장. 실서비스에서는 해시 사용 필수
  name           TEXT NOT NULL,
  role           TEXT NOT NULL, -- 'ADMIN' | 'DISTRIBUTOR'
  distributor_id BIGINT REFERENCES distributors(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. orders (주문/장바구니)
CREATE TABLE IF NOT EXISTS orders (
  id             BIGSERIAL PRIMARY KEY,
  distributor_id BIGINT NOT NULL REFERENCES distributors(id),
  user_id        BIGINT NOT NULL REFERENCES users(id),
  store_id       BIGINT REFERENCES stores(id),
  status         TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, SUBMITTED, CONFIRMED, CANCELED...
  total_amount   INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at   TIMESTAMPTZ
);

-- 7. order_items (주문 품목)
CREATE TABLE IF NOT EXISTS order_items (
  id                BIGSERIAL PRIMARY KEY,
  order_id          BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id        BIGINT NOT NULL REFERENCES products(id),
  product_option_id BIGINT NOT NULL REFERENCES product_options(id),
  quantity          INTEGER NOT NULL,
  unit_price        INTEGER NOT NULL DEFAULT 0,
  line_total        INTEGER NOT NULL DEFAULT 0
);