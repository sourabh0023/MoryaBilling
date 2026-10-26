"use client";

import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }> };

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setHelp(false);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    if (window.matchMedia("(display-mode: standalone)").matches) setInstalled(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!promptEvent) {
      setHelp(true);
      return;
    }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setPromptEvent(null);
  };

  if (installed) return <span className="install-status is-installed" title="MoryaBilling is installed" aria-label="MoryaBilling installed"><Smartphone size={20}/></span>;

  return <>
    <button className="install-app-btn" onClick={install} title="Install MoryaBilling" aria-label="Install MoryaBilling"><Smartphone size={20}/></button>
    {help && <div className="install-help" role="dialog" aria-label="Install MoryaBilling">
      <div className="install-help-title"><Smartphone size={18}/> Install MoryaBilling</div>
      <button className="install-help-close" onClick={() => setHelp(false)} aria-label="Close install instructions">×</button>
      <p>In Chrome on Android, open the ⋮ menu and choose <strong>Install app</strong> or <strong>Add to Home screen</strong>. If the option is missing, wait for the latest deployment and reload this page.</p>
      <button className="install-help-done" onClick={() => setHelp(false)}>Got it</button>
    </div>}
  </>;
}
