# מדריך התקנה מלא - Chatroom Application

## תוכן עניינים
1. [דרישות מערכת](#דרישות-מערכת)
2. [התקנת Node.js ו-npm](#התקנת-nodejs-ו-npm)
3. [התקנת Docker](#התקנת-docker)
4. [התקנת תלויות הפרויקט](#התקנת-תלויות-הפרויקט)
5. [הגדרת מסד הנתונים](#הגדרת-מסד-הנתונים)
6. [הפעלת הפרויקט](#הפעלת-הפרויקט)
7. [בדיקות](#בדיקות)
8. [פתרון בעיות](#פתרון-בעיות)

---

## דרישות מערכת

### תוכנות נדרשות:
- **Node.js** (גרסה 14 או יותר) - https://nodejs.org/
- **npm** (מגיע עם Node.js)
- **Docker Desktop** (עבור מסד הנתונים) - https://www.docker.com/products/docker-desktop
- **Git** (אם צריך להוריד מה-repository) - https://git-scm.com/

### מערכות הפעלה נתמכות:
- Windows 10/11
- macOS
- Linux

---

## התקנת Node.js ו-npm

### Windows:
1. הורד את Node.js מ-https://nodejs.org/
2. התקן את ה-installer (בחר "Add to PATH")
3. פתח Command Prompt או PowerShell
4. בדוק התקנה:
   ```bash
   node --version
   npm --version
   ```
   צריך לראות גרסאות (למשל: v18.17.0, 9.6.7)

### macOS:
```bash
# דרך Homebrew (מומלץ)
brew install node

# או הורד מה-website
# https://nodejs.org/
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install nodejs npm
```

---

## התקנת Docker

### Windows:
1. הורד Docker Desktop מ-https://www.docker.com/products/docker-desktop
2. התקן ופתח את Docker Desktop
3. ודא ש-Docker רץ (איקון Docker ב-system tray)

### macOS:
1. הורד Docker Desktop מ-https://www.docker.com/products/docker-desktop
2. התקן ופתח את Docker Desktop

### Linux (Ubuntu/Debian):
```bash
# הסרת גרסאות ישנות
sudo apt-get remove docker docker-engine docker.io containerd runc

# התקנה
sudo apt-get update
sudo apt-get install docker.io docker-compose

# הוספת המשתמש לקבוצת docker
sudo usermod -aG docker $USER
# יציאה והתחברות מחדש נדרשת!
```

### בדיקת התקנה:
```bash
docker --version
docker-compose --version
```

---

## התקנת תלויות הפרויקט

### 1. נווט לתיקיית הפרויקט:
```bash
cd c:\Users\mayan\PycharmProjects\ex5-express-yair-maayan
# או הנתיב שלך
```

### 2. התקן את כל התלויות:
```bash
npm install
```

פקודה זו תתקין את כל החבילות הרשומות ב-`package.json`:
- **express** - Framework ל-web server
- **express-session** - ניהול sessions
- **cookie-parser** - עבודה עם cookies
- **sequelize** - ORM למסד נתונים
- **mysql2** - Driver למסד נתונים MySQL/MariaDB
- **bcrypt** - הצפנת סיסמאות
- **morgan** - Logging של בקשות
- **pug** - Template engine (לא בשימוש כרגע, יש SPA)
- ועוד...

### 3. ודא שהתקנה הצליחה:
```bash
# בדוק שה-node_modules נוצר
ls node_modules  # Linux/macOS
dir node_modules # Windows

# או:
npm list --depth=0
```

---

## הגדרת מסד הנתונים

### 1. נווט לתיקיית Docker:
```bash
cd mydatabase-docker
```

### 2. הפעל את מסד הנתונים:
```bash
docker-compose up -d
```

פקודה זו:
- תוריד את תמונות MariaDB ו-phpMyAdmin
- תיצור containers
- תפעיל את מסד הנתונים בפורט 3306
- תפעיל את phpMyAdmin בפורט 8080

### 3. בדוק שהכל רץ:
```bash
docker ps
```

צריך לראות 2 containers:
- `mariadb-server` (port 3306)
- `phpmyadmin-interface` (port 8080)

### 4. (אופציונלי) פתח phpMyAdmin:
פתח דפדפן ולך ל: http://localhost:8080

**Login:**
- Server: `mariadb`
- Username: `root`
- Password: `password`

---

## הפעלת הפרויקט

### 1. ודא שמסד הנתונים רץ:
```bash
docker ps
# אם לא רץ:
cd mydatabase-docker
docker-compose up -d
```

### 2. חזור לתיקיית הפרויקט הראשית:
```bash
cd ..
# או:
cd c:\Users\mayan\PycharmProjects\ex5-express-yair-maayan
```

### 3. הפעל את השרת:
```bash
npm start
```

או אם יש בעיות:
```bash
node ./bin/www
```

### 4. פתח דפדפן:
לך ל: **http://localhost:3000**

---

## בדיקות

### בדיקה 1: דף בית
- לך ל: http://localhost:3000
- צריך לראות דף login

### בדיקה 2: רישום משתמש חדש
1. לחץ "Register here"
2. מלא:
   - Email: `test@test.com`
   - First Name: `John`
   - Last Name: `Doe`
3. לחץ "Continue to Step 2"
4. הזן סיסמה (פעמיים)
5. לחץ "Complete Registration"
6. אמור להעביר ל-dף login עם הודעה

### בדיקה 3: התחברות
1. בדף login, הזן:
   - Email: `test@test.com`
   - Password: הסיסמה שהזנת
2. לחץ "Login"
3. אמור להעביר ל-chatroom

### בדיקה 4: הצ'אט
1. בדף chatroom, שלח הודעה
2. בדוק שההודעה מופיעה
3. נסה לערוך הודעה שלך (Edit)
4. נסה למחוק הודעה שלך (Delete)
5. נסה לחפש (Search)

---

## פתרון בעיות

### בעיה: `npm install` נכשל
**פתרון:**
```bash
# נקה cache
npm cache clean --force

# מחק node_modules ו-package-lock.json
rm -rf node_modules package-lock.json  # Linux/macOS
rmdir /s node_modules && del package-lock.json  # Windows

# התקן מחדש
npm install
```

### בעיה: Docker לא רץ
**פתרון:**
- ודא ש-Docker Desktop פתוח ורץ
- בדוק: `docker ps`
- אם לא רץ, פתח Docker Desktop ידנית

### בעיה: Port 3000 כבר בשימוש
**פתרון:**
```bash
# Windows - מצא תהליך
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS - מצא תהליך
lsof -ti:3000
kill -9 <PID>

# או שנה פורט ב-app.js או ב-.env
```

### בעיה: מסד נתונים לא מתחבר
**פתרון:**
1. בדוק ש-MariaDB רץ: `docker ps`
2. בדוק הגדרות ב-`config/database.js`:
   - host: `localhost`
   - port: `3306`
   - database: `mydb`
   - username: `root`
   - password: `password`
3. נסה להתחבר דרך phpMyAdmin: http://localhost:8080

### בעיה: Session לא עובד
**פתרון:**
- ודא ש-`express-session` מותקן: `npm list express-session`
- אם לא, התקן: `npm install express-session`
- ודא שהחבילה נוספה ל-`package.json`

### בעיה: שגיאות Sequelize
**פתרון:**
```bash
# ודא ש-Sequelize מותקן
npm list sequelize

# אם לא, התקן:
npm install sequelize mysql2

# ודא שמסד הנתונים רץ
docker ps
```

---

## סיכום - צעדים מהירים

```bash
# 1. התקן Node.js (אם לא מותקן)
# הורד מ-https://nodejs.org/

# 2. התקן Docker (אם לא מותקן)
# הורד מ-https://www.docker.com/products/docker-desktop

# 3. פתח Docker Desktop

# 4. נווט לפרויקט
cd c:\Users\mayan\PycharmProjects\ex5-express-yair-maayan

# 5. התקן תלויות
npm install

# 6. הפעל מסד נתונים
cd mydatabase-docker
docker-compose up -d
cd ..

# 7. הפעל שרת
npm start

# 8. פתח דפדפן
# http://localhost:3000
```

---

## רשימת תלויות מלאה

### Dependencies (מחבילות חיצוניות):
- `bcrypt` - הצפנת סיסמאות
- `cookie-parser` - עבודה עם cookies
- `debug` - Debug logging
- `express` - Web framework
- `express-session` - Session management
- `http-errors` - יצירת שגיאות HTTP
- `morgan` - HTTP request logger
- `mysql2` - MySQL/MariaDB driver
- `pug` - Template engine (לא בשימוש)
- `sequelize` - ORM למסד נתונים

### כל אלה מותקנים אוטומטית עם `npm install`

---

## הגדרות חשובות

### מסד נתונים (config/database.js):
```javascript
database: 'mydb'
username: 'root'
password: 'password'
host: 'localhost'
port: 3306
```

### פורט שרת (bin/www):
```javascript
PORT: 3000 (ברירת מחדל)
```

### Session (app.js):
```javascript
maxAge: 24 * 60 * 60 * 1000  // 24 שעות
```

### Polling (chatroom.js):
```javascript
POLLING_INTERVAL: 10000  // 10 שניות
```

---

## הערות נוספות

1. **לא לשכוח**: תמיד להפעיל Docker לפני הפעלת השרת!
2. **Ports בשימוש**:
   - 3000 - Express Server
   - 3306 - MariaDB
   - 8080 - phpMyAdmin
3. **קובצי חשובים**:
   - `package.json` - רשימת תלויות
   - `config/database.js` - הגדרות מסד נתונים
   - `app.js` - קובץ ראשי של Express

---

**בהצלחה! 🚀**



