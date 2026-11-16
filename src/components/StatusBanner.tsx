'use client';

interface StatusBannerProps {
  type: 'success' | 'error';
  message: string;
  onDismiss: () => void;
}

export default function StatusBanner({ type, message, onDismiss }: StatusBannerProps) {
  const styles = type === 'success'
    ? 'bg-green-500/10 border-green-500/30 text-green-300'
    : 'bg-red-500/10 border-red-500/30 text-red-300';

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${styles} text-sm`}>
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-4 p-0.5 hover:opacity-70 transition-opacity"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
