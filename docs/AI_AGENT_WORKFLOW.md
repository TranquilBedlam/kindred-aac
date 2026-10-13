# Using the Kindred AAC agent team

Agents are repository-level GitHub Copilot custom profiles in `.github/agents/`. They are **configurations**, not unattended background workers; an eligible GitHub Copilot environment/account must invoke them. Availability may depend on plan and permissions. 

Recommended sequence: assign a scoped issue to **Kindred Developer**; request **Kindred QA** and **Kindred Accessibility** review; consult **Kindred Research** on evidence-related changes; request **Kindred Release Reviewer** assessment. Only the product owner authorizes merge/deployment.

First pilot: review draft PR #10 (v0.14 reliability). Require tests to run and a manual browser acceptance pass before merge. Never send child data to agents.

Always write review comments that distinguish static inspection, automated node tests, simulated browser tests, and physical tablet tests. A PR or agent profile existing does not prove an agent has run or a release is safe.
