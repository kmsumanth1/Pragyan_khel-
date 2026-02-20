import { useEffect } from "react";
import { initializeTensorFlow } from "./services/tfService";
import VideoContainer from "./components/video/VideoContainer";

function App() {
  useEffect(() => {
    initializeTensorFlow();
  }, []);

  return (
    <div>
      <h1>Pragyan Khel AI System</h1>
      <VideoContainer />
    </div>
  );
}

export default App;