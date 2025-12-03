# 📧 הגדרת שליחת מיילים - הוראות

## ✅ API Key שלך:
```
re_TrGbqUH2_2qqjw2SF5demSJQWVthH1KkQ
```

## שלב 1: הוסף Secrets ב-Supabase

1. **לך ל:** [Supabase Dashboard → Edge Functions → Secrets](https://supabase.com/dashboard/project/odmxtufodaljukdhxggs/settings/functions)

2. **הוסף 2 Secrets:**

   **Secret 1:**
   - Name: `RESEND_API_KEY`
   - Value: `re_TrGbqUH2_2qqjw2SF5demSJQWVthH1KkQ`

   **Secret 2:**
   - Name: `FROM_EMAIL`
   - Value: `noreply@onboarding.resend.dev`

3. **לחץ Save**

---

## שלב 2: Deploy Edge Function

פתח Terminal והרץ:

```bash
# אם עדיין לא התקנת Supabase CLI
npm install -g supabase

# התחבר (יפתח דפדפן)
supabase login

# Link לפרויקט
supabase link --project-ref odmxtufodaljukdhxggs

# Deploy את הפונקציה
supabase functions deploy send-email
```

---

## שלב 3: בדיקה

1. לך לאתר: https://kupat-tov-vachesed.vercel.app
2. לך לדף "בקשות תמיכה"
3. אשר בקשה → לחץ "שלח מייל"
4. בדוק את תיבת המייל!

---

## 🎯 מה זה עושה?

- ✅ שולח מייל אישור כשמאשרים בקשה
- ✅ תבנית יפה בעברית עם פרטי האישור
- ✅ נתונים דינמיים (שם, סכום, תאריך)
- ✅ RTL מובנה

---

## 💡 טיפים

- **Domain משלך:** אם תרצה, תוכל להוסיף domain משלך ב-Resend (יותר מקצועי)
- **לוגים:** תוכל לראות את כל המיילים שנשלחו ב-Resend Dashboard
- **חינם:** 3,000 מיילים בחודש - מספיק בהחלט!

---

**אחרי שתעשה את זה - הכל יעבוד!** 🚀

