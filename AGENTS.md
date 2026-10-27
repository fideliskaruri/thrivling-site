# Thrivling site

- Use the owner's personal GitHub account, `fideliskaruri`, for every GitHub operation. Set `GH_TOKEN` from `gh auth token -u fideliskaruri` per command; never print it. Do not use a tool that cannot select that account.
- Git author: `fideliskaruri <fideliskaruri@gmail.com>`. Stage specific files, never `git add .` or `git add -A`. Do not push without the owner's publishing approval.
- Work only in this site checkout. Never edit the core mobile app or change its Metro services.
- Use the actual app tree engine, Skia/CanvasKit backend, theme tokens, icon assets and leaf glyphs. Do not substitute animated tree images.
- Follow local time by default, with a persistent user-selected sky override. Respect reduced motion, pause and hidden-tab suspension.
- Verify real browser flows and screenshots at mobile and desktop sizes before publishing. No mock unit tests as evidence.
- Put screenshots and scratch files under `%TEMP%\agent-scratch` or `%TEMP%\playwright-mcp`, never inside this repository.
- Do not delegate work to subagents unless the owner explicitly changes the sole-agent instruction.
