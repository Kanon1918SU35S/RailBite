import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { OrderProvider } from './context/OrderContext';
import { AdminProvider } from './context/AdminContext';
import { MenuProvider } from './context/MenuContext';
import { DeliveryStaffProvider } from './context/DeliveryStaffContext';
import { NotificationProvider } from './context/NotificationContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OrderSelection from './pages/OrderSelection';
import OrderTrain from './pages/OrderTrain';
import OrderStation from './pages/OrderStation';
import MenuCategories from './pages/MenuCategories';
import Notifications from './pages/Notifications';

// Main Category Pages
import BreakfastMenu from './pages/BreakfastMenu';
import LunchMenu from './pages/LunchMenu';
import SnacksMenu from './pages/SnacksMenu';
import DinnerMenu from './pages/DinnerMenu';

// Submenu Pages
import ShwarmaMenu from './pages/ShwarmaMenu';
import PizzaMenu from './pages/PizzaMenu';
import BurgerMenu from './pages/BurgerMenu';
import SmoothieMenu from './pages/SmoothieMenu';
import BeverageMenu from './pages/BeverageMenu';
import BiryaniMenu from './pages/BiryaniMenu';

import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import OrderHistory from './pages/OrderHistory';
import OrderDetails from './pages/OrderDetails';
import OrderTracking from './pages/OrderTracking';
import ReviewOrder from './pages/ReviewOrder';
import About from './pages/About';
import Contact from './pages/Contact';
import PaymentProcess from './pages/PaymentProcess';
import PaymentResult from './pages/PaymentResult';

// Admin Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminMenuManagement from './pages/AdminMenuManagement';
import AdminOrderManagement from './pages/AdminOrderManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminDeliveryManagement from './pages/AdminDeliveryManagement';
import AdminReports from './pages/AdminReports';
import AdminNotifications from './pages/AdminNotifications';
import AdminContactMessages from './pages/AdminContactMessages';
import AdminReviewsManagement from './pages/AdminReviewsManagement';
import AdminCouponManagement from './pages/AdminCouponManagement';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminTrainManagement from './pages/AdminTrainManagement';
import AdminLoyaltyManagement from './pages/AdminLoyaltyManagement';

// Delivery Staff Pages
import DeliveryStaffLogin from './pages/DeliveryStaffLogin';
import DeliveryStaffDashboard from './pages/DeliveryStaffDashboard';
import DeliveryStaffOrders from './pages/DeliveryStaffOrders';
import DeliveryStaffActive from './pages/DeliveryStaffActive';
import DeliveryStaffHistory from './pages/DeliveryStaffHistory';
import DeliveryStaffProfile from './pages/DeliveryStaffProfile';
import DeliveryStaffOrderDetail from './pages/DeliveryStaffOrderDetail';
import DeliveryStaffNotifications from './pages/DeliveryStaffNotifications';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import DeliveryStaffProtectedRoute from './components/DeliveryStaffProtectedRoute';
import ParticleBackground from './components/ParticleBackground';

// Lazy-loaded new feature pages
import LoyaltyPoints from './pages/LoyaltyPoints';

// Layouts
const PublicLayout = () => (
  <>
    <ParticleBackground />
    <Navbar />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Outlet />
    </div>
    <Footer />
  </>
);

const AdminLayout = () => (
  <>
    <Outlet />
  </>
);

const DeliveryStaffLayout = () => (
  <>
    <Outlet />
  </>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <MenuProvider>
          <CartProvider>
            <OrderProvider>
              <AdminProvider>
                <DeliveryStaffProvider>
                  <NotificationProvider>
                    <div className="App">
                      <Routes>
                        {/* Public + customer routes WITH Navbar & Footer */}
                        <Route element={<PublicLayout />}>
                          <Route path="/" element={<Home />} />
                          <Route path="/login" element={<Login />} />
                          <Route path="/register" element={<Register />} />
                          <Route path="/forgot-password" element={<ForgotPassword />} />
                          <Route path="/reset-password" element={<ResetPassword />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/contact" element={<Contact />} />

                          <Route path="/order-selection" element={<ProtectedRoute><OrderSelection /></ProtectedRoute>} />
                          <Route path="/order-train" element={<ProtectedRoute><OrderTrain /></ProtectedRoute>} />
                          <Route path="/order-station" element={<ProtectedRoute><OrderStation /></ProtectedRoute>} />
                          <Route path="/menu-categories" element={<ProtectedRoute><MenuCategories /></ProtectedRoute>} />

                          <Route path="/breakfast-menu" element={<ProtectedRoute><BreakfastMenu /></ProtectedRoute>} />
                          <Route path="/lunch-menu" element={<ProtectedRoute><LunchMenu /></ProtectedRoute>} />
                          <Route path="/snacks-menu" element={<ProtectedRoute><SnacksMenu /></ProtectedRoute>} />
                          <Route path="/dinner-menu" element={<ProtectedRoute><DinnerMenu /></ProtectedRoute>} />

                          <Route path="/shwarma-menu" element={<ProtectedRoute><ShwarmaMenu /></ProtectedRoute>} />
                          <Route path="/pizza-menu" element={<ProtectedRoute><PizzaMenu /></ProtectedRoute>} />
                          <Route path="/burger-menu" element={<ProtectedRoute><BurgerMenu /></ProtectedRoute>} />
                          <Route path="/smoothie-menu" element={<ProtectedRoute><SmoothieMenu /></ProtectedRoute>} />
                          <Route path="/beverage-menu" element={<ProtectedRoute><BeverageMenu /></ProtectedRoute>} />
                          <Route path="/biryani-menu" element={<ProtectedRoute><BiryaniMenu /></ProtectedRoute>} />

                          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
                          <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                          <Route path="/order-success" element={<ProtectedRoute><OrderSuccess /></ProtectedRoute>} />

                          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                          <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
                          <Route path="/order-details/:orderId" element={<ProtectedRoute><OrderDetails /></ProtectedRoute>} />
                          <Route path="/order-tracking/:orderId" element={<ProtectedRoute><OrderTracking /></ProtectedRoute>} />
                          <Route path="/review/:orderId" element={<ProtectedRoute><ReviewOrder /></ProtectedRoute>} />
                          <Route path="/loyalty" element={<ProtectedRoute><LoyaltyPoints /></ProtectedRoute>} />
                          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                          <Route path="/payment-process" element={<ProtectedRoute><PaymentProcess /></ProtectedRoute>} />
                          <Route path="/payment-result" element={<PaymentResult />} />
                        </Route>

                        {/* Admin routes WITHOUT Navbar/Footer */}
                        <Route element={<AdminLayout />}>
                          {/* Login page - no protection needed */}
                          <Route path="/admin/login" element={<AdminLogin />} />

                          {/* All other admin routes - protected */}
                          <Route path="/admin/dashboard" element={
                            <AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/menu" element={
                            <AdminProtectedRoute><AdminMenuManagement /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/orders" element={
                            <AdminProtectedRoute><AdminOrderManagement /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/users" element={
                            <AdminProtectedRoute><AdminUserManagement /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/delivery" element={
                            <AdminProtectedRoute><AdminDeliveryManagement /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/reports" element={
                            <AdminProtectedRoute><AdminReports /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/notifications" element={
                            <AdminProtectedRoute><AdminNotifications /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/contact-messages" element={
                            <AdminProtectedRoute><AdminContactMessages /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/reviews" element={
                            <AdminProtectedRoute><AdminReviewsManagement /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/coupons" element={
                            <AdminProtectedRoute><AdminCouponManagement /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/analytics" element={
                            <AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/trains" element={
                            <AdminProtectedRoute><AdminTrainManagement /></AdminProtectedRoute>
                          } />
                          <Route path="/admin/loyalty" element={
                            <AdminProtectedRoute><AdminLoyaltyManagement /></AdminProtectedRoute>
                          } />
                        </Route>

                        {/* Delivery Staff routes WITHOUT Navbar/Footer */}
                        <Route element={<DeliveryStaffLayout />}>
                          <Route path="/delivery/login" element={<DeliveryStaffLogin />} />
                          <Route path="/delivery/dashboard" element={
                            <DeliveryStaffProtectedRoute><DeliveryStaffDashboard /></DeliveryStaffProtectedRoute>
                          } />
                          <Route path="/delivery/my-orders" element={
                            <DeliveryStaffProtectedRoute><DeliveryStaffOrders /></DeliveryStaffProtectedRoute>
                          } />
                          <Route path="/delivery/active" element={
                            <DeliveryStaffProtectedRoute><DeliveryStaffActive /></DeliveryStaffProtectedRoute>
                          } />
                          <Route path="/delivery/history" element={
                            <DeliveryStaffProtectedRoute><DeliveryStaffHistory /></DeliveryStaffProtectedRoute>
                          } />
                          <Route path="/delivery/profile" element={
                            <DeliveryStaffProtectedRoute><DeliveryStaffProfile /></DeliveryStaffProtectedRoute>
                          } />
                          <Route path="/delivery/order/:orderId" element={
                            <DeliveryStaffProtectedRoute><DeliveryStaffOrderDetail /></DeliveryStaffProtectedRoute>
                          } />
                          <Route path="/delivery/notifications" element={
                            <DeliveryStaffProtectedRoute><DeliveryStaffNotifications /></DeliveryStaffProtectedRoute>
                          } />
                        </Route>
                      </Routes>
                    </div>
                  </NotificationProvider>
                </DeliveryStaffProvider>
              </AdminProvider>
            </OrderProvider>
          </CartProvider>
        </MenuProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
