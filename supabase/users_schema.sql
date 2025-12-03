-- =====================================================
-- ניהול משתמשים והרשאות
-- =====================================================

-- טבלת משתמשי המערכת (מקושרת ל-auth.users)
CREATE TABLE IF NOT EXISTS system_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'suspended')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ,
    notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_system_users_auth_user ON system_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_system_users_email ON system_users(email);
CREATE INDEX IF NOT EXISTS idx_system_users_role ON system_users(role);
CREATE INDEX IF NOT EXISTS idx_system_users_status ON system_users(status);

-- טבלת בקשות גישה
CREATE TABLE IF NOT EXISTS access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    full_name TEXT,
    requested_role TEXT DEFAULT 'user' CHECK (requested_role IN ('admin', 'manager', 'user', 'viewer')),
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status ON access_requests(status);
CREATE INDEX IF NOT EXISTS idx_access_requests_email ON access_requests(email);

-- טבלת הרשאות לפי דפים
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'user', 'viewer')),
    resource TEXT NOT NULL, -- 'families', 'supports', 'projects', etc.
    action TEXT NOT NULL, -- 'read', 'write', 'delete', 'approve'
    allowed BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- הרשאות ברירת מחדל
INSERT INTO permissions (role, resource, action, allowed) VALUES
-- Admin - הכל
('admin', 'families', 'read', TRUE),
('admin', 'families', 'write', TRUE),
('admin', 'families', 'delete', TRUE),
('admin', 'supports', 'read', TRUE),
('admin', 'supports', 'write', TRUE),
('admin', 'supports', 'approve', TRUE),
('admin', 'projects', 'read', TRUE),
('admin', 'projects', 'write', TRUE),
('admin', 'projects', 'delete', TRUE),
('admin', 'users', 'read', TRUE),
('admin', 'users', 'write', TRUE),
('admin', 'users', 'delete', TRUE),
('admin', 'settings', 'read', TRUE),
('admin', 'settings', 'write', TRUE),
-- Manager - קריאה וכתיבה, ללא מחיקה
('manager', 'families', 'read', TRUE),
('manager', 'families', 'write', TRUE),
('manager', 'families', 'delete', FALSE),
('manager', 'supports', 'read', TRUE),
('manager', 'supports', 'write', TRUE),
('manager', 'supports', 'approve', TRUE),
('manager', 'projects', 'read', TRUE),
('manager', 'projects', 'write', TRUE),
('manager', 'projects', 'delete', FALSE),
('manager', 'users', 'read', TRUE),
('manager', 'users', 'write', FALSE),
('manager', 'users', 'delete', FALSE),
('manager', 'settings', 'read', TRUE),
('manager', 'settings', 'write', FALSE),
-- User - קריאה וכתיבה מוגבלת
('user', 'families', 'read', TRUE),
('user', 'families', 'write', TRUE),
('user', 'families', 'delete', FALSE),
('user', 'supports', 'read', TRUE),
('user', 'supports', 'write', TRUE),
('user', 'supports', 'approve', FALSE),
('user', 'projects', 'read', TRUE),
('user', 'projects', 'write', FALSE),
('user', 'projects', 'delete', FALSE),
('user', 'users', 'read', FALSE),
('user', 'users', 'write', FALSE),
('user', 'users', 'delete', FALSE),
('user', 'settings', 'read', FALSE),
('user', 'settings', 'write', FALSE),
-- Viewer - רק קריאה
('viewer', 'families', 'read', TRUE),
('viewer', 'families', 'write', FALSE),
('viewer', 'families', 'delete', FALSE),
('viewer', 'supports', 'read', TRUE),
('viewer', 'supports', 'write', FALSE),
('viewer', 'supports', 'approve', FALSE),
('viewer', 'projects', 'read', TRUE),
('viewer', 'projects', 'write', FALSE),
('viewer', 'projects', 'delete', FALSE),
('viewer', 'users', 'read', FALSE),
('viewer', 'users', 'write', FALSE),
('viewer', 'users', 'delete', FALSE),
('viewer', 'settings', 'read', FALSE),
('viewer', 'settings', 'write', FALSE)
ON CONFLICT DO NOTHING;

-- טריגר לעדכון updated_at
CREATE TRIGGER update_system_users_updated_at BEFORE UPDATE ON system_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה
CREATE POLICY "Allow all for now" ON system_users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON access_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON permissions FOR ALL USING (true) WITH CHECK (true);

-- יצירת רשומת system_user למשתמש הקיים
INSERT INTO system_users (auth_user_id, email, full_name, role, status)
SELECT 
    id,
    email,
    raw_user_meta_data->>'full_name' AS full_name,
    'admin' AS role,
    'active' AS status
FROM auth.users
WHERE email = '7691037@gmail.com'
ON CONFLICT (auth_user_id) DO UPDATE SET role = 'admin', status = 'active';

