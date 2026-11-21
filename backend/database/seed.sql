-- 시연용 최소 데이터 (프론트 가짜 API와 같은 테스트 계정, 비밀번호 모두 test1234)
-- schema.sql 실행 직후, 빈 DB에 한 번만 실행하세요.
SET NAMES utf8mb4;
USE delivery_app;

INSERT INTO customer (name, email, phone, password_hash) VALUES
  ('테스트 고객', 'customer@test.com', '010-1234-5678', '$2b$10$hxfLMDb1p2QnNueM/l29TOlKNNGcHxrYY.8bHmSf5nnJFwUVZIDou');

INSERT INTO address (customer_id, address, address_detail) VALUES
  (LAST_INSERT_ID(), '경기도 수원시 영통구 광교중앙로 140', '101동 1001호');

INSERT INTO owner (email, password_hash, name) VALUES
  ('owner@test.com', '$2b$10$hxfLMDb1p2QnNueM/l29TOlKNNGcHxrYY.8bHmSf5nnJFwUVZIDou', '김사장'),
  ('newowner@test.com', '$2b$10$hxfLMDb1p2QnNueM/l29TOlKNNGcHxrYY.8bHmSf5nnJFwUVZIDou', '새사장');  -- 가게 없음 → 로그인하면 가게 등록부터

INSERT INTO restaurant (name, address, status, owner_id, delivery_fee)
  SELECT '김밥천국 광교점', '경기도 수원시 영통구 광교로 100', '영업중', owner_id, 3000
    FROM owner WHERE email = 'owner@test.com';

INSERT INTO menu (restaurant_id, name, price)
  SELECT restaurant_id, m.name, m.price FROM restaurant
    JOIN (SELECT '참치김밥' AS name, 4500 AS price UNION ALL
          SELECT '라볶이', 6500 UNION ALL
          SELECT '돈까스김밥', 5000) m
   WHERE restaurant.name = '김밥천국 광교점';

INSERT INTO rider (name, phone, status, email, password_hash) VALUES
  ('테스트 라이더', '010-0000-0007', '운행종료', 'rider@test.com', '$2b$10$hxfLMDb1p2QnNueM/l29TOlKNNGcHxrYY.8bHmSf5nnJFwUVZIDou');
