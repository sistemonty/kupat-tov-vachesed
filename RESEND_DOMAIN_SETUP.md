# 🔧 הגדרת Domain ב-Resend

## הבעיה
השגיאה `The onboarding.resend.dev domain is not verified` אומרת שה-domain לא מאומת ב-Resend.

## פתרון: הוסף Domain ב-Resend

### שלב 1: הוסף Domain
1. לך ל-[Resend Dashboard](https://resend.com/domains)
2. לחץ **"Add Domain"**
3. הזן את ה-domain שלך (למשל: `kupat-tov-vachesed.co.il`)
4. לחץ **"Add"**

### שלב 2: הוסף DNS Records
Resend יבקש ממך להוסיף DNS records. הוסף אותם ב-DNS של ה-domain שלך:

**דוגמה ל-DNS Records:**
```
Type: TXT
Name: @
Value: [הערך ש-Resend נותן]

Type: MX
Name: @
Value: feedback-smtp.resend.com
Priority: 10
```

### שלב 3: המתן לאימות
- אימות יכול לקחת 5-30 דקות
- תראה סטטוס "Verified" כשה-domain מאומת

### שלב 4: עדכן את Supabase
1. לך ל-Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. עדכן את `FROM_EMAIL` ל: `noreply@yourdomain.com` (החלף ב-domain שלך)
3. לחץ **Save**

---

## פתרון זמני (לבדיקות בלבד)

אם אין לך domain, תוכל להשתמש ב-domain של Resend לבדיקות:

1. לך ל-Resend Dashboard → **API Keys**
2. בדוק אם יש לך domain מאומת אחר
3. אם לא, הוסף domain חדש (כמו בשלבים למעלה)

---

## בדיקה
לאחר העדכון, נסה לשלוח מייל שוב. זה אמור לעבוד! ✅

