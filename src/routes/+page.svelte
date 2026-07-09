<script lang="ts">
  import { getDesktopRuntimeInfo, sendDesktopNotification } from "./notifications.remote";

  let status = $state("Ready to send a desktop notification.");
  let sending = $state(false);
  let checking = $state(false);
  let runtimeInfo = $state<Awaited<ReturnType<typeof getDesktopRuntimeInfo>> | null>(null);

  async function checkRuntime() {
    checking = true;
    status = "Checking the Deno server process...";

    try {
      runtimeInfo = await getDesktopRuntimeInfo();
      status =
        runtimeInfo.runtime === "deno-desktop"
          ? "The server process is running with Deno Desktop APIs."
          : "The server process is not exposing Deno Desktop APIs.";
    } catch (error) {
      status = error instanceof Error ? error.message : "Failed to check the runtime.";
    } finally {
      checking = false;
    }
  }

  async function sendNotification() {
    sending = true;
    status = "Asking the Deno server process to send a notification...";

    try {
      const result = await sendDesktopNotification();
      status = result.ok ? "Notification sent from the Deno process." : result.reason;
    } catch (error) {
      status = error instanceof Error ? error.message : "Failed to send notification.";
    } finally {
      sending = false;
    }
  }
</script>

<svelte:head>
  <title>Deno Desktop Notification Demo</title>
</svelte:head>

<main class="demo-shell">
  <section class="demo-panel" aria-labelledby="demo-title">
    <p class="eyebrow">Deno Desktop demo</p>
    <h1 id="demo-title">Desktop notifications</h1>
    <p class="summary">
      Check which desktop-only APIs are available in the SvelteKit server process, then send a
      native notification from that same Deno process.
    </p>

    <div class="actions">
      <button type="button" class="secondary-button" onclick={checkRuntime} disabled={checking}>
        {checking ? "Checking..." : "Check runtime"}
      </button>

      <button type="button" class="notify-button" onclick={sendNotification} disabled={sending}>
        {sending ? "Sending..." : "Send notification"}
      </button>
    </div>

    <p class="status" aria-live="polite">{status}</p>

    {#if runtimeInfo}
      <dl class="runtime-grid" aria-label="Deno server runtime details">
        <div>
          <dt>Runtime</dt>
          <dd>{runtimeInfo.runtime}</dd>
        </div>
        <div>
          <dt>Deno</dt>
          <dd>{runtimeInfo.denoVersion ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Platform</dt>
          <dd>{runtimeInfo.platform ?? "n/a"}</dd>
        </div>
        <div>
          <dt>Notification</dt>
          <dd>{runtimeInfo.hasNotification ? runtimeInfo.notificationPermission : "missing"}</dd>
        </div>
        <div>
          <dt>BrowserWindow</dt>
          <dd>{runtimeInfo.hasBrowserWindow ? "available" : "missing"}</dd>
        </div>
        <div>
          <dt>Permission query</dt>
          <dd>
            {runtimeInfo.hasNotificationPermissionQuery
              ? (runtimeInfo.notificationPermissionQueryState ?? "available")
              : "missing"}
          </dd>
        </div>
      </dl>
    {/if}
  </section>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #f5f7fb;
    color: #151922;
    font-family:
      Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .demo-shell {
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 2rem;
  }

  .demo-panel {
    width: min(100%, 34rem);
    border: 1px solid #d8deea;
    border-radius: 8px;
    background: #ffffff;
    padding: 2rem;
    box-shadow: 0 20px 50px rgb(21 25 34 / 10%);
  }

  .eyebrow {
    margin: 0 0 0.75rem;
    color: #4263eb;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  h1 {
    margin: 0;
    font-size: clamp(2rem, 8vw, 3rem);
    line-height: 1;
  }

  .summary {
    margin: 1rem 0 1.5rem;
    color: #5a6375;
    line-height: 1.55;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .notify-button,
  .secondary-button {
    appearance: none;
    border-radius: 8px;
    cursor: pointer;
    font: inherit;
    font-weight: 700;
    padding: 0.875rem 1.125rem;
  }

  .notify-button {
    border: 0;
    background: #151922;
    color: #ffffff;
  }

  .notify-button:hover:not(:disabled) {
    background: #293244;
  }

  .secondary-button {
    border: 1px solid #c7cfdd;
    background: #ffffff;
    color: #151922;
  }

  .secondary-button:hover:not(:disabled) {
    background: #edf1f7;
  }

  .notify-button:disabled,
  .secondary-button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .status {
    min-height: 1.5rem;
    margin: 1rem 0 0;
    color: #384152;
  }

  .runtime-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    gap: 0.75rem;
    margin: 1.25rem 0 0;
  }

  .runtime-grid div {
    border: 1px solid #d8deea;
    border-radius: 8px;
    padding: 0.75rem;
  }

  dt {
    color: #687287;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  dd {
    margin: 0.25rem 0 0;
    overflow-wrap: anywhere;
  }
</style>
