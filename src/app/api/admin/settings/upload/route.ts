import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'asset'

    if (!file) {
      return NextResponse.json({ success: false, error: 'Berkas tidak ditemukan' }, { status: 400 })
    }

    // Validate mime type
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/svg+xml',
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Format berkas tidak didukung. Harap unggah format PNG, JPG, WEBP, atau SVG.',
        },
        { status: 400 }
      )
    }

    // Size limit 5MB
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Ukuran berkas melebihi batas maksimal 5 MB' },
        { status: 400 }
      )
    }

    const fileExt = file.name.split('.').pop() || 'png'
    const cleanFilename = `${type}-${Date.now()}.${fileExt}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // 1. Try Supabase Storage
    const adminClient = createAdminClient()
    let publicUrl: string | null = null

    try {
      const { data: uploadData, error: uploadErr } = await adminClient.storage
        .from('assets')
        .upload(cleanFilename, buffer, {
          contentType: file.type,
          upsert: true,
        })

      if (!uploadErr && uploadData) {
        const { data: urlData } = adminClient.storage.from('assets').getPublicUrl(cleanFilename)
        if (urlData?.publicUrl) {
          publicUrl = urlData.publicUrl
        }
      }
    } catch (storageErr) {
      console.warn('[SettingsUpload] Supabase Storage upload skipped/failed:', storageErr)
    }

    // 2. Local Fallback in public/uploads/
    if (!publicUrl) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
      await fs.mkdir(uploadsDir, { recursive: true })
      const localFilePath = path.join(uploadsDir, cleanFilename)
      await fs.writeFile(localFilePath, buffer)
      publicUrl = `/uploads/${cleanFilename}`
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: cleanFilename,
      type,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengunggah berkas'
    console.error('[SettingsUpload:Error]', err)
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 })
  }
}
