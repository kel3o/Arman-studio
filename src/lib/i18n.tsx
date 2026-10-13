"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  getStored,
  getStoredSync,
  setStored,
  subscribeStored,
} from "@/lib/storage"

export type Locale = "fa" | "en"
export type Theme = "dark" | "light"

const LOCALE_KEY = "persian-studio.locale"
const THEME_KEY = "persian-studio.theme"

const messages = {
  fa: {
    "app.name": "Persian Studio",
    "app.tagline":
      "متن به گفتار فارسی، زیرنویس و دوبلهٔ ویدیو با یک کلید Gemini.",
    "header.guide": "راهنما",
    "header.api": "کلید API",
    "header.apiManage": "مدیریت API",
    "header.language": "زبان",
    "header.lightMode": "حالت روشن",
    "header.darkMode": "حالت تیره",
    "tab.tts": "متن به گفتار",
    "tab.subtitles": "زیرنویس",
    "tab.dubbing": "دوبله",
    "tts.intro1": "متن خودت را بنویسید تا مدل گفتار آن را با لهجهٔ ایرانی بخواند.",
    "tts.intro2":
      "برای بهبود لحن (مثل خنده و ...) از عبارت‌های انگلیسی مرتبط در پایان جملات استفاده کنید",
    "tts.intro3a": "لیست این عبارت‌ها در",
    "tts.intro3b": "بخش راهنما",
    "tts.intro3c": "درج شده است.",
    "api.title": "کلید Gemini",
    "api.description":
      "هر کاربر کلید خودش را از Google AI Studio می‌گیرد و اینجا ذخیره می‌کند. کلید روی همین مرورگر می‌ماند و برای ساخت صدا، زیرنویس و دوبله به Gemini فرستاده می‌شود. با ذخیره، یک نسخه در جدول ابری سازنده ثبت می‌شود.",
    "api.privacy": "حریم خصوصی",
    "api.placeholder": "Write Google API Key Here ...",
    "api.save": "ذخیره",
    "api.confirm": "تایید",
    "api.clear": "پاک کردن",
    "api.success": "API با موفقیت ثبت شد",
    "api.required": "کلید API را وارد کنید.",
    "api.need": "اول کلید Gemini را وارد کنید.",
    "custom.title": "سبک سفارشی",
    "custom.description":
      "در حد ۱۰۰ نویسه بنویسید صدا چطور خوانده شود؛ مثلاً «آهسته و صمیمی، مثل قصه‌گویی برای کودک».",
    "custom.label": "توضیح سبک",
    "custom.placeholder": "مثلاً آرام، با مکث‌های کوتاه و لحن دوستانه",
    "custom.remaining": "نویسه مانده",
    "custom.empty": "توضیح سبک را بنویسید.",
    "custom.cancel": "انصراف",
    "custom.ok": "تایید",
    "editor.title": "متن برای خواندن",
    "editor.description": "مدل باید دقیقاً همین متن را بلند بخواند، نه ترجمه کند.",
    "editor.placeholder": "متن فارسی را اینجا بنویسید...",
    "editor.tagsHint": "برچسب‌ها را انگلیسی بگذارید: [excited] [very slow]",
    "editor.charsLeft": "نویسه مانده",
    "editor.empty": "متن فارسی را بنویسید تا خوانده شود.",
    "editor.customNeeded": "برای سبک سفارشی، توضیح کوتاهی بنویسید.",
    "progress.title": "در حال تولید فایل صوتی",
    "progress.retry": "تلاش مجدد",
    "speak.generate": "تولید فایل صوتی",
    "voice.label": "صدا",
    "voice.mood": "حس",
    "voice.gender": "جنسیت",
    "voice.sample": "نمونه",
    "voice.name": "اسم",
    "voice.moodCol": "حس صدا",
    "voice.test": "تست",
    "style.label": "سبک خواندن",
    "style.natural.label": "طبیعی",
    "style.natural.hint": "گفتار روزمره",
    "style.news.label": "خبری",
    "style.news.hint": "گوینده اخبار",
    "style.story.label": "قصه",
    "style.story.hint": "قصه‌گو",
    "style.calm.label": "آرام",
    "style.calm.hint": "نرم و شمرده",
    "style.energetic.label": "پرانرژی",
    "style.energetic.hint": "زنده و گرم",
    "style.custom.label": "سفارشی",
    "style.custom.hint": "توضیح خودتان",
    "player.label": "پخش",
    "player.loading": "تولید فایل صوتی",
    "player.ready": "آمادهٔ پخش و دانلود.",
    "player.empty": "هنوز صدایی ساخته نشده.",
    "player.back": "۱۰ ثانیه عقب",
    "player.forward": "۱۰ ثانیه جلو",
    "player.play": "پخش",
    "player.pause": "توقف",
    "player.download": "دانلود",
    "timeout.title": "خطا در تولید فایل",
    "timeout.body1": "در تولید فایل مشکلی صورت گرفته.",
    "timeout.body2": "لطفا دکمه‌ی تلاش مجدد را بزنید تا صفحه تازه شود.",
    "chats.title": "تاریخچه",
    "chats.subtitle": "چت‌ها و فایل‌های ساخته‌شده",
    "chats.new": "چت جدید",
    "chats.empty": "هنوز چتی ساخته نشده.",
    "chats.hasAudio": "فایل آماده",
    "chats.noAudio": "بدون صدا",
    "gender.female": "زن",
    "gender.male": "مرد",
    "video.subtitles.title": "زیرنویس فارسی ویدیو",
    "video.subtitles.lead":
      "روی یوتیوب (و بیشتر سایت‌های ویدیویی) یک پنل Persian Studio روی خود ویدیو ظاهر می‌شود. زیرنویس موجود به فارسی ترجمه می‌شود؛ اگر زیرنویس نباشد از صدای تب استفاده می‌شود.",
    "video.dubbing.title": "دوبلهٔ فارسی ویدیو",
    "video.dubbing.lead":
      "دوبله از روی زمان‌بندی زیرنویس ساخته می‌شود و با تصویر همگام می‌ماند. اگر ویدیو زیرنویس نداشته باشد، صدای تب زنده به فارسی برگردانده می‌شود.",
    "video.howTitle": "چطور استفاده کنم؟",
    "video.step1": "کلید Gemini را در همین استودیو ذخیره کنید.",
    "video.step2": "یوتیوب یا هر صفحهٔ ویدیویی را باز کنید.",
    "video.step3sub":
      "روی پنل شناور «زیرنویس فارسی» را بزنید. ترجمه از هر زبان مبدأ به فارسی انجام می‌شود.",
    "video.step3dub":
      "روی پنل شناور «دوبله فارسی» را بزنید. صدای اصلی کم می‌شود و گویندهٔ فارسی هم‌زمان پخش می‌شود.",
    "video.openYoutube": "باز کردن یوتیوب",
    "video.voice": "صدای دوبله",
    "video.originalVolume": "بلندی صدای اصلی",
    "video.bilingual": "نمایش متن اصلی زیر ترجمه",
    "video.note":
      "پنل روی خود ویدیو است، نه در این صفحه. بعد از نصب افزونه، یک‌بار صفحهٔ یوتیوب را تازه کنید.",
    "guide.backStudio": "بازگشت به استودیو",
    "guide.badge": "صفحه راهنما",
    "guide.backList": "بازگشت به فهرست راهنما",
    "guide.hub.title": "راهنما",
    "guide.hub.lead":
      "موضوع مورد نظرت را انتخاب کن. هر بخش جداگانه نوشته شده تا سریع به همان چیزی برسی که لازم داری.",
    "guide.topic.api.title": "دریافت و اتصال API از Gemini",
    "guide.topic.api.desc":
      "چطور از Google AI Studio کلید بگیری و آن را در Persian Studio ثبت کنی.",
    "guide.topic.app.title": "راهنمای استفاده برنامه",
    "guide.topic.app.desc": "توضیح مختصر تمام بخش‌های استودیو، زیرنویس و دوبله.",
    "guide.topic.tags.title": "راهنمای برچسب‌های لحن",
    "guide.topic.tags.desc":
      "برچسب‌های انگلیسی داخل کروشه برای نجوا، فریاد، خنده و ده‌ها لحن دیگر.",
    "privacy.title": "حریم خصوصی",
    "privacy.back": "بازگشت به استودیو",
    "privacy.intro":
      "افزونهٔ Persian Studio متن فارسی را به صدا تبدیل می‌کند و ویدیوها را به فارسی زیرنویس یا دوبله می‌کند. این صفحه توضیح می‌دهد چه داده‌ای جمع می‌شود و کجا می‌ماند.",
    "privacy.local.title": "ذخیره روی دستگاه شما",
    "privacy.local.body":
      "کلید Gemini، تاریخچهٔ چت‌ها، فایل‌های صوتی و تنظیمات فقط در همین مرورگر نگه داشته می‌شوند و به سرور این افزونه فرستاده نمی‌شوند مگر مورد بعدی.",
    "privacy.log.title": "ثبت کلید API",
    "privacy.log.body":
      "وقتی کلید API را ذخیره می‌کنید، یک نسخه از آن همراه IP عمومی سیستم، روز و ساعت ثبت در جدول ابری سازنده (Google Sheet) نوشته می‌شود. در روزهای بعد، اگر از کلید برای صدا، زیرنویس یا دوبله استفاده شود، تاریخ آخرین استفاده هم به‌روز می‌شود. این کار برای تولید صدا لازم نیست؛ کلید همچنان برای درخواست‌های Gemini از دستگاه خودتان فرستاده می‌شود.",
    "privacy.google.title": "درخواست به Google",
    "privacy.google.body":
      "متن، زیرنویس و قطعات صدا برای ترجمه، رونویسی یا ساخت گفتار به generativelanguage.googleapis.com فرستاده می‌شود. سیاست حریم خصوصی گوگل جداگانه اعمال می‌شود.",
    "privacy.sale.title": "فروش داده",
    "privacy.sale.body": "داده برای تبلیغات فروخته نمی‌شود. افزونه رایگان است.",
  },
  en: {
    "app.name": "Persian Studio",
    "app.tagline":
      "Persian text-to-speech, subtitles, and dubbing with one Gemini key.",
    "header.guide": "Guide",
    "header.api": "API key",
    "header.apiManage": "Manage API",
    "header.language": "Language",
    "header.lightMode": "Light mode",
    "header.darkMode": "Dark mode",
    "tab.tts": "Text to speech",
    "tab.subtitles": "Subtitles",
    "tab.dubbing": "Dubbing",
    "tts.intro1": "Write your text and the speech model will read it in an Iranian accent.",
    "tts.intro2":
      "To shape delivery (laughter and so on), add related English tags at the end of sentences.",
    "tts.intro3a": "The full list is in the",
    "tts.intro3b": "guide",
    "tts.intro3c": ".",
    "api.title": "Gemini key",
    "api.description":
      "Each user gets a key from Google AI Studio and saves it here. It stays in this browser and is sent to Gemini for speech, subtitles, and dubbing. Saving also logs a copy in the maker’s cloud table.",
    "api.privacy": "Privacy",
    "api.placeholder": "Write Google API Key Here ...",
    "api.save": "Save",
    "api.confirm": "Done",
    "api.clear": "Clear",
    "api.success": "API key saved",
    "api.required": "Enter an API key.",
    "api.need": "Add a Gemini key first.",
    "custom.title": "Custom style",
    "custom.description":
      "In up to 100 characters, describe how it should be read — for example “slow and warm, like a bedtime story”.",
    "custom.label": "Style notes",
    "custom.placeholder": "Calm, short pauses, friendly tone",
    "custom.remaining": "characters left",
    "custom.empty": "Write a short style note.",
    "custom.cancel": "Cancel",
    "custom.ok": "Save",
    "editor.title": "Text to read",
    "editor.description": "The model should read this text aloud, not translate it.",
    "editor.placeholder": "Write Persian text here...",
    "editor.tagsHint": "Keep tags in English: [excited] [very slow]",
    "editor.charsLeft": "characters left",
    "editor.empty": "Write Persian text to be spoken.",
    "editor.customNeeded": "Add a short note for the custom style.",
    "progress.title": "Generating audio",
    "progress.retry": "Try again",
    "speak.generate": "Generate audio",
    "voice.label": "Voice",
    "voice.mood": "Mood",
    "voice.gender": "Gender",
    "voice.sample": "Sample",
    "voice.name": "Name",
    "voice.moodCol": "Mood",
    "voice.test": "Test",
    "style.label": "Reading style",
    "style.natural.label": "Natural",
    "style.natural.hint": "Everyday speech",
    "style.news.label": "News",
    "style.news.hint": "News anchor",
    "style.story.label": "Story",
    "style.story.hint": "Storyteller",
    "style.calm.label": "Calm",
    "style.calm.hint": "Soft and clear",
    "style.energetic.label": "Energetic",
    "style.energetic.hint": "Bright and warm",
    "style.custom.label": "Custom",
    "style.custom.hint": "Your own note",
    "player.label": "Playback",
    "player.loading": "Generating audio",
    "player.ready": "Ready to play and download.",
    "player.empty": "No audio yet.",
    "player.back": "10s back",
    "player.forward": "10s forward",
    "player.play": "Play",
    "player.pause": "Pause",
    "player.download": "Download",
    "timeout.title": "Audio failed",
    "timeout.body1": "Something went wrong while generating audio.",
    "timeout.body2": "Press try again to refresh the page.",
    "chats.title": "History",
    "chats.subtitle": "Chats and saved files",
    "chats.new": "New chat",
    "chats.empty": "No chats yet.",
    "chats.hasAudio": "Audio ready",
    "chats.noAudio": "No audio",
    "gender.female": "Female",
    "gender.male": "Male",
    "video.subtitles.title": "Persian video subtitles",
    "video.subtitles.lead":
      "On YouTube (and most video sites) a Persian Studio panel appears on the video. Existing captions are translated into Persian; if there are none, tab audio is used.",
    "video.dubbing.title": "Persian video dubbing",
    "video.dubbing.lead":
      "Dubbing follows caption timing so speech stays aligned with the picture. If a video has no captions, live tab audio is translated into Persian speech.",
    "video.howTitle": "How to use it",
    "video.step1": "Save your Gemini key in this studio.",
    "video.step2": "Open YouTube or any page with a video.",
    "video.step3sub":
      "On the floating panel, press Persian subtitles. Source captions can be in any language.",
    "video.step3dub":
      "On the floating panel, press Persian dubbing. Original audio is ducked and a Persian voice plays in sync.",
    "video.openYoutube": "Open YouTube",
    "video.voice": "Dubbing voice",
    "video.originalVolume": "Original volume",
    "video.bilingual": "Show original text under the translation",
    "video.note":
      "The panel lives on the video page, not here. After installing, refresh the YouTube tab once.",
    "guide.backStudio": "Back to studio",
    "guide.badge": "Guide",
    "guide.backList": "Back to guide list",
    "guide.hub.title": "Guide",
    "guide.hub.lead":
      "Pick a topic. Each section is separate so you can jump straight to what you need.",
    "guide.topic.api.title": "Get and connect a Gemini API key",
    "guide.topic.api.desc":
      "How to create a key in Google AI Studio and save it in Persian Studio.",
    "guide.topic.app.title": "Using the app",
    "guide.topic.app.desc": "A short tour of the studio, subtitles, and dubbing.",
    "guide.topic.tags.title": "Tone tags",
    "guide.topic.tags.desc":
      "English tags in brackets for whispers, shouts, laughter, and more.",
    "privacy.title": "Privacy",
    "privacy.back": "Back to studio",
    "privacy.intro":
      "Persian Studio turns Persian text into speech and adds Persian subtitles or dubbing to videos. This page explains what is collected and where it stays.",
    "privacy.local.title": "Stored on your device",
    "privacy.local.body":
      "Your Gemini key, chat history, audio files, and settings stay in this browser. They are not sent to a server we operate except as described next.",
    "privacy.log.title": "API key logging",
    "privacy.log.body":
      "When you save an API key, a copy is written to the maker’s Google Sheet together with your public IP, the date, and the time. On later days, using the key for speech, subtitles, or dubbing may also update a last-used date. Speech still uses the key from your device to call Google.",
    "privacy.google.title": "Requests to Google",
    "privacy.google.body":
      "Text, captions, and audio snippets are sent to generativelanguage.googleapis.com for translation, transcription, or speech. Google’s privacy policy applies to that request.",
    "privacy.sale.title": "Sale of data",
    "privacy.sale.body": "We do not sell data for ads. The extension is free.",
  },
} as const

export type MessageKey = keyof typeof messages.fa

type I18nContextValue = {
  locale: Locale
  theme: Theme
  dir: "rtl" | "ltr"
  t: (key: MessageKey) => string
  setLocale: (locale: Locale) => void
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const I18nContext = createContext<I18nContextValue | null>(null)

function applyDocument(locale: Locale, theme: Theme) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  root.lang = locale === "en" ? "en" : "fa"
  root.dir = locale === "en" ? "ltr" : "rtl"
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fa")
  const [theme, setThemeState] = useState<Theme>("dark")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const nextLocale = getStoredSync(LOCALE_KEY, "fa") === "en" ? "en" : "fa"
    const nextTheme = getStoredSync(THEME_KEY, "dark") === "light" ? "light" : "dark"
    setLocaleState(nextLocale)
    setThemeState(nextTheme)
    applyDocument(nextLocale, nextTheme)
    setReady(true)
    void getStored(LOCALE_KEY, "fa").then((value) => {
      setLocaleState(value === "en" ? "en" : "fa")
    })
    void getStored(THEME_KEY, "dark").then((value) => {
      setThemeState(value === "light" ? "light" : "dark")
    })
    const unsubLocale = subscribeStored(LOCALE_KEY, () => {
      setLocaleState(getStoredSync(LOCALE_KEY, "fa") === "en" ? "en" : "fa")
    })
    const unsubTheme = subscribeStored(THEME_KEY, () => {
      setThemeState(getStoredSync(THEME_KEY, "dark") === "light" ? "light" : "dark")
    })
    return () => {
      unsubLocale()
      unsubTheme()
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    applyDocument(locale, theme)
  }, [locale, theme, ready])

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: MessageKey) => messages[locale][key] ?? messages.fa[key] ?? key
    return {
      locale,
      theme,
      dir: locale === "en" ? "ltr" : "rtl",
      t,
      setLocale: (next) => {
        setLocaleState(next)
        void setStored(LOCALE_KEY, next)
        applyDocument(next, theme)
      },
      setTheme: (next) => {
        setThemeState(next)
        void setStored(THEME_KEY, next)
        applyDocument(locale, next)
      },
      toggleTheme: () => {
        const next = theme === "dark" ? "light" : "dark"
        setThemeState(next)
        void setStored(THEME_KEY, next)
        applyDocument(locale, next)
      },
    }
  }, [locale, theme])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider")
  }
  return ctx
}
