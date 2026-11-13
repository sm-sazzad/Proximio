# AGENTS.md — Rules for the AI coding agent (Proximo)

Read this file and `ProjectPlan.md` completely before every task.

## The most important rule: one step at a time

- `ProjectPlan.md` section 7 defines Steps 1 to 9.
- Do **only** the step the user names in the prompt. Never start the next step, and never add features from a later step, even if it looks easy or small.
- If a request is unclear or seems to span several steps, ask before building.
- When the step is finished:
  1. Tick its checkbox in the Progress list in `ProjectPlan.md`.
  2. Reply with a short summary: what you built, the files you created or changed, and exactly how I can test it.
  3. **Stop and wait.** Do not continue on your own.

## Scope and safety

- Touch only the files the current step needs. Do not refactor unrelated code.
- Never create, edit or print `.env.local`. Never hardcode keys or secrets. Never commit secrets.
- The Firebase schema in `ProjectPlan.md` section 3 is a contract with the ESP32 firmware. Do not rename or restructure it.
- The website may **write only to `/control`**. Never write to `/live` or `/logs`.
- Subscribe to each Firebase path once (context/provider), never in many components. Always unsubscribe on unmount.
- Use free tools only. No Cloud Functions, no paid services.
- Do not install new packages without asking first. When you do, list them in your summary.
- Respect the Out of scope list in `ProjectPlan.md` section 6.

## Quality bar

- TypeScript strict. No `any`. Small, reusable, well-named components.
- Premium visual quality is a requirement of every step, not a final polish. Follow the design tokens and rules in `ProjectPlan.md` section 5.
- Before building a UI component, look at 21st.dev, Aceternity UI, Magic UI and shadcn/ui for a good pattern. Adapt it to the Proximo style, check the license, and keep dependencies minimal.
- Mobile-first (360 px), with loading, empty and error states for every data component.
- Accessible: contrast, focus rings, aria labels. Respect `prefers-reduced-motion`.
- UI text is in English.
- Make sure `npm run build` passes before you say a step is done.

## Communication

- Be brief and concrete. If you make an assumption, state it in one line.
- If something blocks you (missing env variable, no data from the device), say so clearly instead of faking data.
