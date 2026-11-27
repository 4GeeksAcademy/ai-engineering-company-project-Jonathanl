const SERVICE_LINES = [
  {
    title: "Headhunting de Mandos Medios y Directivos",
    description:
      "Búsqueda y selección especializada para posiciones clave en empresas de tecnología, retail y servicios financieros, acompañando cada fase desde el briefing hasta la incorporación.",
  },
  {
    title: "Outsourcing de Soporte al Cliente",
    description:
      "Equipos dedicados de atención multicanal por teléfono, email y chat, enfocados en cumplimiento de acuerdos de nivel de servicio y calidad en cada interacción.",
  },
  {
    title: "Formación Corporativa",
    description:
      "Programas, talleres y webinars en habilidades blandas, liderazgo, comunicación y gestión de equipos adaptados a empresas medianas en crecimiento.",
  },
];

const KEY_FACTS = [
  { value: "Desde 2011", label: "Trayectoria en gestión de talento" },
  { value: "120", label: "Profesionales en plantilla" },
  { value: "2 sedes", label: "Valencia (España) y Miami (EE. UU.)" },
  { value: "3 líneas", label: "Selección, soporte externalizado y formación" },
];

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Nexova Solutions",
  description:
    "Consultora de recursos humanos y selección de talento fundada en 2011 con sedes en Valencia y Miami.",
  foundingDate: "2011",
  address: [
    {
      "@type": "PostalAddress",
      addressCountry: "ES",
      addressLocality: "Valencia",
    },
    {
      "@type": "PostalAddress",
      addressCountry: "US",
      addressLocality: "Miami",
      addressRegion: "FL",
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_SCHEMA) }}
      />

      <header className="site-header">
        <div className="container header-inner">
          <a href="#inicio" className="brand">
            Nexova<span> Solutions</span>
          </a>
          <nav className="nav" aria-label="Navegación principal">
            <a href="#servicios">Servicios</a>
            <a href="#presencia">Presencia</a>
            <a href="#contacto">Contacto</a>
            <a href="/api/health">Estado</a>
          </nav>
        </div>
      </header>

      <main id="inicio">
        <section className="hero">
          <div className="container">
            <span className="eyebrow">Consultora de RR. HH. y Talento · Valencia &amp; Miami</span>
            <h1>Conectamos empresas en crecimiento con el talento que impulsa sus equipos.</h1>
            <p>
              Nexova Solutions acompaña desde 2011 a medianas empresas de tecnología, retail y
              servicios financieros en selección de mandos medios y directivos, equipos de soporte
              al cliente externalizados y formación corporativa en liderazgo.
            </p>
            <div className="actions">
              <a className="btn btn-primary" href="#servicios">
                Explorar líneas de negocio
              </a>
              <a className="btn btn-secondary" href="#contacto">
                Hablar con el equipo
              </a>
            </div>
          </div>
        </section>

        <section id="servicios" className="section">
          <div className="container">
            <h2 className="section-title">Líneas de negocio</h2>
            <p className="section-lead">
              Soluciones especializadas para encontrar, desarrollar y consolidar el talento en
              organizaciones medianas.
            </p>
            <div className="grid-3">
              {SERVICE_LINES.map((service) => (
                <article key={service.title} className="card">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="presencia" className="section">
          <div className="container">
            <h2 className="section-title">Nexova en cifras</h2>
            <p className="section-lead">
              Operación internacional combinando cercanía de consultoría y especialización sectorial.
            </p>
            <div className="stats">
              {KEY_FACTS.map((item) => (
                <div key={item.label} className="stat">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contacto" className="section">
          <div className="container">
            <div className="card">
              <h2 className="section-title">Sedes y contacto</h2>
              <p className="section-lead">
                Atendemos clientes en Europa y América desde nuestras oficinas de Valencia (España)
                y Miami (Florida).
              </p>
              <div className="grid-3">
                <div>
                  <h3>Sede Central — Valencia</h3>
                  <p>Operaciones de selección, formación corporativa y equipos centrales.</p>
                </div>
                <div>
                  <h3>Oficina de Expansión — Miami</h3>
                  <p>Desarrollo de clientes y cobertura de talento en el mercado estadounidense.</p>
                </div>
                <div>
                  <h3>Sectores principales</h3>
                  <p>Tecnología, retail y servicios financieros para medianas empresas.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container footer-inner">
          <span>© {new Date().getFullYear()} Nexova Solutions · Valencia &amp; Miami</span>
          <span>Sitio público corporativo</span>
        </div>
      </footer>
    </>
  );
}
