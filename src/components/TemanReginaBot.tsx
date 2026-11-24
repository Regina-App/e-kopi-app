'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  HelpCircle,
  Calendar,
  Landmark,
  ShieldCheck,
  RefreshCw,
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
]

export default function TemanReginaBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'Halo! Saya Teman Regina, asisten pintar E-KOPI. Ada yang bisa saya bantu terkait pengajuan cuti, pinjaman koperasi, atau aturan aplikasi?',
      timestamp: 'Baru saja',
    },
  ])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isTyping])

  const generateAnswer = (query: string): string => {
    const q = query.toLowerCase()

    // 1. Koperasi Bunga
    if (q.includes('bunga') || q.includes('rate') || q.includes('persen')) {
      return 'Suku bunga pinjaman koperasi adalah flat 2,5% per bulan dari nominal pinjaman awal. Rumusnya: Bunga = Pinjaman Pokok x 2,5%. Pokok bulanan = Pinjaman / Tenor. Total angsuran per bulan = Pokok + Bunga.'
    }

    // 2. Koperasi Tanggal Buka
    if (q.includes('buka') || q.includes('periode') || q.includes('kapan pinjam')) {
      return 'Pengajuan pinjaman koperasi dibuka mulai tanggal 8 hingga tanggal 28 setiap bulannya. Di luar tanggal tersebut, formulir pengajuan otomatis terkunci oleh sistem.'
    }

    // 3. Tanggal Potongan Angsuran
    if (q.includes('potong') || q.includes('jadwal') || q.includes('tanggal 5') || q.includes('bayar')) {
      return 'Pemotongan angsuran koperasi karyawan dijadwalkan otomatis setiap tanggal 5 setiap bulan.'
    }

    // 4. Tenor / Pinjaman Maksimal
    if (q.includes('tenor') || q.includes('maksimal') || q.includes('berapa kali') || q.includes('limit')) {
      return 'Tenor pinjaman maksimal standar adalah 4 kali (4 bulan) dengan batas maksimal pinjaman hingga Rp10.000.000 (dapat disesuaikan oleh Super Admin melalui Panel Pengaturan).'
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
      return 'Syarat mengajukan cuti tahunan adalah masa kerja minimal 1 tahun (dihitung otomatis dari TMT Kerja saat pendaftaran). Kuota standar adalah 12 hari/tahun yang diisi oleh admin perusahaan. Sisa cuti dapat diakumulasikan ke tahun berikutnya.'
    }

    // 8. Cara Ajukan Cuti
    if (q.includes('cara cuti') || q.includes('ajukan cuti') || q.includes('kalender') || q.includes('tanggal')) {
      return 'Buka menu "Cuti" ➡️ "Ajukan Cuti". Pilih tanggal-tanggal spesifik di kalender (tanggal libur/off tidak perlu dipilih). Isi alasan cuti dan nomor kontak darurat yang aktif, lalu kirim pengajuan.'
    }

    // 9. Surat Cuti PDF
    if (q.includes('surat cuti') || q.includes('pdf') || q.includes('cetak') || q.includes('download')) {
      return 'Surat cuti resmi format PDF A4 dapat diunduh pada menu "Riwayat Cuti" segera setelah pengajuan Anda disetujui (Approved) oleh Admin. Surat cuti dilengkapi nomor resmi, kode verifikasi, dan area tanda tangan (Pengaju, Danru, dan Kasatgas/PJ Operasional).'
    }

    // 10. Login / NIK / Session
    if (q.includes('login') || q.includes('nik') || q.includes('password') || q.includes('sesi') || q.includes('otp')) {
      return 'Karyawan login menggunakan 16 digit NIK KTP tanpa password, diverifikasi dengan kode OTP ke email/HP. Sesi login bertahan selama 30 hari di smartphone Anda tanpa perlu login ulang.'
    }

    // 11. Greeting
    if (q.includes('halo') || q.includes('hai') || q.includes('pagi') || q.includes('siang') || q.includes('malam') || q.includes('sore')) {
      return 'Halo! Senang bisa menyapa Anda. Saya Teman Regina siap membantu kapan saja. Ada hal seputar cuti atau koperasi yang ingin ditanyakan?'
    }

    // 12. Terima kasih
    if (q.includes('makasih') || q.includes('terima kasih') || q.includes('thanks')) {
      return 'Sama-sama! Senang bisa membantu Anda. Jika ada pertanyaan lainnya, jangan ragu bertanya lagi ya!'
    }

    // Default Fallback
    return 'Pertanyaan menarik! Mengenai ' + query + ', silakan cek menu Cuti atau Koperasi di aplikasi Anda. Anda juga bisa menghubungi Customer Service resmi E-KOPI By Regina - App melalui tombol WhatsApp CS atau Gmail CS di halaman Tentang & Announcement jika membutuhkan bantuan langsung.'
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
    }, 600)
  }

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-[9990]">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-500/35 border border-blue-400/40 cursor-pointer group"
          title="Tanya Teman Regina (AI Assistant)"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>

          <div className="w-7 h-7 rounded-full bg-white/10 p-0.5 flex items-center justify-center overflow-hidden">
            <Image
              src="/images/logo.png"
              alt="Teman Regina"
              width={26}
              height={26}
              className="rounded-full object-cover"
            />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-bold leading-tight flex items-center gap-1">
              Teman Regina
              <Sparkles className="w-3 h-3 text-amber-300" />
            </span>
            <span className="text-[10px] text-blue-200 font-medium">Asisten Pintar</span>
          </div>
        </motion.button>
      </div>

      {/* Chat Window Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-20 z-[9995] w-auto sm:w-[400px] h-[520px] max-h-[85vh] rounded-3xl bg-slate-900 text-white shadow-2xl border border-blue-500/40 flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 p-0.5 border border-white/30 flex items-center justify-center overflow-hidden">
                  <Image
                    src="/images/logo.png"
                    alt="Teman Regina"
                    width={36}
                    height={36}
                    className="rounded-xl object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold flex items-center gap-1.5 text-white">
                    Teman Regina
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500 text-white rounded-full">
                      Online
                    </span>
                  </h3>
                  <p className="text-[11px] text-blue-100">Asisten Cerdas Karyawan E-KOPI</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Questions Chips */}
            <div className="p-2.5 bg-slate-950/60 border-b border-slate-800 overflow-x-auto custom-scrollbar flex gap-2">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-medium bg-blue-500/15 border border-blue-400/30 text-blue-300 hover:bg-blue-500/25 active:scale-95 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Message Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-gradient-to-b from-slate-900 to-slate-950">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-md ${
                      m.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none font-medium'
                        : 'bg-slate-800/90 text-slate-100 rounded-tl-none border border-slate-700/60'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span
                      className={`block text-[9px] mt-1.5 ${
                        m.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                      }`}
                    >
                      {m.timestamp}
                    </span>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-800 rounded-2xl rounded-tl-none px-3 py-2 flex items-center gap-1 border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]"></span>
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
              className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tanya seputar cuti, koperasi..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white transition-all shadow-md active:scale-95 cursor-pointer"
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
