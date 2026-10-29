
export function AppScreenshot({ src, alt, title, description }: {
  src: string; alt: string; title: string; description: string;
}) {
  return <figure className="glass-pane">
    <div className="screen-frame">
      <img src={src} alt={alt} loading="lazy" decoding="async" width="1440" height="3120" />
    </div>
    <figcaption><strong>{title}</strong><span>{description}</span></figcaption>
  </figure>;
}
