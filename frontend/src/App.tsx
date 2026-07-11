import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './pages/Auth/Login';
import { Register } from './pages/Auth/Register';
import { Search } from './pages/Search/Search';
import { MovieDetail } from './pages/MovieDetail/MovieDetail';
import { Profile } from './pages/Profile/Profile';
import { Watchlist } from './pages/Watchlist/Watchlist';
import { MovieMap } from './pages/Map/Map';
import { Stats } from './pages/Stats/Stats';
import { Category } from './pages/Category/Category';
import { TvDetail } from './pages/TvDetail/TvDetail';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Search />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/tv/:id" element={<TvDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/map" element={<MovieMap />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/category/:genreId" element={<Category />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
