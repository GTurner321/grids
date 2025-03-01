// username-checker.js
// A client-side username checker for family-friendly usernames

class UsernameChecker {
    constructor() {
        // Common inappropriate terms to check against
        this.inappropriatePatterns = [
            /fuck/i, /shit/i, /ass(?!et|ign|ess|ist)/i, /damn/i, /cunt/i, /dick/i,
            /bitch/i, /bastard/i, /penis/i, /vagina/i, /porn/i, /sex/i,
            /nazi/i, /hitler/i, /kill/i, /murder/i, /suicide/i, /rape/i,
            /\bn[i1l]gg[ae3]r/i, /\bf[a@]g/i, /\bh[o0]e/i, /\bwh[o0]re/i,
            /69/i, /420/i, /\ba55/i, /\bp[o0]rn/i, /\bcum/i
        ];
    }
    
    /**
     * Check if username is appropriate for a family-friendly environment
     * @param {string} username - The username to check
     * @returns {Promise<boolean>} - Promise resolves to true if username is appropriate, false otherwise
     */
    async checkUsername(username) {
        // Check length
        if (!username || username.length < 2 || username.length > 12) {
            return false;
        }
        
        // Check for inappropriate content
        for (const pattern of this.inappropriatePatterns) {
            if (pattern.test(username)) {
                return false;
            }
        }
        
        // Check for leetspeak substitutions
        const normalizedUsername = username
            .replace(/1/g, 'i')
            .replace(/3/g, 'e')
            .replace(/4/g, 'a')
            .replace(/5/g, 's')
            .replace(/0/g, 'o')
            .replace(/\$/g, 's')
            .replace(/@/g, 'a');
            
        for (const pattern of this.inappropriatePatterns) {
            if (pattern.test(normalizedUsername)) {
                return false;
            }
        }
        
        // Add a small delay to simulate server check
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // All checks passed
        return true;
    }
}

// Export as a singleton
const usernameChecker = new UsernameChecker();
export default usernameChecker;
