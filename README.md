# Mini POS

ระบบขายหน้าร้านขนาดเล็ก สร้างด้วย Next.js (App Router) + Supabase

## เริ่มต้นใช้งาน (Local)

```bash
npm install
cp .env.local.example .env.local   # แล้วใส่ค่า Supabase ของคุณ
npm run dev
```

เปิด http://localhost:3000

## ตั้งค่า Supabase

1. สร้างโปรเจกต์ใหม่ที่ https://supabase.com
2. ไปที่ SQL Editor แล้วรันสคริปต์ใน `supabase.sql` เพื่อสร้างตาราง `sales`
3. ไปที่ Project Settings → API แล้วคัดลอก **Project URL** และ **anon public key**
   (ห้ามใช้ service_role key ฝั่งนี้)
4. ใส่ค่าทั้งสองลงใน `.env.local` (local) หรือ Vercel → Project Settings →
   Environment Variables (production):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## โครงสร้างโปรเจกต์

```
mini-pos/
├── lib/
│   ├── supabaseClient.js   # Supabase client (ใช้ env vars)
│   └── products.js         # รายการสินค้าตัวอย่าง
├── app/
│   ├── layout.js           # เลย์เอาต์หลัก + เมนูนำทาง
│   ├── NavLinks.js          # ลิงก์เมนู (client component)
│   ├── globals.css         # สไตล์ทั้งหมด
│   ├── page.js             # หน้าแรก (แดชบอร์ด)
│   ├── sell/page.js        # หน้าขายสินค้า
│   └── history/page.js     # หน้าประวัติการขาย
├── supabase.sql            # สคริปต์สร้างตาราง sales
├── package.json
├── next.config.js
└── .gitignore
```

## Deploy บน Vercel

1. Push โค้ดนี้ขึ้น GitHub
2. Import โปรเจกต์เข้า Vercel
3. เพิ่ม Environment Variables สองตัวด้านบนใน Vercel
4. Deploy — เสร็จแล้ว 🎉
