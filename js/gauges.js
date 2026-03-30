// js/gauges.js - Realistic aircraft instrument gauges

class GaugeSystem {
    constructor() {
        this.speedNeedle = document.getElementById('speed-needle');
        this.altNeedle10k = document.getElementById('alt-needle-10k');
        this.altNeedle1k = document.getElementById('alt-needle-1k');
        this.altNeedle100 = document.getElementById('alt-needle-100');
        this.throttleNeedle = document.getElementById('throttle-needle');
        
        this.initSpeedGauge();
        this.initAltitudeGauge();
        this.initThrottleGauge();
    }
    
    initSpeedGauge() {
        const marksGroup = document.getElementById('speed-marks');
        const labelsGroup = document.getElementById('speed-labels');
        
        // Cessna 182 range: 0-200 KTS
        for (let i = 0; i <= 200; i += 10) {
            const angle = -135 + (i / 200) * 270;
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % 20 === 0;
            
            const innerR = isMajor ? 40 : 43;
            const outerR = 47;
            
            const x1 = 60 + innerR * Math.cos(rad);
            const y1 = 60 + innerR * Math.sin(rad);
            const x2 = 60 + outerR * Math.cos(rad);
            const y2 = 60 + outerR * Math.sin(rad);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', isMajor ? 2 : 1);
            marksGroup.appendChild(line);
            
            if (isMajor) {
                const labelR = 32;
                const lx = 60 + labelR * Math.cos(rad);
                const ly = 60 + labelR * Math.sin(rad);
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', lx);
                text.setAttribute('y', ly);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('font-size', '7');
                text.setAttribute('font-family', 'Arial');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('fill', '#333');
                text.textContent = i;
                labelsGroup.appendChild(text);
            }
        }
    }
    
    initAltitudeGauge() {
        const marksGroup = document.getElementById('altitude-marks');
        const labelsGroup = document.getElementById('altitude-labels');
        
        // Altimeter: 0-10000 ft (100 ft per division)
        for (let i = 0; i <= 100; i += 1) {
            const angle = -135 + (i / 100) * 270;
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % 5 === 0;
            
            const innerR = isMajor ? 40 : 44;
            const outerR = 47;
            
            const x1 = 60 + innerR * Math.cos(rad);
            const y1 = 60 + innerR * Math.sin(rad);
            const x2 = 60 + outerR * Math.cos(rad);
            const y2 = 60 + outerR * Math.sin(rad);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', isMajor ? 2 : 1);
            marksGroup.appendChild(line);
            
            if (isMajor && i % 5 === 0) {
                const labelR = 33;
                const lx = 60 + labelR * Math.cos(rad);
                const ly = 60 + labelR * Math.sin(rad);
                
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', lx);
                text.setAttribute('y', ly);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('dominant-baseline', 'middle');
                text.setAttribute('font-size', '6');
                text.setAttribute('font-family', 'Arial');
                text.setAttribute('font-weight', 'bold');
                text.setAttribute('fill', '#333');
                text.textContent = i;
                labelsGroup.appendChild(text);
            }
        }
    }
    
    initThrottleGauge() {
        const marksGroup = document.getElementById('throttle-marks');
        const labelsGroup = document.getElementById('throttle-labels');
        
        // Throttle: 0-100%
        for (let i = 0; i <= 100; i += 10) {
            const angle = -135 + (i / 100) * 270;
            const rad = (angle * Math.PI) / 180;
            const isMajor = true;
            
            const innerR = 40;
            const outerR = 47;
            
            const x1 = 60 + innerR * Math.cos(rad);
            const y1 = 60 + innerR * Math.sin(rad);
            const x2 = 60 + outerR * Math.cos(rad);
            const y2 = 60 + outerR * Math.sin(rad);
            
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', isMajor ? 2 : 1);
            marksGroup.appendChild(line);
            
            const labelR = 32;
            const lx = 60 + labelR * Math.cos(rad);
            const ly = 60 + labelR * Math.sin(rad);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', lx);
            text.setAttribute('y', ly);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', '7');
            text.setAttribute('font-family', 'Arial');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#333');
            text.textContent = i;
            labelsGroup.appendChild(text);
        }
    }
    
    updateSpeed(knots) {
        const clampedSpeed = Math.max(0, Math.min(200, knots));
        const angle = -135 + (clampedSpeed / 200) * 270;
        if (this.speedNeedle) {
            this.speedNeedle.setAttribute('transform', `rotate(${angle} 60 60)`);
        }
    }
    
    updateAltitude(feet) {
        const clampedAlt = Math.max(0, Math.min(99900, feet));
        const alt100 = (clampedAlt % 1000) / 100; // 0-10 range for 100s needle
        const alt10 = (clampedAlt % 10000) / 1000; // 0-10 range for 1000s needle
        const alt1 = (clampedAlt % 100000) / 10000; // 0-10 range for 10000s needle
        
        // 100s needle rotates full 270 degrees
        if (this.altNeedle100) {
            const angle100 = -135 + alt100 * 270;
            this.altNeedle100.setAttribute('transform', `rotate(${angle100} 60 60)`);
        }
        
        // 1000s needle rotates 270 degrees over 10000
        if (this.altNeedle1k) {
            const angle1k = -135 + alt10 * 270;
            this.altNeedle1k.setAttribute('transform', `rotate(${angle1k} 60 60)`);
        }
        
        // 10000s needle rotates 270 degrees over 100000
        if (this.altNeedle10k) {
            const angle10k = -135 + alt1 * 270;
            this.altNeedle10k.setAttribute('transform', `rotate(${angle10k} 60 60)`);
        }
    }
    
    updateThrottle(percent) {
        const clamped = Math.max(0, Math.min(100, percent));
        const angle = -135 + (clamped / 100) * 270;
        if (this.throttleNeedle) {
            this.throttleNeedle.setAttribute('transform', `rotate(${angle} 60 60)`);
        }
    }
}

window.GaugeSystem = GaugeSystem;
