/** 从链接或文本中只提取 BV 号（如 BV1vgYVzfEuF），不含查询参数 */
export function extractBvid(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/BV[0-9A-Za-z]+/i);
  return match ? match[0] : null;
}
