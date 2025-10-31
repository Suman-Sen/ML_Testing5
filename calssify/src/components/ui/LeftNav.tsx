import React from "react";
import { Link } from "react-router-dom";
import "./LeftNav.css";

interface Props {
  currentTab?: "image" | "db" | "document-pii";
  setCurrentTab?: (t: "image" | "db" | "document-pii") => void;
  // Controlled open state from parent (App) so layout can react
  open?: boolean;
  setOpen?: (v: boolean) => void;
}

const LeftNav: React.FC<Props> = ({ setCurrentTab, open: controlledOpen, setOpen: controlledSetOpen }) => {
  const [internalOpen, setInternalOpen] = React.useState<boolean>(true);
  const open = typeof controlledOpen === "boolean" ? controlledOpen : internalOpen;
  const setOpen = controlledSetOpen ?? setInternalOpen;

  const buttonRef = React.useRef<HTMLButtonElement | null>(null);
  const navRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (buttonRef.current) {
      buttonRef.current.setAttribute("aria-expanded", open ? "true" : "false");
    }
    if (navRef.current) {
      navRef.current.setAttribute("aria-hidden", open ? "false" : "true");
    }
  }, [open]);


  return (
    <aside className={`leftnav ${open ? "open" : "collapsed"}`} data-open={open}>
      {/* logo area */}
      <div className={`logo-wrap ${!open ? "visually-hidden" : ""}`}>
        <Link to="/" className="logo-link" title="Home">
          <span className="text-2xl font-bold text-white">Home</span>
        </Link>
      </div>

      <button
        ref={buttonRef}
        className="ellipsis-btn"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Hide menu" : "Show menu"}
        title={open ? "Hide menu" : "Show menu"}
      >
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
      </button>

      <nav ref={navRef} className="nav-list" role="navigation">
        <Link to="/" className={`nav-item`}>
          Home
        </Link>
        <Link to="/batches" className={`nav-item`}>
          Batches
        </Link>
        <Link to="/history/me" className={`nav-item`}>
          History
        </Link>
        <div className="mt-4 mb-2 px-2 text-xs text-gray-400 uppercase tracking-wider">Scan</div>
        <Link to="/?tab=image" className={`nav-item`}>
          Image Scan
        </Link>
        <Link to="/?tab=db" className={`nav-item`}>
          DB Scan
        </Link>
        <Link to="/?tab=document-pii" className={`nav-item`}>
          Document Scan
        </Link>
      </nav>
    </aside>
  );
};

export default LeftNav;