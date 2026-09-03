import { Link } from 'react-router-dom'
import { Package, Truck, Wallet, Warehouse, Phone, ArrowRight, PackageSearch } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <h1>
            Streamlined logistics for your <span>e-commerce needs</span>
          </h1>
          <p>
            Efficient parcel delivery, financial solutions, and warehousing — all in one
            platform. Join Pay Parcel today and revolutionize your online business.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary btn-lg">
              Get Started <ArrowRight size={18} />
            </Link>
            <Link to="/track" className="btn-outline btn-lg">
              <PackageSearch size={18} /> Track a Parcel
            </Link>
          </div>
        </div>
      </section>

      <section className="services" id="services">
        <h2>Our Services</h2>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">
              <Wallet size={32} />
            </div>
            <h3>Financial Solutions</h3>
            <p>
              Streamlined financial services for your e-commerce needs — payments, COD, and
              settlements handled with care.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <Truck size={32} />
            </div>
            <h3>Efficient Logistics</h3>
            <p>
              Reliable and fast delivery to enhance your shipping process across Pakistan. Track
              every parcel in real time.
            </p>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <Warehouse size={32} />
            </div>
            <h3>Warehousing</h3>
            <p>
              Optimal inventory management with secure warehousing solutions so you can scale
              without the overhead.
            </p>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="about-content">
          <h2>Join Pay Parcel Today</h2>
          <p>
            Don't let outdated logistics and financial processes hold your business back. Say
            goodbye to the frustrations of delivery and payment delays, and hello to a brighter,
            more prosperous future for your online business.
          </p>
          <p>
            Experience the benefits of a modern, efficient, and comprehensive e-commerce
            logistics and financial services platform. With our personalized services, expert
            operations team, and qualified accountants, you can be confident that you are
            receiving the best support in the industry.
          </p>
          <p>
            Your success is our success, and we are committed to fueling your growth with our
            comprehensive suite of services. Partner with Pay Parcel and embark on a journey to
            revolutionize your online business for a more efficient, reliable, and profitable
            e-commerce experience.
          </p>
          <Link to="/signup" className="btn-primary btn-lg">
            Join Now <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="cta-band">
        <Package size={48} />
        <div>
          <h3>Ready to ship smarter?</h3>
          <p>Create an account and book your first parcel in minutes.</p>
        </div>
        <Link to="/signup" className="btn-primary btn-lg">
          Get Started
        </Link>
      </section>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <Package size={28} />
              <span>Pay Parcel</span>
            </div>
            <p>
              Streamlined financial solutions for your e-commerce needs. Efficient logistics to
              enhance your delivery process. Warehousing solutions for optimal inventory
              management.
            </p>
          </div>
          <div className="footer-col">
            <h4>Information</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><a href="#about">About Us</a></li>
              <li><a href="#services">Services</a></li>
              <li><Link to="/track">Track Parcel</Link></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Get In Touch</h4>
            <p className="footer-contact">
              Got Question? Call us 24/7
            </p>
            <a href="tel:03452388115" className="footer-phone">
              <Phone size={16} /> 0345 2388115
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          Copyright © {new Date().getFullYear()} Pay Parcel — All Rights Reserved.
        </div>
      </footer>
    </div>
  )
}
