import { NextRequest, NextResponse } from "next/server"
import { v2 as cloudinary } from "cloudinary"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const maxDuration = 60

function configCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME
  const api_key = process.env.CLOUDINARY_API_KEY
  const api_secret = process.env.CLOUDINARY_API_SECRET
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary 환경변수가 설정되지 않았습니다")
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true })
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    configCloudinary()

    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file이 필요합니다" }, { status: 400 })
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const dataUri = `data:${file.type || "application/octet-stream"};base64,${buffer.toString("base64")}`

    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: "image",
      format: isPdf ? "jpg" : undefined,
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (error) {
    console.error("POST /api/car-insurance/upload error:", error)
    return NextResponse.json({ error: "파일 업로드 중 오류가 발생했습니다" }, { status: 500 })
  }
}
