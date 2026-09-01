export type ToneTag = {
  event: string;
  emotion: string;
  key: string;
};

/** کلید انگلیسی داخل کروشه برای چسباندن به متن. */
export function tagWithBrackets(key: string): string {
  const inner = key.replace(/^\{|\}$/g, "");
  return `[${inner}]`;
}

export const TONE_TAGS: ToneTag[] = [
  {
    event: "نجوا در گوش",
    emotion: "محرمانه، صمیمی",
    key: "{whispers}",
  },
  {
    event: "فریاد بلند",
    emotion: "خشم، هیجان شدید، هشدار",
    key: "{shouting}",
  },
  {
    event: "خنده",
    emotion: "شادی، سرخوشی، تمسخر ملایم",
    key: "{laughs}",
  },
  {
    event: "آه کشیدن",
    emotion: "خستگی، ناامیدی، تسکین",
    key: "{sighs}",
  },
  {
    event: "نفس حبس‌شده / جیغ کوتاه از ترس",
    emotion: "شوک، ترس ناگهانی",
    key: "{gasp}",
  },
  {
    event: "پچ‌پچ کردن",
    emotion: "توطئه، رازداری، ترس از شنیده شدن",
    key: "{muttering}",
  },
  {
    event: "گریه کردن",
    emotion: "غم عمیق، اندوه",
    key: "{crying}",
  },
  {
    event: "سرفه کردن",
    emotion: "بیماری، جلب توجه، قطع مکالمه",
    key: "{coughs}",
  },
  {
    event: "خنده‌ی کوتاه و تمسخرآمیز",
    emotion: "پوزخند، شک، تحقیر",
    key: "{chuckles}",
  },
  {
    event: "نفس نفس زدن",
    emotion: "خستگی فیزیکی، ترس، هیجان",
    key: "{panting}",
  },
  {
    event: "غرغر کردن",
    emotion: "نارضایتی، عصبانیت فروخورده",
    key: "{grumbling}",
  },
  {
    event: "فریاد کوتاه از درد یا تعجب",
    emotion: "درد ناگهانی، وحشت",
    key: "{yelps}",
  },
  {
    event: "زمزمه کردن آهنگ",
    emotion: "آرامش، فکر کردن، سرخوشی",
    key: "{hums}",
  },
  {
    event: "گرفتن نفس (هق‌هق)",
    emotion: "گریه شدید، شوک احساسی",
    key: "{sobs}",
  },
  {
    event: "پاک کردن گلو",
    emotion: "شروع سخنرانی، شک، جلب توجه",
    key: "{clears throat}",
  },
  {
    event: "خرناس / خروپف",
    emotion: "خواب، کسالت شدید",
    key: "{snores}",
  },
  {
    event: "صدای تق تق دندان",
    emotion: "سرما، ترس شدید",
    key: "{teeth chattering}",
  },
  {
    event: "لیسیدن لب",
    emotion: "گرسنگی، طمع، اضطراب",
    key: "{licks lips}",
  },
  {
    event: "سوت زدن",
    emotion: "بی‌خیالی، جلب توجه، تحسین",
    key: "{whistles}",
  },
  {
    event: "نفس عمیق",
    emotion: "آماده‌سازی، تسکین، صبر",
    key: "{inhales}",
  },
  {
    event: "بازدم طولانی",
    emotion: "رها کردن تنش، خستگی",
    key: "{exhales}",
  },
  {
    event: "خنده‌ی بلند و قهقهه",
    emotion: "شادی انفجاری",
    key: "{bursts into laughter}",
  },
  {
    event: "جیغ کشیدن",
    emotion: "ترس شدید، هیجان غیرقابل کنترل",
    key: "{screams}",
  },
  {
    event: "ناله کردن",
    emotion: "درد، لذت، کسالت",
    key: "{moans}",
  },
  {
    event: "غریدن (مثل حیوان)",
    emotion: "تهدید، خشم بدوی",
    key: "{growls}",
  },
  {
    event: "خمیازه کشیدن",
    emotion: "خواب‌آلودگی، بی‌حوصلگی",
    key: "{yawns}",
  },
  {
    event: "ضربه زدن با انگشت (بی‌صبری)",
    emotion: "انتظار، عصبانیت، فکر کردن",
    key: "{taps fingers}",
  },
  {
    event: "تق تق پا",
    emotion: "بی‌قراری، ریتم",
    key: "{taps foot}",
  },
  {
    event: "ضربه به میز",
    emotion: "تأکید، خشم، تصمیم‌گیری",
    key: "{slams table}",
  },
  {
    event: "دست زدن (تشویق)",
    emotion: "تحسین، شادی",
    key: "{claps}",
  },
  {
    event: "انگشت روی لب (هیس)",
    emotion: "سکوت، رازداری",
    key: "{shushes}",
  },
  {
    event: "صدای بوسه",
    emotion: "محبت، خداحافظی",
    key: "{kisses}",
  },
  {
    event: "جویدن",
    emotion: "غذا خوردن، بی‌ادبی، فکر کردن",
    key: "{chewing}",
  },
  {
    event: "هیس کردن با خشم",
    emotion: "تهدید خزنده، نفرت",
    key: "{hisses}",
  },
  {
    event: "خنده‌ی عصبی",
    emotion: "اضطراب، تلاش برای پنهان کردن ترس",
    key: "{nervous laugh}",
  },
  {
    event: "گریه با صدای بلند",
    emotion: "ماتم، از دست دادن کنترل",
    key: "{wails}",
  },
  {
    event: "زمزمه‌ی جادویی / ورد خواندن",
    emotion: "تشریفات، رمزآلودگی",
    key: "{chants}",
  },
  {
    event: "نفس حبس کردن و رها کردن",
    emotion: "تلاش فیزیکی، تمرکز",
    key: "{holds breath}",
  },
  {
    event: "صدای تق استخوان",
    emotion: "درد، پیری، حرکت سنگین",
    key: "{bones cracking}",
  },
  {
    event: "مالیدن دست‌ها به هم",
    emotion: "طمع، سرما، نقشه‌کشی",
    key: "{rubs hands}",
  },
  {
    event: "ضربه به سینه (افتخار یا غم)",
    emotion: "غرور، سوگند، اندوه",
    key: "{beats chest}",
  },
  {
    event: "صدای شکستن چیزها",
    emotion: "خشم تخریبی، تصادف",
    key: "{smashing}",
  },
  {
    event: "راه رفتن با صدای پا",
    emotion: "ورود، rumbling، انتظار",
    key: "{footsteps}",
  },
  {
    event: "در زدن",
    emotion: "ورود، خبر، تعلیق",
    key: "{knocks}",
  },
  {
    event: "باز شدن در",
    emotion: "ورود ناگهانی، تغییر صحنه",
    key: "{door opens}",
  },
  {
    event: "بسته شدن در",
    emotion: "خروج، پایان، خشم",
    key: "{door slams}",
  },
  {
    event: "ورق زدن کاغذ",
    emotion: "مطالعه، اداره، تعلیق",
    key: "{pages turning}",
  },
  {
    event: "صدای باران",
    emotion: "غم، آرامش، پس‌زمینه",
    key: "{rain}",
  },
  {
    event: "رعد و برق",
    emotion: "وحشت، قدرت، درام",
    key: "{thunder}",
  },
  {
    event: "وزش باد",
    emotion: "تنهایی، سفر، سرما",
    key: "{wind blowing}",
  },
  {
    event: "تیک‌تاک ساعت",
    emotion: "انتظار، تنش، گذر زمان",
    key: "{clock ticking}",
  },
  {
    event: "صدای قلب",
    emotion: "ترس، عشق، تعلیق",
    key: "{heartbeat}",
  },
  {
    event: "زنگ تلفن / زنگ در",
    emotion: "قطع مکالمه، خبر",
    key: "{phone ringing}",
  },
  {
    event: "صدای شلیک",
    emotion: "خشونت، شوک، اکشن",
    key: "{gunshot}",
  },
  {
    event: "انفجار",
    emotion: "فاجعه، اکشن",
    key: "{explosion}",
  },
  {
    event: "شکستن شیشه",
    emotion: "نفوذ، تصادف، خشم",
    key: "{glass breaking}",
  },
  {
    event: "صدای آب (چکیدن یا جریان)",
    emotion: "آرامش، غرق شدن، زمان",
    key: "{water dripping}",
  },
  {
    event: "آتش (ترق ترق)",
    emotion: "گرما، ویرانی، کمپ",
    key: "{fire crackling}",
  },
  {
    event: "صدای اسب / حیوان",
    emotion: "طبیعت، سفر",
    key: "{horse neighs}",
  },
  {
    event: "پارس سگ",
    emotion: "هشدار، خطر، زندگی روزمره",
    key: "{dog barks}",
  },
  {
    event: "صدای پرندگان",
    emotion: "صبح، آرامش، جنگل",
    key: "{birds chirping}",
  },
  {
    event: "سکوت ناگهانی (قطع صدا)",
    emotion: "شوک، تأکید",
    key: "{silence}",
  },
  {
    event: "پژواک صدا",
    emotion: "فضای بزرگ، تنهایی",
    key: "{echo}",
  },
  {
    event: "قطع شدن صدا (پارازیت)",
    emotion: "تکنولوژی، وحشت، ارتباط ضعیف",
    key: "{static}",
  },
  {
    event: "نفس در گوش (نفس گرم)",
    emotion: "تهدید نزدیک، صمیمیت ترسناک",
    key: "{breathing close}",
  },
  {
    event: "خنده از دور",
    emotion: "جنون، خاطره، وحشت",
    key: "{distant laughter}",
  },
];
