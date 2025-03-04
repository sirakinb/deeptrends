"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const supabase_1 = require("@/lib/supabase");
async function GET() {
    try {
        const { data, error } = await supabase_1.supabase
            .from('schedules')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('Error fetching schedules:', error);
            return server_1.NextResponse.json({ error: 'Failed to fetch schedules' }, { status: 500 });
        }
        return server_1.NextResponse.json(data || []);
    }
    catch (error) {
        console.error('Error in GET handler:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function POST(request) {
    try {
        const schedule = await request.json();
        const now = new Date().toISOString();
        const { data, error } = await supabase_1.supabase
            .from('schedules')
            .insert([{
                ...schedule,
                is_active: true,
                created_at: now,
                updated_at: now
            }])
            .select()
            .single();
        if (error) {
            console.error('Error creating schedule:', error);
            return server_1.NextResponse.json({ error: 'Failed to create schedule' }, { status: 500 });
        }
        return server_1.NextResponse.json(data, { status: 201 });
    }
    catch (error) {
        console.error('Error in POST handler:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
