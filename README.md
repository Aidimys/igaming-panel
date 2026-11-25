# Multi-Brand Content Panel

An interactive prototype for managing game content across multiple brands. It demonstrates how an Account Manager can target brands, review changes before publishing, and track the outcome in an audit history.

## What the prototype demonstrates

- A game catalog with brand-specific activation, artwork, labels, and lobby positions.
- Brand and group targeting, with access scoped by the selected demo operator.
- A pre-publish review with per-brand changes and validation for license restrictions, label mappings, and pinned-position conflicts.
- Role-aware publishing, per-brand sync statuses, retry for failed syncs, and rollback from History.
- Artwork selection, label expiry, and optional pin expiry.

## Suggested demo flow

1. Open a game and inspect its state across brands.
2. Choose **Edit**, explicitly select target brands, and configure a change.
3. Review the per-brand summary, resolve any blocking questions, and publish.
4. Open **History** to inspect sync statuses, review the change details, or revert it.
5. Optionally switch operators to demonstrate role and brand-access restrictions.

## Demo controls

- **12 / 50 brands** switches between generated sample datasets to demonstrate the same interface at different sizes. Switching datasets resets the current demo state and history.
- **Simulate failures** can make the first sync attempt fail for a sample brand. Use **Retry failed** to demonstrate recovery.
- **Reset demo data** restores the initial sample state.

## Run locally

Requirements: Node.js and npm.

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run lint
npm run build
```

## Prototype limitations

This is a front-end demonstration, not a production integration. Platform publishing and sync responses are simulated; state is held in memory and resets when the page is reloaded. The artwork upload option is a placeholder. The prototype does not include production authentication, saved drafts, or scheduled game activation.

No environment variables are required to run or deploy the demo. Vercel is the simplest deployment option for this Next.js project.
