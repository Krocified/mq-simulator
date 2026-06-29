// AMQP topic matching: `*` = one word, `#` = zero+ words, `.` delimiter.
// binding `logs.*.app1` matches `logs.error.app1`; `logs.#` matches `logs.error.app1.db`.

export function topicMatch(binding: string, routingKey: string): boolean {
  const b = binding.split(".").filter(Boolean);
  const r = routingKey.split(".").filter(Boolean);
  return matchWords(b, 0, r, 0);
}

function matchWords(b: string[], bi: number, r: string[], ri: number): boolean {
  if (bi === b.length) return ri === r.length;
  if (b[bi] === "#") {
    // # matches zero or more words: try consuming 0..rest
    for (let k = ri; k <= r.length; k++) {
      if (matchWords(b, bi + 1, r, k)) return true;
    }
    return false;
  }
  if (ri === r.length) return false;
  if (b[bi] === "*" || b[bi] === r[ri]) return matchWords(b, bi + 1, r, ri + 1);
  return false;
}
