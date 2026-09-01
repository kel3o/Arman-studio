import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    title: "تاریخچه چت‌ها",
    body: "ستون راست فهرست گفتگوهاست. «چت جدید» یک متن خالی می‌سازد. روی هر مورد بزن تا همان متن و صدای ذخیره‌شده باز شود. آیکن مداد نام چت را عوض می‌کند؛ سطل زباله آن را پاک می‌کند.",
  },
  {
    title: "متن",
    body: "کادر اصلی همان چیزی است که خوانده می‌شود. تا ده هزار نویسه جا دارد. اگر از برچسب لحن استفاده می‌کنی، عبارت انگلیسی را داخل کروشه در همین متن بگذار.",
  },
  {
    title: "صدا",
    body: "فهرست صداها به‌صورت کشویی است. روی گزینهٔ انتخاب‌شده بزن تا جدول باز شود. ستون‌ها اسم گوینده، حس صدا و جنسیت هستند. کنار هر اسم دکمهٔ پخش نمونه هست.",
  },
  {
    title: "سبک خواندن",
    body: "چند سبک از پیش آماده مثل طبیعی، خبری یا قصه‌گو، به‌علاوهٔ گزینهٔ سفارشی. با زدن سفارشی می‌توانی تا صد نویسه توضیح بدهی صدا چطور خوانده شود. انتخاب سبک روی لحن کلی خواندن اثر می‌گذارد و جدا از برچسب‌های لحظه‌ای داخل متن است.",
  },
  {
    title: "تولید فایل صوتی",
    body: "با این دکمه درخواست به Gemini می‌رود. نوار پیشرفت تا ۹۹٪ جلو می‌رود و وقتی فایل آماده شد به ۱۰۰٪ می‌رسد. اگر بیش از پنج دقیقه روی ۹۹٪ بماند، پیام خطا و دکمه ری‌استارت می‌آید.",
  },
  {
    title: "پخش صدا",
    body: "بعد از موفقیت، پخش‌کننده ظاهر می‌شود: پخش و توقف، عقب و جلو ده ثانیه‌ای، اسلایدر برای رفتن به نقطه دلخواه، و دانلود فایل WAV.",
  },
  {
    title: "کلید API",
    body: "از هدر، کلید Gemini را وارد یا عوض می‌کنی. بدون کلید معتبر تولید صدا انجام نمی‌شود.",
  },
];

export default function AppGuidePage() {
  return (
    <>
      <Link
        href="/guide"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowRight className="size-4" />
        بازگشت به فهرست راهنما
      </Link>
      <header className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          راهنمای استفاده برنامه
        </h1>
        <p className="max-w-none text-pretty leading-8 text-muted-foreground">
          استدیو آرمان یک استودیوی متن به گفتار فارسی است. متن را می‌نویسی، صدا و
          سبک را انتخاب می‌کنی، فایل می‌سازی و همان جلسه را در تاریخچه نگه
          می‌داری.
        </p>
      </header>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <section
            key={section.title}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 leading-8 text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </>
  );
}
