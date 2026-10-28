require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

let serviceSupabase;

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY
);

const getServiceSupabase = () => {
    if (serviceSupabase) return serviceSupabase;

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        const error = new Error('Notice storage is not configured on the server');
        error.statusCode = 503;
        throw error;
    }

    serviceSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    return serviceSupabase;
};

module.exports = { supabase, getServiceSupabase };