export const TTS_MODELS = [
  "gemini-3.1-flash-tts-preview",
  "gemini-2.5-flash-preview-tts",
] as const

export const DEFAULT_VOICE = "Kore"

export const VOICES = [
  { name: "Kore", mood: "قاطع و واضح", gender: "زن", group: "روشن" },
  { name: "Aoede", mood: "سبک و روان", gender: "زن", group: "روشن" },
  { name: "Leda", mood: "جوان و زنده", gender: "زن", group: "روشن" },
  { name: "Zephyr", mood: "درخشان", gender: "زن", group: "روشن" },
  { name: "Autonoe", mood: "شفاف", gender: "زن", group: "روشن" },
  { name: "Laomedeia", mood: "سرزنده", gender: "زن", group: "روشن" },
  { name: "Achernar", mood: "نرم", gender: "زن", group: "ملایم" },
  { name: "Sulafat", mood: "گرم", gender: "زن", group: "ملایم" },
  { name: "Vindemiatrix", mood: "آرام", gender: "زن", group: "ملایم" },
  { name: "Despina", mood: "صاف", gender: "زن", group: "ملایم" },
  { name: "Algieba", mood: "ملایم", gender: "مرد", group: "ملایم" },
  { name: "Callirrhoe", mood: "آسوده‌خاطر", gender: "زن", group: "ملایم" },
  { name: "Umbriel", mood: "راحت", gender: "مرد", group: "ملایم" },
  { name: "Achird", mood: "دوستانه", gender: "مرد", group: "گرم" },
  { name: "Puck", mood: "شوخ و پرانرژی", gender: "مرد", group: "گرم" },
  { name: "Fenrir", mood: "هیجان‌زده", gender: "مرد", group: "گرم" },
  { name: "Sadachbia", mood: "پرجنب‌وجوش", gender: "مرد", group: "گرم" },
  { name: "Pulcherrima", mood: "رو به جلو", gender: "زن", group: "گرم" },
  { name: "Charon", mood: "اطلاعاتی", gender: "مرد", group: "رسمی" },
  { name: "Rasalgethi", mood: "توضیحی", gender: "مرد", group: "رسمی" },
  { name: "Sadaltager", mood: "دانشمند", gender: "مرد", group: "رسمی" },
  { name: "Erinome", mood: "شفاف", gender: "زن", group: "رسمی" },
  { name: "Iapetus", mood: "واضح", gender: "مرد", group: "رسمی" },
  { name: "Schedar", mood: "یکدست", gender: "مرد", group: "رسمی" },
  { name: "Orus", mood: "محکم", gender: "مرد", group: "عمیق" },
  { name: "Alnilam", mood: "قاطع", gender: "مرد", group: "عمیق" },
  { name: "Gacrux", mood: "بالغ", gender: "زن", group: "عمیق" },
  { name: "Algenib", mood: "خشن", gender: "مرد", group: "عمیق" },
  { name: "Enceladus", mood: "نفس‌دار", gender: "مرد", group: "عمیق" },
  { name: "Zubenelgenubi", mood: "غیررسمی", gender: "مرد", group: "عمیق" },
] as const

export type VoiceOption = (typeof VOICES)[number]

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

export const MAX_TEXT_CHARS = 10_000
