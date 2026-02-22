import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

/**
 * PaymentResult page – shown after SSLCommerz callback or dev payment flow
 */
const PaymentResult = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const status = searchParams.get('status');
    const orderNumber = searchParams.get('order');
    const tranId = searchParams.get('tran_id');
    const message = searchParams.get('message');

    const isSuccess = status === 'success';
    const isFailed = status === 'failed';
    const isCancelled = status === 'cancelled';

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
                {/* Status icon */}
                <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
                    {isSuccess ? '✅' : isCancelled ? '⚠️' : '❌'}
                </div>

                <h2 style={{
                    color: isSuccess ? '#28a745' : isCancelled ? '#ffc107' : '#ff6b6b',
                    marginBottom: '0.5rem'
                }}>
                    {isSuccess ? 'Payment Successful!' : isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
                </h2>

                <p style={{ color: '#b0b0b0', marginBottom: '2rem', fontSize: '0.95rem' }}>
                    {isSuccess
                        ? `Your payment for order ${orderNumber || ''} has been processed successfully.`
                        : isCancelled
                            ? 'You cancelled the payment. Your order is still saved — you can pay later.'
                            : message || 'Something went wrong with your payment. Please try again.'}
                </p>

                {tranId && (
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '10px',
                        padding: '1rem',
                        marginBottom: '2rem',
                        fontSize: '0.85rem'
                    }}>
                        <span style={{ color: '#b0b0b0' }}>Transaction ID: </span>
                        <span style={{ color: '#fff', fontWeight: '600' }}>{tranId}</span>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {isSuccess && orderNumber && (
                        <button
                            onClick={() => navigate(`/order-tracking/${orderNumber}`)}
                            style={{
                                padding: '0.9rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #f97316, #ea580c)',
                                color: '#fff',
                                cursor: 'pointer',
                                fontWeight: '700',
                                fontSize: '0.95rem'
                            }}
                        >
                            🚚 Track Your Order
                        </button>
                    )}

                    <button
                        onClick={() => navigate('/order-history')}
                        style={{
                            padding: '0.9rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            background: 'transparent',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '0.95rem'
                        }}
                    >
                        📋 View Order History
                    </button>

                    <button
                        onClick={() => navigate('/')}
                        style={{
                            padding: '0.9rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.15)',
                            background: 'transparent',
                            color: '#b0b0b0',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        🏠 Back to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentResult;
