/**
 * Anti-Flood & Client Rate Limiting Security Layer
 * Protects Supabase backend, download endpoints, and UI from automated spam, autoclickers, and flooding.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class SecurityShield {
  private static instance: SecurityShield;
  private actionTimestamps: Map<string, number[]> = new Map();
  private lastClickTime: number = 0;
  private isBannedUntil: number = 0;

  private constructor() {
    // Restore temporary cooldown state from sessionStorage
    const savedCooldown = sessionStorage.getItem('sponex_security_cooldown');
    if (savedCooldown) {
      const parsed = parseInt(savedCooldown, 10);
      if (parsed > Date.now()) {
        this.isBannedUntil = parsed;
      }
    }
  }

  public static getInstance(): SecurityShield {
    if (!SecurityShield.instance) {
      SecurityShield.instance = new SecurityShield();
    }
    return SecurityShield.instance;
  }

  /**
   * Check if rapid click spamming / autoclicker is detected (< 300ms between critical actions)
   */
  public checkClickSpam(): { allowed: boolean; reason?: string } {
    const now = Date.now();

    if (this.isBannedUntil > now) {
      const remainingSec = Math.ceil((this.isBannedUntil - now) / 1000);
      return {
        allowed: false,
        reason: `Protecție Anti-Flood activă. Așteaptă ${remainingSec}s.`
      };
    }

    if (now - this.lastClickTime < 350) {
      // Rapid repetitive clicking detected
      return {
        allowed: false,
        reason: 'Prea multe acțiuni rapide. Te rugăm să nu spamezi!'
      };
    }

    this.lastClickTime = now;
    return { allowed: true };
  }

  /**
   * Generic sliding-window rate limiter per action key (e.g. 'download_script', 'fetch_data')
   */
  public rateLimit(
    actionKey: string,
    config: RateLimitConfig = { maxRequests: 5, windowMs: 15000 }
  ): { allowed: boolean; remainingSec?: number } {
    const now = Date.now();

    if (this.isBannedUntil > now) {
      return {
        allowed: false,
        remainingSec: Math.ceil((this.isBannedUntil - now) / 1000)
      };
    }

    const timestamps = this.actionTimestamps.get(actionKey) || [];
    const validTimestamps = timestamps.filter(t => now - t < config.windowMs);

    if (validTimestamps.length >= config.maxRequests) {
      // Trigger temporary 15-second cooldown
      this.isBannedUntil = now + 15000;
      sessionStorage.setItem('sponex_security_cooldown', this.isBannedUntil.toString());
      return {
        allowed: false,
        remainingSec: 15
      };
    }

    validTimestamps.push(now);
    this.actionTimestamps.set(actionKey, validTimestamps);
    return { allowed: true };
  }

  /**
   * Check if current session is under temporary flood restriction
   */
  public isUnderCooldown(): boolean {
    return this.isBannedUntil > Date.now();
  }

  public getCooldownSeconds(): number {
    return Math.max(0, Math.ceil((this.isBannedUntil - Date.now()) / 1000));
  }
}

export const securityShield = SecurityShield.getInstance();
