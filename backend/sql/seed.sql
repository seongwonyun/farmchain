
-- FarmChain 데모용 시드 데이터 (idempotent, 여러번 실행 가능)

-- 1. distributors
INSERT INTO distributors (code, name, memo)
VALUES 
  ('CR001', 'test 유통사', '기본 데모 유통사')
ON CONFLICT (code) DO NOTHING;


-- 2. products
INSERT INTO products (name, category, unit, is_active)
VALUES
  ('단호박',   '채소', 'BOX', TRUE),
  ('브로콜리', '채소', 'BOX', TRUE),
  ('양파',     '채소', 'BOX', TRUE)
ON CONFLICT DO NOTHING;


-- 3. product_options
-- 3-1) product name당 1개씩만 선택하도록 DISTINCT ON 사용
WITH p AS (
  SELECT DISTINCT ON (name) 
         name, id
  FROM products
  WHERE name IN ('단호박', '브로콜리', '양파')
  ORDER BY name, id  -- 같은 name이면 가장 작은 id 하나만 선택
)
INSERT INTO product_options (product_id, name, spec, price, sort_order, is_active)
VALUES
  ((SELECT id FROM p WHERE name = '단호박'),   '뉴질랜드', '8kg',   18000, 1, TRUE),
  ((SELECT id FROM p WHERE name = '단호박'),   '국산',     '10kg',  22000, 2, TRUE),

  ((SELECT id FROM p WHERE name = '브로콜리'), '특',       '10입',  15000, 1, TRUE),
  ((SELECT id FROM p WHERE name = '브로콜리'), '상',       '8입',   12000, 2, TRUE),

  ((SELECT id FROM p WHERE name = '양파'),     '특',       '20kg',  13000, 1, TRUE),
  ((SELECT id FROM p WHERE name = '양파'),     '상',       '15kg',  11000, 2, TRUE)
ON CONFLICT DO NOTHING;


-- 4. demo users (패스워드 평문: 데모용)
INSERT INTO users (email, password, name, role, distributor_id)
VALUES
  ('admin@farmchain.app', 'admin1234', '관리자',      'ADMIN',       NULL),
  (
    'test@farmchain.app',
    'test1234',
    'test 유통사',
    'DISTRIBUTOR',
    (
      SELECT id 
      FROM distributors 
      WHERE code = 'CR001'
      ORDER BY id
      LIMIT 1
    )
  )
ON CONFLICT (email) DO NOTHING;
