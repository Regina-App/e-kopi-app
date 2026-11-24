'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronDown,
  Sparkles,
  ShieldCheck,
  BookOpen,
  Headphones,
  Bot,
  HeartHandshake,
  Maximize2,
  CheckCircle2,
  X,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react'
import {
  WhatsAppLogo,
  GmailLogo,
  CS_WHATSAPP_URL,
  CS_GMAIL_URL,
} from './CsContactButtons'

interface AnnouncementPopupProps {
  forceShow?: boolean
}

export default function AnnouncementPopup({ forceShow = false }: AnnouncementPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('syarat')
  const [showQrModal, setShowQrModal] = useState(false)
  const [qrisUrl, setQrisUrl] = useState<string>('/images/logo.png')

  useEffect(() => {
    // Check if user has already agreed in this session
    const hasAgreed = sessionStorage.getItem('ekopi_announcement_agreed')
    if (!hasAgreed || forceShow) {
      // Small timeout for smooth entrance
      const timer = setTimeout(() => setIsOpen(true), 600)
      return () => clearTimeout(timer)
    }
  }, [forceShow])

  // Fetch QRIS from settings if available
  useEffect(() => {
    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.settings?.donation_qr_url) {
          setQrisUrl(data.settings.donation_qr_url)
        }
      })
      .catch(() => {})
  }, [])

  const handleAgree = () => {
    sessionStorage.setItem('ekopi_announcement_agreed', 'true')
    setIsOpen(false)
  }

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id)
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-xl my-auto rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-[#0b132b] text-white shadow-2xl border border-blue-500/30 overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Decorative Top Glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-2 bg-gradient-to-r from-transparent via-blue-500 to-transparent blur-sm" />
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

              {/* Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-sm relative">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 p-0.5 shadow-lg shadow-blue-500/25 flex items-center justify-center overflow-hidden">
                      <Image
                        src="/images/logo.png"
                        alt="E-KOPI Logo"
                        width={44}
                        height={44}
                        className="rounded-[14px] object-cover"
                      />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                        Announcement!
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        E-KOPI By Regina - App
                      </h2>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3.5 py-2">
                  <span className="text-amber-400 font-bold">ℹ️ Info:</span>
                  <span>Klik tanda panah <b>▼</b> di bawah untuk melihat rincian informasi penting</span>
                </div>
              </div>

              {/* Accordion List Body */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar flex-1">
                {/* 1. Syarat & Ketentuan */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 overflow-hidden transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggleSection('syarat')}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span>1. Syarat & Ketentuan Aplikasi</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        expandedSection === 'syarat' ? 'rotate-180 text-blue-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedSection === 'syarat' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 pt-1 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                          <p>• <b>Cuti Tahunan:</b> Berlaku bagi karyawan dengan masa kerja minimal 1 tahun (TMT Kerja). Saldo awal diisi oleh admin perusahaan.</p>
                          <p>• <b>Koperasi Karyawan:</b> Buka pengajuan setiap <b>tanggal 8 s/d 28</b> setiap bulan. Di luar tanggal ini, sistem ditutup.</p>
                          <p>• <b>Bunga & Potongan:</b> Suku bunga flat 2,5% per bulan. Pemotongan angsuran otomatis dilakukan setiap <b>tanggal 5</b>.</p>
                          <p>• <b>Peminjam Pertama:</b> Wajib membawa Ijazah Satpam asli atau Ijazah terakhir saat verifikasi pencairan kantor.</p>
                          <p>• <b>Pencegahan Duplikasi:</b> Setiap karyawan hanya boleh memiliki 1 pengajuan cuti dan 1 pengajuan koperasi berstatus pending dalam satu waktu.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Cara Penggunaan */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 overflow-hidden transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggleSection('cara')}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span>2. Panduan Cara Penggunaan</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        expandedSection === 'cara' ? 'rotate-180 text-indigo-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedSection === 'cara' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 pt-1 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                          <p>• <b>Pengajuan Cuti:</b> Buka menu <i>Cuti</i> ➡️ pilih tanggal di kalender secara spesifik (tanggal libur tidak perlu dipilih) ➡️ isi alasan dan nomor darurat ➡️ kirim.</p>
                          <p>• <b>Pengajuan Pinjaman:</b> Buka menu <i>Koperasi</i> ➡️ gunakan kalkulator simulasi real-time ➡️ tentukan nominal & tenor (maksimal 4x) ➡️ ajukan.</p>
                          <p>• <b>Fasilitas Takeover:</b> Jika memiliki pinjaman berjalan, Anda dapat mengajukan pinjaman baru dengan nominal lebih besar dari sisa kewajiban.</p>
                          <p>• <b>Cetak Surat Cuti:</b> Setelah disetujui admin, surat cuti PDF format A4 resmi dengan barcode verifikasi dapat langsung diunduh dan dicetak.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Bantuan CS */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 overflow-hidden transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggleSection('cs')}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                        <Headphones className="w-4 h-4" />
                      </div>
                      <span>3. Bantuan Customer Service (CS)</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        expandedSection === 'cs' ? 'rotate-180 text-emerald-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedSection === 'cs' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 pt-1 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
                          <p>Jika mengalami kendala akun, NIK tidak terdaftar, atau masalah pengajuan, tim layanan kami siap membantu:</p>
                          <div className="grid grid-cols-2 gap-3 pt-1">
                            <a
                              href={CS_WHATSAPP_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label="WhatsApp Customer Service"
                              className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 active:scale-95 transition-all font-semibold group cursor-pointer"
                            >
                              <div className="p-1.5 rounded-xl bg-slate-900 group-hover:scale-110 transition-transform">
                                <WhatsAppLogo className="w-5 h-5" />
                              </div>
                              <span className="text-xs">WhatsApp CS</span>
                            </a>
                            <a
                              href={CS_GMAIL_URL}
                              aria-label="Gmail Customer Service"
                              className="flex items-center justify-center gap-2.5 p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 active:scale-95 transition-all font-semibold group cursor-pointer"
                            >
                              <div className="p-1.5 rounded-xl bg-slate-900 group-hover:scale-110 transition-transform">
                                <GmailLogo className="w-5 h-5" />
                              </div>
                              <span className="text-xs">Gmail CS</span>
                            </a>
                          </div>
                          <p className="text-[11px] text-slate-400">Jam Layanan Operasional: Senin – Sabtu (08.00 – 17.00 WIB)</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. Bot Cerdas Teman Regina */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 overflow-hidden transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggleSection('bot')}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span>4. Cara Menggunakan Bot "Teman Regina"</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        expandedSection === 'bot' ? 'rotate-180 text-purple-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedSection === 'bot' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 pt-1 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-2">
                          <p>• Di pojok kanan bawah layar ponsel Anda terdapat tombol melayang <b>"Teman Regina"</b> berikon asisten cerdas.</p>
                          <p>• Anda dapat bertanya seputar:</p>
                          <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-700/60 space-y-1 text-slate-300 font-mono text-xs">
                            <p>💬 "Berapa persen bunga koperasi?"</p>
                            <p>💬 "Kapan tanggal buka pendaftaran koperasi?"</p>
                            <p>💬 "Bagaimana syarat cuti 1 tahun?"</p>
                            <p>💬 "Bisa takeover pinjaman tidak?"</p>
                          </div>
                          <p>• Bot akan membalas otomatis secara pintar dan instan kapan saja 24 jam nonstop.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 5. Donasi Pengembangan */}
                <div className="rounded-2xl border border-slate-800 bg-slate-800/40 overflow-hidden transition-all duration-200">
                  <button
                    type="button"
                    onClick={() => toggleSection('donasi')}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm sm:text-base text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                        <HeartHandshake className="w-4 h-4" />
                      </div>
                      <span>5. Bantuan Donasi Pengembangan Aplikasi</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${
                        expandedSection === 'donasi' ? 'rotate-180 text-pink-400' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedSection === 'donasi' && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="p-4 pt-1 border-t border-slate-800/80 text-xs sm:text-sm text-slate-300 leading-relaxed space-y-3">
                          <p>Aplikasi E-KOPI dikembangkan secara mandiri untuk kemudahan seluruh karyawan. Dukungan donasi sukarela Anda sangat berharga untuk pemeliharaan server dan pengembangan fitur lanjutan.</p>
                          
                          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl shadow-inner text-slate-900">
                            <div className="text-center font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                              Scan QRIS Donasi E-KOPI
                            </div>
                            <div
                              onClick={() => setShowQrModal(true)}
                              className="relative cursor-pointer group rounded-xl overflow-hidden border-2 border-slate-300 shadow-md hover:scale-105 transition-transform"
                            >
                              <Image
                                src={qrisUrl}
                                alt="QRIS Donasi"
                                width={180}
                                height={180}
                                className="object-contain"
                              />
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold gap-1">
                                <Maximize2 className="w-4 h-4" />
                                Perbesar QR
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-500 mt-2 text-center">
                              Mendukung GoPay, OVO, DANA, ShopeePay & Semua Mobile Banking
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer / Agree Button */}
              <div className="p-4 sm:p-5 border-t border-slate-800/80 bg-slate-900/90 backdrop-blur-md">
                <button
                  type="button"
                  onClick={handleAgree}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 active:scale-[0.98] transition-all duration-150 cursor-pointer border border-blue-400/40"
                >
                  <CheckCircle2 className="w-5 h-5 text-blue-200" />
                  <span>Saya Mengerti & Setuju</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Fullscreen Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full bg-white rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center"
            >
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="font-extrabold text-slate-900 text-lg mb-1">QRIS Donasi E-KOPI</div>
              <p className="text-xs text-slate-500 mb-4">Scan langsung dari aplikasi m-banking atau e-wallet Anda</p>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
                <Image
                  src={qrisUrl}
                  alt="QRIS Donasi Full"
                  width={260}
                  height={260}
                  className="object-contain rounded-xl"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full py-2.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition-colors"
              >
                Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
