// Account 2 Reservation API - Store ID: restaurant-002
// Version: 1.0.0 - Fresh deployment to bypass cache
// Deploy Date: 2025-08-27

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://faenvzzeguvlconvrqgp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhZW52enpzZ3V2bGNvbnZycWdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMzg4MDA2MywiZXhwIjoyMDM5NDU2MDYzfQ.m05TmqZGCM4m9IWBGEGg5JOj8qG0nERN7kNKdKGvTSA';
const supabase = createClient(supabaseUrl, supabaseKey);

const STORE_ID = 'restaurant-002'; // Account 2 Store ID

// Vercel serverless function export
exports.default = async function handler(req, res) {
  console.log(`=== Account 2 Booking Save API v1.0.0 ===`);
  console.log('Store ID:', STORE_ID);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { date, time, people, customerName, phone, email, notes } = req.body;
    
    console.log('Reservation request:', {
      date, time, people, customerName, phone, email,
      notes: notes ? notes.substring(0, 50) + '...' : 'none'
    });

    // Validate required fields
    if (!date || !time || !people || !customerName) {
      console.error('Missing required fields:', { date, time, people, customerName });
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['date', 'time', 'people', 'customerName']
      });
    }

    // Create reservation object
    const reservation = {
      store_id: STORE_ID,
      date: date,
      time: time,
      people: parseInt(people),
      customer_name: customerName,
      phone: phone || null,
      email: email || null,
      notes: notes || null,
      status: 'confirmed',
      created_at: new Date().toISOString()
    };

    console.log('Inserting reservation:', reservation);

    // Insert into Supabase
    const { data, error } = await supabase
      .from('reservations')
      .insert([reservation])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ 
        error: 'Database error',
        details: error.message 
      });
    }

    console.log('✅ Reservation saved successfully:', data.id);

    return res.status(200).json({
      success: true,
      reservation: data,
      message: '予約が完了しました'
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
};