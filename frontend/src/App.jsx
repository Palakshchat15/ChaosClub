import { Navigate, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import FunZonePage from "./pages/FunZonePage";
import NewsPage from "./pages/NewsPage";
import PredictPage from "./pages/PredictPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DailyFactPopup from "./components/DailyFactPopup";
import AdminPage from "./pages/AdminPage";
import ArticlePage from "./pages/ArticlePage";
import AboutPage from "./pages/AboutPage";
import ProfilePage from "./pages/ProfilePage";
import PageTransition from "./components/PageTransition";
import RippleEffect from "./components/RippleEffect";
import CursorTrail from "./components/CursorTrail";
import SmoothScroll from "./components/SmoothScroll";
import ScrollToTop from "./components/ScrollToTop";
import ToastManager from "./components/ToastManager";

function App() {
  return (
    <div className="app-shell">
      <ToastManager />
      <ScrollToTop />
      <SmoothScroll />
      <PageTransition />
      <RippleEffect />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/funzone" element={<FunZonePage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/news/:id" element={<ArticlePage />} />
          <Route path="/predict" element={<PredictPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <DailyFactPopup />
    </div>
  );
}

export default App;
