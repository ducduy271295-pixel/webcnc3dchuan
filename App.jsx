import React, { useState, useEffect } from 'react';
import { ShoppingCart, User, Download, CheckCircle, Loader2, FileBox, ShieldCheck, CreditCard, X, Package, Filter, LayoutDashboard, Plus, TrendingUp, Users, ListOrdered, Image as ImageIcon, Trash2, Search, Phone, HelpCircle, MessageCircle, Mail, Settings, ChevronRight, Activity, Clock, Lock, Eye, EyeOff } from 'lucide-react';

// Khởi tạo Firebase THẬT của bạn
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAP0R2OwRwVA24c1pOu0hJ50gbHCD1o8s4",
  authDomain: "web-ban-tuong.firebaseapp.com",
  projectId: "web-ban-tuong",
  storageBucket: "web-ban-tuong.firebasestorage.app",
  messagingSenderId: "942280925523",
  appId: "1:942280925523:web:24c569e3ac7d5e301741a6",
  measurementId: "G-QPQEGMSZ4Y"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = "web-ban-tuong-official"; 

// Hàm lấy link tải trực tiếp
const getDirectDownloadLink = (url) => {
  if (!url) return '';
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://drive.google.com/uc?export=download&id=${fileIdMatch[1]}`;
  }
  return url; 
};

const INITIAL_PRODUCTS = [];
const CATEGORIES = ["Tất cả", "Tượng Phật", "Phong Thủy", "Tranh Gỗ", "Linh Vật"];
const INITIAL_SETTINGS = { hotline: "0987.974.962", fanpage: "https://facebook.com", email: "hotro@cnc3dviet.vn", bankId: "MB", bankAccount: "0987974962", bankName: "NGUYEN VAN A" };

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
};

// ==========================================
// 1. GIAO DIỆN QUẢN TRỊ (ADMIN DASHBOARD)
// ==========================================
function AdminDashboard({ products, setProducts, siteSettings, setSiteSettings, allProfiles, allTransactions, onSwitchToUser }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: 'Tượng Phật', format: '.STL', size: '150 MB', images: [], description: '', downloadUrl: '', maxDownloads: 3 });

  const showToast = (msg) => { setToastMessage(msg); setTimeout(() => setToastMessage(''), 3000); };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (newProduct.images.length === 0) return showToast("Vui lòng tải lên ít nhất 1 ảnh!");
    setIsSubmitting(true);
    const productToAdd = { ...newProduct, id: Date.now(), price: parseInt(newProduct.price) || 0, maxDownloads: parseInt(newProduct.maxDownloads) || 3, image: newProduct.images[0] };
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', productToAdd.id.toString()), productToAdd);
      setIsAddModalOpen(false); showToast("Đã thêm mẫu tượng mới thành công!");
      setNewProduct({ name: '', price: '', category: 'Tượng Phật', format: '.STL', size: '150 MB', images: [], description: '', downloadUrl: '', maxDownloads: 3 });
    } catch (error) { showToast(`Lỗi: ${error.message}`); } finally { setIsSubmitting(false); }
  };

  const handleDeleteProduct = async (id) => {
    if(!window.confirm("Bạn có chắc chắn muốn xóa mẫu này?")) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'products', id.toString())); showToast("Đã xóa mẫu tượng."); } 
    catch (error) { showToast("Không thể xóa sản phẩm lúc này!"); }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), siteSettings); showToast("Đã lưu cài đặt vĩnh viễn!"); } 
    catch (error) { showToast("Không thể lưu cài đặt!"); } finally { setIsSubmitting(false); }
  };

  const resizeAndConvertToBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width; let height = img.height; const MAX_SIZE = 600; 
          if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } 
          else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          canvas.width = width; canvas.height = height;
          const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleMultipleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    showToast("Đang xử lý ảnh, vui lòng đợi...");
    const base64Images = [];
    for (const file of files) { base64Images.push(await resizeAndConvertToBase64(file)); }
    setNewProduct(prev => ({ ...prev, images: [...prev.images, ...base64Images].slice(0, 5) }));
    showToast(`Đã tải lên ${base64Images.length} ảnh.`);
  };

  const removeImage = (indexToRemove) => { setNewProduct(prev => ({ ...prev, images: prev.images.filter((_, index) => index !== indexToRemove) })); };

  const successfulOrders = allTransactions.filter(t => t.status === 'success');
  const totalRevenue = successfulOrders.reduce((sum, order) => sum + (order.price || 0), 0);
  const totalCustomers = allProfiles.length;
  const totalSalesCount = successfulOrders.length;

  return (
    <div className="flex h-screen bg-stone-100 font-sans text-stone-800 overflow-hidden">
      <div className="w-64 bg-stone-900 text-stone-300 flex flex-col shadow-xl z-20 shrink-0">
        <div className="p-6 flex items-center space-x-2 text-amber-500 border-b border-stone-800"><ShieldCheck className="w-8 h-8 text-green-500" /><span className="text-xl font-bold tracking-wider text-white">ADMIN<span className="text-amber-500">CNC</span></span></div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'dashboard' ? 'bg-amber-600 text-white' : 'hover:bg-stone-800'}`}><LayoutDashboard className="w-5 h-5" /> <span className="font-medium">Tổng Quan</span></button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'products' ? 'bg-amber-600 text-white' : 'hover:bg-stone-800'}`}><Package className="w-5 h-5" /> <span className="font-medium">Kho Mẫu ({products.length})</span></button>
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'orders' ? 'bg-amber-600 text-white' : 'hover:bg-stone-800'}`}><ListOrdered className="w-5 h-5" /> <span className="font-medium">Giao Dịch ({allTransactions.length})</span></button>
          <button onClick={() => setActiveTab('customers')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'customers' ? 'bg-amber-600 text-white' : 'hover:bg-stone-800'}`}><Users className="w-5 h-5" /> <span className="font-medium">Khách Hàng ({totalCustomers})</span></button>
          <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-amber-600 text-white' : 'hover:bg-stone-800'}`}><Settings className="w-5 h-5" /> <span className="font-medium">Cài Đặt Web</span></button>
        </nav>
        <div className="p-4 border-t border-stone-800"><button onClick={onSwitchToUser} className="w-full flex items-center justify-center space-x-2 bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"><ShoppingCart className="w-4 h-4" /> <span>Trở ra Cửa Hàng</span></button></div>
      </div>
      <div className="flex-1 overflow-y-auto bg-stone-50 p-8 relative">
        {activeTab === 'dashboard' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-bold mb-6 text-stone-900">Báo cáo hoạt động kinh doanh</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center space-x-4"><div className="p-4 bg-green-100 text-green-600 rounded-xl"><TrendingUp className="w-8 h-8"/></div><div><p className="text-stone-500 text-sm font-medium">Tổng Doanh Thu</p><p className="text-2xl font-bold text-stone-900">{formatPrice(totalRevenue)}</p></div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center space-x-4"><div className="p-4 bg-amber-100 text-amber-600 rounded-xl"><Download className="w-8 h-8"/></div><div><p className="text-stone-500 text-sm font-medium">Lượt Bán Ra</p><p className="text-2xl font-bold text-stone-900">{totalSalesCount}</p></div></div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100 flex items-center space-x-4"><div className="p-4 bg-blue-100 text-blue-600 rounded-xl"><Users className="w-8 h-8"/></div><div><p className="text-stone-500 text-sm font-medium">Khách Đăng Ký</p><p className="text-2xl font-bold text-stone-900">{totalCustomers}</p></div></div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-100">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-amber-500"/> Hoạt động gần đây</h2>
              {successfulOrders.slice(0, 5).length > 0 ? (
                <div className="space-y-4">
                  {successfulOrders.slice(0, 5).map(order => (
                    <div key={order.id} className="flex justify-between items-center pb-4 border-b last:border-0 last:pb-0">
                      <div><p className="font-bold text-stone-900">{order.productName}</p><p className="text-xs text-stone-500">Khách hàng: {order.userEmail || order.userName}</p></div>
                      <div className="text-right"><p className="font-bold text-green-600">+{formatPrice(order.price)}</p><p className="text-xs text-stone-400">{new Date(order.completedAt).toLocaleDateString('vi-VN')}</p></div>
                    </div>
                  ))}
                </div>
              ) : (<p className="text-stone-500 text-sm text-center py-4">Chưa có giao dịch thành công nào.</p>)}
            </div>
          </div>
        )}
        {activeTab === 'products' && (
          <div className="animate-in fade-in">
            <div className="flex justify-between items-center mb-6"><h1 className="text-2xl font-bold text-stone-900">Quản Lý Mẫu Tượng</h1><button onClick={() => setIsAddModalOpen(true)} className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-lg"><Plus className="w-5 h-5" /> Đăng Mẫu Mới</button></div>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-sm"><th className="p-4 font-medium">Sản phẩm</th><th className="p-4 font-medium">Giá bán</th><th className="p-4 font-medium">Danh mục</th><th className="p-4 font-medium text-right">Thao tác</th></tr></thead>
                <tbody>
                  {products.map(product => (
                    <tr key={product.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4 flex items-center gap-4"><img src={product.image || (product.images && product.images[0])} alt="" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1582560475093-ba66cef36eb4?auto=format&fit=crop&q=80&w=600"; }} className="w-12 h-12 rounded object-cover border bg-stone-200" /><span className="font-medium text-stone-900 line-clamp-1">{product.name}</span></td>
                      <td className="p-4 text-amber-600 font-bold">{formatPrice(product.price)}</td><td className="p-4"><span className="bg-stone-100 text-stone-600 px-2 py-1 rounded text-xs">{product.category}</span></td>
                      <td className="p-4 text-right"><button onClick={() => handleDeleteProduct(product.id)} className="text-red-400 hover:text-red-600 p-2" title="Xoá mẫu này"><Trash2 className="w-5 h-5" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === 'orders' && (
          <div className="animate-in fade-in">
             <h1 className="text-2xl font-bold mb-6 text-stone-900">Lịch Sử Giao Dịch</h1>
             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-sm"><th className="p-4 font-medium">Mã Đơn / Thời gian</th><th className="p-4 font-medium">Khách hàng</th><th className="p-4 font-medium">Sản phẩm</th><th className="p-4 font-medium text-center">Trạng thái</th><th className="p-4 font-medium text-right">Số tiền</th></tr></thead>
                <tbody>
                  {allTransactions.length > 0 ? allTransactions.map(tx => (
                    <tr key={tx.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4"><div className="font-bold text-stone-900 text-sm">{tx.orderCode}</div><div className="text-xs text-stone-500">{new Date(tx.createdAt).toLocaleString('vi-VN')}</div></td>
                      <td className="p-4"><div className="font-medium text-stone-900 text-sm">{tx.userName}</div><div className="text-xs text-stone-500">{tx.userEmail}</div></td>
                      <td className="p-4 text-sm font-medium text-stone-800 line-clamp-1">{tx.productName}</td>
                      <td className="p-4 text-center">{tx.status === 'success' ? (<span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-max mx-auto"><CheckCircle className="w-3 h-3"/> Đã thanh toán</span>) : (<span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-xs font-bold flex items-center justify-center gap-1 w-max mx-auto"><Clock className="w-3 h-3"/> Đang chờ</span>)}</td>
                      <td className="p-4 text-right text-stone-900 font-bold">{formatPrice(tx.price)}</td>
                    </tr>
                  )) : (<tr><td colSpan="5" className="p-8 text-center text-stone-500">Chưa có giao dịch nào.</td></tr>)}
                </tbody>
              </table>
             </div>
          </div>
        )}
        {activeTab === 'customers' && (
          <div className="animate-in fade-in">
             <h1 className="text-2xl font-bold mb-6 text-stone-900">Danh Sách Khách Hàng</h1>
             <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-stone-50 border-b border-stone-200 text-stone-500 text-sm"><th className="p-4 font-medium">Khách hàng</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Đăng nhập lần cuối</th><th className="p-4 font-medium text-center">Trạng thái</th></tr></thead>
                <tbody>
                  {allProfiles.length > 0 ? allProfiles.map(profile => (
                    <tr key={profile.uid} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="p-4 flex items-center gap-3">{profile.photoURL ? <img src={profile.photoURL} alt="avatar" className="w-8 h-8 rounded-full border" /> : <div className="w-8 h-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-500"><User className="w-4 h-4" /></div>}<span className="font-bold text-stone-900">{profile.name}</span></td>
                      <td className="p-4 text-sm text-stone-600">{profile.email || 'Không có email'}</td>
                      <td className="p-4 text-sm text-stone-500">{new Date(profile.lastLogin).toLocaleString('vi-VN')}</td>
                      <td className="p-4 text-center"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold border border-blue-200">Đã kích hoạt</span></td>
                    </tr>
                  )) : (<tr><td colSpan="4" className="p-8 text-center text-stone-500">Chưa có khách hàng đăng ký.</td></tr>)}
                </tbody>
              </table>
             </div>
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="animate-in fade-in">
            <h1 className="text-2xl font-bold mb-6 text-stone-900">Cài Đặt Thanh Toán & Liên Hệ</h1>
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden p-6 max-w-2xl">
              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="pb-4 border-b border-stone-200">
                  <h3 className="font-bold text-lg text-green-600 mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5"/> Tài khoản Ngân Hàng (Tạo mã QR)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium mb-1">Ngân hàng (Tên viết tắt)</label><input required type="text" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={siteSettings.bankId || ''} onChange={e => setSiteSettings({...siteSettings, bankId: e.target.value})} placeholder="VD: MB, VCB, ACB..." /></div>
                    <div><label className="block text-sm font-medium mb-1">Số tài khoản</label><input required type="text" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={siteSettings.bankAccount || ''} onChange={e => setSiteSettings({...siteSettings, bankAccount: e.target.value})} placeholder="Nhập số tài khoản" /></div>
                    <div className="col-span-2"><label className="block text-sm font-medium mb-1">Tên chủ tài khoản (Viết in hoa không dấu)</label><input required type="text" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500 uppercase" value={siteSettings.bankName || ''} onChange={e => setSiteSettings({...siteSettings, bankName: e.target.value.toUpperCase()})} placeholder="VD: NGUYEN VAN A" /></div>
                  </div>
                </div>
                <div className="pt-2">
                  <h3 className="font-bold text-lg text-amber-600 mb-4 flex items-center gap-2"><Phone className="w-5 h-5"/> Thông tin liên hệ</h3>
                  <div className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Số điện thoại Hotline / Zalo</label><input required type="text" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={siteSettings.hotline} onChange={e => setSiteSettings({...siteSettings, hotline: e.target.value})} placeholder="VD: 0987.974.962" /></div>
                    <div><label className="block text-sm font-medium mb-1">Link Fanpage Facebook</label><input required type="url" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={siteSettings.fanpage} onChange={e => setSiteSettings({...siteSettings, fanpage: e.target.value})} placeholder="https://facebook.com/..." /></div>
                    <div><label className="block text-sm font-medium mb-1">Email Hỗ Trợ</label><input required type="email" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={siteSettings.email} onChange={e => setSiteSettings({...siteSettings, email: e.target.value})} placeholder="hotro@...vn" /></div>
                  </div>
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400 text-white font-bold py-3 rounded-lg mt-4 transition-colors">{isSubmitting ? 'ĐANG LƯU...' : 'LƯU CÀI ĐẶT'}</button>
              </form>
            </div>
          </div>
        )}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6"><h2 className="text-xl font-bold text-stone-900">Đăng File Mẫu CNC Mới</h2><button onClick={() => setIsAddModalOpen(false)} className="text-stone-400 hover:text-stone-900 bg-stone-100 p-2 rounded-full"><X className="w-5 h-5" /></button></div>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-sm font-medium mb-1">Tên bức tượng / Mẫu CNC</label><input required type="text" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium mb-1">Giá bán (VNĐ)</label><input required type="number" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} /></div>
                  <div><label className="block text-sm font-medium mb-1">Danh mục</label><select className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})}>{CATEGORIES.filter(c => c !== "Tất cả").map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  <div><label className="block text-sm font-medium mb-1">Định dạng file tải</label><input required type="text" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={newProduct.format} onChange={e => setNewProduct({...newProduct, format: e.target.value})} /></div>
                  <div className="col-span-2 border-t border-b py-4 my-2">
                    <label className="block text-sm font-medium mb-2 flex items-center justify-between"><span className="flex items-center gap-2"><ImageIcon className="w-4 h-4 text-amber-500" /> Hình ảnh mô phỏng (Tối đa 5 ảnh)</span></label>
                    <div className="flex flex-wrap gap-4 items-center">
                      {newProduct.images.map((imgBase64, index) => (<div key={index} className="relative w-24 h-24 group"><img src={imgBase64} alt={`Upload ${index}`} className="w-full h-full object-cover rounded-lg border shadow-sm" /><button type="button" onClick={() => removeImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button></div>))}
                      {newProduct.images.length < 5 && (<label className="w-24 h-24 flex flex-col items-center justify-center cursor-pointer bg-stone-50 hover:bg-stone-100 border-2 border-dashed border-stone-300 rounded-lg transition-colors group"><input type="file" accept="image/*" multiple className="hidden" onChange={handleMultipleImageUpload} /><Plus className="w-6 h-6 text-stone-400 group-hover:text-amber-500 mb-1" /><span className="text-[10px] text-stone-500 font-medium">Tải ảnh lên</span></label>)}
                    </div>
                  </div>
                  <div className="col-span-2 flex gap-4">
                    <div className="flex-1"><label className="block text-sm font-medium mb-1">Link tải file GỐC (.STL nặng trên Google Drive)</label><input required type="url" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={newProduct.downloadUrl} onChange={e => setNewProduct({...newProduct, downloadUrl: e.target.value})} /></div>
                    <div className="w-1/3"><label className="block text-sm font-medium mb-1">Giới hạn số lần tải</label><input required type="number" min="1" className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-amber-500" value={newProduct.maxDownloads} onChange={e => setNewProduct({...newProduct, maxDownloads: e.target.value})} /></div>
                  </div>
                </div>
                <button disabled={isSubmitting} type="submit" className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-stone-400 text-white font-bold py-4 rounded-xl mt-4 transition-colors flex items-center justify-center gap-2 text-lg">{isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin"/> ĐANG LƯU...</> : "ĐĂNG BÁN SẢN PHẨM"}</button>
              </form>
            </div>
          </div>
        )}
        {toastMessage && (<div className="absolute bottom-8 right-8 bg-stone-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5"><CheckCircle className="w-5 h-5 text-green-400" /> {toastMessage}</div>)}
      </div>
    </div>
  );
}

// ==========================================
// 2. GIAO DIỆN KHÁCH HÀNG (USER STORE)
// ==========================================
function UserStore({ products, siteSettings, user, onSwitchToAdmin }) {
  const [purchases, setPurchases] = useState([]);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('idle'); 
  const [currentTxId, setCurrentTxId] = useState(null); 
  const [orderCode, setOrderCode] = useState(''); 
  const [currentPurchaseId, setCurrentPurchaseId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [toastMsg, setToastMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // STATE BẢNG ĐĂNG NHẬP
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); 
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const provider = new GoogleAuthProvider();

  useEffect(() => {
    if (!user || user.isAnonymous) { setPurchases([]); return; }
    const purchasesRef = collection(db, 'artifacts', appId, 'users', user.uid, 'purchases');
    const unsubscribe = onSnapshot(purchasesRef, (snapshot) => {
      const loaded = []; snapshot.forEach(doc => loaded.push({ id: doc.id, ...doc.data() }));
      loaded.sort((a, b) => new Date(b.purchasedAt) - new Date(a.purchasedAt)); setPurchases(loaded);
    }, console.error);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!currentTxId) return;
    const txRef = doc(db, 'artifacts', appId, 'public', 'data', 'transactions', currentTxId);
    const unsubscribe = onSnapshot(txRef, (docSnap) => {
      if (docSnap.exists() && docSnap.data().status === 'success') {
         setPaymentStatus('success'); if (docSnap.data().purchaseId) setCurrentPurchaseId(docSnap.data().purchaseId);
      }
    });
    return () => unsubscribe();
  }, [currentTxId]);

  // HÀM XỬ LÝ ĐĂNG KÝ / ĐĂNG NHẬP EMAIL
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setIsAuthLoading(true); setAuthError('');
    try {
      if (authMode === 'register') {
        const userCredential = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (authName) {
           await updateProfile(userCredential.user, { displayName: authName });
           const dbData = { uid: userCredential.user.uid, name: authName, email: userCredential.user.email, lastLogin: new Date().toISOString() };
           await setDoc(doc(db, 'artifacts', appId, 'users', userCredential.user.uid), dbData, { merge: true });
           await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'profiles', userCredential.user.uid), dbData, { merge: true });
        }
        setIsAuthModalOpen(false); showToast("Đăng ký tài khoản thành công!");
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        setIsAuthModalOpen(false); showToast("Đăng nhập thành công!");
      }
      setAuthEmail(''); setAuthPassword(''); setAuthName('');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setAuthError("Email này đã được đăng ký!");
      else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') setAuthError("Email hoặc mật khẩu không đúng!");
      else if (err.code === 'auth/weak-password') setAuthError("Mật khẩu quá yếu (cần ít nhất 6 ký tự).");
      else setAuthError("Lỗi: " + err.message);
    } finally { setIsAuthLoading(false); }
  };

  const handleGoogleLogin = async () => {
    try { 
      await signInWithPopup(auth, provider); 
      setIsAuthModalOpen(false); 
      showToast("Đăng nhập thành công!");
    } 
    catch (error) { 
      console.error(error); 
      if(error.code === 'auth/unauthorized-domain') {
        setAuthError("Lỗi cấu hình: Tên miền này chưa được cấp phép trong Firebase.");
      } else if (error.code !== 'auth/popup-closed-by-user') {
        setAuthError("Đăng nhập thất bại: " + error.message);
      }
    }
  };

  const handleLogout = async () => { try { await signOut(auth); showToast("Đã đăng xuất tài khoản.");} catch (error) { console.error(error); } };

  const handleOpenProductDetail = (product) => { setViewingProduct(product); setActiveImageIndex(0); };

  const handleBuyClick = async (product) => {
    if (!user || user.isAnonymous) { setAuthMode('login'); setIsAuthModalOpen(true); return; }
    setViewingProduct(null); setCheckoutProduct(product); setPaymentStatus('waiting');
    const newOrderCode = 'CNC' + Math.floor(1000 + Math.random() * 9000); setOrderCode(newOrderCode);

    try {
      const docRef = await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), {
        userId: user.uid, userName: user.displayName || user.email?.split('@')[0] || 'Khách hàng', userEmail: user.email || '',
        productId: product.id, productName: product.name, price: product.price, format: product.format, size: product.size,
        downloadUrl: product.downloadUrl || '', maxDownloads: product.maxDownloads || 3, orderCode: newOrderCode, status: 'pending', createdAt: new Date().toISOString()
      });
      setCurrentTxId(docRef.id);
    } catch (err) { console.error(err); }
  };

  const showToast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(''), 3000); };

  const handleDownloadItem = async (id, downloadUrl, currentCount, maxLimit, isVaultItem = false) => {
    if (currentCount >= maxLimit) { showToast('Bạn đã hết lượt tải cho mẫu này!'); return; }
    if (downloadUrl) { window.open(getDirectDownloadLink(downloadUrl), '_blank');
      try { if(isVaultItem && id !== 'temp') await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'purchases', id), { downloadCount: currentCount + 1 }); } 
      catch (err) { console.error("Lỗi cập nhật lượt tải:", err); }
    } else showToast('Chưa có link tải cho mẫu này.');
  };

  const triggerFakeWebhook = async () => {
    if (!currentTxId || !checkoutProduct) return; showToast("Ngân hàng đang xử lý...");
    try {
      const purchaseDoc = await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'purchases'), {
        productId: checkoutProduct.id, productName: checkoutProduct.name, price: checkoutProduct.price, format: checkoutProduct.format, size: checkoutProduct.size, downloadUrl: checkoutProduct.downloadUrl || '', maxDownloads: checkoutProduct.maxDownloads || 3, downloadCount: 0, purchasedAt: new Date().toISOString()
      });
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'transactions', currentTxId), { status: 'success', purchaseId: purchaseDoc.id, completedAt: new Date().toISOString() });
    } catch (err) { console.error(err); }
  };

  const filteredProducts = products.filter(product => (activeCategory === "Tất cả" || product.category === activeCategory) && product.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-stone-100 font-sans text-stone-800 flex flex-col">
      <header className="bg-stone-900 text-amber-50 sticky top-0 z-40 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:h-16 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between"><div className="flex items-center space-x-2 cursor-pointer" onClick={() => {setSearchQuery(''); setActiveCategory("Tất cả");}}><FileBox className="text-amber-500 w-8 h-8" /><span className="text-xl font-bold tracking-wider">CNC<span className="text-amber-500">3D</span>VIỆT</span></div></div>
          <div className="w-full sm:flex-1 max-w-xl mx-0 sm:mx-8 relative group"><input type="text" placeholder="Tìm kiếm mẫu 3D..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-stone-800 text-white border border-stone-700 rounded-full py-2.5 pl-11 pr-4 focus:outline-none focus:border-amber-500 focus:bg-stone-800 transition-colors text-sm" /><Search className="absolute left-4 top-3 w-4 h-4 text-stone-400 group-focus-within:text-amber-500" />{searchQuery && (<button onClick={() => setSearchQuery('')} className="absolute right-4 top-3 text-stone-400 hover:text-white"><X className="w-4 h-4" /></button>)}</div>
          <div className="flex items-center space-x-4 w-full sm:w-auto justify-end">
            {user && !user.isAnonymous ? (
              <div className="flex items-center space-x-4">
                <button onClick={() => setIsVaultOpen(true)} className="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-full transition-colors font-medium text-sm shadow-sm"><Package className="w-4 h-4" /><span className="hidden sm:inline">Kho File</span><span className="bg-amber-800 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{purchases.length}</span></button>
                <div className="hidden md:flex items-center space-x-2 bg-stone-800 px-3 py-1.5 rounded-full border border-stone-700 cursor-pointer group relative">
                  {user.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 bg-stone-700 rounded-full flex items-center justify-center"><User className="w-4 h-4 text-stone-300" /></div>}
                  <span className="text-xs font-bold text-stone-300 truncate max-w-[100px]">{user.displayName || user.email?.split('@')[0] || 'Khách'}</span>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all"><div className="px-4 py-3 text-xs text-stone-500 border-b truncate">{user.email || 'Tài khoản Email'}</div><button onClick={handleLogout} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-stone-50 rounded-b-lg font-bold">Đăng xuất</button></div>
                </div>
              </div>
            ) : (
              <button onClick={() => {setAuthMode('login'); setIsAuthModalOpen(true)}} className="flex items-center space-x-2 bg-amber-500 text-stone-900 hover:bg-amber-400 px-5 py-2 rounded-full transition-colors font-bold text-sm shadow-sm"><User className="w-4 h-4" /><span>Đăng nhập / Đăng ký</span></button>
            )}
          </div>
        </div>
      </header>

      <div className="bg-stone-800 text-white border-b border-stone-700 hidden sm:block shadow-md">
        <div className="max-w-6xl mx-auto flex items-center text-sm font-bold tracking-wide">
          <button onClick={() => {setSearchQuery(''); setActiveCategory("Tất cả");}} className="px-8 py-3.5 bg-amber-600 text-white hover:bg-amber-500 transition-colors flex items-center gap-2"><FileBox className="w-4 h-4" /> TRANG CHỦ</button>
          <button onClick={() => setIsGuideOpen(true)} className="px-8 py-3.5 hover:text-amber-400 hover:bg-stone-700 transition-colors flex items-center gap-2"><HelpCircle className="w-4 h-4" /> HƯỚNG DẪN MUA HÀNG</button>
          <button onClick={() => setIsContactOpen(true)} className="px-8 py-3.5 hover:text-amber-400 hover:bg-stone-700 transition-colors flex items-center gap-2"><Phone className="w-4 h-4" /> LIÊN HỆ HỖ TRỢ</button>
          <div className="ml-auto px-4 text-amber-500 flex items-center gap-2"><Phone className="w-4 h-4 animate-pulse" /> Hotline: {siteSettings.hotline}</div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-grow w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold border-b-2 border-amber-500 pb-2 inline-block w-max text-stone-900">{searchQuery ? `Kết quả tìm kiếm: "${searchQuery}"` : "Khám Phá Mẫu Tượng"}</h2>
          {!searchQuery && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Filter className="w-5 h-5 text-stone-500 shrink-0" />
              {CATEGORIES.map(category => (<button key={category} onClick={() => setActiveCategory(category)} className={`px-4 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors border shadow-sm ${activeCategory === category ? 'bg-amber-500 border-amber-500 text-stone-900' : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'}`}>{category}</button>))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => {
              const displayImage = (product.images && product.images.length > 0) ? product.images[0] : product.image;
              return (
              <div key={product.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1 flex flex-col relative group/card border border-stone-100">
                <div className="h-56 overflow-hidden relative group bg-stone-200 cursor-pointer" onClick={() => handleOpenProductDetail(product)}>
                  <img src={displayImage} alt={product.name} onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1582560475093-ba66cef36eb4?auto=format&fit=crop&q=80&w=600"; }} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm border border-white/20">{product.format}</div>
                  <div className="absolute top-2 left-2 bg-amber-500 text-stone-900 font-bold text-[10px] px-2 py-1 rounded-full backdrop-blur-sm shadow-sm">{product.category}</div>
                  {product.images && product.images.length > 1 && (<div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md flex items-center gap-1 backdrop-blur-sm"><ImageIcon className="w-3 h-3" /> +{product.images.length} góc</div>)}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="bg-white text-stone-900 font-bold px-4 py-2 rounded-full shadow-lg text-sm flex items-center gap-2"><Search className="w-4 h-4"/> Xem chi tiết</span></div>
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <h3 className="font-bold text-base mb-1 text-stone-900 line-clamp-2 leading-snug group-hover/card:text-amber-600 transition-colors cursor-pointer" onClick={() => handleOpenProductDetail(product)}>{product.name}</h3>
                  <div className="flex items-center justify-between mt-auto pt-4"><span className="text-red-600 font-bold text-lg">{formatPrice(product.price)}</span><button onClick={(e) => {e.stopPropagation(); handleBuyClick(product)}} className="bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-700 p-2 rounded-lg transition-colors" title="Mua ngay"><ShoppingCart className="w-5 h-5" /></button></div>
                </div>
              </div>
            )})
          ) : (<div className="col-span-full text-center py-20 text-stone-500 bg-white rounded-2xl border border-dashed border-stone-300"><Search className="w-12 h-12 mx-auto mb-3 text-stone-300" /><p className="text-lg font-medium text-stone-700">Chưa có mẫu nào.</p><p className="text-sm">Quản trị viên hãy đăng sản phẩm đầu tiên nhé.</p></div>)}
        </div>
      </main>

      <footer className="bg-stone-900 text-stone-400 py-8 text-center text-sm relative mt-auto border-t-4 border-amber-500">
        <p>© 2026 CNC 3D Việt. Hệ thống thanh toán & giao file tự động.</p>
        <button onClick={onSwitchToAdmin} className="absolute right-4 bottom-4 text-xs text-stone-600 hover:text-amber-500 transition-colors font-bold uppercase tracking-widest flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> [ Truy cập Admin ]</button>
      </footer>

      {/* MODAL CHI TIẾT SẢN PHẨM */}
      {viewingProduct && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-stone-900 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200 max-h-[90vh]">
            <button onClick={() => setViewingProduct(null)} className="absolute top-4 right-4 z-10 text-stone-400 hover:text-white bg-black/50 p-2 rounded-full"><X className="w-6 h-6" /></button>
            <div className="w-full md:w-3/5 bg-black flex flex-col p-4 border-b md:border-b-0 md:border-r border-stone-800">
              <div className="flex-1 min-h-[300px] flex items-center justify-center relative mb-4"><img src={(viewingProduct.images && viewingProduct.images.length > 0) ? viewingProduct.images[activeImageIndex] : viewingProduct.image} alt="Chi tiết" className="max-w-full max-h-[50vh] md:max-h-[60vh] object-contain rounded-lg" /></div>
              {viewingProduct.images && viewingProduct.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-start md:justify-center">
                  {viewingProduct.images.map((imgUrl, idx) => (<button key={idx} onClick={() => setActiveImageIndex(idx)} className={`shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${activeImageIndex === idx ? 'border-amber-500 opacity-100' : 'border-transparent opacity-50 hover:opacity-100'}`}><img src={imgUrl} className="w-full h-full object-cover" alt="" /></button>))}
                </div>
              )}
            </div>
            <div className="w-full md:w-2/5 p-6 md:p-8 flex flex-col bg-stone-900 text-white overflow-y-auto">
              <div className="flex items-center gap-2 mb-4 text-xs font-bold tracking-wider text-stone-400 uppercase"><span>Trang Chủ</span> <ChevronRight className="w-3 h-3" /> <span className="text-amber-500">{viewingProduct.category}</span></div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-4">{viewingProduct.name}</h1>
              <div className="flex items-end gap-4 mb-6 border-b border-stone-800 pb-6"><span className="text-3xl font-bold text-amber-500">{formatPrice(viewingProduct.price)}</span></div>
              <div className="space-y-4 mb-8 text-stone-300 text-sm">
                <div className="flex items-start gap-3"><FileBox className="w-5 h-5 text-stone-500 shrink-0" /><div><span className="text-stone-500 block text-xs uppercase font-bold">Định dạng file</span><span className="font-medium text-white">{viewingProduct.format}</span></div></div>
                <div className="flex items-start gap-3"><Download className="w-5 h-5 text-stone-500 shrink-0" /><div><span className="text-stone-500 block text-xs uppercase font-bold">Giới hạn tải</span><span className="font-medium text-white">{viewingProduct.maxDownloads || 3} lần / khách</span></div></div>
              </div>
              <div className="mt-auto pt-4"><button onClick={() => handleBuyClick(viewingProduct)} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-bold text-lg py-4 rounded-xl flex justify-center items-center gap-3 transition-colors shadow-lg shadow-amber-900/50"><ShoppingCart className="w-6 h-6" /> ĐẶT MUA MẪU NÀY</button></div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KHO FILE ĐÃ MUA */}
      {isVaultOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-stone-50 rounded-t-2xl"><h2 className="text-xl font-bold flex items-center gap-2"><Package className="w-6 h-6 text-amber-600" />Kho File Đã Mua Của Bạn</h2><button onClick={() => setIsVaultOpen(false)} className="text-stone-400 hover:text-stone-900 bg-white border p-1 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="p-4 overflow-y-auto flex-grow bg-stone-50/50">
              {purchases.length === 0 ? (
                <div className="text-center py-16 text-stone-500 bg-white rounded-xl border border-dashed"><FileBox className="w-16 h-16 mx-auto mb-4 text-stone-300" /><p className="font-medium text-lg">Kho file đang trống.</p><p className="text-sm mt-1">Bạn chưa mua mẫu CNC nào.</p></div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl hover:border-amber-300 bg-white shadow-sm transition-colors gap-4">
                      <div><h3 className="font-bold text-stone-900 text-base">{item.productName}</h3><p className="text-xs text-stone-500 mt-1">Mua lúc: {new Date(item.purchasedAt).toLocaleString('vi-VN')}</p><p className={`text-xs mt-1.5 inline-block px-2 py-0.5 rounded-full font-bold ${((item.downloadCount || 0) >= (item.maxDownloads || 3)) ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>Lượt tải còn lại: {Math.max(0, (item.maxDownloads || 3) - (item.downloadCount || 0))} / {item.maxDownloads || 3}</p></div>
                      <button onClick={() => handleDownloadItem(item.id, item.downloadUrl, item.downloadCount || 0, item.maxDownloads || 3, true)} disabled={(item.downloadCount || 0) >= (item.maxDownloads || 3)} className={`px-4 py-3 sm:p-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all w-full sm:w-auto ${ (item.downloadCount || 0) >= (item.maxDownloads || 3) ? 'bg-stone-100 text-stone-400 cursor-not-allowed' : 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white hover:shadow-lg' }`}><Download className="w-5 h-5" /><span className="sm:hidden">Tải file .STL</span></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN QR TỰ ĐỘNG */}
      {checkoutProduct && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl">
            <div className="bg-stone-900 text-white p-4 flex justify-between items-center border-b border-stone-800"><h2 className="font-bold text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-amber-500"/> Thanh toán tự động 24/7</h2>{paymentStatus === 'waiting' && <button onClick={() => {setCheckoutProduct(null); setCurrentTxId(null)}} className="text-stone-400 hover:text-white p-1 rounded-full transition-colors"><X className="w-6 h-6" /></button>}</div>
            <div className="p-6 overflow-y-auto bg-stone-50">
              {paymentStatus === 'waiting' && (
                <div className="space-y-6 animate-in fade-in">
                  <div className="flex gap-4 p-4 bg-white rounded-xl border shadow-sm"><img src={(checkoutProduct.images && checkoutProduct.images.length > 0) ? checkoutProduct.images[0] : checkoutProduct.image} alt="" className="w-20 h-20 object-cover rounded-lg border bg-stone-100" /><div><h3 className="font-bold text-stone-900 line-clamp-2">{checkoutProduct.name}</h3><p className="text-xs text-stone-500 mt-1">Mã đơn: <strong className="text-amber-600 bg-amber-50 px-1 py-0.5 rounded">{orderCode}</strong></p><div className="text-red-600 font-bold text-lg mt-1">{formatPrice(checkoutProduct.price)}</div></div></div>
                  <div className="bg-white border-2 border-amber-500 rounded-2xl p-6 text-center shadow-lg relative overflow-hidden"><div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-xs font-bold py-1.5 uppercase tracking-wider">Mở App Ngân hàng và quét mã</div><div className="mt-6 flex flex-col md:flex-row items-center gap-6"><div className="shrink-0 p-2 bg-white border-2 border-dashed border-stone-300 rounded-xl"><img src={`https://img.vietqr.io/image/${siteSettings.bankId || 'MB'}-${siteSettings.bankAccount || '0987974962'}-compact2.png?amount=${checkoutProduct.price}&addInfo=${orderCode}&accountName=${encodeURIComponent(siteSettings.bankName || 'NGUYEN VAN A')}`} alt="Mã QR" className="w-48 h-48" /></div><div className="text-left flex-1 w-full"><div className="mb-3"><p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Ngân hàng</p><p className="font-bold text-lg text-stone-900">{siteSettings.bankId || 'MB Bank'}</p></div><div className="mb-3"><p className="text-xs text-stone-500 uppercase font-bold tracking-wider">Số tài khoản</p><p className="font-bold text-lg text-stone-900">{siteSettings.bankAccount || '0987974962'}</p><p className="text-sm font-medium text-stone-700">{siteSettings.bankName || 'NGUYEN VAN A'}</p></div><div className="bg-amber-50 p-3 rounded-lg border border-amber-200"><p className="text-[10px] text-amber-700 uppercase font-bold tracking-wider mb-1">Nội dung chuyển khoản (Bắt buộc)</p><p className="font-bold text-2xl text-red-600 tracking-wider">{orderCode}</p></div></div></div></div>
                  <div className="text-center text-sm font-medium text-amber-700 flex items-center justify-center gap-2 bg-amber-100 py-4 rounded-xl border border-amber-200 shadow-inner"><Loader2 className="w-5 h-5 animate-spin"/> Đang chờ nhận tiền... (Sẽ tự động tải file)</div>
                  <button onClick={triggerFakeWebhook} className="w-full bg-stone-200 hover:bg-stone-300 text-stone-600 text-xs font-bold py-3 rounded-xl transition-colors mt-2">🔌 [Dành cho Test] Giả lập Ngân hàng báo có tiền</button>
                </div>
              )}
              {paymentStatus === 'success' && (
                <div className="flex flex-col items-center py-6 text-center animate-in zoom-in-95"><div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-inner"><CheckCircle className="w-12 h-12 text-green-600" /></div><h3 className="text-2xl font-bold text-green-600 mb-2">Thanh toán thành công!</h3><p className="text-stone-500 text-sm">Cảm ơn bạn đã mua hàng. File đã sẵn sàng.</p>
                  <div className="w-full bg-amber-50 border-2 border-amber-400 rounded-2xl p-6 mt-6 relative overflow-hidden shadow-lg"><div className="absolute inset-0 w-1/2 bg-white/40 skew-x-12 -translate-x-full animate-[shimmer_2s_infinite]"></div><h4 className="font-bold text-stone-900 mb-2 flex items-center justify-center gap-2"><Download className="w-5 h-5"/> NHẬN FILE MẪU CNC</h4>
                    {(() => {
                      const purchasedItem = purchases.find(p => p.id === currentPurchaseId); 
                      const currentCount = purchasedItem ? (purchasedItem.downloadCount || 0) : 0; const maxLimit = purchasedItem ? (purchasedItem.maxDownloads || 3) : (checkoutProduct?.maxDownloads || 3);
                      const isLimitReached = currentCount >= maxLimit; const downloadUrl = purchasedItem ? purchasedItem.downloadUrl : checkoutProduct?.downloadUrl;
                      return (
                        <><p className={`text-xs font-bold mb-4 bg-white py-1 px-3 rounded-full inline-block border ${isLimitReached ? 'text-red-500 border-red-200' : 'text-green-600 border-green-200'}`}>Lượt tải còn lại: {Math.max(0, maxLimit - currentCount)} / {maxLimit}</p><button onClick={() => { handleDownloadItem(purchasedItem?.id || 'temp', downloadUrl, currentCount, maxLimit, !!purchasedItem) }} disabled={isLimitReached} className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all text-lg ${ (isLimitReached) ? 'bg-stone-300 text-stone-500 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xl active:scale-95' }`}><Download className="w-6 h-6" /> TẢI XUỐNG NGAY (.STL)</button></>
                      );
                    })()}
                  </div>
                  <button onClick={() => {setCheckoutProduct(null); setPaymentStatus('idle'); setCurrentTxId(null); setCurrentPurchaseId(null);}} className="mt-6 text-stone-500 hover:text-stone-900 font-medium underline text-sm transition-colors">Đóng và tiếp tục xem mẫu khác</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL BẢNG ĐĂNG KÝ / ĐĂNG NHẬP HOÀN CHỈNH */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-stone-200">
            <div className="flex border-b border-stone-200 bg-stone-50">
              <button onClick={() => {setAuthMode('login'); setAuthError('');}} className={`flex-1 py-4 font-bold text-center transition-colors text-sm tracking-wide ${authMode === 'login' ? 'bg-white text-amber-600 border-b-2 border-amber-600' : 'text-stone-500 hover:bg-stone-100'}`}>ĐĂNG NHẬP</button>
              <button onClick={() => {setAuthMode('register'); setAuthError('');}} className={`flex-1 py-4 font-bold text-center transition-colors text-sm tracking-wide ${authMode === 'register' ? 'bg-white text-amber-600 border-b-2 border-amber-600' : 'text-stone-500 hover:bg-stone-100'}`}>TẠO TÀI KHOẢN</button>
            </div>
            <div className="p-8 relative">
              <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 p-1 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              
              <div className="text-center mb-6">
                <h3 className="font-bold text-2xl text-stone-900">{authMode === 'login' ? 'Chào mừng trở lại!' : 'Tham gia cùng chúng tôi!'}</h3>
                <p className="text-stone-500 text-sm mt-1">{authMode === 'login' ? 'Đăng nhập để xem kho file đã mua của bạn' : 'Tạo tài khoản để lưu trữ mẫu CNC vĩnh viễn'}</p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                {authError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2"><ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" /> {authError}</div>}
                
                {authMode === 'register' && (
                  <div>
                    <label className="block text-sm font-bold mb-1 text-stone-700">Họ và Tên</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                      <input required type="text" value={authName} onChange={e => setAuthName(e.target.value)} className="w-full border-2 border-stone-200 py-3 pl-10 pr-4 rounded-xl focus:border-amber-500 outline-none transition-colors" placeholder="Nhập tên của bạn" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold mb-1 text-stone-700">Email của bạn</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} className="w-full border-2 border-stone-200 py-3 pl-10 pr-4 rounded-xl focus:border-amber-500 outline-none transition-colors" placeholder="VD: email@gmail.com" />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold mb-1 text-stone-700">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input required type={showPassword ? "text" : "password"} value={authPassword} onChange={e => setAuthPassword(e.target.value)} className="w-full border-2 border-stone-200 py-3 pl-10 pr-10 rounded-xl focus:border-amber-500 outline-none transition-colors" placeholder="Ít nhất 6 ký tự" minLength="6" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button disabled={isAuthLoading} type="submit" className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center gap-2 mt-2 shadow-md">
                  {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin"/> : (authMode === 'login' ? 'ĐĂNG NHẬP NGAY' : 'ĐĂNG KÝ MIỄN PHÍ')}
                </button>
              </form>

              <div className="mt-6 border-t border-stone-200 pt-6">
                <button onClick={handleGoogleLogin} className="w-full bg-white border-2 border-stone-200 hover:bg-stone-50 hover:border-stone-300 text-stone-700 font-bold py-3 rounded-xl transition-all flex justify-center items-center gap-3">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Đăng nhập nhanh bằng Google
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CÁC MODAL HƯỚNG DẪN / LIÊN HỆ */}
      {isGuideOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-amber-500 p-4 flex justify-between items-center text-stone-900"><h2 className="text-lg font-bold flex items-center gap-2"><HelpCircle className="w-5 h-5" /> Hướng dẫn mua hàng</h2><button onClick={() => setIsGuideOpen(false)} className="hover:bg-amber-600 p-1 rounded-full"><X className="w-5 h-5" /></button></div>
            <div className="p-6 space-y-6 text-stone-700">
              <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-amber-600 shrink-0">1</div><div><h3 className="font-bold text-stone-900">Đăng ký tài khoản</h3><p className="text-sm mt-1">Bạn cần đăng ký tài khoản để hệ thống tạo "Kho File" lưu trữ vĩnh viễn.</p></div></div>
              <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-amber-600 shrink-0">2</div><div><h3 className="font-bold text-stone-900">Thanh toán</h3><p className="text-sm mt-1">Bấm MUA NGAY và tiến hành chuyển khoản qua mã VietQR.</p></div></div>
              <div className="flex gap-4"><div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-amber-600 shrink-0">3</div><div><h3 className="font-bold text-stone-900">Tải file tự động</h3><p className="text-sm mt-1">Hệ thống sẽ tự nhận diện tiền và cấp link tải file ngay lập tức.</p></div></div>
              <button onClick={() => setIsGuideOpen(false)} className="w-full bg-stone-900 text-white font-medium py-2.5 rounded-lg mt-4">Đã hiểu</button>
            </div>
          </div>
        </div>
      )}

      {isContactOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="bg-stone-900 p-4 flex justify-between items-center text-white"><h2 className="text-lg font-bold flex items-center gap-2"><Phone className="w-5 h-5 text-amber-500" /> Liên hệ hỗ trợ</h2><button onClick={() => setIsContactOpen(false)} className="text-stone-400 hover:text-white"><X className="w-5 h-5" /></button></div>
            <div className="p-6">
              <div className="space-y-3">
                <a href={`tel:${siteSettings.hotline.replace(/\./g, '')}`} className="flex items-center gap-3 p-3 rounded-xl border group"><div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Phone className="w-5 h-5"/></div><div><div className="text-xs text-stone-500">Hotline / Zalo</div><div className="font-bold text-stone-900">{siteSettings.hotline}</div></div></a>
                <a href={siteSettings.fanpage} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border group"><div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><MessageCircle className="w-5 h-5"/></div><div><div className="text-xs text-stone-500">Fanpage Facebook</div><div className="font-bold text-stone-900">Nhắn tin ngay</div></div></a>
                <a href={`mailto:${siteSettings.email}`} className="flex items-center gap-3 p-3 rounded-xl border group"><div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Mail className="w-5 h-5"/></div><div><div className="text-xs text-stone-500">Email Hỗ Trợ</div><div className="font-bold text-stone-900">{siteSettings.email}</div></div></a>
              </div>
            </div>
          </div>
        </div>
      )}

      {toastMsg && <div className="fixed bottom-8 right-8 bg-stone-800 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[200] animate-in slide-in-from-bottom-5"><CheckCircle className="w-5 h-5 text-green-400" /> {toastMsg}</div>}
      <style dangerouslySetInnerHTML={{__html: `@keyframes shimmer { 100% { transform: translateX(200%); } }`}} />
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('user'); 
  const [products, setProducts] = useState([]);
  const [siteSettings, setSiteSettings] = useState(INITIAL_SETTINGS);
  const [allProfiles, setAllProfiles] = useState([]);
  const [allTransactions, setAllTransactions] = useState([]); 
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        signInAnonymously(auth).catch(console.error);
      } else {
        setUser(currentUser);
        setIsAuthReady(true);
        
        if (!currentUser.isAnonymous) {
          try {
            const userRef = doc(db, 'artifacts', appId, 'users', currentUser.uid);
            await setDoc(userRef, { uid: currentUser.uid, name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Khách hàng', email: currentUser.email || '', photoURL: currentUser.photoURL || '', lastLogin: new Date().toISOString() }, { merge: true });
            const adminProfileRef = doc(db, 'artifacts', appId, 'public', 'data', 'profiles', currentUser.uid);
            await setDoc(adminProfileRef, { uid: currentUser.uid, name: currentUser.displayName || currentUser.email?.split('@')[0] || 'Khách hàng', email: currentUser.email || '', photoURL: currentUser.photoURL || '', lastLogin: new Date().toISOString() }, { merge: true });
          } catch (err) { console.error(err); }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) return; 
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'config'), (docSnap) => { if (docSnap.exists()) setSiteSettings(docSnap.data()); });
    const unsubProducts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'products'), (snapshot) => {
      const loadedProducts = []; snapshot.forEach(docSnap => loadedProducts.push(docSnap.data()));
      if (loadedProducts.length > 0) { loadedProducts.sort((a, b) => b.id - a.id); setProducts(loadedProducts); } 
      else { INITIAL_PRODUCTS.forEach(async (p) => await setDoc(doc(collection(db, 'artifacts', appId, 'public', 'data', 'products'), p.id.toString()), p)); }
    });
    const unsubProfiles = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'profiles'), (snapshot) => {
      const loadedProfiles = []; snapshot.forEach(docSnap => loadedProfiles.push(docSnap.data()));
      loadedProfiles.sort((a, b) => new Date(b.lastLogin) - new Date(a.lastLogin)); setAllProfiles(loadedProfiles);
    });
    const unsubTx = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'transactions'), (snapshot) => {
      const loadedTx = []; snapshot.forEach(docSnap => loadedTx.push({ id: docSnap.id, ...docSnap.data() }));
      loadedTx.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); setAllTransactions(loadedTx);
    });
    return () => { unsubSettings(); unsubProducts(); unsubProfiles(); unsubTx(); };
  }, [isAuthReady, user]);

  if (!isAuthReady) return (<div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-white"><Loader2 className="w-12 h-12 animate-spin text-amber-500 mb-4" /><h2 className="font-bold tracking-wider">ĐANG TẢI DỮ LIỆU...</h2></div>);

  // ========================================================
  // 🔴 Ổ KHÓA CỦA ADMIN: ĐIỀN GMAIL CỦA BẠN VÀO BÊN DƯỚI 👇
  // ========================================================
  const ADMIN_EMAIL = "ducduy271295@gmail.com";

  if (viewMode === 'admin') {
    if (user && user.email === ADMIN_EMAIL) {
      return <AdminDashboard products={products} setProducts={setProducts} siteSettings={siteSettings} setSiteSettings={setSiteSettings} allProfiles={allProfiles} allTransactions={allTransactions} onSwitchToUser={() => setViewMode('user')} />;
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-stone-900 text-white text-center p-4">
          <ShieldCheck className="w-24 h-24 text-red-500 mb-4" />
          <h2 className="text-3xl font-bold mb-2 text-red-500">CẢNH BÁO BẢO MẬT</h2>
          <p className="text-stone-300 mb-8 max-w-md">Tài khoản <strong className="text-amber-500">{user?.email || 'Khách chưa đăng nhập'}</strong> không có đặc quyền truy cập trang Quản Trị!</p>
          <button onClick={() => setViewMode('user')} className="px-8 py-3 bg-amber-600 rounded-xl font-bold text-white transition-colors hover:bg-amber-700 shadow-lg">Trở lại Cửa hàng</button>
        </div>
      );
    }
  }

  return <UserStore products={products} siteSettings={siteSettings} user={user} onSwitchToAdmin={() => {
    if (user && user.email === ADMIN_EMAIL) setViewMode('admin'); 
    else alert("🔐 KHU VỰC BẢO MẬT DÀNH CHO QUẢN TRỊ!\n\nVui lòng cuộn lên đầu trang, bấm Đăng Nhập bằng đúng Email Quản trị viên của bạn trước khi truy cập.");
  }} />;
}