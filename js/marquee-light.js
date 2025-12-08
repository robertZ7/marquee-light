document.addEventListener('DOMContentLoaded', () => {
    // 1. Find all marquee instances and initialize them
    document.querySelectorAll('.marquee-instance').forEach(init);
});

function init(c) {
    // Select elements and read custom data attributes
    const m = c.querySelector('.marquee'); 
    const t = c.querySelector('.marquee-track');
    const s = c.querySelector('[data-content-source]');
    const b = c.querySelector('.toggle-marquee-btn'); 

    // Read custom settings
    const spd = parseFloat(c.getAttribute('data-speed')) || 0.5;
    const gap = c.getAttribute('data-gap');
    const noFade = c.getAttribute('data-fade') === 'false'; 

    // Apply custom settings
    if (gap) {
        // Set CSS variable for gap control
        c.style.setProperty('--marquee-gap', gap);
    }
    if (noFade) {
        // Add class to disable fades via CSS
        m.classList.add('no-fade');
    }

    // State variables
    let isD = false; // isDragging
    let isP = false; // isPaused
    let isH = false; // isHovering
    let sX;          // startX
    let cX = 0;      // currentTranslateX 
    let aID;         // animationFrameId 
    let cW = 0;      // contentSetWidth 

    // --- Init: Cloning ---
    function initContent() {
        const wW = m.offsetWidth;
        const iW = s.offsetWidth;
        let cTW = iW;
        
        // Clone to fill screen + buffer
        while (cTW < wW * 3) {
            const clone = s.cloneNode(true);
            clone.removeAttribute('data-content-source'); 
            t.appendChild(clone);
            cTW += clone.offsetWidth;
        }

        // Clone the track for the seamless swap
        const sOW = t.offsetWidth;
        const fC = t.cloneNode(true);
        fC.querySelector('[data-content-source]')?.removeAttribute('data-content-source');
        t.appendChild(fC);
        
        cW = sOW / 2; // Set snap distance
    }

    // --- Core Movement ---
    function scroll() {
        if (!isP && !isH && !isD) {
            cX += spd; // Scroll Left to Right
            
            if (cX > 0) {
                cX -= cW; 
            }

            t.style.transform = `translateX(${cX}px)`;
        }
        
        aID = requestAnimationFrame(scroll);
    }

    // --- Pause/Play Toggle ---
    function toggle() {
        isP = !isP;
        m.classList.toggle('paused', isP); 
        b.innerHTML = isP ? 'Play' : 'Stop';
        toggleButton.title = isPaused ? 'Play marquee' : 'Stop marquee';
    }
    b.addEventListener('click', toggle);

    // --- Pause on Hover ---
    m.addEventListener('mouseenter', () => { isH = true; });
    m.addEventListener('mouseleave', () => { isH = false; });

    // --- Dragging Functions ---
    const dS = (e) => { // dragStart
        isD = true;
        
        // Set the marquee to paused state when drag starts 
        // to prevent the continuous scroll from immediately resuming after release.
        if (!isP) {
            isP = true;
            m.classList.add('paused');
            b.innerHTML = 'Play';
            b.title = 'Play marquee';
        }
        
        // Ensure the transition is removed for instant drag feedback
        t.style.transition = 'none'; 

        // Record the current scroll position before drag starts
        const style = window.getComputedStyle(t);
        const matrix = new DOMMatrixReadOnly(style.transform);
        cX = matrix.m41; 
        
        sX = (e.touches ? e.touches[0].clientX : e.clientX);
        e.preventDefault();
    };

    const dM = (e) => { // dragMove
        if (!isD) return;
        
        const cXn = (e.touches ? e.touches[0].clientX : e.clientX); // current X new
        const dX = cXn - sX; // delta X
        
        t.style.transform = `translateX(${cX + dX}px)`;
    };

    const dE = () => { // dragEnd
        if (!isD) return;
        isD = false;
        
        // Update cX to final position
        const style = window.getComputedStyle(t);
        const matrix = new DOMMatrixReadOnly(style.transform);
        cX = matrix.m41; 

        // Re-enable transition
        t.style.transition = 'transform 0.3s ease-out'; 

        // Boundary/Loop Check (Left to Right Logic)
        if (cX > 0) {
            cX -= cW; 
            t.style.transition = 'none'; 
            t.style.transform = `translateX(${cX}px)`;
            setTimeout(() => t.style.transition = 'transform 0.3s ease-out', 50); 
            
        } else if (cX < -cW) {
            cX += cW;
            t.style.transition = 'none'; 
            t.style.transform = `translateX(${cX}px)`;
            setTimeout(() => t.style.transition = 'transform 0.3s ease-out', 50); 
        }
    };

    // --- Attach Listeners ---
    m.addEventListener('mousedown', dS);
    m.addEventListener('touchstart', dS);
    
    window.addEventListener('mousemove', dM);
    window.addEventListener('touchmove', dM);
    window.addEventListener('mouseup', dE);
    window.addEventListener('touchend', dE);

    // --- Final Execution ---
    initContent();
    scroll();
}