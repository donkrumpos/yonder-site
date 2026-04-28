/**
 * subscribe Edge Function
 *
 * POST { email, source?, website? } → upsert into subscribers and email a
 * confirmation link. The confirmation link points at the
 * `confirm-subscription` edge function, which flips `confirmed_at` and sends
 * the welcome email.
 *
 * `website` is a honeypot field — present in the form but hidden from humans;
 * any value means a bot, and we silently fake success.
 *
 * Secrets required (Supabase Edge Function Secrets):
 *   RESEND_API_KEY, FROM_EMAIL
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
    const { email, source, website, turnstile_token } = body as Record<string, unknown>;

    // Honeypot — hidden from humans. Anything in this field means a bot.
    if (typeof website === 'string' && website.trim() !== '') {
      console.log('Honeypot triggered:', { email });
      return jsonResponse({ ok: true });
    }

    // Cloudflare Turnstile verification.
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

    if (typeof email !== 'string' || !email.includes('@')) {
      return jsonResponse({ ok: false, error: 'Valid email required' }, 400);
    }

    const lowered = email.toLowerCase().trim();
    const sourceStr = typeof source === 'string' ? source : 'unknown';

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: existing, error: lookupErr } = await supabase
      .from('subscribers')
      .select('id, email, confirmation_token, confirmed_at, unsubscribed_at')
      .eq('email', lowered)
      .maybeSingle();

    if (lookupErr) {
      console.error('Lookup failed:', lookupErr);
      return jsonResponse({ ok: false, error: 'Server error' }, 500);
    }

    let token: string;
    let alreadyConfirmed = false;

    if (existing) {
      if (existing.unsubscribed_at) {
        // Re-subscribe after a prior unsubscribe. New token; reset confirmed_at.
        const { data: updated, error: updErr } = await supabase
          .from('subscribers')
          .update({
            unsubscribed_at: null,
            confirmed_at: null,
            confirmation_token: crypto.randomUUID(),
            source: sourceStr,
          })
          .eq('id', existing.id)
          .select('confirmation_token')
          .single();
        if (updErr || !updated) {
          console.error('Resubscribe update failed:', updErr);
          return jsonResponse({ ok: false, error: 'Server error' }, 500);
        }
        token = updated.confirmation_token;
      } else if (existing.confirmed_at) {
        alreadyConfirmed = true;
        token = existing.confirmation_token;
      } else {
        // Pending confirmation: reuse existing token so old + new emails both work.
        token = existing.confirmation_token;
      }
    } else {
      const { data: inserted, error: insErr } = await supabase
        .from('subscribers')
        .insert({ email: lowered, source: sourceStr })
        .select('confirmation_token')
        .single();
      if (insErr || !inserted) {
        console.error('Insert failed:', insErr);
        return jsonResponse({ ok: false, error: 'Server error' }, 500);
      }
      token = inserted.confirmation_token;
    }

    if (!alreadyConfirmed) {
      const sendOk = await sendConfirmationEmail(lowered, token);
      if (!sendOk) {
        return jsonResponse({ ok: false, error: 'Could not send confirmation email' }, 500);
      }
    }

    return jsonResponse({ ok: true, alreadyConfirmed });
  } catch (err) {
    console.error('Subscribe error:', err);
    return jsonResponse({ ok: false, error: 'Server error' }, 500);
  }
});

async function sendConfirmationEmail(email: string, token: string): Promise<boolean> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL');
  if (!apiKey || !fromEmail) {
    console.error('Resend not configured (RESEND_API_KEY or FROM_EMAIL missing)');
    return false;
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const confirmUrl = `${supabaseUrl}/functions/v1/confirm-subscription?token=${token}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `Yonder Art Land <${fromEmail}>`,
      to: email,
      subject: 'Confirm your subscription to Yonder Art Land',
      html: `
        <p>One last step.</p>
        <p>Click the link below to confirm you'd like to receive dispatches from Yonder Art Land — field notes, mural progress, Krampusnacht updates, and the occasional invitation.</p>
        <p><a href="${confirmUrl}" style="color:#7a5a2b;">Confirm subscription →</a></p>
        <p style="color:#888;font-size:0.9em;">If you didn't ask for this, you can ignore the message — nothing happens until you click.</p>
        <p>— Don &amp; Erin<br>Yonder Art Land<br>Algoma, Wisconsin</p>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error('Resend send failed:', text);
    return false;
  }
  return true;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
