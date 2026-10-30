import { capabilityStatus, statusLabel } from "@/lib/status";
import { JourneyPlanner } from "@/app/components/journey-planner";
import { OperatorInsights } from "@/app/components/operator-insights";

export default function HomePage() {
  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="NammaLink home">
          <span className="brandMark" aria-hidden="true">ನ</span>
          <span>NammaLink</span>
        </a>
        <span className="prototypePill">Engineering prototype</span>
      </nav>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="eyebrow">Bengaluru, connected end to end</p>
          <h1>Reach on time.<br /><span>Wait less.</span></h1>
          <p className="lede">
            NammaLink plans the whole public-transport journey, protects the limits that matter to you,
            and finds a way forward when a connection breaks.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#journey">Plan a journey</a>
            <a className="textButton" href="#android">Get Android preview <span aria-hidden="true">↓</span></a>
            <a className="textButton" href="#evidence">See data evidence <span aria-hidden="true">↗</span></a>
          </div>
        </div>

        <JourneyPlanner />
      </section>

      <section className="principleStrip" aria-label="Product principles">
        <div><span>01</span><strong>Deadline aware</strong><p>Arrive-by search, not just leave-now directions.</p></div>
        <div><span>02</span><strong>Constraint safe</strong><p>Walking, budget and transfers are hard limits.</p></div>
        <div><span>03</span><strong>Recovery ready</strong><p>Replan the unfinished journey when conditions change.</p></div>
      </section>

      <OperatorInsights />

      <section className="downloadSection" id="android">
        <div>
          <p className="eyebrow">Native Android · presentation build</p>
          <h2>Take the journey contract onto your phone.</h2>
          <p>
            This is the physically tested Kotlin/Jetpack Compose preview—not a WebView. It includes the bounded offline
            demonstration and connects to the verified public NammaLink backend over HTTPS. Android may ask you to allow installs
            from your browser or file manager.
          </p>
          <p className="downloadHash"><strong>SHA-256</strong> 45CFEA744CE361383947BCF8F67D2E1CFD53C101622A026E98DE1A613EA5E3E2</p>
        </div>
        <div className="downloadActions">
          <a className="primaryButton" href="/downloads/NammaLink-0.1.0-dev.apk" download>Download APK · 7.0 MB</a>
          <span>Version 0.1.0-presentation · HTTPS backend · debug certificate · Android 8+</span>
        </div>
      </section>

      <section className="evidenceSection" id="evidence">
        <div className="sectionHeading">
          <p className="eyebrow">Evidence before claims</p>
          <h2>Built around what the data can actually support.</h2>
          <p>Every ETA and alert will carry a source label. Scheduled data is never presented as live tracking.</p>
        </div>

        <div className="statusGrid">
          {capabilityStatus.map((item) => (
            <article className="statusCard" key={item.label}>
              <span className={`statusDot ${item.status}`} aria-hidden="true" />
              <p className="statusName">{statusLabel(item.status)}</p>
              <h3>{item.label}</h3>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <footer>
        <div><strong>MONOLIMO</strong><span>CodeSangram 3.0 · CS/26-002</span></div>
        <p>Planning and engineering validation · Bengaluru</p>
      </footer>
    </main>
  );
}

