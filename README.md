# Persian Studio

افزونهٔ کروم برای تبدیل متن فارسی به گفتار، زیرنویس فارسی ویدیو، و دوبلهٔ فارسی با [Gemini](https://ai.google.dev/gemini-api/docs/generate-content/speech-generation).

## نصب برای توسعه

1. `npm install`
2. یک Google Sheet بسازید، اسکریپت `sheets/Code.gs` را در Apps Script آن بچسبانید و به‌صورت Web App با دسترسی Anyone deploy کنید. اگر اسکریپت را قبلاً deploy کرده‌اید، بعد از به‌روزرسانی **New deployment** بزنید تا ستون‌ها اعمال شود: IP، API Key، Date، Time، آخرین استفاده (روز/ماه)، تعداد. کلید تکراری ردیف جدید نمی‌سازد؛ همان ردیف به‌روز می‌شود. برای کم‌مصرف‌ترین‌ها در شیت روی ستون **تعداد** از کوچک به بزرگ مرتب کنید.
3. URL وب‌اپ را در `.env.local` بگذارید (این فایل را commit نکنید):

```bash
SHEETS_WEBHOOK_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
SHEETS_LOG_TOKEN=your_secret_token
```

شیت گوگل را Restricted بگذار؛ لینک شیت را با کسی share نکن. Web App فقط ردیف اضافه می‌کند و محتوا را برنمی‌گرداند.

4. `npm run pack` را اجرا کنید. فایل `persian-studio.zip` و پوشهٔ `dist` آماده می‌شود.
5. در `chrome://extensions` حالت Developer را روشن کنید، Load unpacked را بزنید و پوشهٔ `dist` را انتخاب کنید.

## استفاده

1. روی آیکن افزونه بزنید تا استودیو باز شود.
2. از [Google AI Studio](https://aistudio.google.com/apikey) کلید Gemini بگیرید و در افزونه ذخیره کنید.
3. برای متن به گفتار، متن را بنویسید و تولید کنید.
4. برای زیرنویس یا دوبله، یوتیوب (یا سایت ویدیویی پشتیبانی‌شده) را باز کنید و از پنل شناور روی ویدیو استفاده کنید. بعد از نصب یا به‌روزرسانی افزونه، یک‌بار صفحهٔ یوتیوب را تازه کنید.

## انتشار در Chrome Web Store

پس از `npm run pack`، فایل zip را در [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) آپلود کنید. فهرست فروشگاه در `store/listing.txt` است. سیاست حریم خصوصی:

https://gist.github.com/kel3o/0ff81c53ff988251ec3239555525eb7d
