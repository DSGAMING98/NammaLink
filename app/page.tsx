import { capabilityStatus, statusLabel } from "@/lib/status";

const routeMetrics = [
  ["Arrival deadline", "09:00"],
  ["Maximum walking", "800 m"],
  ["Transfers", "1 preferred"],
];

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
            <a className="textButton" href="#evidence">See data evidence <span aria-hidden="true">↗</span></a>
          </div>
        </div>

        <div className="journeyPanel" id="journey" aria-label="Journey preview">
          <div className="panelHeader">
            <div>
              <p className="smallLabel">Journey contract</p>
              <h2>Campus commute</h2>
            </div>
            <span className="sourceBadge">Scheduled</span>
          </div>

          <div className="routeLine" aria-label="Jain Global Campus to Alliance University">
            <span className="routeDot originDot" />
            <div><small>FROM</small><strong>Jain Global Campus</strong><span>Jakkasandra</span></div>
            <span className="routeStem" />
            <span className="routeDot destinationDot" />
            <div><small>TO</small><strong>Alliance University</strong><span>Central Campus, Anekal</span></div>
          </div>

          <div className="contractGrid">
            {routeMetrics.map(([label, value]) => (
              <div key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>

          <button className="disabledSearch" type="button" disabled>
            Route engine initializing
            <span className="pulse" aria-hidden="true" />
          </button>
          <p className="panelNote">No route result is shown until the verified schedule engine is connected.</p>
        </div>
      </section>

      <section className="principleStrip" aria-label="Product principles">
        <div><span>01</span><strong>Deadline aware</strong><p>Arrive-by search, not just leave-now directions.</p></div>
        <div><span>02</span><strong>Constraint safe</strong><p>Walking, budget and transfers are hard limits.</p></div>
        <div><span>03</span><strong>Recovery ready</strong><p>Replan the unfinished journey when conditions change.</p></div>
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

