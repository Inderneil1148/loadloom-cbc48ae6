import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import logoIcon from "@/assets/loadloom-icon.png";
import { Button } from "@/components/ui/button";

const KEY = "ll-install-dismissed";
type BIP = Event & { prompt: () => Promise<void> };

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [ios, setIos] = useState(false);
  const [evt, setEvt] = useState<BIP | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone;
    if (standalone || localStorage.getItem(KEY)) return;
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    // Show only once per device, even if ignored; skip the dashboard splash.
    localStorage.setItem(KEY, "1");
    const t = window.setTimeout(() => setShow(true), window.location.pathname.startsWith("/dashboard") ? 4000 : 1500);
    const onBip = (e: Event) => { e.preventDefault(); setEvt(e as BIP); };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => { window.clearTimeout(t); window.removeEventListener("beforeinstallprompt", onBip); };
  }, []);

  function close() { setShow(false); }
  if (!show) return null;

  return (
    <div role="dialog" aria-label="Install LoadLoom" className="fixed right-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-[60] flex w-[min(20rem,calc(100vw-1.5rem))] items-center gap-2 rounded-lg border border-navy-foreground/15 bg-navy p-2.5 text-navy-foreground shadow-lifted lg:bottom-4">
      <img src={logoIcon} alt="" className="size-8 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 text-xs">
        <p className="font-bold">Install LoadLoom as an app</p>
        {evt ? <p className="text-navy-foreground/70">Open it from your home screen like an app.</p>
          : ios ? <p className="text-navy-foreground/70">Tap <Share className="inline size-3.5" /> Share, then "Add to Home Screen".</p>
          : <p className="text-navy-foreground/70">Open your browser menu and tap "Install app" or "Add to Home screen".</p>}
      </div>
      {evt && <Button size="sm" variant="action" onClick={async () => { await evt.prompt(); close(); }}><Download /> Install</Button>}
      <button type="button" aria-label="Close" onClick={close} className="shrink-0 rounded p-1 text-navy-foreground/70 hover:text-navy-foreground"><X className="size-4" /></button>
    </div>
  );
}
