# Persian Studio v3 — Implementation Plan

این فایل منبع حقیقت برای تب بعدی Cursor است. فقط همین را پیاده کن. قابلیت اشتراک نساز. UI پرداخت نساز. ستون پلن به شیت اضافه نکن.

نسخهٔ افزونه را به `3.0.0` ببر (`package.json` و `public/manifest.json`).

---

## 1. هدف این بیلد

سه قابلیت جدید روی معماری فعلی:

1. **خواندن متن** — انتخاب متن در هر صفحه، ترجمه به فارسی اگر لازم بود، پخش با همان TTS فعلی.
2. **خلاصهٔ فارسی** — خلاصهٔ صفحه یا ویدیو (از کپشن) به فارسی.
3. **رونوشت و SRT** — دانلود `.srt` / `.vtt` / `.txt` از کیوهای فارسی‌شده.

به‌علاوهٔ دو تغییر پوسته و هویت که بدون آن‌ها محصول به‌هم می‌ریزد:

- کاربر اول **تب/کار** را انتخاب می‌کند؛ فقط workspace آن تب عوض می‌شود.
- هدر در همهٔ تب‌ها ثابت است: **راهنما، کلید API، تنظیمات**.
- هویت کاربر **ایمیل یا موبایل یا گوگل** است، نه IP. ستون `IP` شیت با `Account` جایگزین می‌شود.

---

## 2. خارج از محدوده (عمداً نساز)

- خرید اشتراک، درگاه پرداخت، محدودیت سهمیهٔ پولی، بنر «ارتقا».
- تولید تصویر/ویدیو، چت آزاد شبیه ChatGPT، دانلود فایل ویدیوی یوتیوب.
- بازنویسی اداری، ترجمهٔ تصویر، دیکته با میکروفن (موج بعدی).
- گسترش نتفلیکس/DRM.
- توضیح یا طراحی محصول اشتراک در UI.

فقط این قلاب معماری را بگذار و رد شو:

```ts
// src/lib/entitlements.ts
export type PlanId = "free"

export function getPlan(): PlanId {
  return "free"
}

export function canUseFeature(_feature: FeatureId): boolean {
  return true
}
```

هویت حساب (`Account`) همان کلیدی است که بعداً اشتراک به آن وصل می‌شود. در این بیلد `canUseFeature` همیشه `true` است و هیچ جا UI قفل نشان نده.

---

## 3. معماری فعلی (دست نزن مگر پلن بگوید)

| لایه | الان چه می‌کند |
|---|---|
| استودیو Next static (`src/app/page.tsx` → `PersianStudio`) | سه تب: `tts` / `subtitles` / `dubbing` |
| `StudioHeader` | راهنما، کلید API، زبان، تم |
| `SpeechStudio` + `src/lib/speak.ts` | TTS داخل استودیو، تاریخچه |
| `VideoToolsPanel` | راهنمای زیرنویس/دوبله + صدا/ولوم |
| `public/content/player.js` | پنل شناور روی یوتیوب/آپارات/ویمئو/توییچ/نتفلیکس |
| `public/background.js` | `translate-cues`, `speak-text`, `transcribe-translate`, tabCapture, لاگ شیت با IP |
| `public/lib/gemini.js` | `translateCues`, `synthesizeSpeechWav`, `transcribeTranslateAudio` |
| `public/offscreen.js` | ضبط صدای تب |
| `sheets/Code.gs` | upsert بر اساس API Key؛ ستون اول IP |
| `src/lib/api-log.ts` + `logApiKey` | یک‌بار در روز، `fetchIp()` از ipify |

الگوی ذخیره: `chrome.storage.local` با کلیدهای `persian-studio.*` از `src/lib/storage.ts`. همان را برای حساب و تب فعال ادامه بده.

Gemini از دستگاه کاربر با کلید خودش صدا زده می‌شود. این را عوض نکن. بک‌اند ما فقط Apps Script + شیت است.

---

## 4. پوستهٔ استودیو (frontend shell)

### 4.1 هدر ثابت

در همهٔ تب‌ها و حتی روی صفحهٔ ورود، این سه دکمه در **چپ** (در RTL سمت شروع) بمانند:

1. راهنما → `/guide/`
2. کلید API → همان دیالوگ فعلی (`persistApiKey`)
3. تنظیمات → دیالوگ جدید `SettingsDialog`

عنوان «Persian Studio» وسط بماند.

از هدر **حذف شود:** سلکت زبان و دکمهٔ خورشید/ماه. هر دو بروند داخل تنظیمات.

دکمهٔ API قبل از ورود حساب غیرفعال باشد؛ بعد از ورود مثل امروز کار کند.

### 4.2 تنظیمات

`SettingsDialog` با سه بخش:

1. **ظاهر:** زبان (`fa`/`en`)، تم (`dark`/`light`) — همان کلیدهای فعلی `persian-studio.locale` و `persian-studio.theme`.
2. **حساب:** نوع ورود، شناسه (ایمیل یا موبایل)، دکمهٔ خروج.
3. **حریم خصوصی:** لینک `/privacy/`.

خروج حساب: `persian-studio.account` پاک شود. کلید Gemini را پاک نکن مگر کاربر جداگانه در دیالوگ API پاک کند.

### 4.3 تب‌ها — اول انتخاب کار

`FeatureId`:

```ts
export type FeatureId =
  | "tts"
  | "read"
  | "subtitles"
  | "dubbing"
  | "summary"
  | "export"
```

شش تب در یک ردیف با wrap؛ تب فعال با استایل فعلی `FeatureTabs`.

| id | برچسب فارسی | workspace |
|---|---|---|
| `tts` | متن به گفتار | `SpeechStudio` فعلی بدون تغییر رفتار |
| `read` | خواندن متن | `ReadAloudPanel` جدید |
| `subtitles` | زیرنویس | `VideoToolsPanel mode="subtitles"` |
| `dubbing` | دوبله | `VideoToolsPanel mode="dubbing"` |
| `summary` | خلاصه | `SummaryPanel` جدید |
| `export` | رونوشت و SRT | `ExportPanel` جدید |

تب فعال در `persian-studio.active-tab` ذخیره شود. پیش‌فرض `tts`.

`PersianStudio` فقط شِل است: هدر + اینترو همان تب + `FeatureTabs` + workspace. اینترو را از i18n همان تب بگیر.

اگر `!account.verified`، به‌جای workspace همان `AuthScreen` را نشان بده. تب‌ها دیده شوند ولی غیرفعال/صرفاً نمایشی نباشند — ساده‌تر: تب‌ها دیده شوند اما کلیک فقط بعد از ورود workspace را عوض کند؛ قبل از ورود فقط AuthScreen.

ترجیح پیاده‌سازی: **ورود اجباری قبل از workspace.** هدر (راهنما + تنظیمات) کار کند. کلید API تا ورود قفل.

### 4.4 i18n

همهٔ رشته‌های جدید را در `src/lib/i18n.tsx` برای `fa` و `en` اضافه کن. کلیدهای هدر:

- `header.settings` = تنظیمات / Settings
- تب‌های جدید: `tab.read`, `tab.summary`, `tab.export`
- اینتروی هر تب
- رشته‌های ورود، OTP، خطاها، پنل‌های جدید، منوی راست‌کلیک

`app.tagline` را به‌روز کن تا شش کار را پوشش دهد، نه سه تا.

---

## 5. هویت به‌جای IP

### 5.1 مدل محلی

کلید: `persian-studio.account`  
مقدار JSON رشته‌ای:

```ts
type AccountRecord = {
  type: "email" | "phone" | "google"
  identity: string // ایمیل lowercase یا موبایل E.164 (+98...) یا ایمیل گوگل
  verifiedAt: string // ISO
}
```

ماژول: `src/lib/account-store.ts` شبیه `api-key-store.ts` (subscribe / snapshot / persist / clear / `requestOpenAuth`).

نرمال‌سازی:

- ایمیل: `trim.toLowerCase()`، باید `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` باشد.
- موبایل ایران: ارقام فارسی را به انگلیسی تبدیل کن. قبول: `09xxxxxxxxx` یا `+989xxxxxxxxx` یا `989xxxxxxxxx`. ذخیرهٔ نهایی همیشه `+989xxxxxxxxx`.
- گوگل: ایمیل verified از tokeninfo.

بدون حساب verified هیچ `log-api-key` / usage به شیت فرستاده نشود.

### 5.2 صفحهٔ ورود `AuthScreen`

سه روش در یک کارت، نه سه route:

1. **ایمیل** — فیلد ایمیل → «ارسال کد» → کد ۶ رقمی → «تأیید».
2. **موبایل** — فیلد موبایل ایرانی → همان جریان OTP.
3. **گوگل** — یک دکمه. اگر `GOOGLE_OAUTH_CLIENT_ID` خالی بود دکمه را نشان نده.

بعد از verify، `persistAccount` و بستن گیت.

### 5.3 پروتکل Apps Script (همان webhook فعلی)

`doPost` از روی `action` شاخه شود. اگر `action` نبود، رفتار usage را بفهم (سازگاری: بدنهٔ قدیمی فقط `apiKey` داشت؛ دیگر IP نفرست).

#### `request-otp`

```json
{ "token": "...", "action": "request-otp", "channel": "email"|"phone", "identity": "..." }
```

- هویت را نرمال کن؛ نامعتبر → `{ ok: false }`.
- ریت‌لیمیت جدا از usage: حداکثر ۵ OTP برای هر identity در ۱۵ دقیقه (CacheService).
- کد ۶ رقمی تصادفی، ۵ دقیقه در CacheService با کلید `otp_<channel>_<identity>`. مقدار را هش نکن اگر ساده می‌ماند؛ حداقل خام در شیت **نوشته نشود**.
- `email`: `GmailApp.sendEmail` از حساب صاحب اسکریپت. موضوع و متن دوزبانه کوتاه. فقط کد و نام «Persian Studio».
- `phone`: اگر `PropertiesService.getScriptProperties().getProperty("SMS_WEBHOOK_URL")` بود، `UrlFetchApp` با JSON `{ identity, code }` (یا فرمت همان سرویس). اگر نبود → `{ ok: false, error: "sms_unavailable" }`. افزونه پیام بدهد: «ارسال پیامک هنوز فعال نیست؛ با ایمیل یا گوگل وارد شوید.» UI موبایل را حذف نکن.
- پاسخ همیشه `{ ok: true }` بعد از ارسال موفق. کد را برنگردان.

#### `verify-otp`

```json
{ "token": "...", "action": "verify-otp", "channel": "email"|"phone", "identity": "...", "code": "123456" }
```

کد را با کش مقایسه کن. موفق: کش را پاک کن، `{ ok: true, account: { type, identity } }`. ناموفق: `{ ok: false }`.

#### `verify-google`

```json
{ "token": "...", "action": "verify-google", "accessToken": "..." }
```

`UrlFetchApp` به `https://www.googleapis.com/oauth2/v2/userinfo` با Bearer. ایمیل و `verified_email` لازم است. `{ ok: true, account: { type: "google", identity: email } }`.

جایگزین معادل: `id_token` + `https://oauth2.googleapis.com/tokeninfo?id_token=`. یکی را کامل پیاده کن.

#### `usage` (جایگزین لاگ فعلی)

```json
{
  "token": "...",
  "action": "usage",
  "apiKey": "AIza...",
  "account": "+98912... یا email",
  "accountType": "email"|"phone"|"google",
  "date": "YYYY-MM-DD",
  "time": "HH:mm:ss"
}
```

- `account` خالی → `{ ok: false }` (دیگر با IP کار نکن).
- `apiKey` همچنان با `isGeminiKey` چک شود.
- upsert بر اساس **ستون Account** نه IP.

توکن شیت همان `TOKEN` داخل `Code.gs` است. `SHEETS_LOG_TOKEN` در بیلد داخل `background.js` تزریق می‌شود. این را عوض نکن.

### 5.4 شیت

`HEADERS` جدید:

```js
["Account", "API Key", "Date", "Time", "آخرین استفاده", "تعداد"]
```

`getSheet` / `ensureColumns`:

- اگر `existing[0] === "IP"` فقط هدر سلول A1 را به `Account` عوض کن. ردیف‌های قدیمی با IP باقی می‌مانند تا اولین usage با حساب، همان ردیف را پیدا و ستون A را بازنویسی کند.
- اگر هدر از قبل `Account` است، دست نزن.

جستجو:

1. `findRowByAccount(sheet, account)` روی ستون ۱.
2. اگر نبود `findRowByApiKey` روی ستون ۲ (سازگاری کلید تکراری).
3. اگر از روی API Key پیدا شد، ستون Account را بنویس.
4. اگر هیچ‌کدام نبود `appendRow`.

شمارنده و «آخرین استفاده» مثل امروز.

بعد از تغییر اسکریپت باید **New deployment** وب‌اپ زده شود. در README همین را بنویس.

### 5.5 `background.js` لاگ

- `fetchIp` و ipify را **حذف** کن.
- از `host_permissions` این دو را بردار: `https://api.ipify.org/*`, `https://api64.ipify.org/*`.
- `logApiKey(apiKey)` حساب را از `chrome.storage.local` بخوان (`persian-studio.account`). اگر نبود return false.
- بدنه: `action: "usage", apiKey, account, accountType, date, time`.
- یک‌بار در روز به ازای `(apiKey + account)` مثل امروز.

پیام‌های جدید:

| type | کار |
|---|---|
| `request-otp` | پروکسی به webhook |
| `verify-otp` | پروکسی به webhook |
| `verify-google` | پروکسی به webhook |
| `read-selection` | ترجمه در صورت نیاز + TTS + پخش در تب |
| `summarize-tab` | استخراج متن تب + خلاصه |
| `summarize-text` | خلاصهٔ متن فرستاده‌شده |
| `export-cues` | ساخت فایل از کیوها (می‌تواند خالص در content باشد) |
| `get-last-web-tab` | id آخرین تب http(s) غیر از صفحهٔ افزونه |

استودیو OTP را مستقیم به گوگل اسکریپت نزند (CORS). همیشه از طریق service worker.

### 5.6 ورود گوگل در افزونه

از `chrome.identity.launchWebAuthFlow` استفاده کن، نه GIS داخل صفحه (CSP روی `chrome-extension://` معمولاً می‌شکند).

مجوزها: `"identity"`.

در `manifest.json`:

```json
"oauth2": {
  "client_id": "__GOOGLE_OAUTH_CLIENT_ID__",
  "scopes": ["openid", "email", "profile"]
}
```

`scripts/build-extension.mjs` مثل webhook این placeholder را از `.env.local` فیلد `GOOGLE_OAUTH_CLIENT_ID` جایگزین کند.

Redirect: `https://<EXTENSION_ID>.chromiumapp.org/`

اگر کلاینت خالی یا هنوز `__GOOGLE...` بود، دکمهٔ گوگل مخفی.

`.env.example`:

```
SHEETS_WEBHOOK_URL=
SHEETS_LOG_TOKEN=
GOOGLE_OAUTH_CLIENT_ID=
```

README: ساخت OAuth Client از نوع Chrome Extension در Google Cloud، زدن Extension ID بعد از pack.

### 5.7 حریم خصوصی

`PRIVACY.md`، `src/views/privacy.tsx` / کلیدهای i18n، `store/listing.txt`:

- دیگر IP جمع نمی‌شود.
- با ورود، شناسهٔ حساب (ایمیل یا موبایل یا ایمیل گوگل) + کلید API + تاریخ در شیت سازنده ذخیره می‌شود.
- OTP ایمیل از حساب Apps Script فرستاده می‌شود؛ کد در شیت ذخیره نمی‌شود.

---

## 6. Gemini — توابع جدید

فایل: `public/lib/gemini.js` (منبع حقیقت افزونه). اگر استودیو جداگانه خلاصه می‌سازد، یا همان را از background صدا بزن یا معادل TypeScript در `src/lib/gemini-text.ts` ننویس مگر لازم باشد — **ترجیح: همهٔ فراخوانی‌های Gemini تب‌های جدید از background + gemini.js** تا یک مسیر خطا/مدل/کلید داشته باشید.

`TEXT_MODELS` فعلی راreuse کن.

### `translateText({ apiKey, text, locale, signal })`

پرامپت: ترجمه به فارسی ایرانی طبیعی. اگر خودش فارسی ایرانی بود همان را برگردان. فقط متن ترجمه، بدون توضیح.

برای خواندن انتخاب: اگر متن عمدتاً عربی/فارسی است باز هم از مدل بخواه «اگر فارسی است عوض نکن». تشخیص دستی زبان لازم نیست.

سقف: همان `MAX_TEXT_CHARS` در `src/lib/voices.ts`. طولانی‌تر را قطع کن و در UI بگو بریده شد.

### `summarizeToPersian({ apiKey, text, title, url, length, locale, signal })`

- `length`: `short` | `medium` | `bullets`
- خروجی فقط فارسی. عنوان و URL را به‌عنوان زمینه بده نه برای نقل‌قول اجباری.
- متن ورودی را در caller به حدود ۱۲۰۰۰ نویسه قطع کن (اول `document` article/main، وگرنه `body.innerText`).
- مدل نباید ادعا کند ویدیو را دیده؛ برای ویدیو فقط رونوشت/کپشن می‌آید.

### توابع محلی (بدون API) در `public/lib/cues-export.js`

ورودی کیو: `{ startMs, endMs, text, source? }`

- `cuesToSrt(cues, { bilingual: boolean })`
- `cuesToVtt(cues, { bilingual: boolean })`
- `cuesToTranscript(cues, { bilingual: boolean })` — متن پشت‌سرهم با خط خالی بین کیوها

زمان SRT: `HH:MM:SS,mmm`. VTT با نقطه.

دانلود در content script با `Blob` + `<a download>`.

---

## 7. قابلیت ۱ — خواندن متن

### 7.1 تب استودیو `ReadAloudPanel`

- توضیح سه‌مرحله‌ای: کلید API → در هر سایت متن را انتخاب کنید → راست‌کلیک «با فارسی بخوان».
- انتخاب صدا (همان `VoiceTable` و کلید `persian-studio.dub-voice` یا کلید جدا `persian-studio.read-voice`؛ جدا بهتر است تا دوبله را خراب نکند).
- چک‌باکس «اگر فارسی نبود اول ترجمه کن» پیش‌فرض روشن. کلید: `persian-studio.read-translate` = `"1"`/`"0"`.
- جعبهٔ آزمایش: پیست متن + دکمهٔ «بخوان» برای تست داخل استودیو (از background `speak-text` یا مسیر TTS استودیو). تاریخچهٔ چت TTS را درگیر نکن.
- دکمهٔ «خواندن تب وب قبلی»: background `lastWebTabId` را هدف می‌گیرد، از آن تب `window.getSelection()` می‌گیرد؛ اگر خالی بود خطا: «در آن صفحه متنی انتخاب نشده.»

### 7.2 منوی راست‌کلیک

`contextMenus` در `background.js` روی `selection`:

- `persian-studio-read` — «با فارسی بخوان» / «Read in Persian»

روی کلیک: `info.selectionText` → در صورت نیاز `translateText` → `synthesizeSpeechWav` با صدای read → به content همان تب پیام `play-read-aloud` با `audioBase64`.

اگر content script در آن تب نبود: `chrome.scripting.executeScript` فایل `content/page.js` را تزریق کن بعد پیام بفرست.

### 7.3 `public/content/page.js` (جدید)

روی همهٔ `http(s)` به‌جز صفحات افزونه.

- overlay کوچک shadow DOM: وضعیت، توقف، خطا. استایل از `public/content/page.css`.
- پیام‌ها: `play-read-aloud`, `stop-read-aloud`, `show-summary`, `extract-page`.
- `extract-page`: `{ title, url, text }` برگردان.
- پخش با `new Audio(blobUrl)` مثل دوبله. با `stop` قطع شود.

`manifest.json`:

- `permissions` اضافه: `contextMenus`, `scripting`, `identity`, `activeTab`
- `content_scripts` دوم:

```json
{
  "matches": ["http://*/*", "https://*/*"],
  "js": ["content/page.js"],
  "run_at": "document_idle",
  "all_frames": false
}
```

`web_accessible_resources` برای `content/page.css` با همان matches.

`host_permissions` برای `http://*/*` و `https://*/*` لازم است تا از استودیو به تب وب تزریق/پیام شود. یوتیوب از قبل هست؛ این را صریح اضافه کن و در listing توجیه کن: خواندن انتخاب و خلاصهٔ صفحه.

`lastWebTabId`: در `chrome.tabs.onActivated` اگر URL تب `http/https` بود و origin آن `chrome-extension:` نبود، ذخیره کن.

### 7.4 محدودیت

بدون کلید API: پیام فعلی «اول کلید را در استودیو ذخیره کنید» و در صورت امکان استودیو را باز کن (`chrome.tabs.create` index.html) + ایونت باز کردن دیالوگ API اگر همان تب استودیو باز است.

---

## 8. قابلیت ۲ — خلاصهٔ فارسی

### 8.1 تب `SummaryPanel`

سه منبع، کاربر یکی را انتخاب می‌کند:

1. **صفحهٔ وب قبلی** — extract از `lastWebTabId`.
2. **ویدیوی همین تب وب** — از content ویدیو بخواه کیو/کپشن بدهد (پیام به `player.js` اگر هست: `get-cues-or-captions`). اگر `state.cues` پر بود از متن فارسی کیوها استفاده کن. اگر خالی بود همان مسیر `fetchYoutubeCues` / `html5Cues` بدون ترجمهٔ کامل همهٔ کیوها: متن مبدأ را به هم بچسبان و خلاصه کن (ارزان‌تر از ترجمهٔ خط‌به‌خط).
3. **متن چسبانده‌شده** — textarea داخل استودیو.

طول خلاصه: سه دکمه `short` / `medium` / `bullets`.

خروجی: کارت متن فارسی، کپی، دکمهٔ «با صدا بخوان» (همان موتور read/TTS).

### 8.2 راست‌کلیک

منوی دوم روی `page` و `selection`:

- `persian-studio-summarize-selection` — «خلاصهٔ فارسی انتخاب»
- `persian-studio-summarize-page` — «خلاصهٔ فارسی صفحه»

نتیجه را در overlay `page.js` نشان بده (عنوان، متن، کپی). استودیو را اجباری باز نکن.

### 8.3 ویدیو

در `player.js` دکمهٔ سوم لازم نیست اگر از استودیو/منو کافی است؛ ولی یک دکمهٔ «خلاصه فارسی» در پنل شناور کنار زیرنویس/دوبله تجربه را یکدست می‌کند. **اضافه کن.** خلاصه را در همان `ps-panel` زیر وضعیت نشان بده + کپی. اگر کیو نبود و live بود: خطا «اول زیرنویس بسازید یا ویدیو کپشن داشته باشد.» زنده از tabCapture برای خلاصهٔ کل ویدیو استفاده **نکن** (گران و ناقص).

---

## 9. قابلیت ۳ — رونوشت و SRT

### 9.1 پنل شناور `player.js`

بعد از اینکه `state.cues.length > 0` (زیرنویس یا دوبله، حتی live تکه‌تکه):

دکمه‌های outline:

- دانلود SRT
- دانلود VTT
- کپی رونوشت

اگر bilingual در تنظیمات روشن است، SRT دوخطی: فارسی سپس `source`.

نام فایل: `persian-studio-<videoId یا hostname>-<date>.srt`

برای یوتیوب از `v=` یا `/shorts/` در URL.

`stopAll` کیوها را پاک می‌کند؛ تا قبل از stop دکمه‌ها زنده بمانند. اگر live است، export همان کیوهای تا آن لحظه است.

### 9.2 تب استودیو `ExportPanel`

- توضیح: اول روی ویدیو زیرنویس/دوبله بساز، بعد از همین پنل شناور دانلود کن.
- تنظیم: فرمت پیش‌فرض SRT/VTT/TXT، bilingual (همان کلید فعلی).
- اگر `persian-studio.last-export` موجود بود (background وقتی content دانلود می‌کند متادیتا ذخیره کند: عنوان، زمان، تعداد کیو) همان را نشان بده. ذخیرهٔ خود فایل اجباری نیست.

آخرین کیوها را می‌توان در `chrome.storage.local` با کلید `persian-studio.last-cues` گذاشت (JSON، سقف مثلاً ۲۰۰۰ کیو) تا از استودیو هم «دانلود مجدد» ممکن باشد. اگر حجم نگران‌کننده است فقط متادیتا؛ دانلود اصلی از پنل ویدیو.

**ترجیح این پلن:** `last-cues` را ذخیره کن تا تب Export واقعاً کار داشته باشد نه فقط راهنما.

پیام `cues-updated` از player به background → storage.

### 9.3 بدون API اضافه

ساخت SRT محلی است. usage شیت نزن مگر اینکه برای رسیدن به کیوها ترجمه شده باشد (همان لاگ translate-cues کافی است).

---

## 10. پیام‌ها و فایل‌ها

### فایل‌های جدید

| فایل | نقش |
|---|---|
| `src/lib/features.ts` | `FeatureId`, لیست تب‌ها |
| `src/lib/entitlements.ts` | قلاب اشتراک؛ همیشه allow |
| `src/lib/account-store.ts` | حساب محلی |
| `src/lib/phone.ts` | نرمال‌سازی موبایل ایران |
| `src/components/settings-dialog.tsx` | تنظیمات |
| `src/components/auth-screen.tsx` | ورود |
| `src/components/read-aloud-panel.tsx` | تب خواندن |
| `src/components/summary-panel.tsx` | تب خلاصه |
| `src/components/export-panel.tsx` | تب SRT |
| `src/app/guide/account/page.tsx` + `src/views/guide-account.tsx` | راهنمای ورود |
| `public/content/page.js` | overlay صفحه |
| `public/content/page.css` | استایل overlay |
| `public/lib/cues-export.js` | SRT/VTT/TXT |

### فایل‌های موجود که باید عوض شوند

- `src/components/persian-studio.tsx` — شِل + گیت ورود + ۶ تب
- `src/components/studio-header.tsx` — راهنما / API / تنظیمات؛ زبان و تم بیرون
- `src/components/video-tools-panel.tsx` — `FeatureTabs` شش‌تایی را به `features.ts` منتقل کن
- `src/lib/i18n.tsx`
- `src/lib/api-log.ts` — بدون IP؛ account لازم
- `src/lib/api-key-store.ts` — ذخیرهٔ کلید فقط بعد از حساب؛ `logSavedApiKey` حساب را هم بفرستد
- `public/background.js`
- `public/content/player.js` + `player.css` — خلاصه + export
- `public/lib/gemini.js` — `translateText`, `summarizeToPersian`
- `public/manifest.json`
- `sheets/Code.gs`
- `scripts/build-extension.mjs` — OAuth client id
- `src/chrome.d.ts` — `contextMenus`, `scripting`, `identity`, `tabs.onActivated`
- `src/views/guide-hub.tsx`, `guide-app.tsx`, `privacy.tsx`
- `PRIVACY.md`, `README.md`, `store/listing.txt`, `.env.example`
- `package.json` version

`SpeechStudio` را مگر برای i18n نشکاف.

### ترتیب پیاده‌سازی (همین را در تب build رعایت کن)

1. `features.ts` + `entitlements.ts` + شِل هدر/تنظیمات/شش تب با پنل‌های خالی راهنما.
2. هویت: `Code.gs` → background OTP/Google → `AuthScreen` → حذف IP/ipify → privacy/README شیت.
3. `gemini.js` توابع متنی + `cues-export.js`.
4. خواندن متن: context menu + `page.js` + `ReadAloudPanel`.
5. خلاصه: منو + پنل + دکمه در `player.js`.
6. SRT: دکمه‌های player + `last-cues` + `ExportPanel`.
7. راهنما، listing، i18n کامل، `chrome.d.ts`.
8. `npm run pack` و چک‌لیست پایین.

هر مرحله باید typecheck/build را بشکند یا درست pack شود؛ شِل را ناقص رها نکن.

---

## 11. Manifest (هدف نهایی)

`permissions`:

```
unlimitedStorage, storage, tabCapture, offscreen,
contextMenus, scripting, identity, activeTab
```

`host_permissions`:

```
https://generativelanguage.googleapis.com/*
https://script.google.com/*
https://script.googleusercontent.com/*
https://www.googleapis.com/*
https://oauth2.googleapis.com/*
https://accounts.google.com/*
http://*/*
https://*/*
```

ipify نباشد.

`content_scripts`: بلوک فعلی ویدیو + بلوک `page.js`.

توضیح `description` را با سه قابلیت جدید هم‌خوان کن.

---

## 12. معیار پذیرش

- باز کردن افزونه: بدون حساب فقط ورود دیده می‌شود؛ راهنما باز می‌شود.
- ورود ایمیل: کد به ایمیل صاحب اسکریپت می‌رسد (تست با ایمیل خودت). کد غلط رد می‌شود.
- موبایل بدون SMS_WEBHOOK: خطای مشخص، کرش نیست.
- گوگل: اگر client id نباشد دکمه نیست؛ اگر باشد جریان WebAuth کار می‌کند.
- ذخیرهٔ API بعد از ورود یک ردیف شیت با ستون Account می‌سازد/به‌روز می‌کند. ستون IP در هدر نیست. درخواست به ipify در Network نیست.
- شش تب؛ هدر در همه یکسان؛ زبان/تم فقط در تنظیمات.
- TTS / زیرنویس / دوبلهٔ قبلی هنوز کار می‌کنند.
- راست‌کلیک روی انتخاب در wikipedia انگلیسی: فارسی خوانده می‌شود و overlay توقف دارد.
- خلاصهٔ صفحه یک پاراگراف/گلولهٔ فارسی می‌دهد و کپی می‌شود.
- بعد از «زیرنویس فارسی» روی یوتیوب، SRT دانلود و در پلیر ویدیو باز می‌شود (زمان‌ها معقول).
- `canUseFeature` وجود دارد و هیچ UI اشتراک نیست.
- `npm run pack` فایل zip می‌سازد.

---

## 13. راهنمای استفادهٔ محصول (باید با UI یکی باشد)

پیاده‌ساز باید متن راهنمای داخل `/guide/app` و `/guide/account` را با بخش زیر هم‌معنی کند.

### ورود و تنظیمات ثابت

1. روی آیکن افزونه بزن تا استودیو باز شود.
2. با **ایمیل** (کد یک‌بارمصرف)، **موبایل** (اگر پیامک فعال باشد) یا **گوگل** وارد شو.
3. از هدر **کلید API** را از Google AI Studio بچسبان و ذخیره کن.
4. **تنظیمات:** زبان رابط، تم، وضعیت حساب، خروج.
5. **راهنما** از هدر همیشه در دسترس است.
6. بالای workspace تب کار را انتخاب کن؛ فقط همان بخش عوض می‌شود.

### متن به گفتار

مثل امروز: متن، صدا، سبک، تولید، پخش، دانلود، تاریخچه.

### خواندن متن

1. تب «خواندن متن» را باز کن و صدا را انتخاب کن.
2. در هر سایت متن را انتخاب کن.
3. راست‌کلیک → «با فارسی بخوان».
4. اگر متن فارسی نبود اول ترجمه می‌شود بعد خوانده می‌شود.
5. از overlay همان صفحه می‌توانی توقف کنی.
6. برای آزمایش، در خود تب استودیو متن پیست کن و «بخوان».

### زیرنویس و دوبله

مثل امروز روی پنل شناور ویدیو. بعد از نصب صفحه را یک‌بار تازه کن.

### خلاصه

1. تب «خلاصه» یا راست‌کلیک روی صفحه/انتخاب.
2. منبع: صفحه، ویدیو (کپشن)، یا متن پیست‌شده.
3. کوتاه / متوسط / گلوله‌ای.
4. کپی یا خواندن صوتی خلاصه.

ویدیو بدون کپشن: اول زیرنویس فارسی بساز یا خلاصه ساخته نمی‌شود.

### رونوشت و SRT

1. روی ویدیو زیرنویس یا دوبله بساز.
2. از پنل شناور SRT / VTT / رونوشت بگیر.
3. یا تب «رونوشت و SRT» آخرین کیوها را دوباره دانلود کن.
4. اگر «متن اصلی زیر ترجمه» روشن باشد فایل دوزبانه است.

---

## 14. دستور تب Build برای Cursor

در تب جدید عیناً این را بده:

> `PLAN.md` را بخوان و همان را پیاده کن. خارج از محدوده را نساز. اشتراک نساز. بعد از هر مرحلهٔ بخش ۱۰ `npm run pack` را در نظر بگیر و در پایان pack را واقعاً اجرا کن. اگر `GOOGLE_OAUTH_CLIENT_ID` در `.env.local` نبود دکمهٔ گوگل را مخفی کن نه اینکه بیلد را بشکنی. بعد از تغییر `sheets/Code.gs` در README یادآوری New deployment را نگه دار.

---

## 15. نکات پیاده‌سازی

- Apps Script بعد از ادیت بدون New deployment همان نسخهٔ IP را سرو می‌کند.
- `GmailApp` باید از همان حسابی اجرا شود که وب‌اپ را deploy کرده.
- OTP را در پاسخ JSON یا لاگ console نگذار.
- `page.js` با `player.js` تداخل id نسازد؛ host جدا: `persian-studio-page-host`.
- روی یوتیوب هر دو content script لود می‌شوند؛ منوی خواندن از `page.js`، ویدیو از `player.js`.
- رشته‌ها را هاردکد فارسی وسط کامپوننت نگذار؛ i18n.
- الگوی کامپوننت‌های موجود (Card, Button, Dialog) را ادامه بده.
- Next 16 این ریپو static export است؛ route سرور یا Route Handler جدید نساز. OTP فقط از service worker به Apps Script می‌رود.
- `src/app/api/` نساز (قبلاً حذف شده).
