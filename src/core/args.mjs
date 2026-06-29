export function parseArgs(argv) {
  const options = {};
  const positional = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      positional.push(...argv.slice(index + 1));
      break;
    }

    if (!arg.startsWith("-") || arg === "-") {
      positional.push(arg);
      continue;
    }

    if (arg.startsWith("--no-")) {
      options[toCamelCase(arg.slice(5))] = false;
      continue;
    }

    if (arg.startsWith("--")) {
      const raw = arg.slice(2);
      const equalsIndex = raw.indexOf("=");
      if (equalsIndex !== -1) {
        options[toCamelCase(raw.slice(0, equalsIndex))] = raw.slice(equalsIndex + 1);
        continue;
      }

      const name = toCamelCase(raw);
      const next = argv[index + 1];
      if (next && !next.startsWith("-")) {
        options[name] = next;
        index += 1;
      } else {
        options[name] = true;
      }
      continue;
    }

    if (arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "-v") {
      options.version = true;
      continue;
    }

    positional.push(arg);
  }

  return { options, positional };
}

export function toCamelCase(value) {
  return String(value || "").replace(/-([a-z0-9])/g, (_, char) => char.toUpperCase());
}
