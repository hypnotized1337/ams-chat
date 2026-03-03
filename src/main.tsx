import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

async function startApp() {
  // Start MSW worker in development
  if (import.meta.env.DEV) {
    const { worker } = await import('./api/browser');
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
  }

  createRoot(document.getElementById("root")!).render(<App />);
}

startApp();