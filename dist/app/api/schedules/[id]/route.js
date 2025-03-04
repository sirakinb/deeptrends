"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUT = PUT;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const supabase_1 = require("@/lib/supabase");
async function PUT(request, { params }) {
    try {
        const scheduleId = String(params.id);
        const updates = await request.json();
        const { data, error } = await supabase_1.supabase
            .from('schedules')
            .update({
            ...updates,
            updated_at: new Date().toISOString()
        })
            .eq('id', scheduleId)
            .select()
            .single();
        if (error) {
            console.error('Error updating schedule:', error);
            return server_1.NextResponse.json({ error: error.message }, { status: 500 });
        }
        if (!data) {
            return server_1.NextResponse.json({ error: `Schedule ${scheduleId} not found` }, { status: 404 });
        }
        return server_1.NextResponse.json(data);
    }
    catch (error) {
        console.error('Error in PUT /api/schedules/[id]:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
async function DELETE(request, { params }) {
    try {
        const scheduleId = String(params.id);
        console.log(`Attempting to delete schedule: ${scheduleId}`);
        const { error } = await supabase_1.supabase
            .from('schedules')
            .delete()
            .eq('id', scheduleId);
        if (error) {
            console.error('Error deleting schedule:', error);
            return server_1.NextResponse.json({ error: 'Failed to delete schedule' }, { status: 500 });
        }
        return server_1.NextResponse.json({ message: `Successfully deleted schedule: ${scheduleId}` }, { status: 200 });
    }
    catch (error) {
        console.error('Error in DELETE handler:', error);
        return server_1.NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
