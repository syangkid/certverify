-- database/schema.sql
-- Creates all tables for the Academic Certificate Verification System.
-- WARNING: the DROP lines delete existing tables AND their data.
-- Run this file on a development database, or once when first setting up Neon.

DROP TABLE IF EXISTS verification_results;
DROP TABLE IF EXISTS verification_requests;
DROP TABLE IF EXISTS certificates;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS institutions;
DROP TABLE IF EXISTS roles;

-- 1. roles: ADMIN, INSTITUTION_STAFF, STUDENT, VERIFIER
CREATE TABLE roles (
  role_id   SERIAL PRIMARY KEY,
  role_name VARCHAR(30) NOT NULL UNIQUE
);

-- 2. institutions
CREATE TABLE institutions (
  institution_id   SERIAL PRIMARY KEY,
  institution_name VARCHAR(150) NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. users: everyone who can log in
--    institution_id is NULL for admins and verifiers.
CREATE TABLE users (
  user_id        SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  email          VARCHAR(150) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role_id        INT NOT NULL REFERENCES roles(role_id),
  institution_id INT REFERENCES institutions(institution_id),
  status         VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. students
--    user_id links a student record to their login account (optional).
CREATE TABLE students (
  student_id     SERIAL PRIMARY KEY,
  name           VARCHAR(100) NOT NULL,
  student_number VARCHAR(50) NOT NULL,
  institution_id INT NOT NULL REFERENCES institutions(institution_id),
  user_id        INT UNIQUE REFERENCES users(user_id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (institution_id, student_number)   -- same number cannot repeat inside one institution
);

-- 5. certificates
--    verification_code looks like CERT-9F3A7C21 (CERT- + 8 hexadecimal characters).
CREATE TABLE certificates (
  certificate_id    SERIAL PRIMARY KEY,
  student_id        INT NOT NULL REFERENCES students(student_id),
  institution_id    INT NOT NULL REFERENCES institutions(institution_id),
  certificate_type  VARCHAR(100) NOT NULL,
  status            VARCHAR(10) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
  verification_code VARCHAR(13) NOT NULL UNIQUE
                    CHECK (verification_code ~ '^CERT-[0-9A-F]{8}$'),
  issued_by         INT NOT NULL REFERENCES users(user_id),
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at        TIMESTAMPTZ
);

-- 6. verification_requests: every attempt is saved, even failed ones.
--    certificate_id is NULL when the code was INVALID or NOT_FOUND.
--    verifier_id is NULL when the person verified without logging in.
CREATE TABLE verification_requests (
  request_id     SERIAL PRIMARY KEY,
  certificate_id INT REFERENCES certificates(certificate_id),
  verifier_id    INT REFERENCES users(user_id),
  submitted_code VARCHAR(50) NOT NULL,
  request_date   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. verification_results: exactly one result per request (UNIQUE request_id = 1-to-1)
CREATE TABLE verification_results (
  result_id     SERIAL PRIMARY KEY,
  request_id    INT NOT NULL UNIQUE REFERENCES verification_requests(request_id),
  result_status VARCHAR(10) NOT NULL
                CHECK (result_status IN ('VALID', 'INVALID', 'NOT_FOUND', 'REVOKED')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes: speed up the lookups used by the history pages.
CREATE INDEX idx_certificates_student      ON certificates(student_id);
CREATE INDEX idx_certificates_institution  ON certificates(institution_id);
CREATE INDEX idx_requests_certificate      ON verification_requests(certificate_id);
CREATE INDEX idx_requests_verifier         ON verification_requests(verifier_id);
