import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { ForgotPassword } from './pages/Auth/ForgotPassword';
import { ResetPassword } from './pages/Auth/ResetPassword';
import { Search } from './pages/Search/Search';
import { MovieDetail } from './pages/MovieDetail/MovieDetail';
import { Profile } from './pages/Profile/Profile';
import { Watchlist } from './pages/Watchlist/Watchlist';
import { MovieMap } from './pages/Map/Map';
import { Stats } from './pages/Stats/Stats';
import { Category } from './pages/Category/Category';
import { TvDetail } from './pages/TvDetail/TvDetail';
import { Discover } from './pages/Discover/Discover';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Search />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tv/:id" element={<TvDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/map" element={<MovieMap />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/category/:mediaType/:genreId" element={<Category />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
