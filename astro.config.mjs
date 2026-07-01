// @ts-check
import { defineConfig, envField } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  adapter: vercel(),
  env: {
    schema: {
      RESEND_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'ВЕКТОР <onboarding@resend.dev>',
      }),
      CONTACT_TO_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'info@vectorvet.ru',
      }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
