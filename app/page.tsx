'use client'
import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

export default function Home() {
  const [result, setResult] = useState<any>(null)
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return
    const formData = new FormData()
    formData.append('file', acceptedFiles[0])
    const res = await fetch('/api/process', { method: 'POST', body: formData })
    if (res.ok) {
      setResult(await res.json())
    } else {
      setResult({ error: await res.text() })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop })

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
      <div {...getRootProps({ className: 'border border-dashed p-10 text-center' })}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here...</p>
        ) : (
          <p>Drag 'n' drop a zip file here, or click to select</p>
        )}
      </div>
      {result && (
        <pre className="mt-4 w-full max-w-xl overflow-auto bg-gray-100 p-4 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  )
}
