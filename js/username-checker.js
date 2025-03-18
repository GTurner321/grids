// username-checker.js
// A client-side username checker for family-friendly usernames in multiple languages
class UsernameChecker {
    constructor() {
        // English inappropriate terms
        this.englishPatterns = [
            /fuck/i, /shit/i, /ass(?!et|ign|ess|ist)/i, /damn/i, /cunt/i, /dick/i,
            /bitch/i, /bastard/i, /penis/i, /vagina/i, /porn/i, /sex/i,
            /nazi/i, /hitler/i, /kill/i, /murder/i, /suicide/i, /rape/i,
            /\bn[i1l]gg[ae3]r/i, /\bf[a@]g/i, /\bh[o0]e/i, /\bwh[o0]re/i,
            /69/i, /420/i, /\ba55/i, /\bp[o0]rn/i, /\bcum/i
        ];
        
        // French inappropriate terms
        this.frenchPatterns = [
            /merde/i, /putain/i, /salope/i, /con/i, /connard/i, /bite/i, 
            /couille/i, /foutre/i, /baiser/i, /cul/i, /baise/i, /enculé/i,
            /pute/i, /nique/i
        ];
        
        // German inappropriate terms
        this.germanPatterns = [
            /scheiße/i, /scheisse/i, /arsch/i, /ficken/i, /schwanz/i, /fotze/i,
            /hure/i, /wichser/i, /schwuchtel/i, /hurensohn/i
        ];
        
        // Spanish inappropriate terms
        this.spanishPatterns = [
            /puta/i, /mierda/i, /cojone/i, /joder/i, /chinga/i, /verga/i,
            /pendejo/i, /cabron/i, /cabrón/i, /culo/i, /coño/i, /polla/i
        ];
        
        // Arabic inappropriate terms (romanized)
        this.arabicPatterns = [
            /kuss/i, /sharmoota/i, /kahba/i, /kosomak/i, /kos/i, /zobi/i,
            /zebbi/i, /kul/i, /manyak/i, /zeb/i
        ];
        
        // Specifically blocked terms
        this.blockedTerms = [
            /turn[e3]r/i, /t[u*]rn[e3]r/i, /mrt/i, /mr[._-]?t/i
        ];
        
        // Combine all patterns
        this.inappropriatePatterns = [
            ...this.englishPatterns,
            ...this.frenchPatterns,
            ...this.germanPatterns,
            ...this.spanishPatterns,
            ...this.arabicPatterns,
            ...this.blockedTerms
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
        
        // Normalize the username to catch simple evasion attempts
        const normalizedUsername = this.normalizeUsername(username);
        
        // Check for inappropriate content in original username
        for (const pattern of this.inappropriatePatterns) {
            if (pattern.test(username)) {
                return false;
            }
        }
        
        // Check for inappropriate content in normalized username
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
    
    /**
     * Normalize username to catch leetspeak and other substitutions
     * @param {string} username - The username to normalize
     * @returns {string} - Normalized username
     */
    normalizeUsername(username) {
        // Handle common leetspeak substitutions
        return username
            .replace(/1/g, 'i')
            .replace(/3/g, 'e')
            .replace(/4/g, 'a')
            .replace(/5/g, 's')
            .replace(/0/g, 'o')
            .replace(/\$/g, 's')
            .replace(/@/g, 'a')
            .replace(/\+/g, 't')
            .replace(/8/g, 'b')
            .replace(/7/g, 't')
            .replace(/\*/g, 'u')
            .replace(/_/g, '')
            .replace(/-/g, '')
            .replace(/\./g, '')
            .replace(/ü/g, 'u')
            .replace(/é/g, 'e')
            .replace(/è/g, 'e')
            .replace(/à/g, 'a')
            .replace(/ö/g, 'o')
            .replace(/ä/g, 'a')
            .replace(/ß/g, 'ss');
    }
    
    /**
     * Check if a specific word contains banned terms
     * @param {string} word - The word to check
     * @returns {boolean} - True if word contains banned terms, false otherwise
     */
    containsBannedTerms(word) {
        const normalizedWord = this.normalizeUsername(word);
        
        for (const pattern of this.inappropriatePatterns) {
            if (pattern.test(word) || pattern.test(normalizedWord)) {
                return true;
            }
        }
        
        return false;
    }
}

// Export as a singleton
const usernameChecker = new UsernameChecker();
export default usernameChecker;
