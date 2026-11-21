-- 3조 배달앱 스키마 (배달플랫폼_테이블정의서 + 확인사항.txt 기준)
-- MySQL 8.0.16 이상 (CHECK 제약 동작)
-- DB 담당이 만든 DDL이 따로 있으면 그걸 써도 됩니다. 컬럼명만 같으면 API는 그대로 동작합니다.

SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS delivery_app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE delivery_app;

CREATE TABLE customer (
  customer_id   INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(30)  NOT NULL,
  email         VARCHAR(100) NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  CONSTRAINT uq_customer_email UNIQUE (email)
);

CREATE TABLE address (
  address_id     INT AUTO_INCREMENT PRIMARY KEY,
  customer_id    INT          NOT NULL,
  address        VARCHAR(200) NOT NULL,
  address_detail VARCHAR(100) NULL,
  CONSTRAINT fk_address_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id)
);

CREATE TABLE owner (
  owner_id      INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(30)  NOT NULL,
  CONSTRAINT uq_owner_email UNIQUE (email)
);

CREATE TABLE restaurant (
  restaurant_id INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(50)  NOT NULL,
  address       VARCHAR(200) NOT NULL,
  status        VARCHAR(10)  NOT NULL DEFAULT '영업종료',
  owner_id      INT          NOT NULL,
  delivery_fee  INT          NOT NULL DEFAULT 0,
  CONSTRAINT uq_restaurant_owner UNIQUE (owner_id),
  CONSTRAINT fk_restaurant_owner FOREIGN KEY (owner_id) REFERENCES owner (owner_id),
  CONSTRAINT ck_restaurant_status CHECK (status IN ('영업중', '영업종료')),
  CONSTRAINT ck_restaurant_fee CHECK (delivery_fee >= 0)
);

CREATE TABLE menu (
  menu_id       INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT         NOT NULL,
  name          VARCHAR(50) NOT NULL,
  price         INT         NOT NULL,
  CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id),
  CONSTRAINT ck_menu_price CHECK (price >= 0)
);

CREATE TABLE rider (
  rider_id      INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(30)  NOT NULL,
  phone         VARCHAR(20)  NOT NULL,
  status        VARCHAR(10)  NOT NULL DEFAULT '운행종료',
  email         VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  CONSTRAINT uq_rider_email UNIQUE (email),
  CONSTRAINT ck_rider_status CHECK (status IN ('운행가능', '배달중', '운행종료'))
);

CREATE TABLE orders (
  order_id      INT AUTO_INCREMENT PRIMARY KEY,
  customer_id   INT          NOT NULL,
  restaurant_id INT          NOT NULL,
  ordered_time  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status        VARCHAR(10)  NOT NULL,
  address_id    INT          NOT NULL,
  order_address VARCHAR(300) NOT NULL,
  total_amount  INT          NOT NULL,
  delivery_fee  INT          NOT NULL,
  CONSTRAINT fk_orders_customer   FOREIGN KEY (customer_id)   REFERENCES customer (customer_id),
  CONSTRAINT fk_orders_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id),
  CONSTRAINT fk_orders_address    FOREIGN KEY (address_id)    REFERENCES address (address_id),
  CONSTRAINT ck_orders_status CHECK (status IN ('결제실패', '접수대기', '조리중', '조리완료', '거절')),
  CONSTRAINT ck_orders_amount CHECK (total_amount >= 0 AND delivery_fee >= 0)
);

CREATE TABLE order_item (
  order_item_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT NOT NULL,
  menu_id       INT NOT NULL,
  quantity      INT NOT NULL,
  unit_price    INT NOT NULL,
  CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT fk_order_item_menu  FOREIGN KEY (menu_id)  REFERENCES menu (menu_id),
  CONSTRAINT ck_order_item CHECK (quantity >= 1 AND unit_price >= 0)
);

CREATE TABLE delivery (
  delivery_id INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT         NOT NULL,
  rider_id    INT         NOT NULL,
  status      VARCHAR(10) NOT NULL DEFAULT '배정완료',
  CONSTRAINT uq_delivery_order UNIQUE (order_id),
  CONSTRAINT fk_delivery_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT fk_delivery_rider FOREIGN KEY (rider_id) REFERENCES rider (rider_id),
  CONSTRAINT ck_delivery_status CHECK (status IN ('배정완료', '픽업완료', '배달중', '배달완료'))
);

CREATE TABLE delivery_history (
  history_id  INT AUTO_INCREMENT PRIMARY KEY,
  delivery_id INT         NOT NULL,
  status      VARCHAR(10) NOT NULL,
  changed_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_history_delivery_status UNIQUE (delivery_id, status),
  CONSTRAINT fk_history_delivery FOREIGN KEY (delivery_id) REFERENCES delivery (delivery_id),
  CONSTRAINT ck_history_status CHECK (status IN ('배정완료', '픽업완료', '배달중', '배달완료'))
);

CREATE TABLE payment (
  payment_id  INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT         NOT NULL,
  method      VARCHAR(10) NOT NULL,
  amount      INT         NOT NULL,
  status      VARCHAR(10) NOT NULL,
  canceled_at DATETIME    NULL,
  CONSTRAINT uq_payment_order UNIQUE (order_id),
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders (order_id),
  CONSTRAINT ck_payment_method CHECK (method IN ('카드', '간편결제')),
  CONSTRAINT ck_payment_status CHECK (status IN ('완료', '실패', '취소완료')),
  CONSTRAINT ck_payment_amount CHECK (amount >= 0),
  -- 취소일자는 취소완료일 때만
  CONSTRAINT ck_payment_canceled CHECK (
    (status = '취소완료' AND canceled_at IS NOT NULL) OR (status <> '취소완료' AND canceled_at IS NULL)
  )
);

CREATE TABLE settlement (
  settlement_id INT AUTO_INCREMENT PRIMARY KEY,
  restaurant_id INT         NULL,
  rider_id      INT         NULL,
  start_date    DATE        NOT NULL,
  end_date      DATE        NOT NULL,
  amount        INT         NOT NULL,
  status        VARCHAR(10) NOT NULL DEFAULT '생성완료',
  CONSTRAINT uq_settlement_restaurant_week UNIQUE (restaurant_id, start_date),
  CONSTRAINT uq_settlement_rider_week      UNIQUE (rider_id, start_date),
  CONSTRAINT fk_settlement_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant (restaurant_id),
  CONSTRAINT fk_settlement_rider      FOREIGN KEY (rider_id)      REFERENCES rider (rider_id),
  -- 음식점ID와 라이더ID 중 정확히 하나
  CONSTRAINT ck_settlement_target CHECK ((restaurant_id IS NULL) <> (rider_id IS NULL)),
  CONSTRAINT ck_settlement_period CHECK (start_date <= end_date),
  CONSTRAINT ck_settlement_amount CHECK (amount >= 0),
  CONSTRAINT ck_settlement_status CHECK (status IN ('생성완료', '지급완료'))
);

CREATE TABLE settlement_item (
  settlement_item_id INT AUTO_INCREMENT PRIMARY KEY,
  settlement_id      INT         NOT NULL,
  order_id           INT         NOT NULL,
  pay_target         VARCHAR(10) NOT NULL,
  pay_amount         INT         NOT NULL,
  CONSTRAINT uq_settlement_item_order_target UNIQUE (order_id, pay_target),
  CONSTRAINT fk_settlement_item_settlement FOREIGN KEY (settlement_id) REFERENCES settlement (settlement_id),
  CONSTRAINT fk_settlement_item_order      FOREIGN KEY (order_id)      REFERENCES orders (order_id),
  CONSTRAINT ck_settlement_item_target CHECK (pay_target IN ('음식점', '라이더')),
  CONSTRAINT ck_settlement_item_amount CHECK (pay_amount >= 0)
);
