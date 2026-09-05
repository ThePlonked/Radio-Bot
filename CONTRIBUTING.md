# Contributing

Thanks for considering a contribution.

1. Fork and clone the repository.
2. Install Node.js 22.12 or newer and pnpm 11 or newer.
3. Run `pnpm install`.
4. Copy `.env.example` to `.env` and add development-bot credentials.
5. Run `pnpm deploy-commands` and `pnpm dev`.

Before opening a pull request, run:

```bash
pnpm check
pnpm build
```

Keep changes focused, update tests where practical, and never commit tokens or
`.env` files. Confirm that new stations publish legitimate streams and that
their use complies with broadcaster terms and applicable licences.

Contributions are licensed under the repository's MIT License.
