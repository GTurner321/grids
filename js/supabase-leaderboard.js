// supabase-leaderboard.js - Simplified Supabase integration

// Define Supabase connection details
const SUPABASE_URL = 'https://zqintrlsxpdxbjspkskd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaW50cmxzeHBkeGJqc3Brc2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjU0MTYsImV4cCI6MjA1NjQwMTQxNn0.5G1mEsD3skWtOcQ5ugmhYMfQ2obBm6kNKwnA-YH-yIw';
const TABLE_NAME = 'leaderboard_entries';

class SupabaseLeaderboard {
    constructor() {
        this.supabase = null;
        this.initialized = false;
        
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
    
    async getLeaderboard() {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.supabase) {
            return [];
        }
        
        try {
            // Get entries from the last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const { data, error } = await this.supabase
                .from(TABLE_NAME)
                .select('*')
                .gte('created_at', sevenDaysAgo.toISOString())
                .order('score', { ascending: false })
                .limit(20);
                
            if (error) {
                throw error;
            }
            
            return data.map(entry => ({
                name: entry.name,
                score: entry.score,
                date: entry.created_at
            }));
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            return [];
        }
    }
    
    async submitScore(name, score) {
        if (!this.initialized) {
            await this.init();
        }
        
        if (!this.supabase || !name || score <= 0) {
            return { success: false, error: 'Invalid submission or Supabase not initialized' };
        }
        
        try {
            // Insert the new score
            const { error } = await this.supabase
                .from(TABLE_NAME)
                .insert([{
                    name,
                    score,
                    created_at: new Date().toISOString()
                }]);
                
            if (error) {
                throw error;
            }
            
            return { success: true };
        } catch (error) {
            console.error('Error submitting score:', error);
            return { success: false, error: error.message };
        }
    }
}

// Export a singleton instance
const supabaseLeaderboard = new SupabaseLeaderboard();
export default supabaseLeaderboard;
