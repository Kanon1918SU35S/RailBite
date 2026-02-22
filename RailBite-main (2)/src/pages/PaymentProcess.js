import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { paymentAPI } from '../services/api';
import Toast from '../components/Toast';

/**
 * PaymentProcess page – handles payment in dev mode.
 * In production with SSLCommerz, the user is redirected to the gateway directly.
 * This page simulates the payment flow for development/testing.
 */
const PaymentProcess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const tranId = searchParams.get('tran_id');
    const amount = searchParams.get('amount');
    const orderNumber = searchParams.get('order');

    const [processing, setProcessing] = useState(false);
    const [toast, setToast] = useState(null);

    const handleConfirmPayment = async () => {
        const token = localStorage.getItem('railbiteToken');
        if (!token) {
            setToast({ message: 'Please login to continue', type: 'error' });
            return;
        }

        setProcessing(true);
        try {
            const res = await paymentAPI.confirmDev({ transactionId: tranId }, token);
            if (res.data.success) {
                setToast({ message: 'Payment successful!', type: 'success' });
                setTimeout(() => {
                    navigate(`/payment-result?status=success&order=${orderNumber}&tran_id=${tranId}`);
                }, 1500);
            } else {
                setToast({ message: res.data.message || 'Payment failed', type: 'error' });
            }
        } catch (err) {
            setToast({ message: err.response?.data?.message || 'Payment failed', type: 'error' });
        } finally {
            setProcessing(false);
        }
    };

    const handleCancelPayment = () => {
        navigate(`/payment-result?status=cancelled&tran_id=${tranId}`);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f0f23, #1a1a2e)',
            padding: '2rem'
        }}>
            <div style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '20px',
                padding: '3rem',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                <h2 style={{ color: '#fff', marginBottom: '0.5rem' }}>Secure Payment Gateway</h2>
                <p style={{ color: '#b0b0b0', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Development Mode — SSLCommerz Simulation
                </p>

                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                        <span style={{ color: '#b0b0b0' }}>Order</span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{orderNumber || 'N/A'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                        <span style={{ color: '#b0b0b0' }}>Transaction ID</span>
                        <span style={{ color: '#fff', fontWeight: '600', fontSize: '0.85rem' }}>{tranId || 'N/A'}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        paddingTop: '0.8rem',
                        borderTop: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <span style={{ color: '#b0b0b0' }}>Amount</span>
                        <span style={{ color: '#f97316', fontWeight: '700', fontSize: '1.3rem' }}>৳{amount || '0'}</span>
                    </div>
                </div>

                <div style={{
                    background: 'rgba(249,115,22,0.1)',
                    border: '1px solid rgba(249,115,22,0.3)',
                    borderRadius: '10px',
                    padding: '1rem',
                    marginBottom: '2rem',
                    fontSize: '0.85rem',
                    color: '#f97316'
                }}>
                    ⚠️ This is a development simulation. In production, you would be redirected to SSLCommerz's secure payment page.
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={handleCancelPayment}
                        style={{
                            flex: 1,
                            padding: '0.9rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirmPayment}
                        disabled={processing}
                        style={{
                            flex: 2,
                            padding: '0.9rem',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #28a745, #20c997)',
                            color: '#fff',
                            cursor: processing ? 'wait' : 'pointer',
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            opacity: processing ? 0.7 : 1
                        }}
                    >
                        {processing ? 'Processing...' : `Pay ৳${amount || '0'}`}
                    </button>
                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default PaymentProcess;
