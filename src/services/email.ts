import Mailgun from 'mailgun.js';
import formData from 'form-data';

// Lazy-initialize Mailgun client to avoid build-time errors
let mgClient: ReturnType<InstanceType<typeof Mailgun>['client']> | null = null;

function getMailgunClient() {
  if (!mgClient && process.env.MAILGUN_API_KEY) {
    const mailgun = new Mailgun(formData);
    const MAILGUN_URL = process.env.MAILGUN_REGION === 'us'
      ? 'https://api.mailgun.net'
      : 'https://api.eu.mailgun.net';

    mgClient = mailgun.client({
      username: 'api',
      key: process.env.MAILGUN_API_KEY,
      url: MAILGUN_URL,
    });
  }
  return mgClient;
}

const DOMAIN = process.env.MAILGUN_DOMAIN || 'mail.klippost.co';
const FROM_EMAIL = process.env.MAILGUN_FROM_EMAIL || 'klippost <noreply@mail.klippost.co>';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  tags?: string[];
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email using Mailgun
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const mg = getMailgunClient();

  if (!mg) {
    console.error('MAILGUN_API_KEY not configured');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const messageData: Record<string, unknown> = {
      from: options.from || FROM_EMAIL,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
    };

    if (options.text) messageData.text = options.text;
    if (options.html) messageData.html = options.html;
    if (options.replyTo) messageData['h:Reply-To'] = options.replyTo;
    if (options.tags) messageData['o:tag'] = options.tags;

    const result = await mg.messages.create(DOMAIN, messageData as Parameters<typeof mg.messages.create>[1]);

    console.log('Email sent:', result.id);
    return { success: true, messageId: result.id };
  } catch (error: unknown) {
    console.error('Failed to send email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return { success: false, error: errorMessage };
  }
}
