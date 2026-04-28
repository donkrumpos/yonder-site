// Resend integration — placeholder.
// TODO: install `resend` package and wire up sendConfirmation / sendWelcome
// once API key is provisioned and domain is verified.
//
// Env vars expected:
//   RESEND_API_KEY
//   RESEND_FROM_ADDRESS  (e.g. "Yonder <hello@yonderartland.com>")

export interface SendArgs {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(_args: SendArgs): Promise<void> {
  throw new Error('Resend not yet wired up. See src/lib/resend.ts');
}
