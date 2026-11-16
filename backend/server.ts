import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '50mb' }));

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Configure backend Supabase integration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send({ status: 'ARcricinfo Backend Online', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

// Implement REST endpoints mimicking frontend `utils/db.ts`
app.get('/api/players', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .eq('user_id', userId)
            .order('total_runs', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// --- Profile Endpoints ---
app.get('/api/profile', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const { data, error } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
        if (error && error.code !== 'PGRST116') throw error; // ignore not found
        res.json(data || null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/profile', async (req, res) => {
    try {
        const { userId, profile } = req.body;
        if (!userId || !profile) return res.status(400).json({ error: 'Missing data' });
        const { error } = await supabase.from('user_profiles').upsert({ 
            id: userId, 
            name: profile.name,
            email: profile.email,
            avatar: profile.avatar,
            mobile_no: profile.mobileNo || null,
            updated_at: new Date().toISOString() 
        });
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/profile/by-mobile/:mobileNo', async (req, res) => {
    try {
        const mobileNo = req.params.mobileNo;
        if (!mobileNo) return res.status(400).json({ error: 'Mobile number is required' });
        const { data, error } = await supabase.from('user_profiles').select('*').eq('mobile_no', mobileNo).single();
        if (error && error.code !== 'PGRST116') throw error; // ignore not found
        res.json(data || null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Matches Endpoints ---
app.get('/api/matches', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const { data, error } = await supabase.from('matches').select('data').eq('user_id', userId).order('date', { ascending: false });
        if (error) throw error;
        res.json(data.map((row: any) => row.data));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/match', async (req, res) => {
    try {
        const { userId, match } = req.body;
        if (!userId || !match) return res.status(400).json({ error: 'userId and match are required' });
        const { error } = await supabase.from('matches').upsert({ id: match.id, user_id: userId, data: match, date: match.date });
        if (error) throw error;
        res.status(200).json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/match/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('matches').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Series Endpoints ---
app.get('/api/series/active', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        const { data, error } = await supabase.from('series').select('data').eq('user_id', userId).eq('status', 'ACTIVE').order('created_at', { ascending: false }).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data ? data.data : null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/series/completed', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: 'userId required' });
        const { data, error } = await supabase.from('series').select('data').eq('user_id', userId).eq('status', 'COMPLETED').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data.map((r: any) => r.data));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/series', async (req, res) => {
    try {
        const { userId, series } = req.body;
        const { error } = await supabase.from('series').upsert({ id: series.id, user_id: userId, data: series, status: series.status });
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/series/:id/complete', async (req, res) => {
    try {
        const { error } = await supabase.from('series').update({ status: 'COMPLETED' }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Teams Endpoints ---
app.get('/api/teams', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        const { data, error } = await supabase.from('teams').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data.map((r: any) => ({ id: r.id, name: r.name, logoUrl: r.logo_url, roster: r.roster || [] })));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/team', async (req, res) => {
    try {
        const { userId, team } = req.body;
        const { error } = await supabase.from('teams').upsert({ id: team.id, user_id: userId, name: team.name, logo_url: team.logoUrl || null, roster: team.roster, updated_at: new Date().toISOString() });
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/team/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('teams').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/team/:id/join', async (req, res) => {
    try {
        const { profile } = req.body;
        // Fetch existing team
        const { data: team, error: fetchError } = await supabase.from('teams').select('*').eq('id', req.params.id).single();
        if (fetchError) throw fetchError;
        
        let roster = team.roster || [];
        // Check if user is already in roster
        const isAlreadyIn = roster.some((p: any) => p === profile.name || (typeof p === 'object' && p.id === profile.id));
        if (!isAlreadyIn) {
            roster.push(profile.name); // Using name string for backward compatibility with string array, or an object if refactored.
            const { error: updateError } = await supabase.from('teams').update({ roster }).eq('id', req.params.id);
            if (updateError) throw updateError;
        }
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Players Endpoints ---
app.get('/api/players', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: 'userId is required' });
        const { data, error } = await supabase.from('players').select('*').eq('user_id', userId).order('total_runs', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/player/:id', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        const { data, error } = await supabase.from('players').select('*').eq('id', req.params.id).eq('user_id', userId).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data || null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/players/sync', async (req, res) => {
    try {
        const { upsertRows } = req.body;
        if (upsertRows && upsertRows.length > 0) {
            const { error } = await supabase.from('players').upsert(upsertRows);
            if (error) throw error;
        }
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Tournaments Endpoints ---
app.get('/api/tournaments', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        const { data, error } = await supabase.from('tournaments').select('data').eq('user_id', userId).order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data.map((r: any) => r.data));
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tournament', async (req, res) => {
    try {
        const { userId, tournament } = req.body;
        const { error } = await supabase.from('tournaments').upsert({ id: tournament.id, user_id: userId, data: tournament, status: tournament.status });
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tournament/:id', async (req, res) => {
    try {
        const { error } = await supabase.from('tournaments').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// --- Live Matches & Community (REST wrappers) ---
app.get('/api/live/:id', async (req, res) => {
    try {
        const { data, error } = await supabase.from('live_matches').select('match_data').eq('id', req.params.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        res.json(data ? data.match_data : null);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/live/:id', async (req, res) => {
    try {
        await supabase.from('live_matches').delete().eq('id', req.params.id);
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/public/player/:id', async (req, res) => {
    try {
        const { data: player, error: pErr } = await supabase.from('players').select('*').eq('id', req.params.id).single();
        if (pErr) throw pErr;
        const { data: matches, error: mErr } = await supabase.from('matches').select('data').eq('user_id', player.user_id);
        if (mErr) throw mErr;
        res.json({ player, matches: matches.map((m: any) => m.data) });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/community', async (req, res) => {
    try {
        const { data, error } = await supabase.from('community_posts').select('*').order('createdAt', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/community', async (req, res) => {
    try {
        const { post } = req.body;
        const { error } = await supabase.from('community_posts').upsert(post);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/community/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const { error } = await supabase.from('community_posts').update({ status }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.get('/api/notifications', async (req, res) => {
    try {
        const userId = req.query.userId as string;
        const { data, error } = await supabase.from('notifications').select('*').eq('userId', userId).order('createdAt', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notification', async (req, res) => {
    try {
        const { notification } = req.body;
        const { error } = await supabase.from('notifications').upsert(notification);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

app.put('/api/notification/:id/read', async (req, res) => {
    try {
        const { error } = await supabase.from('notifications').update({ isRead: true }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// WebSocket Event Handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // When a user selects a live match to view
  socket.on('join_match', (matchId: string) => {
    socket.join(`match_${matchId}`);
    console.log(`📡 Socket ${socket.id} joined room match_${matchId}`);
  });

  // When a scorer pushes an update
  socket.on('push_score_update', async (data: { matchId: string; matchData: any; userId: string }) => {
    console.log(`⚡ Score pushed for match: ${data.matchId}`);
    
    // Broadcast the new MatchState to everyone viewing this match (except sender)
    socket.to(`match_${data.matchId}`).emit('match_state_updated', data.matchData);
    
    // Queue a database write here via Supabase Admin
    if (data.userId && data.matchData) {
        const snapshot = {
            id: data.matchId,
            user_id: data.userId,
            match_data: data.matchData,
            updated_at: new Date().toISOString(),
        };
        const { error } = await supabase
            .from('live_matches')
            .upsert(snapshot, { onConflict: 'id' });
        if (error) console.error('Error auto-syncing live score:', error.message);
    }
  });

  // When a milestone is reached (wicket, 50s, etc)
  socket.on('match_milestone', (data: { matchId: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error' | 'accent' }) => {
    socket.to(`match_${data.matchId}`).emit('match_milestone', data);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 ARcricinfo Backend Engine running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket API Active and listening...`);
});
