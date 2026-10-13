# Kindred AAC AI Collaboration Contract

# Kindred AAC operating rules
- Product owner approves scope, layout changes, and releases. Never auto-merge or publish.
- Child-controlled AAC is always accessible, offline-capable, and independent of spoken responses or AI predictions.
- Protect Help, Stop and Break; do not gate communication behind caregiver PIN, avatar, speech, network, or login.
- Preserve verified v0.13 behavior, existing vocabulary, stored photos, settings, and offline speech support.
- Follow MVC: model owns state/rules, view owns presentation, controller owns interactions; isolate speech and storage.
- Before changes, reproduce defects with failing tests, compare prior working behavior, make the smallest change, run all available regression tests.
- Report exactly what ran, passes/failures and limits. Static checks, mocks, browser, and actual tablet tests are distinct.
- Never include real children's photos, communication histories, or sensitive data in issues, logs, prompts, or external services.
- Never claim clinical efficacy, diagnosis, pronunciation scoring, or child outcomes without supporting evidence.

## Workflow
1. Product owner approves issue and UI designs.
2. Developer proposes changes and adds failing tests.
3. QA and accessibility reviewers inspect independently.
4. Release reviewer records readiness and gaps.
5. Product owner explicitly approves deployment; no agent autonomously publishes.

The current GitHub Pages branch is a demo, not a place for experimental changes. Keep v0.13 rollback history. The v0.14 reliability audit is an open draft PR; don't conflate new source tests with real-browser validation.
