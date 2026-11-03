import { Outlet, Link } from "react-router";

export default function AdminLayout() {
  return (
    <div className="admin-container">
      {/* Phần khung chung cố định */}
      <aside className="sidebar">
        <h2>Admin Menu</h2>
        <Link to="/admin">Dashboard</Link>
        <Link to="/admin/users">Quản lý User</Link>
      </aside>

      {/* Phần nội dung thay đổi tùy theo route con */}
      <main className="content">
        <Outlet /> 
      </main>
    </div>
  );
}