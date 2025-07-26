import Whiteboard from '@/pages/Whiteboard';
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import CheckEmail from '@/pages/CheckEmail';
import ResetPassword from '@/pages/ResetPassword';

<Route path="/whiteboard" element={<Whiteboard />} />
<Route path="/login" element={<Login />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/check-email" element={<CheckEmail />} />
<Route path="/reset-password" element={<ResetPassword />} /> 