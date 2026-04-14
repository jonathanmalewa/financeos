import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { readFile } from "fs/promises"
import path from "path"
import { existsSync } from "fs"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const filename = searchParams.get("file")

  if (!filename) {
    return NextResponse.json({ error: "Filename is required" }, { status: 400 })
  }

  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename)
  const targetDir = path.join(process.cwd(), "public", "uploads")
  const filepath = path.join(targetDir, safeFilename)

  if (!existsSync(filepath)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 })
  }

  try {
    const fileBuffer = await readFile(filepath)
    
    // Determine mime type based on extension
    const ext = path.extname(safeFilename).toLowerCase()
    let mimeType = "application/octet-stream"
    if (ext === ".pdf") mimeType = "application/pdf"
    else if (ext === ".png") mimeType = "image/png"
    else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg"
    else if (ext === ".txt") mimeType = "text/plain"
    else if (ext === ".xlsx") mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else if (ext === ".docx") mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
      },
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Failed to read file from Google Drive desktop" }, { status: 500 })
  }
}
