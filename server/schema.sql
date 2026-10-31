-- Signature Catering & Event Management — database tables
-- Is file ko phpMyAdmin / MySQL Workbench mein chala sakte hain, ya "npm run db:setup" se

CREATE DATABASE IF NOT EXISTS signature_events
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE signature_events;

-- "Get a free quote" form
CREATE TABLE IF NOT EXISTS enquiries (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  whatsapp      VARCHAR(20)   NULL,
  email         VARCHAR(160)  NULL,
  city          VARCHAR(60)   NOT NULL,
  event_types   VARCHAR(255)  NULL,          -- comma se alag, jaise "barat,nikah"
  event_date    DATE          NOT NULL,
  start_time    TIME          NULL,          -- event kab shuru hoga
  end_time      TIME          NULL,          -- event kab khatam hoga
  guests        INT UNSIGNED  NULL,
  message       TEXT          NULL,
  venue         VARCHAR(160)  NULL,          -- booking: shadi hall / marquee
  advance_paid  DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount      DECIMAL(12,2) NOT NULL DEFAULT 0,
  enquiry_for   VARCHAR(160)  NULL,          -- kis cheez ke liye (package / service ka naam)
  status        ENUM('new','contacted','booked','closed') NOT NULL DEFAULT 'new',
  admin_notes   TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_enquiries_created (created_at),
  INDEX idx_enquiries_status (status)
) ENGINE=InnoDB;

-- "Join as Vendor" form
CREATE TABLE IF NOT EXISTS vendors (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business_name VARCHAR(160)  NOT NULL,
  contact_name  VARCHAR(120)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  whatsapp      VARCHAR(20)   NULL,
  city          VARCHAR(60)   NOT NULL,
  service_type  VARCHAR(60)   NOT NULL,
  status        ENUM('new','approved','rejected') NOT NULL DEFAULT 'new',
  admin_notes   TEXT          NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_vendors_created (created_at)
) ENGINE=InnoDB;

-- "Plan Your Event" search box (hero)
CREATE TABLE IF NOT EXISTS searches (
  id                 INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  city               VARCHAR(60)  NULL,
  event_date         DATE         NULL,
  start_time         TIME         NULL,
  end_time           TIME         NULL,
  event_types        VARCHAR(255) NULL,
  budget             VARCHAR(40)  NULL,
  callback_requested TINYINT(1)   NOT NULL DEFAULT 0,
  created_at         TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_searches_created (created_at)
) ENGINE=InnoDB;
