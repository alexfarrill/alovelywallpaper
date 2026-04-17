export function usage(message: string): never {
  console.error(message.trim());
  process.exit(1);
}

export function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      usage(`Unexpected argument: ${token}`);
    }

    const [rawKey, inlineValue] = token.slice(2).split("=", 2);
    if (!rawKey) {
      usage(`Invalid argument: ${token}`);
    }

    if (inlineValue !== undefined) {
      args[rawKey] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      args[rawKey] = true;
      continue;
    }

    args[rawKey] = next;
    index += 1;
  }

  return args;
}

export function requireStringArg(
  args: Record<string, string | boolean>,
  name: string,
): string {
  const value = args[name];
  if (typeof value !== "string" || !value.trim()) {
    usage(`Missing required argument --${name}`);
  }
  return value.trim();
}

export function getStringArg(
  args: Record<string, string | boolean>,
  name: string,
): string | undefined {
  const value = args[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
