import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.z = Math.random() * 1000;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.5;
                this.speedY = (Math.random() - 0.5) * 0.5;
                this.speedZ = Math.random() * 2 + 0.5;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.color = Math.random() > 0.7
                    ? `rgba(232, 126, 30, ${this.opacity})`
                    : `rgba(255, 255, 255, ${this.opacity * 0.3})`;
            }

            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                this.z -= this.speedZ;

                if (this.z <= 0) this.reset();
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }

            draw() {
                const scale = 1000 / (1000 + this.z);
                const x2d = (this.x - canvas.width / 2) * scale + canvas.width / 2;
                const y2d = (this.y - canvas.height / 2) * scale + canvas.height / 2;
                const r = this.size * scale;

                ctx.beginPath();
                ctx.arc(x2d, y2d, Math.max(r, 0.1), 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();

                // Glow effect
                ctx.beginPath();
                ctx.arc(x2d, y2d, Math.max(r * 3, 0.3), 0, Math.PI * 2);
                const glowOpacity = this.opacity * 0.2 * scale;
                ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${glowOpacity})`);
                ctx.fill();
            }
        }

        const init = () => {
            resize();
            particles = Array.from({ length: 80 }, () => new Particle());
        };

        // Connect nearby particles with lines
        const connectParticles = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 150) {
                        const avgZ = (particles[i].z + particles[j].z) / 2;
                        const scale = 1000 / (1000 + avgZ);
                        const opacity = (1 - dist / 150) * 0.15 * scale;

                        const x1 = (particles[i].x - canvas.width / 2) * (1000 / (1000 + particles[i].z)) + canvas.width / 2;
                        const y1 = (particles[i].y - canvas.height / 2) * (1000 / (1000 + particles[i].z)) + canvas.height / 2;
                        const x2 = (particles[j].x - canvas.width / 2) * (1000 / (1000 + particles[j].z)) + canvas.width / 2;
                        const y2 = (particles[j].y - canvas.height / 2) * (1000 / (1000 + particles[j].z)) + canvas.height / 2;

                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.lineTo(x2, y2);
                        ctx.strokeStyle = `rgba(232, 126, 30, ${opacity})`;
                        ctx.lineWidth = 0.5 * scale;
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            connectParticles();
            animationId = requestAnimationFrame(animate);
        };

        init();
        animate();

        window.addEventListener('resize', resize);
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 0,
                opacity: 0.6
            }}
        />
    );
};

export default ParticleBackground;
