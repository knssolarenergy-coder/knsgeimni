import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

function emailServerPlugin(): Plugin {
  const handler = async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method Not Allowed' }));
      return;
    }
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const apiKey =
          payload.apiKey ||
          process.env.VITE_RESEND_API_KEY ||
          process.env.RESEND_API_KEY;

        if (!apiKey) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(
            JSON.stringify({
              statusCode: 400,
              name: 'missing_api_key',
              message: 'Resend API key is not configured.',
            })
          );
          return;
        }

        const fromAddress =
          payload.from ||
          process.env.VITE_RESEND_FROM ||
          process.env.RESEND_FROM ||
          'K&S Solar Security <noreply@knssolar.com.pk>';

        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: Array.isArray(payload.to) ? payload.to : [payload.to],
            subject: payload.subject,
            html: payload.html,
          }),
        });

        const resData = await resendRes.json().catch(() => ({}));
        res.statusCode = resendRes.status;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(resData));
      } catch (err: any) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            statusCode: 500,
            name: 'internal_error',
            message: err?.message || 'Server error delivering email',
          })
        );
      }
    });
  };

  return {
    name: 'email-server-plugin',
    configureServer(server: any) {
      server.middlewares.use('/api/send-email', handler);
    },
    configurePreviewServer(server: any) {
      server.middlewares.use('/api/send-email', handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile(), emailServerPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
    proxy: {
      '/api/resend': {
        target: 'https://api.resend.com',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/resend/, ''),
        secure: true,
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: true,
  },
});
