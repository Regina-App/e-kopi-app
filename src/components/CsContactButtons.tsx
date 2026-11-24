import React from 'react'

export const CS_WHATSAPP_URL =
  'https://wa.me/6282228924328?text=Halo%20Tim%20Customer%20Service%20E-KOPI%20By%20Regina%20-%20App%2C%20saya%20butuh%20bantuan%20terkait%20penggunaan%20aplikasi%20ini.'

export const CS_GMAIL_URL =
  'mailto:mohammadrizal6666@gmail.com?subject=Bantuan%20Aplikasi%20E-KOPI%20By%20Regina%20-%20App&body=Halo%20Tim%20Customer%20Service%20E-KOPI%20By%20Regina%20-%20App%2C%0A%0ASaya%20membutuhkan%20bantuan%20terkait%20aplikasi%20E-KOPI%20By%20Regina%20-%20App.%0A%0A-%20NIK%20%2F%20Nama%20Karyawan%3A%20%0A-%20Kendala%20%2F%20Pertanyaan%3A%20%0A%0ATerima%20kasih.'

export function WhatsAppLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M20.52 3.48A11.93 11.93 0 0012.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.16 1.6 5.98L0 24l6.23-1.63a11.93 11.93 0 005.83 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.2-3.52-8.43zM12.06 21.88h-.01a9.92 9.92 0 01-5.06-1.39l-.36-.22-3.76.99 1-3.66-.24-.38a9.9 9.9 0 01-1.52-5.25c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.03 7.03 2.91a9.9 9.9 0 012.91 7.03c0 5.48-4.46 9.92-9.94 9.92zm5.45-7.44c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.8.37-.27.3-1.05 1.03-1.05 2.51s1.08 2.91 1.23 3.11c.15.2 2.12 3.24 5.14 4.54.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"
        fill="#25D366"
      />
    </svg>
  )
}

export function GmailLogo({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.49l8.073-5.997C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
      <path
        d="M0 5.457c0-.986.545-1.891 1.418-2.355l10.582 7.89L12 11.73l-10.582-7.89C.545 3.376 0 4.281 0 5.267v.19z"
        fill="#C5221F"
      />
      <path
        d="M24 5.457c0-.986.545-1.891-1.418-2.355l-10.582 7.89L12 11.73l10.582-7.89c.873.464 1.418 1.369 1.418 2.355v.19z"
        fill="#C5221F"
      />
      <path
        d="M0 5.457l12 8.945 12-8.945v-.19C24 3.239 21.69 2.085 20.073 3.299L12 9.296 3.927 3.299C2.309 2.085 0 3.239 0 5.267v.19z"
        fill="#4285F4"
      />
      <path
        d="M18.545 11.73V21h3.819c.904 0 1.636-.732 1.636-1.636V5.457L18.545 11.73z"
        fill="#34A853"
      />
      <path
        d="M0 5.457v13.909C0 20.268.732 21 1.636 21h3.819V11.73L0 5.457z"
        fill="#FBBC04"
      />
    </svg>
  )
}
