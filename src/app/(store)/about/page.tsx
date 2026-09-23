import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "عن حبيب الحبايب",
  description: "تعرف على متجرنا الالكتروني الأول للبقالة في مصر.",
}

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">عن حبيب الحبايب</h1>
      <div className="mt-8 space-y-6 text-muted-foreground">
        <p>
          حبيب الحبايب هو متجر البقالة الالكترونية الأول في مصر، حيث نوفر لك كل احتياجات البيت من منتجات طازة وموثوقة بأسعار مناسبة.
        </p>
        <p>
          نحن نسعى لتوفير أفضل تجربة تسوق الكترونية من خلال موقع سهل الاستخدام وخدمة عملاء متميزة.
        </p>
      </div>
    </div>
  )
}
