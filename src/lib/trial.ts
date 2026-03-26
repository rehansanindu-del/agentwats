export function isTrialActive(user: { is_pro?: boolean | null; trial_end?: string | null }): boolean {
  if (user.is_pro === true) {
    return true;
  }

  if (!user.trial_end) {
    return false;
  }

  const trialEnd = new Date(user.trial_end);
  if (Number.isNaN(trialEnd.getTime())) {
    return false;
  }

  return Date.now() < trialEnd.getTime();
}

export function getDaysLeft(trialEnd: string | null | undefined): number {
  if (!trialEnd) {
    return 0;
  }

  const end = new Date(trialEnd);
  if (Number.isNaN(end.getTime())) {
    return 0;
  }

  const diff = end.getTime() - Date.now();
  if (diff <= 0) {
    return 0;
  }

  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}
