import type { APIRoute } from 'astro';

export const prerender = false;

interface ContactPayload {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
}

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 6;

type RateLimitStore = Map<string, number[]>;

function asText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidEmail(email: string): boolean {
  return /^\S+@\S+\.\S+$/.test(email);
}

function jsonResponse(body: Record<string, unknown>, status: number, headers?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function getRateLimitStore(): RateLimitStore {
  const runtime = globalThis as typeof globalThis & {
    __contactRateLimitStore?: RateLimitStore;
  };

  if (!runtime.__contactRateLimitStore) {
    runtime.__contactRateLimitStore = new Map();
  }

  return runtime.__contactRateLimitStore;
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const store = getRateLimitStore();
  const attempts = (store.get(key) ?? []).filter((timestamp) => timestamp > windowStart);

  if (attempts.length >= RATE_LIMIT_MAX_REQUESTS) {
    const oldestAttempt = attempts[0] ?? now;
    const retryAfterMs = RATE_LIMIT_WINDOW_MS - (now - oldestAttempt);
    store.set(key, attempts);
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
    };
  }

  attempts.push(now);
  store.set(key, attempts);
  return { allowed: true, retryAfterSeconds: 0 };
}

function extractSmtpAddress(fromHeader: string): string {
  const match = fromHeader.match(/<([^>]+)>/);
  return match ? match[1] : fromHeader.trim();
}

function isResendSandbox(baseFrom: string): boolean {
  return baseFrom.includes('onboarding@resend.dev');
}

function resolveFromEmail(): string {
  const configured =
    asText(import.meta.env.MAIL_FROM)
    || asText(import.meta.env.CONTACT_FROM_EMAIL)
    || 'VectorVet <onboarding@resend.dev>';

  if (isResendSandbox(configured)) {
    return 'VectorVet <onboarding@resend.dev>';
  }

  return configured;
}

function sanitizeDisplayName(name: string): string {
  const cleaned = name.replace(/[<>"\\]/g, '').trim();
  if (!cleaned || isValidEmail(cleaned) || cleaned.includes('@')) {
    return 'Посетитель сайта';
  }
  return cleaned;
}

/** From display name = submitter; SMTP address stays on verified domain (Resend requirement). */
function formatFromAsSubmitter(name: string, baseFrom: string): string {
  if (isResendSandbox(baseFrom)) {
    // Sandbox: fixed sender — Resend rejects display names that look like email addresses.
    return 'VectorVet <onboarding@resend.dev>';
  }

  const safeName = sanitizeDisplayName(name);
  const smtpAddress = extractSmtpAddress(baseFrom);
  return `${safeName} <${smtpAddress}>`;
}

function resolveResendErrorMessage(status: number, providerMessage?: string): string {
  if (
    status === 403
    && providerMessage?.includes('testing emails to your own email address')
  ) {
    console.error('Contact form: Resend sandbox restriction. Check MAIL_FROM and CONTACT_TO_EMAIL.');
    return 'Не удалось отправить сообщение. Попробуйте позже или напишите нам напрямую.';
  }

  return 'Не удалось отправить сообщение. Попробуйте позже.';
}

export const POST: APIRoute = async ({ request }) => {
  const resendApiKey = asText(import.meta.env.RESEND_API_KEY);
  const toEmail = asText(import.meta.env.CONTACT_TO_EMAIL);

  if (!resendApiKey || !toEmail) {
    console.error('Contact form: RESEND_API_KEY or CONTACT_TO_EMAIL is not configured');
    return jsonResponse(
      { ok: false, error: 'Отправка временно недоступна. Попробуйте позже.' },
      503,
    );
  }

  let payload: ContactPayload;
  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return jsonResponse({ ok: false, error: 'Некорректный запрос.' }, 400);
  }

  const name = asText(payload.name);
  const email = asText(payload.email);
  const message = asText(payload.message);
  const website = asText(payload.website);

  if (website.length > 0) {
    console.warn('contact_form_honeypot_filled', { websiteLength: website.length });
    return jsonResponse({ ok: true }, 200);
  }

  const isValid =
    name.length >= 2
    && name.length <= 80
    && isValidEmail(email)
    && message.length <= 2000;

  if (!isValid) {
    return jsonResponse(
      { ok: false, error: 'Укажите имя и корректный email.' },
      400,
    );
  }

  if (isValidEmail(name)) {
    return jsonResponse(
      { ok: false, error: 'В поле «Имя» укажите имя, а не email.' },
      400,
    );
  }

  const forwardedFor = request.headers.get('x-forwarded-for') || '';
  const remoteIp = forwardedFor.split(',')[0]?.trim() || 'unknown';
  const rateLimitKey = `${remoteIp}:${email.toLowerCase()}`;
  const rateLimit = checkRateLimit(rateLimitKey);

  if (!rateLimit.allowed) {
    return jsonResponse(
      { ok: false, error: 'Слишком много попыток. Попробуйте позже.' },
      429,
      { 'Retry-After': String(rateLimit.retryAfterSeconds) },
    );
  }

  const baseFrom = resolveFromEmail();
  const fromHeader = formatFromAsSubmitter(name, baseFrom);

  const subject = `Заявка с сайта ВЕКТОР: ${name} (${email})`;
  const text = [
    `Имя: ${name}`,
    `Email: ${email}`,
    '',
    'Сообщение:',
    message || '—',
  ].join('\n');

  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromHeader,
      to: [toEmail],
      reply_to: email,
      subject,
      text,
    }),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.json().catch(() => ({})) as {
      message?: string;
    };
    console.error('Resend error:', resendError);
    return jsonResponse(
      {
        ok: false,
        error: resolveResendErrorMessage(
          resendResponse.status,
          resendError.message,
        ),
      },
      502,
    );
  }

  const resendResult = await resendResponse.json().catch(() => ({}));

  return jsonResponse({ ok: true, id: resendResult.id || null }, 200);
};

export const GET: APIRoute = async () =>
  jsonResponse({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
