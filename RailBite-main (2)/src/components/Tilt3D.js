import React, { useRef, useCallback } from 'react';

const Tilt3D = ({ children, intensity = 15, glare = true, className = '', style = {} }) => {
    const cardRef = useRef(null);
    const glareRef = useRef(null);

    const handleMouseMove = useCallback((e) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -intensity;
        const rotateY = ((x - centerX) / centerX) * intensity;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) scale3d(1.02, 1.02, 1.02)`;

        if (glare && glareRef.current) {
            const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI);
            glareRef.current.style.background = `linear-gradient(${angle + 180}deg, rgba(255,255,255,0.15) 0%, transparent 60%)`;
            glareRef.current.style.opacity = '1';
        }
    }, [intensity, glare]);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        if (card) {
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0) scale3d(1, 1, 1)';
            card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
        }
        if (glareRef.current) {
            glareRef.current.style.opacity = '0';
        }
    }, []);

    const handleMouseEnter = useCallback(() => {
        const card = cardRef.current;
        if (card) {
            card.style.transition = 'transform 0.1s ease-out';
        }
    }, []);

    return (
        <div
            ref={cardRef}
            className={className}
            style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                ...style
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onMouseEnter={handleMouseEnter}
        >
            {children}
            {glare && (
                <div
                    ref={glareRef}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: 'inherit',
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                        pointerEvents: 'none',
                        zIndex: 10
                    }}
                />
            )}
        </div>
    );
};

export default Tilt3D;
