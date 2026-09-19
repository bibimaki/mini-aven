"use client";

import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../../lib/supabaseClient";

function formatBaht(n) {
  return "฿" + Number(n || 0).toLocaleString("en-US");
}

function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function HistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  async function loadSales() {
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("sales")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError(error.message);
    } else {
      setLoadError("");
      setSales(data || []);
    }
    setLoading(false);
  }

  useEffect(() => {
    loadSales();
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>ประวัติการขาย</h1>
        <p>รายการขายทั้งหมดที่บันทึกไว้ในระบบ</p>
      </div>

      {!isSupabaseConfigured && (
        <div className="notice">
          ยังไม่ได้ตั้งค่า Supabase — เมื่อกำหนดค่า Environment Variables แล้ว ประวัติการขายจะแสดงที่นี่
        </div>
      )}
      {loadError && <div className="notice">โหลดประวัติการขายไม่สำเร็จ: {loadError}</div>}

      <div className="toolbar">
        <span className="refresh-hint">
          {loading ? "กำลังโหลด…" : `ทั้งหมด ${sales.length} รายการ`}
        </span>
        <button className="btn btn-ghost" onClick={loadSales} type="button">
          รีเฟรช
        </button>
      </div>

      <div className="card table-card">
        <div className="table-scroll">
          <table className="history-table">
            <thead>
              <tr>
                <th>วันที่</th>
                <th>รายการสินค้า</th>
                <th>จำนวน</th>
                <th>ยอดรวม</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => {
                const items = Array.isArray(s.items) ? s.items : [];
                const qty = items.reduce((a, it) => a + Number(it.qty || 0), 0);
                return (
                  <tr key={s.id ?? s.created_at}>
                    <td>{formatDate(s.created_at)}</td>
                    <td className="history-items">
                      {items.map((it, idx) => (
                        <div key={idx}>
                          {it.name} × {it.qty}
                        </div>
                      ))}
                    </td>
                    <td>{qty}</td>
                    <td>{formatBaht(s.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!loading && sales.length === 0 && (
          <div className="history-empty">ยังไม่มีประวัติการขาย เมื่อมีการชำระเงินที่หน้าขายสินค้า รายการจะปรากฏที่นี่</div>
        )}
      </div>
    </div>
  );
}
