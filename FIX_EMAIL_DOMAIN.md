# 🔧 תיקון בעיית Domain ב-Resend

## הבעיה
```
"The onboarding.resend.dev domain is not verified"
```

## פתרון מהיר

### שלב 1: בדוק אם יש לך domain מאומת ב-Resend
1. לך ל-[Resend Dashboard → Domains](https://resend.com/domains)
2. בדוק אם יש domain עם סטטוס "Verified" ✅

### שלב 2א: אם יש domain מאומת
1. לך ל-Supabase Dashboard → **Project Settings** → **Edge Functions** → **Secrets**
2. עדכן את `FROM_EMAIL` ל: `noreply@yourdomain.com` (החלף ב-domain שלך)
3. לחץ **Save**
4. נסה לשלוח מייל שוב

### שלב 2ב: אם אין domain מאומת
1. לך ל-[Resend Dashboard → Domains](https://resend.com/domains)
2. לחץ **"Add Domain"**
3. הזן את ה-domain שלך (למשל: `kupat-tov-vachesed.co.il`)
4. הוסף את ה-DNS records שהמערכת מבקשת:
   - **TXT Record** (ל-verification)
   - **MX Record** (ל-email receiving)
5. המתן לאימות (5-30 דקות)
6. אחרי שהאימות הצליח, עדכן את `FROM_EMAIL` ב-Supabase (כמו בשלב 2א)

## בדיקה
לאחר העדכון, נסה לשלוח מייל שוב. זה אמור לעבוד! ✅

---

## הערה
אם אין לך domain, תוכל לרכוש אחד מ:
- [Namecheap](https://www.namecheap.com/)
- [Google Domains](https://domains.google/)
- [Cloudflare](https://www.cloudflare.com/products/registrar/)

או להשתמש ב-domain קיים אם יש לך.

