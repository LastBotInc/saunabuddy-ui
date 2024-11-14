export function generateRandomAlphanumeric(length: number): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }

  return result;
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function formatDuration(start: Date, end?: Date): string {
  const endTime = end || new Date();
  const durationInSeconds = Math.floor(
    (endTime.getTime() - start.getTime()) / 1000
  );

  const hours = Math.floor(durationInSeconds / 3600);
  const minutes = Math.floor((durationInSeconds % 3600) / 60);
  const seconds = durationInSeconds % 60;

  let result = "";
  if (hours > 0) {
    result += `${hours}h `;
  }
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  result += `${seconds}s`;

  return result.trim();
}

export function getSessionPeriod(): string | null {
  const sessionKey = "lb_connection_session";
  const sessionStart = sessionStorage.getItem(sessionKey);

  if (sessionStart) {
    const startDate = new Date(parseInt(sessionStart, 10)); // Ensure the timestamp is parsed as an integer
    const duration = formatDuration(startDate);
    sessionStorage.removeItem(sessionKey);
    return duration;
  }

  return null;
}
