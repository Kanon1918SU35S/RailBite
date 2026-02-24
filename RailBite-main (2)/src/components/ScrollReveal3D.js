import React, { useEffect, useRef, useState } from 'react';

const ScrollReveal3D = ({ children, animation = 'default', delay = 0, className = '' }) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
        );

        const currentRef = ref.current;
        if (currentRef) observer.observe(currentRef);
        return () => {
            if (currentRef) observer.unobserve(currentRef);
        };
    }, []);

    const animations = {
        default: {
            initial: { opacity: 0, transform: 'perspective(800px) rotateX(10deg) translateY(60px) translateZ(-100px)' },
            visible: { opacity: 1, transform: 'perspective(800px) rotateX(0deg) translateY(0) translateZ(0)' }
        },
        flipLeft: {
            initial: { opacity: 0, transform: 'perspective(800px) rotateY(30deg) translateX(100px)' },
            visible: { opacity: 1, transform: 'perspective(800px) rotateY(0deg) translateX(0)' }
        },
        flipRight: {
            initial: { opacity: 0, transform: 'perspective(800px) rotateY(-30deg) translateX(-100px)' },
            visible: { opacity: 1, transform: 'perspective(800px) rotateY(0deg) translateX(0)' }
        },
        zoomRotate: {
            initial: { opacity: 0, transform: 'scale(0.5) rotateZ(-10deg) translateZ(-200px)' },
            visible: { opacity: 1, transform: 'scale(1) rotateZ(0deg) translateZ(0)' }
        },
        unfold: {
            initial: { opacity: 0, transform: 'perspective(1000px) rotateX(-60deg)', transformOrigin: 'top center' },
            visible: { opacity: 1, transform: 'perspective(1000px) rotateX(0deg)', transformOrigin: 'top center' }
        },
        pop: {
            initial: { opacity: 0, transform: 'scale(0.3) translateZ(-300px)' },
            visible: { opacity: 1, transform: 'scale(1) translateZ(0)' }
        },
        slideUp: {
            initial: { opacity: 0, transform: 'perspective(800px) rotateX(15deg) translateY(80px)' },
            visible: { opacity: 1, transform: 'perspective(800px) rotateX(0deg) translateY(0)' }
        }
    };

    const anim = animations[animation] || animations.default;

    return (
        <div
            ref={ref}
            className={className}
            style={{
                ...anim.initial,
                ...(isVisible ? anim.visible : {}),
                transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${delay}s`,
                willChange: 'transform, opacity'
            }}
        >
            {children}
        </div>
    );
};

export default ScrollReveal3D;
