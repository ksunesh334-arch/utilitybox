# UtilityBox — GitHub Pages par upload kaise karein

## Files
- `index.html` — main page
- `style.css` — styling
- `app.js` — saara tool logic
- `robots.txt` — search engines ko crawl permission deta hai
- `sitemap.xml` — Google ko site structure batata hai

## Steps (GitHub Pages)

1. **GitHub par naya repository banayein**
   - github.com par jaake "New repository" click karein
   - Naam dein (e.g. `utilitybox`) → Create

2. **Files upload karein**
   - Repository page par "Add file" → "Upload files" click karein
   - `index.html`, `style.css`, `app.js`, `robots.txt`, `sitemap.xml` — saari files drag-drop karein
   - Neeche "Commit changes" click karein

3. **GitHub Pages enable karein**
   - Repository ke "Settings" tab mein jaayein
   - Left sidebar mein "Pages" click karein
   - "Source" ke neeche: Branch = `main`, folder = `/ (root)` select karein → Save

4. **Wait 1-2 minutes**
   - Aapki site live ho jaayegi: `https://<aapka-username>.github.io/<repo-naam>/`

## Important notes

- **Background Remover** tool first use par ek AI model (~80MB) download karega — isliye pehli baar load thoda slow hoga, par baad mein browser cache kar leta hai.
- Saare tools **client-side** chalte hain — koi bhi file ya data server par upload nahi hota, sab user ke browser mein hi process hota hai. Isliye GitHub Pages (jo free static hosting hai) ke liye perfect hai.
- Notes editor browser ke `localStorage` mein save hota hai — agar user browser/device change kare to notes wahan nahi milenge.

## Tools included
1. Unit Converter (length, weight, temperature)
2. Currency Converter (live exchange rates)
3. Calculator (basic + scientific: sin, cos, tan, √, ^)
4. EMI / Loan Calculator
5. BMI Calculator
6. Age Calculator
7. Notes Editor (auto-save + download as .txt)
8. Word & Character Counter
9. QR Code Generator
10. Password Generator
11. Image Resize / Compress / Convert (JPG/PNG/WebP)
12. Background Remover (AI-based, runs fully in-browser)
13. PDF Merge / Split
14. PDF to Word (text extraction)

## AdSense setup (paisa kamaane ke liye)

Site mein AdSense ka placeholder code already daal diya gaya hai — 3 jagah `ca-pub-XXXXXXXXXXXXXXXX` likha hai `index.html` mein. Jab aapka AdSense account approve ho jaye:

1. AdSense dashboard se apna **Publisher ID** copy karein (jaise `ca-pub-1234567890123456`)
2. `index.html` file kholen, **Ctrl+F / Cmd+F** se `ca-pub-XXXXXXXXXXXXXXXX` search karein
3. Sabhi 3 occurrences ko apne real Publisher ID se replace karein
4. Optional: AdSense dashboard mein "Ad units" bana ke `data-ad-slot="0000000000"` ko bhi real slot ID se replace karein (har ad ke liye alag)
5. File save karke GitHub par re-upload karein (overwrite)

**AdSense approval ke liye:**
- Site GitHub Pages par live honi chahiye
- adsense.google.com par jaake apni site ka URL submit karein
- Review mein 1-4 weeks lag sakte hain
- Tab tak ye placeholder code koi error nahi dega, ads simply nahi dikhenge

## SEO setup (Google search mein aane ke liye)

Site mein SEO files already daal di gayi hain: `robots.txt`, `sitemap.xml`, aur meta tags (`index.html` ke andar). Inme ek placeholder URL hai jo replace karna hoga.

### Step 1: Apna asli GitHub Pages URL nikalein
Jab site live ho jaaye, URL kuch aisa hoga: `https://username.github.io/utilitybox/`

### Step 2: URL replace karein (5 jagah)
`https://YOUR-USERNAME.github.io/YOUR-REPO/` ko apne asli URL se replace karein:
- `index.html` — `canonical` aur `og:url` lines mein (3 occurrences)
- `robots.txt` — Sitemap line mein (1 occurrence)
- `sitemap.xml` — `<loc>` tag ke andar (1 occurrence)

### Step 3: Google Search Console mein submit karein
Ye sabse important step hai — bina iske Google site ko jaan hi nahi payega.
1. [search.google.com/search-console](https://search.google.com/search-console) par jaayein, Gmail se login karein
2. "Add property" → URL-prefix option → apna GitHub Pages URL daalein
3. Verification ke liye "HTML tag" method choose karein — milne wala meta tag `index.html` ke `<head>` mein paste karein, GitHub par re-upload karein
4. Verify hone ke baad, left sidebar mein "Sitemaps" → `sitemap.xml` submit karein
5. Indexing mein **few days se 2 weeks** lag sakte hain

### Step 4: Bing Webmaster Tools (optional)
[bing.com/webmasters](https://www.bing.com/webmasters) par bhi wahi sitemap submit kar sakte hain — kam competition, kuch extra traffic.

### Reality check
- Naye site ko rank karne mein **2-6 months** lag sakte hain, perfect setup ke baad bhi
- Asli traffic content/backlinks se badhta hai (jaise future mein "BMI kaise calculate karein" jaisi guide add karna)
- `github.io` domain Google ke liye thoda kam-trusted hota hai apne custom domain (₹600-1000/year) ke comparison mein


Agar aap pehle apne computer par test karna chahein:
```
python3 -m http.server 8000
```
Phir browser mein `http://localhost:8000` kholen.
