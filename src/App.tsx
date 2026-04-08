import "reactflow/dist/style.css";

import { Sidebar, AppContent } from "./ui/components";

export default function App() {
  return (
    <div style={layoutStyle}>
      <Sidebar />
      <div style={contentWrapperStyle}>
        <AppContent />
      </div>
    </div>
  );
}

// --- Styles (optional) ---
const layoutStyle: React.CSSProperties = {
  display: "flex",
  height: "100vh",
  width: "100vw",
  minWidth: 0,
  overflow: "hidden",
};

const contentWrapperStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: "hidden",
};