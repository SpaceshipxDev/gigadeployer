import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import * as XLSX from 'xlsx'
import fs from 'fs/promises'
import os from 'os'
import path from 'path'
import { promisify } from 'util'
import { execFile } from 'child_process'
import ExcelJS from 'exceljs'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { XMLParser } from 'fast-xml-parser'

const exec = promisify(execFile)

function extractPptxText(buffer: Buffer) {
  const zip = new AdmZip(buffer)
  const entries = zip
    .getEntries()
    .filter((e) => e.entryName.match(/^ppt\/slides\/slide\d+\.xml$/))
  const parser = new XMLParser()
  let text = ''
  for (const e of entries) {
    const xml = e.getData().toString('utf8')
    const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || []
    for (const m of matches) {
      text += m.replace(/<[^>]+>/g, '') + ' '
    }
  }
  return text
}

async function screenshotSTP(file: string, outDir: string) {
  const outPath = path.join(outDir, path.basename(file) + '.png')
  try {
    await exec('python3', ['scripts/stp_screenshot.py', file, outPath])
    const b64 = await fs.readFile(outPath, { encoding: 'base64' })
    return b64
  } catch (e) {
    console.error('screenshot error', e)
    return ''
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file')
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'order-'))
  const zip = new AdmZip(Buffer.from(await file.arrayBuffer()))
  zip.extractAllTo(tmpDir, true)
  const entries = await fs.readdir(tmpDir)

  const excelFiles = entries.filter((f) => f.match(/\.xlsx?$/i))
  const pptxFiles = entries.filter((f) => f.match(/\.pptx$/i))
  const stpFiles = entries.filter((f) => f.match(/\.stp$/i))

  const excelData: Record<string, unknown[]> = {}
  for (const f of excelFiles) {
    const buf = await fs.readFile(path.join(tmpDir, f))
    const workbook = XLSX.read(buf, { type: 'buffer' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    excelData[f] = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  }

  let pptxText = ''
  for (const f of pptxFiles) {
    const buf = await fs.readFile(path.join(tmpDir, f))
    pptxText += extractPptxText(buf) + '\n'
  }

  const images: Record<string, string> = {}
  for (const f of stpFiles) {
    images[f] = await screenshotSTP(path.join(tmpDir, f), tmpDir)
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt =
    'Match each part with its quantity, material and finish. ' +
    'Return JSON array with fields part, quantity, material, finish.'

  const docs = JSON.stringify({ excelData, pptxText, parts: Object.keys(images) })
  const result = await model.generateContent([prompt, docs])
  const text = result.response.text()

  let parsed: any[] = []
  try {
    parsed = JSON.parse(text)
  } catch (e) {
    console.error('gemini json parse', e)
  }

  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Manufacturing Log')
  sheet.columns = [
    { header: 'Part', key: 'part', width: 30 },
    { header: 'Quantity', key: 'quantity', width: 10 },
    { header: 'Material', key: 'material', width: 20 },
    { header: 'Finish', key: 'finish', width: 20 },
  ]
  for (const row of parsed) {
    sheet.addRow({
      part: row.part,
      quantity: row.quantity,
      material: row.material,
      finish: row.finish,
    })
  }
  const excelPath = path.join(tmpDir, 'manufacturing_log.xlsx')
  await workbook.xlsx.writeFile(excelPath)

  const outZip = new AdmZip()
  outZip.addLocalFile(excelPath)
  const buffer = outZip.toBuffer()

  await fs.rm(tmpDir, { recursive: true, force: true })

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename=results.zip',
    },
  })
}
