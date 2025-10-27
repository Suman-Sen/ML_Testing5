import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import NavBar from "./components/ui/NavBar.tsx";
const IQ = "/images/IQ.png";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
      <NavBar logoSrc={IQ} />

    <App />
  </StrictMode>
);
