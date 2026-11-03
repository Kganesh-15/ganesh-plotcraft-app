// import { AiDashboard } from "./components/AiDashboard.jsx";

// export default function App() {
//   return (
//     <main>
//       <AiDashboard />
//     </main>
//   );
// }





import { useState } from "react";
import WelcomePage from "./components/WelcomePage.jsx";
import { AiDashboard } from "./components/AiDashboard.jsx";

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  // First show Welcome Page
  if (!showDashboard) {
    return (
      <WelcomePage
        onExplore={() => setShowDashboard(true)}
      />
    );
  }

  // After clicking Explore, open the main website
  return (
    <main>
      <AiDashboard />
    </main>
  );
}