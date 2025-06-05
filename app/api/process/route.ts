import { NextRequest, NextResponse } from 'next/server';
import AdmZip from 'adm-zip';
import * as XLSX from 'xlsx';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }
  const arrayBuffer = await file.arrayBuffer();
  const zip = new AdmZip(Buffer.from(arrayBuffer));
  const entries = zip.getEntries();

  const excelData: Record<string, unknown[]> = {};

  for (const entry of entries) {
    if (entry.entryName.match(/\.xlsx?$/)) {
      const workbook = XLSX.read(entry.getData(), { type: 'buffer' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      excelData[entry.entryName] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    }
  }

  return NextResponse.json({ files: entries.map(e => e.entryName), excelData });
}
