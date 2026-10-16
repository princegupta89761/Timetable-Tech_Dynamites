import React from 'react';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, type = 'success', onClose }) {
  if (!message) return null;

  const isError = type === 'error';
  const Icon = isError ? AlertCircle : CheckCircle2;
  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex max-w-md items-start gap-3 rounded border p-4 shadow-lg ${
        isError ? 'border-red-300 bg-red-50 text-red-800' : 'border-green-300 bg-green-50 text-green-800'
      }`}
      role={isError ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
      <p className="flex-1">{message}</p>
      <button type="button" className="shrink-0" aria-label="Dismiss notification" onClick={onClose}>
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}