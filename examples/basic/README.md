# AgentRecord basic example

This example is a privacy-safe starting point for a first local profile run. It does not include raw traces, private sessions, generated `profiles/` output, or real user data.

From the package source:

```bash
node src/cli.mjs init --owner smoke-owner
node src/cli.mjs build --config ./agentrecord.config.json --no-account-usage
node src/cli.mjs validate --config ./agentrecord.config.json
node src/cli.mjs open --config ./agentrecord.config.json
```

After installing the npm package:

```bash
agentrecord init --owner smoke-owner
agentrecord build --config ./agentrecord.config.json --no-account-usage
agentrecord validate --config ./agentrecord.config.json
agentrecord open --config ./agentrecord.config.json
```

The primary output is `profiles/smoke-owner/index.html`, a single-file static HTML report. Keep raw agent traces and private `.agentrecord/` state local.
