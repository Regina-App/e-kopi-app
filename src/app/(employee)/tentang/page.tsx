'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  Info,
  Heart,
  Code2,
  Mail,
  Phone,
  ShieldCheck,
  Maximize2,
  ExternalLink,
  Sparkles,
  Coffee,
  CheckCircle2,
} from 'lucide-react'

import {
  APP_NAME,
  APP_DESCRIPTION,
  APP_VERSION,
  APP_DEVELOPER,
} from '@/lib/constants'
import {
  WhatsAppLogo,
  GmailLogo,
  CS_WHATSAPP_URL,
  CS_GMAIL_URL,
} from '@/components/CsContactButtons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

export default function AboutPage() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 1. HERO SECTION WITH LARGE LOGO */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center flex flex-col items-center"
      >
        <div className="relative mb-5">
          <div className="absolute -inset-3 rounded-3xl bg-blue-500/20 blur-xl animate-pulse" />
          <div className="relative rounded-3xl bg-white p-4 shadow-xl ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800">
            <Image
              src="/images/logo.png"
              alt="E-KOPI Logo"
              width={100}
              height={100}
              priority
              className="rounded-2xl object-contain"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-2 border border-blue-200/60 dark:border-blue-800">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Versi {APP_VERSION}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {APP_NAME}
        </h1>

        <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-lg">
          {APP_DESCRIPTION}
        </p>
      </motion.div>

      {/* 2. APP SPECIFICATIONS & HIGHLIGHTS */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-6"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Coffee className="h-5 w-5 text-amber-600" />
            <span>Tentang Platform E-KOPI</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            E-KOPI (Electronic Kepegawaian & Koperasi Online) dirancang untuk menyederhanakan proses administrasi mandiri pegawai, pengajuan cuti tahunan, simulasi pinjaman koperasi simpan-pinjam, serta integrasi pemotongan payroll secara transparan, akurat, dan aman.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Single Sign-On Bebas Password
              </span>
              <span className="text-slate-500">
                Masuk aman dengan NIK 16 digit dan One-Time Password (OTP) 6 digit.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Otomasi Kuota Cuti & Surat
              </span>
              <span className="text-slate-500">
                Pencatatan buku besar saldo cuti dan penerbitan surat cuti otomatis dengan verifikasi kode QR.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Koperasi & Take-Over Pinjaman
              </span>
              <span className="text-slate-500">
                Perhitungan bunga flat otomatis, pelunasan sisa pinjaman lama, dan sinkronisasi pemotongan gaji.
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Persetujuan 1-Klik Via Email
              </span>
              <span className="text-slate-500">
                Notifikasi instan untuk supervisor dan admin HR menyetujui pengajuan langsung dari email.
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. DEVELOPER & CONTACT INFO */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
      >
        {/* Developer card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Code2 className="h-4 w-4 text-blue-600" />
            <span>Pengembang Aplikasi</span>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">
              {APP_DEVELOPER}
            </p>
            <p className="text-xs text-slate-500">
              Dirancang dengan dedikasi tinggi untuk efisiensi ekosistem ketenagakerjaan modern.
            </p>
          </div>
          <div className="pt-2 text-xs text-slate-400">
            Teknologi: Next.js 16 App Router, TypeScript, Tailwind CSS v4, Supabase, Framer Motion.
          </div>
        </div>

        {/* Contact/Help card */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
            <Info className="h-4 w-4 text-blue-600" />
            <span>Bantuan & Dukungan Teknis</span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Butuh bantuan terkait akun, pengajuan cuti, atau pinjaman koperasi? Hubungi langsung Customer Service resmi melalui tombol di bawah:
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <a
              href={CS_WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi WhatsApp Customer Service"
              className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 active:scale-95 border border-emerald-200/80 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 transition-all shadow-xs group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs group-hover:scale-110 transition-transform">
                <WhatsAppLogo className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold tracking-tight">WhatsApp CS</span>
            </a>

            <a
              href={CS_GMAIL_URL}
              aria-label="Kirim Pesan ke Gmail Customer Service"
              className="flex flex-col sm:flex-row items-center justify-center gap-2.5 p-3.5 rounded-2xl bg-red-50 hover:bg-red-100/80 active:scale-95 border border-red-200/80 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-300 transition-all shadow-xs group cursor-pointer"
            >
              <div className="p-2 rounded-xl bg-white dark:bg-slate-900 shadow-xs group-hover:scale-110 transition-transform">
                <GmailLogo className="w-7 h-7" />
              </div>
              <span className="text-xs font-bold tracking-tight">Gmail CS</span>
            </a>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>Layanan Respons Cepat: Senin – Sabtu (08:00 – 17:00 WIB)</span>
          </div>
        </div>
      </motion.div>

      {/* 4. QR CODE DONATION SECTION */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-6 sm:p-8 text-center shadow-sm dark:border-amber-900/40 dark:from-amber-950/20 dark:via-slate-900 dark:to-amber-950/10 space-y-4"
      >
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
          <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
          <span>Donasi & Dukungan Sukarela</span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
          Dukung Pengembangan & Pemeliharaan Server E-KOPI
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          Apabila Anda merasa aplikasi ini bermanfaat, Anda dapat menyalurkan donasi sukarela melalui scan QRIS di bawah ini.
        </p>

        {/* QR Code Container with Click to Enlarge */}
        <div className="pt-2 flex flex-col items-center">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsQrModalOpen(true)}
            className="group relative cursor-pointer rounded-2xl bg-white p-4 shadow-md border border-slate-200 transition-all hover:shadow-xl dark:bg-slate-800 dark:border-slate-700"
          >
            {/* QR Code SVG Visual */}
            <div className="relative flex flex-col items-center justify-center w-48 h-48 bg-slate-50 dark:bg-slate-900 rounded-xl p-2 border border-dashed border-slate-300 dark:border-slate-700">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-slate-900 dark:text-white"
                fill="currentColor"
              >
                {/* Simulated QR Code Pattern */}
                <rect x="10" y="10" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="16" y="16" width="12" height="12" rx="1" />
                <rect x="66" y="10" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="72" y="16" width="12" height="12" rx="1" />
                <rect x="10" y="66" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="16" y="72" width="12" height="12" rx="1" />
                {/* Random Pattern Nodes */}
                <rect x="42" y="12" width="6" height="6" />
                <rect x="52" y="18" width="6" height="6" />
                <rect x="42" y="28" width="6" height="6" />
                <rect x="12" y="42" width="6" height="6" />
                <rect x="24" y="48" width="6" height="6" />
                <rect x="42" y="42" width="16" height="16" rx="2" />
                <rect x="66" y="42" width="6" height="6" />
                <rect x="78" y="48" width="6" height="6" />
                <rect x="42" y="66" width="6" height="6" />
                <rect x="52" y="74" width="6" height="6" />
                <rect x="66" y="66" width="6" height="6" />
                <rect x="78" y="74" width="6" height="6" />
                <rect x="72" y="84" width="12" height="6" />
                <rect x="48" y="84" width="6" height="6" />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl backdrop-blur-xs transition-opacity text-white text-xs font-semibold gap-1.5">
                <Maximize2 className="h-4 w-4" />
                <span>Perbesar QR</span>
              </div>
            </div>

            <p className="mt-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              QRIS / ShopeePay / GoPay / OVO
            </p>
          </motion.div>

          <span className="mt-2 text-xs text-slate-400">
            Klik kode QR di atas untuk memperbesar tampilan
          </span>
        </div>
      </motion.div>

      {/* FULL-SIZE QR DIALOG */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl text-center">
          <DialogHeader>
            <DialogTitle className="text-center font-bold text-lg">
              QRIS Donasi E-KOPI
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-500">
              Scan melalui aplikasi mobile banking atau e-wallet pilihan Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-64 h-64 p-4 rounded-2xl bg-white border border-slate-200 shadow-lg flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-slate-900"
                fill="currentColor"
              >
                <rect x="10" y="10" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="16" y="16" width="12" height="12" rx="1" />
                <rect x="66" y="10" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="72" y="16" width="12" height="12" rx="1" />
                <rect x="10" y="66" width="24" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                <rect x="16" y="72" width="12" height="12" rx="1" />
                <rect x="42" y="12" width="6" height="6" />
                <rect x="52" y="18" width="6" height="6" />
                <rect x="42" y="28" width="6" height="6" />
                <rect x="12" y="42" width="6" height="6" />
                <rect x="24" y="48" width="6" height="6" />
                <rect x="42" y="42" width="16" height="16" rx="2" />
                <rect x="66" y="42" width="6" height="6" />
                <rect x="78" y="48" width="6" height="6" />
                <rect x="42" y="66" width="6" height="6" />
                <rect x="52" y="74" width="6" height="6" />
                <rect x="66" y="66" width="6" height="6" />
                <rect x="78" y="74" width="6" height="6" />
                <rect x="72" y="84" width="12" height="6" />
                <rect x="48" y="84" width="6" height="6" />
              </svg>
            </div>
            <p className="mt-3 font-semibold text-slate-800 text-sm">
              E-KOPI Development Fund
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              NMID: ID1020038472910
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setIsQrModalOpen(false)}
              className="rounded-xl px-6"
            >
              Tutup
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
