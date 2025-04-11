// Simple utility to check environment variables for debug flags

/**
 * Checks if a specific debug mode is enabled via environment variables.
 * Reads NEXT_PUBLIC_DEBUG_MODES which should be a comma-separated string (e.g., "AI_SERVICE,GENERATION").
 * 
 * @param mode The debug mode key (case-insensitive).
 * @returns True if the mode is enabled, false otherwise.
 */
export function isDebugMode(mode: string): boolean {
    if (typeof process === 'undefined' || !process.env) {
        return false; // Not in a Node-like environment or env vars unavailable
    }

    const debugModes = process.env.NEXT_PUBLIC_DEBUG_MODES || '';
    const modes = debugModes.split(',').map(m => m.trim().toUpperCase());
    
    return modes.includes(mode.toUpperCase());
}

// Log which modes are enabled on load (if any)
if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_DEBUG_MODES) {
    console.log(`[Debug Util] Enabled Debug Modes: ${process.env.NEXT_PUBLIC_DEBUG_MODES}`);
} else {
    console.log("[Debug Util] No NEXT_PUBLIC_DEBUG_MODES environment variable set.");
} 