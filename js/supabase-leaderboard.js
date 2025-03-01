// supabase-leaderboard.js - Handles interaction with Supabase for the leaderboard

import { createClient } from 'https://esm.sh/@supabase/supabase-js';

class SupabaseLeaderboard {
    constructor() {
        this.supabase = createClient(
            'https://zqintrlsxpdxbjspkskd.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxaW50cmxzeHBkeGJqc3Brc2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4MjU0MTYsImV4cCI6MjA1NjQwMTQxNn0.5G1mEsD3skWtOcQ5ugmhYMfQ2obBm6kNKwnA-YH-yIw'
        );
        
        this.tableName = 'leaderboard_entries';
        this.initialized = false;
    }
    
    async initialize() {
        try {
            if (this.initialized) {
                return;
            }
            
            // Check if table exists, if not create it
            const { error } = await this.supabase
                .from(this.tableName)
                .select('id')
                .limit(1);
            
            if (error && error.code === '42P01') {
                // Table doesn't exist, create it
                console.log('Creating leaderboard table...');
                await this.createLeaderboardTable();
            } else if (error) {
                console.error('Error checking table:', error);
                throw error;
            }
            
            this.initialized = true;
        } catch (error) {
            console.error('Error initializing Supabase leaderboard:', error);
            throw error;
        }
    }
    
    async createLeaderboardTable() {
        try {
            // Using RPC to create table through a PostgreSQL function
            const { error } = await this.supabase.rpc('create_leaderboard_table');
            
            if (error) {
                console.error('Error creating table:', error);
                throw error;
            }
            
            console.log('Leaderboard table created successfully');
        } catch (error) {
            console.error('Error creating leaderboard table:', error);
            throw error;
        }
    }
    
    async getLeaderboard() {
        try {
            await this.initialize();
            
            // Get current date minus 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const cutoffDate = sevenDaysAgo.toISOString();
            
            // Fetch leaderboard entries
            const { data, error } = await this.supabase
                .from(this.tableName)
                .select('*')
                .gte('created_at', cutoffDate)
                .order('score', { ascending: false })
                .limit(20);
            
            if (error) {
                console.error('Error fetching leaderboard:', error);
                throw error;
            }
            
            // Transform data to match the expected format
            return data.map(entry => ({
                name: entry.name,
                score: entry.score,
                date: entry.created_at
            }));
        } catch (error) {
            console.error('Error getting leaderboard:', error);
            // Return empty array on error to prevent app from breaking
            return [];
        }
    }
    
    async submitScore(name, score) {
        try {
            await this.initialize();
            
            if (!name || !score || score <= 0) {
                console.error('Invalid score submission');
                return { success: false, error: 'Invalid score submission' };
            }
            
            // First check if user has a higher score already
            const { data: existingEntries, error: fetchError } = await this.supabase
                .from(this.tableName)
                .select('*')
                .eq('name', name)
                .order('score', { ascending: false })
                .limit(1);
            
            if (fetchError) {
                console.error('Error checking existing score:', fetchError);
                throw fetchError;
            }
            
            // If user has a higher score already, don't update
            if (existingEntries.length > 0 && existingEntries[0].score >= score) {
                return { 
                    success: true, 
                    updated: false, 
                    message: 'Existing score is higher' 
                };
            }
            
            // If user has a lower score or no score, insert new record
            const now = new Date().toISOString();
            
            // Check if we need to update or insert
            if (existingEntries.length > 0) {
                // Update existing entry
                const { error: updateError } = await this.supabase
                    .from(this.tableName)
                    .update({ 
                        score: score,
                        created_at: now
                    })
                    .eq('id', existingEntries[0].id);
                
                if (updateError) {
                    console.error('Error updating score:', updateError);
                    throw updateError;
                }
                
                return { 
                    success: true, 
                    updated: true, 
                    message: 'Score updated successfully' 
                };
            } else {
                // Insert new entry
                const { error: insertError } = await this.supabase
                    .from(this.tableName)
                    .insert([
                        { 
                            name, 
                            score, 
                            created_at: now
                        }
                    ]);
                
                if (insertError) {
                    console.error('Error inserting score:', insertError);
                    throw insertError;
                }
                
                return { 
                    success: true, 
                    updated: true, 
                    message: 'Score added successfully' 
                };
            }
        } catch (error) {
            console.error('Error submitting score:', error);
            return { 
                success: false, 
                error: error.message || 'Error submitting score' 
            };
        }
    }
}

// Export a singleton instance
const supabaseLeaderboard = new SupabaseLeaderboard();
export default supabaseLeaderboard;
