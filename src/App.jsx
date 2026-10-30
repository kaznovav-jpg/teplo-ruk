import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import { Category, Product, Cart, Checkout, Complete } from './pages/Shop.jsx'
import { Classes, ClassDetail, Learn, Artists, Artist, Schedule } from './pages/Learn.jsx'
import { Articles, Article, Community, Post, Write } from './pages/Community.jsx'
import MyPage from './pages/MyPage.jsx'
import { Sitemap, Info, NotFound } from './pages/Misc.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="category" element={<Category />} />
        <Route path="product/:id" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-complete" element={<Complete />} />
        <Route path="classes" element={<Classes />} />
        <Route path="classes/:id" element={<ClassDetail />} />
        <Route path="classes/:id/learn" element={<Learn />} />
        <Route path="artists" element={<Artists />} />
        <Route path="artists/:id" element={<Artist />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="articles" element={<Articles />} />
        <Route path="articles/:id" element={<Article />} />
        <Route path="community" element={<Community />} />
        <Route path="community/write" element={<Write />} />
        <Route path="community/:id" element={<Post />} />
        <Route path="mypage" element={<MyPage />} />
        <Route path="sitemap" element={<Sitemap />} />
        <Route path="info" element={<Info />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
