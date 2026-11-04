-- database/seed.sql
-- Inserts the starting data. Run it AFTER schema.sql.
-- ON CONFLICT DO NOTHING makes it safe to run more than once.

-- The four roles
INSERT INTO roles (role_name) VALUES
  ('ADMIN'),
  ('INSTITUTION_STAFF'),
  ('STUDENT'),
  ('VERIFIER')
ON CONFLICT (role_name) DO NOTHING;

-- A sample institution (rename it later from the Admin dashboard)
INSERT INTO institutions (institution_name) VALUES
  ('Sample Institution')
ON CONFLICT (institution_name) DO NOTHING;

-- The first administrator.
-- Login:    admin@example.com
-- Password: Admin@123   (stored only as a bcrypt hash - CHANGE IT after your first deployment)
INSERT INTO users (name, email, password_hash, role_id, institution_id, status)
VALUES (
  'System Administrator',
  'admin@example.com',
  '$2b$10$6R9VW8iOdtH35XGwWFEs7.LYog/Hmrs46CmwEDNAbj4.ngySXxK7e',
  (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
  NULL,
  'ACTIVE'
)
ON CONFLICT (email) DO NOTHING;
