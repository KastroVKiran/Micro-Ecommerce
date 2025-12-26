import React from 'react';
import { useCart } from '../context/CartContext';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const Toast = () => {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    }}>
      {toast.type === 'success' ? (
        <CheckCircle size={20} color="var(--accent-success)" />
      ) : (
        <AlertCircle size={20} color="var(--accent-primary)" />
      )}
      <span>{toast.message}</span>
    </div>
  );
};

export default Toast;
