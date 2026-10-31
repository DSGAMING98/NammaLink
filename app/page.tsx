import { capabilityStatus, statusLabel } from "@/lib/status";
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
          <a href="#mobility">Plan journey</a>
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
            <a className="primaryButton" href="#mobility">Plan a journey</a>
            <span className="madeForBengaluru"><span aria-hidden="true">●</span> Made for Bengaluru, with care.</span>
          </div>
        </div>

        <div className="plannerWrap">
          <div className="journeyPanel">
            <p className="smallLabel">One Bengaluru journey</p>
            <h2>Bus, Metro and Airport</h2>
            <div className="routeLine" aria-label="NammaLink journey modes">
              <span className="routeDot originDot" /><div><small>START</small><strong>Your live location</strong><span>Find nearby verified stops</span></div>
              <span className="routeStem" aria-hidden="true" />
              <span className="routeDot destinationDot" /><div><small>ARRIVE</small><strong>Your destination</strong><span>Compare safest, fastest and direct routes</span></div>
            </div>
            <a className="primaryButton" href="#mobility">Open journey planner</a>
          </div>
        </div>
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
          <p className="eyebrow">Native Android app</p>
          <h2>Take NammaLink with you.</h2>
          <p>
            Built with Kotlin and Jetpack Compose, the app includes live-location planning, saved journeys,
            Airport Mode and full-screen route maps. Android may ask you to allow installs
            from your browser or file manager.
          </p>
          <p className="downloadHash"><strong>SHA-256</strong> DF5B4AB58B482619011848D3E31B08345C7F6BD0546936E929325604A7DB7C7B</p>
        </div>
        <div className="downloadActions">
          <a className="primaryButton" href="/downloads/NammaLink-0.1.0.apk" download>Download APK · 8.2 MB</a>
          <span>Version 0.1.0 · Secure HTTPS service · Android 8+</span>
        </div>
      </section>

      <section className="evidenceSection" id="evidence">
        <div className="sectionHeading">
          <p className="eyebrow">Built for Bengaluru</p>
          <h2>Useful information, clearly sourced.</h2>
          <p>Journey times and service details include their data source and update context.</p>
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
        <p>Bus, Metro and airport journey planning across Bengaluru</p>
      </footer>
    </main>
  );
}

