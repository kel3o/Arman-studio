export const TTS_MODELS = [
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
] as const

export const DEFAULT_VOICE = "Kore"

export const VOICES = [
  { name: "Kore", mood: "قاطع و واضح", group: "روشن" },
  { name: "Aoede", mood: "سبک و روان", group: "روشن" },
  { name: "Leda", mood: "جوان و زنده", group: "روشن" },
  { name: "Zephyr", mood: "درخشان", group: "روشن" },
  { name: "Autonoe", mood: "شفاف", group: "روشن" },
  { name: "Laomedeia", mood: "سرزنده", group: "روشن" },
  { name: "Achernar", mood: "نرم", group: "ملایم" },
  { name: "Sulafat", mood: "گرم", group: "ملایم" },
  { name: "Vindemiatrix", mood: "آرام", group: "ملایم" },
  { name: "Despina", mood: "صاف", group: "ملایم" },
  { name: "Algieba", mood: "ملایم", group: "ملایم" },
  { name: "Callirrhoe", mood: "آسوده‌خاطر", group: "ملایم" },
  { name: "Umbriel", mood: "راحت", group: "ملایم" },
  { name: "Achird", mood: "دوستانه", group: "گرم" },
  { name: "Puck", mood: "شوخ و پرانرژی", group: "گرم" },
  { name: "Fenrir", mood: "هیجان‌زده", group: "گرم" },
  { name: "Sadachbia", mood: "پرجنب‌وجوش", group: "گرم" },
  { name: "Pulcherrima", mood: "رو به جلو", group: "گرم" },
  { name: "Charon", mood: "اطلاعاتی", group: "رسمی" },
  { name: "Rasalgethi", mood: "توضیحی", group: "رسمی" },
  { name: "Sadaltager", mood: "دانشمند", group: "رسمی" },
  { name: "Erinome", mood: "شفاف", group: "رسمی" },
  { name: "Iapetus", mood: "واضح", group: "رسمی" },
  { name: "Schedar", mood: "یکدست", group: "رسمی" },
  { name: "Orus", mood: "محکم", group: "عمیق" },
  { name: "Alnilam", mood: "قاطع", group: "عمیق" },
  { name: "Gacrux", mood: "بالغ", group: "عمیق" },
  { name: "Algenib", mood: "خشن", group: "عمیق" },
  { name: "Enceladus", mood: "نفس‌دار", group: "عمیق" },
  { name: "Zubenelgenubi", mood: "غیررسمی", group: "عمیق" },
] as const

export const VOICE_GROUPS = ["روشن", "ملایم", "گرم", "رسمی", "عمیق"] as const

export const STYLES = [
  {
    id: "natural",
    label: "طبیعی",
    hint: "گفتار روزمره",
    notes:
      "Natural conversational delivery, like a native Tehran speaker reading a message aloud.",
    pacing: "Moderate conversational pace with natural pauses at punctuation.",
  },
  {
    id: "news",
    label: "خبری",
    hint: "گوینده اخبار",
    notes:
      "Clear Iranian news-anchor delivery: formal, precise, and easy to follow.",
    pacing: "Measured broadcast pace. Do not rush.",
  },
  {
    id: "story",
    label: "قصه",
    hint: "قصه‌گو",
    notes:
      "Warm storyteller. Gentle expression, without turning the text into a performance that changes the words.",
    pacing: "Slightly slower, with space between sentences.",
  },
  {
    id: "calm",
    label: "آرام",
    hint: "نرم و شمرده",
    notes: "Calm, soft, and reassuring. Keep pronunciation crisp.",
    pacing: "Slow and unhurried.",
  },
  {
    id: "energetic",
    label: "پرانرژی",
    hint: "زنده و گرم",
    notes: "Bright energy with a vocal smile, still clearly Iranian Persian.",
    pacing: "Lively but intelligible. Do not swallow syllables.",
  },
] as const

export type StyleId = (typeof STYLES)[number]["id"]

export const SAMPLE_TEXTS = [
  {
    label: "سلام",
    text: "سلام. امروز هوا خیلی خوب است و نسیم ملایمی می‌وزد. امیدوارم روز قشنگی داشته باشی.",
  },
  {
    label: "خبر",
    text: "به گزارش منابع محلی، نمایشگاه کتاب تهران از صبح امروز میزبان بازدیدکنندگان بود. ناشران تازه‌ترین عنوان‌های فارسی را روی میز گذاشته‌اند و سالن کودک شلوغ‌ترین بخش نمایشگاه است.",
  },
  {
    label: "شعر",
    text: "بنی‌آدم اعضای یکدیگرند که در آفرینش ز یک گوهرند. چو عضوی به درد آورد روزگار دگر عضوها را نماند قرار.",
  },
] as const

export const MAX_TEXT_CHARS = 4_000
