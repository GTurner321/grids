// supabase-leaderboard.js - Enhanced Supabase integration

// Define Supabase connection details
const SUPABASE_URL = 'https://zqintrlsxpdxbjspkskd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaW50cmxzeHBkeGJqc3Brc2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjU0MTYsImV4cCI6MjA1NjQwMTQxNn0.5G1mEsD3skWtOcQ5ugmhYMfQ2obBm6kNKwnA-YH-yIw';
const TABLE_NAME = 'leaderboard_entries';
const SCORE_THRESHOLD = 5000;

class SupabaseLeaderboard {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        this.lastFetchTime = 0;
        this.cachedLeaderboard = null;
        
        // Try to initialize immediately
        this.init();
    }
    
    async init() {
        try {
            // Dynamically import Supabase client
            const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.31.0');
            this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            
            // Create the table if it doesn't exist
            await this.ensureTableExists();
            
            this.initialized = true;
            console.log('Supabase leaderboard initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
        }
    }
    
    async ensureTableExists() {
        if (!this.supabase) return false;
        
        try {
            // Try to create the table via RPC
            const { error } = await this.supabase.rpc('create_leaderboard_table');
            
            if (error && error.code !== '42P01') {
                console.error('Error ensuring table exists:', error);
            }
            
            return true;
        } catch (error) {
            console.error('Error checking/creating table:', error);
            return false;
        }
    }
    
    async getLeaderboard(forceRefresh = false) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.supabase) {
            return [];
        }
        
        // Check if we can use cached data (not forcing refresh and cache is recent)
        const now = Date.now();
        if (!forceRefresh && this.cachedLeaderboard && (now - this.lastFetchTime < 60000)) {
            console.log('Using cached leaderboard data');
            return this.cachedLeaderboard;
        }
        
        try {
            // Get entries from the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const { data, error } = await this.supabase
                .from(TABLE_NAME)
                .select('*')
                .gte('created_at', sevenDaysAgo.toISOString())
                .gte('score', SCORE_THRESHOLD)
                .order('score', { ascending: false })
                .limit(20);
                
            if (error) {
                throw error;
            }
            
            // Update cache
            this.lastFetchTime = now;
            this.cachedLeaderboard = data.map(entry => ({
                name: entry.name,
                score: entry.score,
                date: entry.created_at,
                sessionId: entry.session_id
            }));
            
            return this.cachedLeaderboard;
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            // Return cached data if available, empty array otherwise
            return this.cachedLeaderboard || [];
        }
    }
    
    async submitScore(name, score, sessionId = null) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.supabase || !name || score <= 0) {
            return { success: false, error: 'Invalid submission or Supabase not initialized' };
        }
        
        // Enforce score threshold
        if (score < SCORE_THRESHOLD) {
            console.log(`Score ${score} is below threshold ${SCORE_THRESHOLD}`);
            return { success: false, error: 'Score below threshold' };
        }
        
        try {
            // If sessionId is provided, check for existing entries in this session
            if (sessionId) {
                const { data: existingEntries, error: queryError } = await this.supabase
                    .from(TABLE_NAME)
                    .select('id, score')
                    .eq('name', name)
                    .eq('session_id', sessionId);
                
                if (queryError) {
                    console.error('Error checking for existing session entries:', queryError);
                } else if (existingEntries && existingEntries.length > 0) {
                    // If user already has entries from this session
                    const highestExistingScore = Math.max(...existingEntries.map(entry => entry.score));
                    
                    // If they already have a higher score in this session, don't update
                    if (highestExistingScore >= score) {
                        console.log(`User ${name} already has a higher score (${highestExistingScore}) in this session`);
                        return { success: true, message: 'Existing higher score kept' };
                    }
                    
                    // Delete all previous entries from this session
                    const { error: deleteError } = await this.supabase
                        .from(TABLE_NAME)
                        .delete()
                        .eq('session_id', sessionId);
                        
                    if (deleteError) {
                        console.error('Error deleting previous session entries:', deleteError);
                        // Continue anyway to insert the new score
                    }
                }
            }
            
            // Insert the new score
            const { error } = await this.supabase
                .from(TABLE_NAME)
                .insert([{
                    name,
                    score,
                    created_at: new Date().toISOString(),
                    session_id: sessionId || `${name}-${Date.now()}`
                }]);
                
            if (error) {
                throw error;
            }
            
            // Clear the cache to force refresh on next get
            this.cachedLeaderboard = null;
            
            return { success: true };
        } catch (error) {
            console.error('Error submitting score:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Get the current minimum score on the leaderboard
    async getMinimumLeaderboardScore() {
        const leaderboard = await this.getLeaderboard();
        
        if (leaderboard.length < 20) {
            return SCORE_THRESHOLD;
        }
        
        // Find the lowest score on the board
        return Math.min(...leaderboard.map(entry => entry.score));
    }
    
    // Check if a score qualifies for the leaderboard
    async scoreQualifies(score) {
        if (score < SCORE_THRESHOLD) return false;
        
        if (score >= SCORE_THRESHOLD) {
            // If fewer than 20 entries or score is higher than lowest entry
            const minScore = await this.getMinimumLeaderboardScore();
            return score >= minScore;
        }
        
        return false;
    }
}

// Export a singleton instance
const supabaseLeaderboard = new SupabaseLeaderboard();
export default supabaseLeaderboard;
