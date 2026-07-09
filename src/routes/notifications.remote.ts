import { command } from "$app/server";

type DesktopDeno = {
  version: { deno: string };
  build: { os: string };
  BrowserWindow?: new () => { focus?: () => void };
};

type DesktopRuntimeInfo = {
  runtime: "deno-desktop" | "deno" | "unknown";
  denoVersion: string | null;
  platform: string | null;
  hasNotification: boolean;
  notificationPermission: NotificationPermission | null;
  hasBrowserWindow: boolean;
  hasNotificationPermissionQuery: boolean;
  notificationPermissionQueryState: PermissionState | null;
  hasNativeDialogGlobals: boolean;
};

type NotificationResult =
  | { ok: true; permission: NotificationPermission }
  | { ok: false; reason: string; permission?: NotificationPermission };

function getDenoGlobal() {
  return (globalThis as typeof globalThis & { Deno?: DesktopDeno }).Deno;
}

function getDesktopRuntime() {
  const deno = getDenoGlobal();
  const hasNotification = typeof Notification !== "undefined";
  const hasBrowserWindow = Boolean(deno?.BrowserWindow);

  if (hasNotification || hasBrowserWindow) {
    return "deno-desktop";
  }

  if (deno) {
    return "deno";
  }

  return "unknown";
}

export const getDesktopRuntimeInfo = command(async (): Promise<DesktopRuntimeInfo> => {
  const deno = getDenoGlobal();
  const hasNotification = typeof Notification !== "undefined";
  const hasNotificationPermissionQuery = Boolean(globalThis.navigator?.permissions?.query);
  let notificationPermissionQueryState: PermissionState | null = null;

  if (hasNotificationPermissionQuery) {
    try {
      const status = await navigator.permissions.query({ name: "notifications" });
      notificationPermissionQueryState = status.state;
    } catch {
      notificationPermissionQueryState = null;
    }
  }

  return {
    runtime: getDesktopRuntime(),
    denoVersion: deno?.version.deno ?? null,
    platform: deno?.build.os ?? null,
    hasNotification,
    notificationPermission: hasNotification ? Notification.permission : null,
    hasBrowserWindow: Boolean(deno?.BrowserWindow),
    hasNotificationPermissionQuery,
    notificationPermissionQueryState,
    hasNativeDialogGlobals:
      typeof alert === "function" && typeof confirm === "function" && typeof prompt === "function",
  };
});

export const sendDesktopNotification = command(async (): Promise<NotificationResult> => {
  const deno = getDenoGlobal();

  if (getDesktopRuntime() !== "deno-desktop" || typeof Notification === "undefined") {
    return {
      ok: false,
      reason: "Deno Desktop notifications are only available when running with `deno desktop`.",
    };
  }

  let permission = Notification.permission;

  if (permission !== "granted") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return {
      ok: false,
      permission,
      reason: "Notification permission was not granted.",
    };
  }

  new Notification("Deadlock Build Manager", {
    body: "The Deno-side desktop notification demo is working.",
    tag: "deadlock-build-manager-demo",
  }).addEventListener("click", () => {
    const win = deno?.BrowserWindow ? new deno.BrowserWindow() : null;
    win?.focus?.();
  });

  return { ok: true, permission };
});
