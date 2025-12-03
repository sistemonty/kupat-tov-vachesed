# 📧 הגדרת שליחת מיילים

## שלב 1: הרשמה ל-Resend

1. לך ל-[resend.com](https://resend.com)
2. הירשם (חינם עד 3,000 מיילים/חודש)
3. קבל את ה-API Key

## שלב 2: הגדרת Domain (אופציונלי)

**אפשרות א': שימוש ב-Resend Domain (קל)**
- Resend נותן domain בחינם: `onboarding.resend.dev`
- מוגבל ל-100 מיילים/יום
- מספיק להתחלה!

**אפשרות ב': Domain משלך (מומלץ לייצור)**
- הוסף domain ב-Resend
- הגדר DNS records
- ללא הגבלה

## שלב 3: הגדרת Environment Variables ב-Supabase

1. לך ל-Supabase Dashboard → **Project Settings → Edge Functions**
2. הוסף Secrets:

| Name | Value |
|------|-------|
| `RESEND_API_KEY` | ה-API Key מ-Resend |
| `FROM_EMAIL` | `noreply@onboarding.resend.dev` (או הדומיין שלך) |

## שלב 4: Deploy Edge Function

```bash
# התקן Supabase CLI
npm install -g supabase

# התחבר
supabase login

# Link לפרויקט
supabase link --project-ref odmxtufodaljukdhxggs

# Deploy
supabase functions deploy send-email
```

## שלב 5: בדיקה

בדף "בקשות תמיכה" - כשיש בקשה מאושרת, תראה כפתור "שלח מייל".

---

## 💰 עלויות

| שירות | חינם | בתשלום |
|-------|------|--------|
| **Resend** | 3,000 מיילים/חודש | $20/חודש (50,000) |
| **Supabase Edge Functions** | 500K invocations/חודש | $2/מיליון |

**להתחלה - הכל חינם!** ✅

---

## 📝 דוגמאות שימוש

### 1. שליחת מייל אישור
```typescript
await sendApprovalEmail(
  'family@example.com',
  'משפחת כהן',
  5000,
  '03/12/2025'
)
```

### 2. שליחת תזכורת
```typescript
await sendReminderEmail(
  'user@example.com',
  'יש לך בקשה ממתינה לאישור'
)
```

### 3. שליחת דוח
```typescript
await sendReportEmail(
  'admin@example.com',
  '<h1>דוח חודשי</h1><p>...</p>'
)
```

---

## 🔧 פתרון בעיות

**מייל לא נשלח?**
1. בדוק שה-API Key נכון
2. בדוק שה-Edge Function deployed
3. בדוק את ה-Logs ב-Supabase Dashboard

**מייל נכנס ל-Spam?**
- השתמש ב-domain משלך
- הוסף SPF/DKIM records

