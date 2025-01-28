function makeMouser(elem, callback) {
    let isKeyDown = false;
    
    // Track key state
    document.addEventListener('mousedown', () => {
        isKeyDown = true;
    });
    
    document.addEventListener('mouseup', () => {
        isKeyDown = false;
    });
    
    // Track mouse movement
    elem.addEventListener('mousemove', (e) => {
        if (!isKeyDown) return;
        
        // Get element's position relative to viewport
        const rect = elem.getBoundingClientRect();
        
        // Calculate normalized coordinates (0 to 1)
        const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        
        callback(x, y);
    });
}