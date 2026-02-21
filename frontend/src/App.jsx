import { Routes, Route } from "react-router-dom";
import Landing from "./pages/landing";
import Tracker from "./pages/Tracker";

export default function App() {
  return (
    <Routes>
  <Route path="/" element={<Landing />} />
  <Route path="/tracker/:source" element={<Tracker />} />
</Routes>
     
  );
} 

