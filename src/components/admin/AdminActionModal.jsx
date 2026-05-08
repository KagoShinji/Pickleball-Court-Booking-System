import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui';

export function AdminActionModal({
    isOpen,
    onClose,
    title,
    description,
    action,
    confirmLabel = 'Confirm',
    variant = 'primary',
    successTitle = 'Success!',
    successDescription = 'The action has been completed successfully.',
    onSuccess // Optional callback after success state is dismissed
}) {
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setErrorMessage('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        try {
            setStatus('loading');
            await action();
            setStatus('success');
        } catch (err) {
            console.error('Action failed:', err);
            setStatus('error');
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    const handleClose = () => {
        if (status === 'success' && onSuccess) {
            onSuccess();
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={status !== 'loading' ? handleClose : undefined}></div>

            <div className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200 overflow-hidden">

                {status === 'idle' && (
                    <div className="text-center space-y-4">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-primary-light text-primary-dark'}`}>
                            <AlertTriangle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                            <p className="text-gray-500 mt-2 text-sm">{description}</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" className="flex-1" onClick={handleClose}>Cancel</Button>
                            <Button variant={variant} className="flex-1" onClick={handleConfirm}>{confirmLabel}</Button>
                        </div>
                    </div>
                )}

                {status === 'loading' && (
                    <div className="text-center py-8 space-y-4">
                        <div className="flex justify-center">
                            <Loader2 className="animate-spin text-primary" size={48} />
                        </div>
                        <p className="text-gray-500 font-medium">Processing...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center space-y-4 animate-in slide-in-from-bottom duration-300">
                        <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                            <CheckCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{successTitle}</h3>
                            <p className="text-gray-500 mt-2 text-sm">{successDescription}</p>
                        </div>
                        <div className="pt-2">
                            <Button className="w-full text-white" onClick={handleClose}>Done</Button>
                        </div>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center space-y-4 animate-in slide-in-from-bottom duration-300">
                        <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                            <XCircle size={32} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Error</h3>
                            <p className="text-red-500 mt-2 text-sm">{errorMessage}</p>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" className="flex-1" onClick={handleClose}>Close</Button>
                            <Button variant="primary" className="flex-1" onClick={() => setStatus('idle')}>Try Again</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
