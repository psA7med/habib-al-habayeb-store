import { loadEnvConfig } from "@next/env"
loadEnvConfig(process.cwd())

import { createClient } from "@supabase/supabase-js"
import postgres from "postgres"

/**
 * Secure One-Time Admin Bootstrap Script for Habib Al-Habayeb
 * 
 * Usage:
 *   npx tsx scripts/bootstrap-admin.ts --email="admin@example.com" --password="SuperSecretPassword123" --name="مدير النظام"
 * Or via environment variables:
 *   BOOTSTRAP_ADMIN_EMAIL="admin@example.com" BOOTSTRAP_ADMIN_PASSWORD="..." npx tsx scripts/bootstrap-admin.ts
 */

function parseArgs() {
  const args = process.argv.slice(2)
  const params: Record<string, string> = {}
  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, ...rest] = arg.slice(2).split("=")
      params[key] = rest.join("=")
    }
  }
  return params
}

async function bootstrapAdmin() {
  const cliArgs = parseArgs()

  const email =
    cliArgs.email ||
    process.env.BOOTSTRAP_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL

  const password =
    cliArgs.password ||
    process.env.BOOTSTRAP_ADMIN_PASSWORD ||
    process.env.ADMIN_PASSWORD

  const fullName =
    cliArgs.name ||
    process.env.BOOTSTRAP_ADMIN_NAME ||
    "مدير المتجر"

  const role =
    cliArgs.role === "superadmin" || process.env.BOOTSTRAP_ADMIN_ROLE === "superadmin"
      ? "superadmin"
      : "admin"

  if (!email || !password) {
    console.error(`
❌ خطأ: لم يتم تحديد البريد الإلكتروني أو كلمة المرور للمدير.
----------------------------------------------------------------------
طريقة الاستخدام الصحيحة:
  1. عبر المعاملات (Arguments):
     npx tsx scripts/bootstrap-admin.ts --email="admin@habib.store" --password="YourSecurePassword" --name="أحمد حبيب"

  2. عبر المتغيرات البيئية (Environment Variables):
     $env:BOOTSTRAP_ADMIN_EMAIL="admin@habib.store"
     $env:BOOTSTRAP_ADMIN_PASSWORD="YourSecurePassword"
     $env:BOOTSTRAP_ADMIN_NAME="أحمد حبيب"
     npx tsx scripts/bootstrap-admin.ts
----------------------------------------------------------------------
`)
    process.exit(1)
  }

  if (password.length < 8) {
    console.error("❌ خطأ: كلمة المرور يجب أن تتكون من 8 أحرف على الأقل للأمان.")
    process.exit(1)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  const databaseUrl = process.env.DATABASE_URL

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ خطأ: NEXT_PUBLIC_SUPABASE_URL أو SUPABASE_SECRET_KEY غير موجود في .env.local")
    process.exit(1)
  }

  console.log(`🔐 بدء تهيئة حساب المدير (${email})...`)

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  // 1. Check if user already exists in Supabase Auth
  const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers()
  if (listError) {
    console.error("❌ فشل الاتصال بخدمة Supabase Auth:", listError.message)
    process.exit(1)
  }

  let userId: string

  const existingUser = usersData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (existingUser) {
    console.log(`ℹ️ تم العثور على المستخدم مسبقاً (ID: ${existingUser.id}). جاري تحديث كلمة المرور والصلاحيات...`)
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      existingUser.id,
      {
        password,
        email_confirm: true,
        user_metadata: {
          role,
          full_name: fullName,
        },
      }
    )

    if (updateError) {
      console.error("❌ فشل تحديث حساب المستخدم في Supabase Auth:", updateError.message)
      process.exit(1)
    }

    userId = existingUser.id
    console.log("✅ تم تحديث بيانات الدخول وتأكيد البريد بنجاح.")
  } else {
    console.log("➕ إنشاء حساب جديد في Supabase Auth...")
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role,
        full_name: fullName,
      },
    })

    if (createError) {
      console.error("❌ فشل إنشاء المستخدم في Supabase Auth:", createError.message)
      process.exit(1)
    }

    userId = createData.user.id
    console.log(`✅ تم إنشاء المستخدم بنجاح (ID: ${userId}).`)
  }

  // 2. Upsert profile in PostgreSQL profiles table
  if (databaseUrl) {
    console.log("🔄 مزامنة بيانات المدير مع جدول profiles في قاعدة البيانات...")
    const sql = postgres(databaseUrl, { prepare: false, ssl: "require", max: 1 })
    try {
      await sql`
        INSERT INTO public.profiles (id, email, full_name, role, updated_at)
        VALUES (${userId}, ${email}, ${fullName}, ${role}, now())
        ON CONFLICT (id) DO UPDATE
        SET email = ${email},
            full_name = ${fullName},
            role = ${role},
            updated_at = now();
      `
      console.log(`✅ تم تأكيد رتبة المدير (${role}) في جدول profiles.`)
    } catch (dbErr: any) {
      console.error("⚠️ فشل تحديث جدول profiles مباشرة:", dbErr.message)
    } finally {
      await sql.end()
    }
  }

  console.log(`
======================================================================
🎉 تم إعداد حساب المدير بنجاح!
----------------------------------------------------------------------
البريد الإلكتروني: ${email}
الاسم: ${fullName}
الرتبة: ${role}
رابط تسجيل الدخول: /admin/login
======================================================================
`)
}

bootstrapAdmin().catch((err) => {
  console.error("❌ خطأ غير متوقع:", err)
  process.exit(1)
})
