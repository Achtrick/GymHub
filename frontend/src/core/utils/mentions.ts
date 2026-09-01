export interface Mention {
  userId: string;
  fullName: string;
}

const MENTION_PATTERN = /@\[([^\]]+)\]\(([a-f0-9]{24})\)/g;

// Comments are stored as plain text, but a mention picked from the @-dropdown
// is encoded inline as `@[Full Name](userId)` so it survives round-tripping
// through the API without a separate mentions table. Only mentions actually
// selected from the dropdown (tracked in `mentions`) get encoded — a bare
// "@name" typed by hand stays plain text.
export function encodeMentions(text: string, mentions: Mention[]): string {
  let result = text;
  const byLength = [...mentions].sort((a, b) => b.fullName.length - a.fullName.length);
  for (const mention of byLength) {
    const token = `@${mention.fullName}`;
    const encoded = `@[${mention.fullName}](${mention.userId})`;
    if (result.includes(token)) {
      result = result.split(token).join(encoded);
    }
  }
  return result;
}

export interface MentionSegment {
  type: "mention";
  userId: string;
  fullName: string;
}

export function parseMentions(text: string): (string | MentionSegment)[] {
  const segments: (string | MentionSegment)[] = [];
  let lastIndex = 0;
  MENTION_PATTERN.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = MENTION_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index));
    }
    segments.push({ type: "mention", fullName: match[1], userId: match[2] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex));
  }

  return segments;
}
