/**
 * confirm-subscription Edge Function
 *
 * GET ?token=<uuid> → flip confirmed_at, send welcome email, redirect back to
 * /subscribed on the public site with a status query param.
 *
 * Called directly from the link in the confirmation email — no JWT required
 * because the URL token is the auth mechanism.
 *
 * Secrets required (Supabase Edge Function Secrets):
 *   RESEND_API_KEY, FROM_EMAIL
 * Optional:
 *   SITE_URL — where to redirect on success/failure (defaults to
 *              https://yonderartland.com).
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const siteUrl = Deno.env.get('SITE_URL') || 'https://yonderartland.com';

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return redirect(`${siteUrl}/subscribed?status=error&reason=missing-token`);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: row, error: fetchErr } = await supabase
    .from('subscribers')
    .select('id, email, confirmed_at, unsubscribed_at')
    .eq('confirmation_token', token)
    .maybeSingle();

  if (fetchErr) {
    console.error('Lookup error:', fetchErr);
    return redirect(`${siteUrl}/subscribed?status=error&reason=lookup`);
  }
  if (!row) {
    return redirect(`${siteUrl}/subscribed?status=error&reason=invalid-token`);
  }
  if (row.unsubscribed_at) {
    return redirect(`${siteUrl}/subscribed?status=error&reason=unsubscribed`);
  }

  // Idempotent: only flip + email on the first confirmation.
  if (!row.confirmed_at) {
    const { error: updErr } = await supabase
      .from('subscribers')
      .update({ confirmed_at: new Date().toISOString() })
      .eq('id', row.id);
    if (updErr) {
      console.error('Confirm update error:', updErr);
      return redirect(`${siteUrl}/subscribed?status=error&reason=update`);
    }
    await sendWelcomeEmail(row.email);
  }

  return redirect(`${siteUrl}/subscribed?status=ok`);
});

async function sendWelcomeEmail(email: string): Promise<void> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('FROM_EMAIL');
  if (!apiKey || !fromEmail) {
    console.error('Resend not configured; skipping welcome email');
    return;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Yonder Art Land <${fromEmail}>`,
        to: email,
        subject: "You're in",
        html: `
          <p>You're in.</p>
          <p>Yonder Art Land is a small studio and gallery in Algoma, Wisconsin — murals, puppet shows, and the occasional Krampus.</p>
          <p>You'll hear from us when something new is up on a wall, when a show goes on sale, or when there's something worth coming over for. Not often.</p>
          <p>If we ever cross your line, the unsubscribe link will be at the bottom of every message we send.</p>
          <p>— Don &amp; Erin</p>
        `,
      }),
    });
    if (!res.ok) {
      console.error('Welcome email send failed:', await res.text());
    }
  } catch (err) {
    console.error('Welcome email error:', err);
  }
}

function redirect(to: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: to },
  });
}
