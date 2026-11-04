# Security Policy

## Supported version

The `main` branch receives security fixes for the current prototype.

## Reporting a vulnerability

Please do **not** open a public issue for a vulnerability that could expose credentials, private image data, or provider access.

Use GitHub's private vulnerability reporting flow:

1. Open the repository's **Security** tab.
2. Choose **Advisories**.
3. Select **Report a vulnerability**.

Include the affected route or file, reproduction conditions, impact, and a minimal proof of concept. Do not include real API keys or private photographs.

## Secret handling

XINTU expects provider credentials only in server-side environment variables. Never commit:

- `.env.local`
- DashScope or other model API keys
- Vercel OIDC tokens
- GitHub tokens
- private user images

If a credential is exposed, revoke it at the provider first, then rotate the deployment secret.