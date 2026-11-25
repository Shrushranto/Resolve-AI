import { AlertCircle } from 'lucide-react'

export default function ErrorAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
      <AlertCircle size={18} className="mt-0.5 shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
