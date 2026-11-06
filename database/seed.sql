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


-- ==========================================
-- PHASE 2: ADDITIONAL TEST ACCOUNTS
-- ==========================================

-- 1. Institution Staff
INSERT INTO users (
    name, email, password_hash, role_id, institution_id
)
VALUES (
    'Sonam',
    '07240113.sherubtse@rub.edu.bt',
    '$2b$10$wTWhvVqAvQLhJReF3tPlmOpAaNLIU0QHIWKKOEsZBEc0CzSD8rR0S',
    (SELECT role_id FROM roles WHERE role_name = 'INSTITUTION_STAFF'),
    (SELECT institution_id FROM institutions
     WHERE institution_name = 'Sample Institution')
)
ON CONFLICT (email) DO NOTHING;


-- 2. Student
INSERT INTO users (
    name, email, password_hash, role_id, institution_id
)
VALUES (
    'Tshering',
    '07240120.sherubtse@rub.edu.bt',
    '$2b$10$x23AUzf04RX7UiOWM4cW7excC.KshW/MO4keBl7ckuMbx4G8ytxVC',
    (SELECT role_id FROM roles WHERE role_name = 'STUDENT'),
    (SELECT institution_id FROM institutions
     WHERE institution_name = 'Sample Institution')
)
ON CONFLICT (email) DO NOTHING;


-- 3. Verifier
INSERT INTO users (
    name, email, password_hash, role_id, institution_id
)
VALUES (
    'Yangki',
    '07240104.sherubtse@rub.edu.bt',
    '$2b$10$WuUTzCwZ3aWxb5rxvfMWW.sr5wZqDm6hh4mXpnBnyysDHfXGQNl0W',
    (SELECT role_id FROM roles WHERE role_name = 'VERIFIER'),
    NULL
)
ON CONFLICT (email) DO NOTHING;


-- 4. Link the student login to a student record
INSERT INTO students (
    name,
    student_number,
    institution_id,
    user_id
)
SELECT
    u.name,
    '07240120',
    u.institution_id,
    u.user_id
FROM users u
WHERE u.email = '07240120.sherubtse@rub.edu.bt'
AND NOT EXISTS (
    SELECT 1
    FROM students s
    WHERE s.institution_id = u.institution_id
    AND s.student_number = '07240120'
);

