-- =====================================================
-- קופת טוב וחסד - סכמת מסד נתונים
-- =====================================================

-- טבלאות עזר (Lookup Tables)
-- =====================================================

-- ערים
CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    name_en TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- רחובות
CREATE TABLE IF NOT EXISTS streets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID REFERENCES cities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(city_id, name)
);

-- קהילות
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    city_id UUID REFERENCES cities(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- סוגי תמיכה
CREATE TABLE IF NOT EXISTS support_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- פרויקטים
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    budget DECIMAL(12,2) DEFAULT 0,
    start_date DATE,
    end_date DATE,
    status TEXT DEFAULT 'active' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- תורמים
CREATE TABLE IF NOT EXISTS donors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- טבלה ראשית - משפחות
-- =====================================================

CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- מזהים
    nedarim_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    
    -- פרטי בעל
    husband_first_name TEXT,
    husband_last_name TEXT NOT NULL,
    husband_id_number TEXT,
    husband_birth_date DATE,
    husband_phone TEXT,
    husband_email TEXT,
    husband_marital_status TEXT CHECK (husband_marital_status IN ('married', 'divorced', 'widower', 'single')),
    
    -- פרטי אשה
    wife_first_name TEXT,
    wife_last_name TEXT,
    wife_id_number TEXT,
    wife_birth_date DATE,
    wife_phone TEXT,
    wife_email TEXT,
    wife_marital_status TEXT CHECK (wife_marital_status IN ('married', 'divorced', 'widow', 'single')),
    
    -- כתובת
    city_id UUID REFERENCES cities(id),
    street_id UUID REFERENCES streets(id),
    house_number TEXT,
    entrance TEXT,
    floor TEXT,
    apartment_code TEXT,
    
    -- קהילה
    synagogue TEXT,
    community_id UUID REFERENCES communities(id),
    
    -- פרטי בנק
    bank_account_name TEXT,
    bank_number TEXT,
    bank_branch TEXT,
    bank_account TEXT,
    
    -- טלפונים
    home_phone TEXT,
    additional_phone TEXT,
    
    -- מטא
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- אינדקסים למשפחות
CREATE INDEX IF NOT EXISTS idx_families_husband_id ON families(husband_id_number);
CREATE INDEX IF NOT EXISTS idx_families_wife_id ON families(wife_id_number);
CREATE INDEX IF NOT EXISTS idx_families_status ON families(status);
CREATE INDEX IF NOT EXISTS idx_families_city ON families(city_id);
CREATE INDEX IF NOT EXISTS idx_families_last_name ON families(husband_last_name);

-- =====================================================
-- ילדים
-- =====================================================

CREATE TABLE IF NOT EXISTS children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    
    first_name TEXT NOT NULL,
    last_name TEXT,
    id_number TEXT,
    birth_date DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    
    -- לימודים (עד גיל 18)
    school TEXT,
    tuition_fee DECIMAL(10,2),
    
    -- נישואין (מעל 18)
    is_married BOOLEAN DEFAULT FALSE,
    married_last_name TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_children_family ON children(family_id);

-- =====================================================
-- מצב כלכלי (היסטוריה)
-- =====================================================

CREATE TABLE IF NOT EXISTS financial_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    
    -- תקופה
    year INTEGER NOT NULL,
    record_date DATE DEFAULT CURRENT_DATE,
    
    -- הכנסות בעל
    husband_occupation TEXT CHECK (husband_occupation IN ('kollel', 'employed', 'self_employed', 'unemployed')),
    husband_workplace TEXT,
    husband_income DECIMAL(10,2) DEFAULT 0,
    
    -- פרטי כולל
    kollel_type TEXT CHECK (kollel_type IN ('full_day', 'half_day')),
    kollel_two_sessions BOOLEAN DEFAULT FALSE,
    kollel_name TEXT,
    kollel_stipend DECIMAL(10,2) DEFAULT 0,
    kollel_name_2 TEXT,
    kollel_stipend_2 DECIMAL(10,2) DEFAULT 0,
    other_kollel_income DECIMAL(10,2) DEFAULT 0,
    
    -- הכנסות אשה
    wife_occupation TEXT CHECK (wife_occupation IN ('employed', 'self_employed', 'housewife')),
    wife_workplace TEXT,
    wife_income DECIMAL(10,2) DEFAULT 0,
    
    -- קצבאות
    child_allowance DECIMAL(10,2) DEFAULT 0,
    income_support DECIMAL(10,2) DEFAULT 0,
    rent_assistance DECIMAL(10,2) DEFAULT 0,
    disability_allowance DECIMAL(10,2) DEFAULT 0,
    unemployment DECIMAL(10,2) DEFAULT 0,
    alimony DECIMAL(10,2) DEFAULT 0,
    survivors DECIMAL(10,2) DEFAULT 0,
    senior_allowance DECIMAL(10,2) DEFAULT 0,
    other_allowance DECIMAL(10,2) DEFAULT 0,
    
    -- הכנסות נוספות
    rental_income DECIMAL(10,2) DEFAULT 0,
    scholarship_income DECIMAL(10,2) DEFAULT 0,
    food_vouchers DECIMAL(10,2) DEFAULT 0,
    charity_support DECIMAL(10,2) DEFAULT 0,
    charity_support_name TEXT,
    family_support DECIMAL(10,2) DEFAULT 0,
    other_income DECIMAL(10,2) DEFAULT 0,
    other_income_description TEXT,
    
    -- דיור
    owns_home BOOLEAN DEFAULT FALSE,
    rent_amount DECIMAL(10,2) DEFAULT 0,
    mortgage_amount DECIMAL(10,2) DEFAULT 0,
    has_additional_property BOOLEAN DEFAULT FALSE,
    additional_property_mortgage DECIMAL(10,2) DEFAULT 0,
    additional_property_income DECIMAL(10,2) DEFAULT 0,
    
    -- חובות
    bank_debts DECIMAL(12,2) DEFAULT 0,
    bank_monthly_payment DECIMAL(10,2) DEFAULT 0,
    gmach_debts DECIMAL(12,2) DEFAULT 0,
    gmach_monthly_payment DECIMAL(10,2) DEFAULT 0,
    private_debts DECIMAL(12,2) DEFAULT 0,
    debt_reason TEXT,
    
    -- הוצאות רפואיות
    medical_expenses DECIMAL(10,2) DEFAULT 0,
    medical_details TEXT,
    
    -- רכוש
    has_vehicle BOOLEAN DEFAULT FALSE,
    has_savings BOOLEAN DEFAULT FALSE,
    savings_amount DECIMAL(12,2) DEFAULT 0,
    savings_details TEXT,
    
    -- סיכומים (מחושבים)
    total_monthly_income DECIMAL(12,2) GENERATED ALWAYS AS (
        husband_income + wife_income + 
        kollel_stipend + COALESCE(kollel_stipend_2, 0) + COALESCE(other_kollel_income, 0) +
        child_allowance + income_support + rent_assistance + 
        disability_allowance + unemployment + alimony + survivors + 
        senior_allowance + other_allowance +
        rental_income + scholarship_income + food_vouchers + 
        charity_support + family_support + other_income +
        additional_property_income
    ) STORED,
    
    total_monthly_expenses DECIMAL(12,2) GENERATED ALWAYS AS (
        rent_amount + mortgage_amount + additional_property_mortgage +
        bank_monthly_payment + gmach_monthly_payment + medical_expenses
    ) STORED,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(family_id, year)
);

CREATE INDEX IF NOT EXISTS idx_financial_family ON financial_status(family_id);
CREATE INDEX IF NOT EXISTS idx_financial_year ON financial_status(year);

-- =====================================================
-- בקשות תמיכה
-- =====================================================

CREATE TABLE IF NOT EXISTS support_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    
    -- פרטי בקשה
    request_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    purpose TEXT,
    requested_amount DECIMAL(10,2),
    
    -- סטטוס
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_review', 'approved', 'rejected', 'completed', 'cancelled')),
    
    -- צרכים נוספים
    needs_rights_assistance BOOLEAN DEFAULT FALSE,
    needs_financial_coaching BOOLEAN DEFAULT FALSE,
    
    -- מגיש הבקשה
    submitted_by TEXT,
    submitter_relation TEXT,
    submitter_phone TEXT,
    submitter_email TEXT,
    is_self_request BOOLEAN DEFAULT TRUE,
    signature TEXT,
    
    -- אישור
    approved_amount DECIMAL(10,2),
    approved_by TEXT,
    approval_date DATE,
    rejection_reason TEXT,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_requests_family ON support_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_date ON support_requests(request_date);

-- =====================================================
-- תמיכות (בפועל)
-- =====================================================

CREATE TABLE IF NOT EXISTS supports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    request_id UUID REFERENCES support_requests(id),
    project_id UUID REFERENCES projects(id),
    donor_id UUID REFERENCES donors(id),
    support_type_id UUID REFERENCES support_types(id),
    
    -- פרטי תמיכה
    amount DECIMAL(10,2) NOT NULL,
    support_date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    
    -- אופן מתן
    payment_method TEXT CHECK (payment_method IN ('transfer', 'check', 'cash', 'voucher', 'other')),
    
    -- סטטוס
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supports_family ON supports(family_id);
CREATE INDEX IF NOT EXISTS idx_supports_project ON supports(project_id);
CREATE INDEX IF NOT EXISTS idx_supports_date ON supports(support_date);
CREATE INDEX IF NOT EXISTS idx_supports_status ON supports(status);

-- =====================================================
-- הערות (תיעוד היסטוריה)
-- =====================================================

CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    
    content TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_family ON notes(family_id);

-- =====================================================
-- טריגרים לעדכון updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- טריגרים לכל הטבלאות
CREATE TRIGGER update_families_updated_at BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_children_updated_at BEFORE UPDATE ON children
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_status_updated_at BEFORE UPDATE ON financial_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_support_requests_updated_at BEFORE UPDATE ON support_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supports_updated_at BEFORE UPDATE ON supports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_donors_updated_at BEFORE UPDATE ON donors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- נתונים ראשוניים
-- =====================================================

-- סוגי תמיכה
INSERT INTO support_types (name, description) VALUES
    ('כספי', 'תמיכה כספית ישירה'),
    ('שובר', 'שוברים לרכישה'),
    ('מוצרים', 'מוצרי מזון או ציוד'),
    ('שירות', 'שירותים שונים'),
    ('מלגה', 'מלגת לימודים'),
    ('סיוע בשכר דירה', 'סיוע בתשלום שכר דירה'),
    ('סיוע רפואי', 'סיוע בהוצאות רפואיות'),
    ('חתונה', 'סיוע להוצאות חתונה'),
    ('אחר', 'סוג תמיכה אחר')
ON CONFLICT (name) DO NOTHING;

-- ערים נפוצות
INSERT INTO cities (name, name_en) VALUES
    ('ירושלים', 'Jerusalem'),
    ('בני ברק', 'Bnei Brak'),
    ('מודיעין עילית', 'Modiin Illit'),
    ('ביתר עילית', 'Beitar Illit'),
    ('אלעד', 'Elad'),
    ('בית שמש', 'Beit Shemesh'),
    ('אשדוד', 'Ashdod'),
    ('פתח תקווה', 'Petah Tikva'),
    ('רכסים', 'Rechasim'),
    ('צפת', 'Tzfat'),
    ('טבריה', 'Tiberias'),
    ('חיפה', 'Haifa'),
    ('תל אביב', 'Tel Aviv'),
    ('נתניה', 'Netanya'),
    ('רמת גן', 'Ramat Gan'),
    ('חולון', 'Holon'),
    ('ראשון לציון', 'Rishon LeZion'),
    ('אופקים', 'Ofakim'),
    ('נתיבות', 'Netivot'),
    ('קרית גת', 'Kiryat Gat')
ON CONFLICT (name) DO NOTHING;

-- פרויקטים לדוגמה
INSERT INTO projects (name, description, status) VALUES
    ('פסח תשפ"ה', 'חלוקת מזון וסיוע לחג הפסח', 'planned'),
    ('ראש השנה תשפ"ה', 'חלוקת מזון וסיוע לחגי תשרי', 'planned'),
    ('מלגות לימודים', 'מלגות לתלמידים נזקקים', 'active'),
    ('סיוע שוטף', 'תמיכה שוטפת למשפחות', 'active')
ON CONFLICT DO NOTHING;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- הפעלת RLS
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE supports ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE streets ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE donors ENABLE ROW LEVEL SECURITY;

-- מדיניות גישה - לעת עתה מאפשרים הכל (בהמשך נוסיף אימות)
CREATE POLICY "Allow all for now" ON families FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON children FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON financial_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON support_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON supports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON cities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON streets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON communities FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON support_types FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for now" ON donors FOR ALL USING (true) WITH CHECK (true);

