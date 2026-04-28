/**
 * contact Edge Function
 *
 * POST { name, email, message, source?, website?, turnstile_token } →
 *   1. Verify Turnstile token
 *   2. Insert into contact_messages
 *   3. Email a notification to CONTACT_TO_EMAIL via Resend
 *
 * `website` is a honeypot field; any value means a bot.
 *
 * Secrets required (Supabase Edge Function Secrets):
 *   RESEND_API_KEY, FROM_EMAIL, CONTACT_TO_EMAIL, TURNSTILE_SECRET_KEY
 * Auto-injected by Supabase:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, message, source, website, turnstile_token } = body as Record<string, unknown>;

    // Honeypot.
    if (typeof website === 'string' && website.trim() !== '') {
      console.log('Honeypot triggered:', { email });
      return jsonResponse({ ok: true });
    }

    // Turnstile verification.
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (!turnstileSecret) {
      console.error('TURNSTILE_SECRET_KEY not configured');
      return jsonResponse({ ok: false, error: 'Server configuration error' }, 500);
    }
    if (typeof turnstile_token !== 'string' || !turnstile_token) {
      return jsonResponse({ ok: false, error: 'Security check failed. Please reload and try again.' }, 400);
    }
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret: turnstileSecret, response: turnstile_token }),
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      console.log('Turnstile rejected:', verifyData['error-codes']);
      return jsonResponse({ ok: false, error: 'Security check failed. Please reload and try again.' }, 400);
    }

    // Validate fields.
    const cleanName = typeof name === 'string' ? name.trim() : '';
    const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const cleanMessage = typeof message === 'string' ? message.trim() : '';
    const cleanSource = typeof source === 'string' ? source : 'unknown';

    if (!cleanName || cleanName.length > 200) {
      return jsonResponse({ ok: false, error: 'Name required (max 200 chars)' }, 400);
    }
    if (!cleanEmail || !cleanEmail.includes('@') || cleanEmail.length > 320) {
      return jsonResponse({ ok: false, error: 'Valid email required' }, 400);
    }
    if (!cleanMessage || cleanMessage.length > 5000) {
      return jsonResponse({ ok: false, error: 'Message required (max 5000 chars)' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: inserted, error: insErr } = await supabase
      .from('contact_messages')
      .insert({
        name: cleanName,
        email: cleanEmail,
        message: cleanMessage,
        source: cleanSource,
      })
      .select('id, created_at')
      .single();

    if (insErr || !inserted) {
      console.error('Insert failed:', insErr);
      return jsonResponse({ ok: false, error: 'Server error' }, 500);
    }

    const sendOk = await sendNotificationEmail({
      name: cleanName,
      email: cleanEmail,
      message: cleanMessage,
      source: cleanSource,
      messageId: inserted.id,
      createdAt: inserted.created_at,
    });

    if (!sendOk) {
      // The DB row exists; the notification email failed. Surface the partial
      // success — Foggy can still read the row in Supabase.
      console.error('Notification email failed — DB row id:', inserted.id);
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    console.error('Contact error:', err);
    return jsonResponse({ ok: false, error: 'Server error' }, 500);
  }
});

interface ContactPayload {
  name: string;
  email: string;
  message: string;
  source: string;
  messageId: string;
  createdAt: string;
}

async function sendNotificationEmail(payload: ContactPayload): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL');
  const toEmail = Deno.env.get('CONTACT_TO_EMAIL');
  if (!apiKey || !fromEmail || !toEmail) {
    console.error('Resend or CONTACT_TO_EMAIL not configured');
    return false;
  }

  const escaped = {
    name: escapeHtml(payload.name),
    email: escapeHtml(payload.email),
    message: escapeHtml(payload.message).replace(/\n/g, '<br>'),
    source: escapeHtml(payload.source),
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Yonder Art Land <${fromEmail}>`,
      to: toEmail,
      reply_to: payload.email,
      subject: `Yonder contact: ${payload.name}`,
      html: `
        <p><strong>From:</strong> ${escaped.name} &lt;${escaped.email}&gt;</p>
        <p><strong>Page:</strong> ${escaped.source}</p>
        <p><strong>Message ID:</strong> ${payload.messageId}</p>
        <hr>
        <p>${escaped.message}</p>
        <hr>
        <p style="color:#888;font-size:0.85em;">Reply directly to this email to respond — it'll go to ${escaped.email}.</p>
      `,
    }),
  });

  if (!res.ok) {
    console.error('Resend send failed:', await res.text());
    return false;
  }
  return true;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
