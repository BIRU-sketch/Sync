# Voice companion

Low-latency desktop voice companion for developers, built on Voxide (voxide.app)
for the STARK Official Hackathon.

## Structure
- electron/   — main process + IPC bridge (runs real shell commands)
- src/        — renderer (React), Voxide client + capabilities + UI
- packs/      — declarative phrase -> capability reference data

## Voxide setup

Create a `.env` file with the publishable key from the Voxide dashboard:

```env
VITE_VOXIDE_PUBLIC_KEY=vox_pub_...
```

Add the production domain to the Voxide project whitelist. `localhost` is allowed automatically during local development.
