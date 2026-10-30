import { capabilityStatus, statusLabel } from "@/lib/status";
import { JourneyPlanner } from "@/app/components/journey-planner";
import { OperatorInsights } from "@/app/components/operator-insights";
import { MobilityExperience } from "@/app/components/mobility-experience";

export default function HomePage() {
  return (
    <main>
      <nav className="topbar" aria-label="Primary navigation">
        <a className="brand" href="#top" aria-label="NammaLink home">
          <img className="brandLogo" src="/assets/nammalink-logo.png" alt="" width="1254" height="1254" />
          <span>NammaLink</span>
        </a>
        <div className="topbarLinks">
          <a href="#journey">Plan journey</a>
          <a href="#android">Android app</a>
          <a href="#evidence">Data evidence</a>
          <span className="locationPill"><span aria-hidden="true">●</span> Bengaluru</span>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="heroCopy">
          <p className="eyebrow">Bengaluru, connected end to end</p>
          <h1>Reach on<br /><span>time.</span></h1>
          <p className="lede">
            BMTC buses, Namma Metro and dependable connections. One thoughtful journey,
            from first mile to last.
          </p>
          <div className="heroActions">
            <a className="primaryButton" href="#journey">Plan a journey</a>
            <span className="madeForBengaluru"><span aria-hidden="true">●</span> Made for Bengaluru, with care.</span>
          </div>
        </div>

        <JourneyPlanner />
      </section>

      <section className="principleStrip" aria-label="Product principles">
        <div><span>01</span><strong>Deadline aware</strong><p>Arrive-by search, not just leave-now directions.</p></div>
        <div><span>02</span><strong>Passenger choice</strong><p>Walking is guidance; optional limits stay under your control.</p></div>
        <div><span>03</span><strong>Recovery ready</strong><p>Replan the unfinished journey when conditions change.</p></div>
      </section>

      <MobilityExperience />

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
          <p className="downloadHash"><strong>SHA-256</strong> 3D2364081AAF309A54E0A380D21467688CA4F39CA5DAA746773A0EE8CAC368B1</p>
        </div>
        <div className="downloadActions">
          <a className="primaryButton" href="/downloads/NammaLink-0.1.0.apk" download>Download APK · 7.7 MB</a>
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
        <div><strong>NammaLink</strong><span>Bengaluru public transport planning</span></div>
        <p>Scheduled journey planning with explicit evidence boundaries</p>
      </footer>
    </main>
  );
}

