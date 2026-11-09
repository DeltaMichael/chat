export default class PollScheduler {
  private timer: number | null = null;
  private running = false;
  private started = false;
  private pending = false;
  private failures = 0;
  private retryAt = 0;

  constructor(
    private readonly poll: () => Promise<boolean>,
    private readonly interval: () => number,
    private readonly now: () => number = Date.now,
    private readonly setTimer: (callback: () => void, delay: number) => number = (callback, delay) => window.setTimeout(callback, delay),
    private readonly clearTimer: (timer: number) => void = (timer) => window.clearTimeout(timer)
  ) {}

  start(): void {
    if (this.started) return;
    this.started = true;
    this.schedule(this.interval());
  }

  reschedule(): void {
    if (!this.started || this.running) return;
    this.schedule(this.interval());
  }

  wake(): void {
    if (!this.started) return;
    if (this.running) {
      this.pending = true;
      return;
    }
    this.schedule(0);
  }

  private schedule(delay: number): void {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = this.setTimer(
      () => {
        this.timer = null;
        void this.run();
      },
      Math.max(delay, this.retryAt - this.now(), 0)
    );
  }

  private async run(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      if (await this.poll()) {
        this.failures = 0;
        this.retryAt = 0;
      }
    } catch (error) {
      this.failures++;
      const delay = Math.min(60000, 3000 * 2 ** Math.min(this.failures - 1, 5));
      this.retryAt = this.now() + delay;
      if (this.failures === 1) console.warn('[ramon-chat] polling failed; retrying with backoff', error);
    } finally {
      this.running = false;
      const delay = this.pending && this.failures === 0 ? 0 : this.interval();
      this.pending = false;
      this.schedule(delay);
    }
  }
}
