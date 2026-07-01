import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import {
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  RESEND_API_KEY,
} from 'astro:env/server';

export const prerender = false;

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const POST: APIRoute = async ({ request }) => {
  const formData = await request.formData();

  if (formData.get('website')) {
    return Response.json({ ok: true });
  }

  const name = formData.get('name')?.toString().trim() ?? '';
  const email = formData.get('email')?.toString().trim() ?? '';
  const message = formData.get('message')?.toString().trim() ?? '';

  if (!name || !email) {
    return Response.json(
      { error: 'Укажите имя и email.' },
      { status: 400 },
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json(
      { error: 'Укажите корректный email.' },
      { status: 400 },
    );
  }

  const resend = new Resend(RESEND_API_KEY);
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeMessage = escapeHtml(message || '—');

  const { error } = await resend.emails.send({
    from: CONTACT_FROM_EMAIL,
    to: CONTACT_TO_EMAIL,
    replyTo: email,
    subject: `Заявка с сайта ВЕКТОР: ${name}`,
    html: `
      <h2>Новая заявка с сайта</h2>
      <p><strong>Имя:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Сообщение:</strong></p>
      <p>${safeMessage.replaceAll('\n', '<br>')}</p>
    `,
    text: `Имя: ${name}\nEmail: ${email}\n\nСообщение:\n${message || '—'}`,
  });

  if (error) {
    console.error('Resend error:', error);
    return Response.json(
      { error: 'Не удалось отправить сообщение. Попробуйте позже.' },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
};
