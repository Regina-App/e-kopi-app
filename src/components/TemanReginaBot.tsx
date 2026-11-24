'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  GripHorizontal,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react'

interface Message {
  id: string
  sender: 'bot' | 'user'
  text: string
  timestamp: string
}

const QUICK_QUESTIONS = [
  'Berapa bunga pinjaman koperasi?',
  'Kapan tanggal buka koperasi?',
  'Kapan tanggal potongan angsuran?',
  'Apa syarat mengajukan cuti?',
  'Bagaimana cara takeover pinjaman?',
  'Kapan surat cuti PDF bisa diunduh?',
  'Berapa limit pinjaman maksimal?',
  'Apakah ada jaminan saat pinjam?',
]

// Animated Lively Robot Mascot Component
function RobotMascotIcon({ className = 'w-10 h-10', isWaving = false }: { className?: string; isWaving?: boolean }) {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md overflow-visible"
      >
        {/* Antenna with Animated Pulsing Beacon */}
        <line x1="50" y1="20" x2="50" y2="8" stroke="#60A5FA" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="7" r="5" fill="#3B82F6" />
        <circle cx="50" cy="7" r="3" fill="#FBBF24" className="animate-ping origin-center" />

        {/* Head Shell - Sleek Rounded Robot Dome */}
        <rect x="20" y="20" width="60" height="48" rx="20" fill="url(#botGradient)" stroke="#93C5FD" strokeWidth="2.5" />

        {/* Ear Headset Pads */}
        <rect x="14" y="32" width="7" height="24" rx="3.5" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1.5" />
        <rect x="79" y="32" width="7" height="24" rx="3.5" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="1.5" />

        {/* Visor Screen Face */}
        <rect x="27" y="27" width="46" height="34" rx="14" fill="#0F172A" stroke="#1E293B" strokeWidth="1.5" />

        {/* Glowing Expressive Eyes */}
        <g>
          {/* Left Eye */}
          <ellipse cx="39" cy="42" rx="5" ry="6" fill="#38BDF8" className="animate-pulse" />
          <circle cx="41" cy="40" r="2" fill="#FFFFFF" />

          {/* Right Eye */}
          <ellipse cx="61" cy="42" rx="5" ry="6" fill="#38BDF8" className="animate-pulse" />
          <circle cx="63" cy="40" r="2" fill="#FFFFFF" />
        </g>

        {/* Cute Blushing Cheeks */}
        <ellipse cx="33" cy="49" rx="3" ry="1.5" fill="#F43F5E" opacity="0.6" />
        <ellipse cx="67" cy="49" rx="3" ry="1.5" fill="#F43F5E" opacity="0.6" />

        {/* Friendly Robot Smile */}
        <path d="M44 51 Q50 56 56 51" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* Robot Body / Collar with Coffee Shield Badge */}
        <path d="M34 68 L66 68 L60 84 L40 84 Z" fill="#1E3A8A" stroke="#60A5FA" strokeWidth="2" />
        <circle cx="50" cy="76" r="4" fill="#F59E0B" />

        {/* Gradients */}
        <defs>
          <linearGradient id="botGradient" x1="20" y1="20" x2="80" y2="68" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="0.5" stopColor="#1D4ED8" />
            <stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export default function TemanReginaBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showGreetingBubble, setShowGreetingBubble] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Floating button drag constraints ref
  const constraintsRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Halo! Saya Teman Regina, robot asisten cerdas E-KOPI. Ada yang bisa saya bantu seputar pengajuan cuti, pinjaman koperasi, atau aturan aplikasi?',
      timestamp: 'Baru saja',
    },
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      setShowGreetingBubble(false)
      scrollToBottom()
    }
  }, [messages, isOpen, isTyping])

  // Dismiss greeting bubble after 10 seconds if not clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGreetingBubble(false)
    }, 10000)
    return () => clearTimeout(timer)
  }, [])

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase()

    // 1. Koperasi Bunga
    if (q.includes('bunga') || q.includes('rate') || q.includes('persen')) {
      return 'Suku bunga pinjaman koperasi adalah flat 2,5% per bulan dari nominal pinjaman awal. Rumusnya:\n• Bunga = Pinjaman Pokok x 2,5%\n• Pokok bulanan = Pinjaman / Tenor\n• Total angsuran per bulan = Pokok + Bunga.'
    }

    // 2. Koperasi Tanggal Buka
    if (q.includes('buka') || q.includes('periode') || q.includes('kapan pinjam')) {
      return 'Pengajuan pinjaman koperasi dibuka mulai tanggal 8 hingga tanggal 28 setiap bulannya. Di luar tanggal tersebut formulir pengajuan otomatis terkunci oleh sistem.'
    }

    // 3. Tanggal Potongan Angsuran
    if (q.includes('potong') || q.includes('jadwal') || q.includes('tanggal 5') || q.includes('bayar')) {
      return 'Pemotongan angsuran koperasi karyawan dijadwalkan otomatis setiap tanggal 5 setiap bulannya melalui pemotongan gaji resmi.'
    }

    // 4. Tenor / Pinjaman Maksimal
    if (q.includes('tenor') || q.includes('maksimal') || q.includes('berapa kali') || q.includes('limit')) {
      return 'Tenor pinjaman maksimal standar adalah 4 kali (4 bulan) dengan batas maksimal pinjaman hingga Rp10.000.000 (dapat disesuaikan oleh Super Admin melalui Panel Master Pengaturan).'
    }

    // 5. Takeover Pinjaman
    if (q.includes('takeover') || q.includes('belum lunas') || q.includes('pinjam lagi') || q.includes('ganti pinjaman')) {
      return 'Anda bisa melakukan Takeover pinjaman baru meskipun pinjaman lama belum lunas! Syaratnya: Nominal pinjaman baru wajib lebih besar dari sisa kewajiban pinjaman lama. Sistem akan otomatis melunasi pinjaman lama dan mencairkan sisa dana bersih untuk Anda.'
    }

    // 6. Jaminan Peminjam Pertama
    if (q.includes('jaminan') || q.includes('ijazah') || q.includes('pertama') || q.includes('syarat pinjam')) {
      return 'Peminjam baru yang pertama kali mengajukan wajib membawa Ijazah Satpam asli atau Ijazah pendidikan terakhir asli saat verifikasi pencairan dana di kantor.'
    }

    // 7. Syarat Cuti
    if (q.includes('syarat cuti') || q.includes('cuti 1 tahun') || q.includes('tmt') || q.includes('masa kerja')) {
      return 'Syarat mengajukan cuti tahunan adalah masa kerja minimal 1 tahun (dihitung otomatis dari TMT Kerja saat pendaftaran). Kuota standar adalah 12 hari/tahun yang dikelola admin perusahaan.'
    }

    // 8. Cara Ajukan Cuti
    if (q.includes('cara cuti') || q.includes('ajukan cuti') || q.includes('kalender') || q.includes('tanggal')) {
      return 'Buka menu "Cuti" ➡️ "Ajukan Cuti". Pilih tanggal-tanggal spesifik di kalender (hari libur/off tidak perlu dipilih). Isi alasan cuti dan kontak darurat aktif, lalu kirim.'
    }

    // 9. Surat Cuti PDF
    if (q.includes('surat cuti') || q.includes('pdf') || q.includes('cetak') || q.includes('download')) {
      return 'Surat cuti resmi format PDF A4 dapat diunduh pada menu "Riwayat Cuti" segera setelah pengajuan Anda berstatus "Disetujui" (Approved) oleh Admin. Surat dilengkapi nomor resmi, barcode verifikasi, dan kolom tanda tangan (Pengaju, Danru, Kasatgas).'
    }

    // 10. Login / NIK / Session
    if (q.includes('login') || q.includes('nik') || q.includes('password') || q.includes('sesi') || q.includes('otp')) {
      return 'Karyawan login menggunakan 16 digit NIK KTP tanpa password, diverifikasi dengan kode OTP via email/HP. Sesi login tersimpan aman selama 30 hari di smartphone Anda.'
    }

    // 11. Greeting
    if (q.includes('halo') || q.includes('hai') || q.includes('pagi') || q.includes('siang') || q.includes('malam') || q.includes('sore')) {
      return 'Halo! Senang bisa menyapa Anda. Saya Teman Regina siap membantu kapan saja. Ada hal seputar cuti atau koperasi yang ingin Anda tanyakan?'
    }

    // 12. Terima kasih
    if (q.includes('makasih') || q.includes('terima kasih') || q.includes('thanks')) {
      return 'Sama-sama! Senang bisa membantu Anda. Jika ada hal lain yang ingin ditanyakan seputar E-KOPI, silakan klik pertanyaan di bawah atau ketik langsung ya!'
    }

    // Default Fallback
    return 'Pertanyaan bagus! Mengenai ' + query + ', silakan cek menu Cuti atau Koperasi di aplikasi Anda. Anda juga dapat menghubungi Customer Service resmi E-KOPI By Regina - App melalui tombol WhatsApp CS atau Gmail CS jika membutuhkan asistensi admin.'
  }

  const handleSend = (textToSend?: string) => {
    const query = textToSend || input
    if (!query.trim()) return

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate smart thinking delay
    setTimeout(() => {
      const botAnswer = generateAnswer(query)
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: botAnswer,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMsg])
      setIsTyping(false)
    }, 550)
  }

  return (
    <>
      {/* Draggable Mascot Trigger Container */}
      <motion.div
        drag
        dragMomentum={false}
        dragElastic={0.1}
        className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9990] cursor-grab active:cursor-grabbing touch-none select-none"
        title="Geser posisi bot atau klik untuk bertanya"
      >
        {/* Floating Greeting Speech Bubble (Auto-shows on load) */}
        <AnimatePresence>
          {showGreetingBubble && !isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-14 right-0 w-48 bg-slate-900/95 text-white text-[11px] font-semibold py-2 px-3 rounded-2xl shadow-xl border border-blue-400/40 backdrop-blur-md flex items-center justify-between pointer-events-auto"
            >
              <span className="leading-tight">Hai! Tanya Teman Regina 🤖</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowGreetingBubble(false)
                }}
                className="text-slate-400 hover:text-white p-0.5 ml-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mascot Button */}
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-2xl shadow-blue-500/40 border-2 border-blue-300/50 group"
        >
          {/* Bobbing Mascot Avatar */}
          <motion.div
            animate={{
              y: [0, -4, 0],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="w-10 h-10 flex items-center justify-center relative"
          >
            <RobotMascotIcon className="w-10 h-10" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </motion.div>

          <div className="flex flex-col text-left pr-1">
            <span className="text-xs font-black leading-tight flex items-center gap-1 text-white">
              Teman Regina
              <Sparkles className="w-3 h-3 text-amber-300 animate-spin" />
            </span>
            <span className="text-[10px] text-blue-200 font-semibold flex items-center gap-1">
              <span>Asisten Pintar</span>
              <GripHorizontal className="w-2.5 h-2.5 opacity-60" />
            </span>
          </div>
        </motion.button>
      </motion.div>

      {/* Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 25 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-20 z-[9995] w-auto sm:w-[410px] h-[540px] max-h-[85vh] rounded-3xl bg-slate-900/95 text-white shadow-2xl border-2 border-blue-500/40 flex flex-col overflow-hidden backdrop-blur-2xl"
          >
            {/* Header with Robot Character */}
            <div className="p-3.5 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="w-11 h-11 rounded-2xl bg-white/10 p-1 border border-white/30 flex items-center justify-center">
                  <RobotMascotIcon className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-sm font-black flex items-center gap-1.5 text-white">
                    Teman Regina
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500 text-white rounded-full">
                      Aktif 24/7
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-100 font-medium">Asisten Pintar Karyawan E-KOPI</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMessages([
                      {
                        id: `reset-${Date.now()}`,
                        sender: 'bot',
                        text: 'Obrolan telah disegarkan. Ada yang bisa saya bantu lagi?',
                        timestamp: 'Baru saja',
                      },
                    ])
                  }}
                  title="Bersihkan Obrolan"
                  className="p-1.5 rounded-full hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
                  title="Tutup Chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Questions Chips */}
            <div className="p-2.5 bg-slate-950/70 border-b border-slate-800 overflow-x-auto flex gap-2 no-scrollbar">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-blue-600/20 text-blue-200 border border-blue-500/30 hover:bg-blue-600/30 active:scale-95 transition-all text-left whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Messages Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-950/40 to-slate-900/60">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {msg.sender === 'bot' ? (
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-blue-600/30 p-1 border border-blue-400/40 flex items-center justify-center">
                      <RobotMascotIcon className="w-7 h-7" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                      <User className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none font-medium'
                        : 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/80 font-normal whitespace-pre-line'
                    }`}
                  >
                    <p>{msg.text}</p>
                    <span className="block mt-1 text-[9px] text-right opacity-60">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs pl-1">
                  <div className="w-7 h-7 rounded-xl bg-blue-600/20 flex items-center justify-center">
                    <RobotMascotIcon className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[10px] text-slate-300 ml-1">Teman Regina mengetik...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanyakan sesuatu pada Teman Regina..."
                className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
