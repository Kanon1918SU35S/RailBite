import React, { useState, useCallback, useEffect, useRef } from 'react';

/**
 * FoodCarousel – An on-click 3D carousel for food items.
 *
 * Props:
 *  - items        : array of { _id, name, price, image, description, category, available }
 *  - onAddToCart  : (item) => void   (optional – shows "Add to Cart" button)
 *  - onOrderNow   : (item) => void   (optional – shows "Order Now" button)
 *  - imageBaseUrl : string – prefix for server-hosted images (default: 'http://localhost:5001')
 */
function FoodCarousel({ items = [], onAddToCart, onOrderNow, imageBaseUrl = 'http://localhost:5001' }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState(null);     // 'left' | 'right' | null
    const [isAnimating, setIsAnimating] = useState(false);
    const touchStartX = useRef(0);
    const carouselRef = useRef(null);

    const total = items.length;

    // Wrap-around index helper
    const wrap = (i) => ((i % total) + total) % total;

    /* ── Navigation ─────────────────────────── */
    const goTo = useCallback(
        (newIndex, dir) => {
            if (isAnimating || total <= 1) return;
            setDirection(dir);
            setIsAnimating(true);
            setActiveIndex(wrap(newIndex));
        },
        [isAnimating, total]
    );

    const goNext = useCallback(() => goTo(activeIndex + 1, 'right'), [activeIndex, goTo]);
    const goPrev = useCallback(() => goTo(activeIndex - 1, 'left'), [activeIndex, goTo]);

    // Reset animation lock after transition
    useEffect(() => {
        if (!isAnimating) return;
        const timer = setTimeout(() => {
            setIsAnimating(false);
            setDirection(null);
        }, 600);               // matches CSS transition duration
        return () => clearTimeout(timer);
    }, [isAnimating]);

    /* ── Keyboard navigation ────────────────── */
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'ArrowRight') goNext();
            if (e.key === 'ArrowLeft') goPrev();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [goNext, goPrev]);

    /* ── Touch / swipe support ──────────────── */
    const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const handleTouchEnd = (e) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    };

    if (total === 0) return null;

    /* ── Resolve image src ──────────────────── */
    const resolveImage = (img) => {
        if (!img) return '/images/placeholder.jpg';
        if (img.startsWith('/uploads')) return `${imageBaseUrl}${img}`;
        return img;
    };

    /* ── Visible cards: centre ±2 ───────────── */
    const positions = [-2, -1, 0, 1, 2];
    const visibleCards = positions.map((offset) => {
        const idx = wrap(activeIndex + offset);
        return { ...items[idx], _pos: offset, _idx: idx };
    });

    return (
        <div
            className={`food-carousel ${direction ? `food-carousel--${direction}` : ''}`}
            ref={carouselRef}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            {/* Left arrow */}
            <button
                className="food-carousel__arrow food-carousel__arrow--left"
                onClick={goPrev}
                aria-label="Previous item"
            >
                ‹
            </button>

            {/* Track */}
            <div className="food-carousel__track">
                {visibleCards.map((card) => {
                    const isCenter = card._pos === 0;
                    return (
                        <div
                            key={`pos-${card._pos}`}
                            className={`food-carousel__card food-carousel__card--pos${card._pos < 0 ? 'n' : ''}${Math.abs(card._pos)}`}
                            onClick={() => {
                                if (card._pos < 0) goPrev();
                                else if (card._pos > 0) goNext();
                            }}
                            style={{ cursor: isCenter ? 'default' : 'pointer' }}
                        >
                            <div className="food-carousel__img-wrap">
                                <img
                                    src={resolveImage(card.image)}
                                    alt={card.name}
                                    onError={(e) => { e.target.src = '/images/placeholder.jpg'; }}
                                />
                                {card.available === false && (
                                    <span className="food-carousel__badge">Unavailable</span>
                                )}
                            </div>

                            <div className="food-carousel__info">
                                <h3 className="food-carousel__name">{card.name}</h3>
                                {card.description && (
                                    <p className="food-carousel__desc">{card.description}</p>
                                )}
                                {card.category && (
                                    <span className="food-carousel__category">{card.category}</span>
                                )}
                                <span className="food-carousel__price">৳{card.price}</span>

                                {isCenter && (
                                    <div className="food-carousel__actions">
                                        {onAddToCart && (
                                            <button
                                                className="btn btn-primary btn-sm btn-3d"
                                                onClick={(e) => { e.stopPropagation(); onAddToCart(card); }}
                                                disabled={card.available === false}
                                            >
                                                {card.available === false ? 'Unavailable' : 'Add to Cart'}
                                            </button>
                                        )}
                                        {onOrderNow && (
                                            <button
                                                className="btn btn-primary btn-sm btn-3d"
                                                onClick={(e) => { e.stopPropagation(); onOrderNow(card); }}
                                            >
                                                Order Now
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Right arrow */}
            <button
                className="food-carousel__arrow food-carousel__arrow--right"
                onClick={goNext}
                aria-label="Next item"
            >
                ›
            </button>

            {/* Dot indicators */}
            {total > 1 && (
                <div className="food-carousel__dots">
                    {items.map((_, i) => (
                        <button
                            key={i}
                            className={`food-carousel__dot ${i === activeIndex ? 'food-carousel__dot--active' : ''}`}
                            onClick={() => goTo(i, i > activeIndex ? 'right' : 'left')}
                            aria-label={`Go to item ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default FoodCarousel;
