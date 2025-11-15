interface MagicLinkEmailPayload {
  url: string;
}

export function buildMagicLinkEmail({ url }: MagicLinkEmailPayload) {
  const appUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const escapedHost = new URL(appUrl).host.replace(/\./g, "&#8203;.");

  const text = `Sign in to Schema Designer\n${url}\n\nThis link expires in 10 minutes. If you didn’t request it, you can ignore this email.`;

  const html = `
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0f172a;padding:32px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" width="480" role="presentation" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,0.25);">
            <tr>
              <td style="padding:32px 40px;text-align:center;background:linear-gradient(135deg,#0f172a,#1e3a8a);color:#fff;">
                <div style="font-size:14px;letter-spacing:0.4em;text-transform:uppercase;opacity:0.7;">Schema Designer</div>
                <h1 style="margin:12px 0 0;font-size:24px;">Magic link request</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 40px;color:#0f172a;font-size:15px;line-height:1.6;">
                <p style="margin:0 0 16px;">Hi there,</p>
                <p style="margin:0 0 24px;">Click the button below to sign in to <strong>${escapedHost}</strong>. This link stays valid for 10 minutes.</p>
                <p style="margin:0 0 24px;text-align:center;">
                  <a href="${url}" style="display:inline-flex;padding:14px 28px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:600;border-radius:999px;">Sign in to Schema Designer</a>
                </p>
                <p style="margin:0 0 8px;">If the button doesn’t work, paste this URL into your browser:</p>
                <p style="margin:0;background:#f1f5f9;padding:12px;border-radius:12px;font-size:13px;word-break:break-all;">${url}</p>
                <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Didn't request this email? You can safely ignore it.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  return { text, html };
}


