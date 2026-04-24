import { useEffect, useRef } from "react";

interface Props {
  /** Called with the .glb URL when user finishes building. */
  onAvatar: (url: string) => void;
  /** RPM subdomain (defaults to demo). */
  subdomain?: string;
}

/**
 * Embeds the Ready Player Me creator iframe and listens for the
 * `v1.avatar.exported` postMessage that includes the GLB URL.
 */
export const RPMCreator = ({ onAvatar, subdomain = "demo" }: Props) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (typeof event.data !== "string" && !(event.data instanceof Object)) return;
      let json: any;
      try {
        json = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch {
        // RPM also fires a raw "v1.avatar.exported" sometimes; check string.
        if (
          typeof event.data === "string" &&
          event.data.startsWith("https://") &&
          event.data.endsWith(".glb")
        ) {
          onAvatar(event.data);
        }
        return;
      }
      if (json?.source !== "readyplayerme") return;
      if (json.eventName === "v1.frame.ready") {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({
            target: "readyplayerme",
            type: "subscribe",
            eventName: "v1.**",
          }),
          "*"
        );
      }
      if (json.eventName === "v1.avatar.exported") {
        const url: string | undefined = json.data?.url;
        if (url) onAvatar(url);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onAvatar]);

  const src = `https://${subdomain}.readyplayer.me/avatar?frameApi&clearCache&bodyType=fullbody`;

  return (
    <iframe
      ref={iframeRef}
      title="Ready Player Me Avatar Creator"
      src={src}
      allow="camera *; microphone *; clipboard-write"
      className="w-full h-full border-0 bg-secondary"
    />
  );
};