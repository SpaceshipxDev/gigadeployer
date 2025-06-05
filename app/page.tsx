'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function Home() {
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const formData = new FormData()
    for (const f of acceptedFiles) {
      formData.append('files', f, f.webkitRelativePath || f.name)
    }
    formData.append('file', acceptedFiles[0])
    setStatus('Processing...')
    const res = await fetch('/api/process', { method: 'POST', body: formData })
    if (res.ok) {
      const blob = await res.blob()
      setDownloadUrl(URL.createObjectURL(blob))
      setStatus('Done')
    } else {
      setStatus('Error: ' + (await res.text()))
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    useFsAccessApi: false,
  })
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
      <div {...getRootProps({ className: 'border border-dashed p-10 text-center' })}>
        <input
          {...getInputProps()}
          multiple
          {...({ webkitdirectory: 'true', directory: '' } as any)}
        />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag 'n' drop a folder here, or click to select</p>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag 'n' drop a zip file here, or click to select</p>
        )}
      </div>
      {status && <p className="mt-4">{status}</p>}
      {downloadUrl && (
        <a
          href={downloadUrl}
          download="results.zip"
          className="mt-2 rounded bg-blue-500 px-4 py-2 text-white"
        >
          Download Results
        </a>
      )}
    </main>
  )
}
