import React, { useEffect } from 'react';
import { XIcon } from './Icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const SuccessIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

const ErrorIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);


export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Auto-close after 5 seconds
    return () => clearTimeout(timer);
  }, [onClose]);

  const baseClasses = 'fixed top-5 right-5 z-50 flex items-center p-4 max-w-sm w-full rounded-lg shadow-2xl text-white animate-in fade-in-0 slide-in-from-top-4';
  const typeClasses = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';

  return (
    <div className={`${baseClasses} ${typeClasses}`} role="alert">
      <div className="mr-3">
        {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
      </div>
      <div className="flex-1 font-semibold">{message}</div>
      <button onClick={onClose} className="ml-3 -mr-1 p-1 rounded-md hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white" aria-label="Close">
        <XIcon className="h-5 w-5" />
      </button>
    </div>
  );
};
