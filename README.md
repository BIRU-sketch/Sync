# Voice companion

Low-latency desktop voice companion for developers, built on Voxide (voxide.app)
for the STARK Official Hackathon.

## Structure
- electron/   — main process + IPC bridge (runs real shell commands)
- src/        — renderer (React), Voxide client + capabilities + UI
- packs/      — declarative phrase -> capability reference data
