'use client';

interface StatusBannerProps {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

export default function StatusBanner({ type, message, onDismiss }: StatusBannerProps) {
  const bgClass = type === 'success' ? 'bg-green-800 border-green-600' : 'bg-red-900 border-red-600';

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${bgClass} text-white text-sm`}>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-4 text-white hover:text-gray-200 font-bold text-lg leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
