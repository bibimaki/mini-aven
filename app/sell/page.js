'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  // รายการสินค้าทั้งหมด สำหรับใส่ใน dropdown
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // สินค้าที่เลือกและจำนวนที่จะขาย
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // โหลดรายการสินค้าตอน component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงข้อมูลสินค้าทั้งหมดจากตาราง products
  async function fetchProducts() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setErrorMsg('โหลดรายการสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setProducts(data);
    }
    setLoading(false);
  }

  // หาข้อมูลสินค้าที่ถูกเลือกอยู่ในปัจจุบัน (ใช้คำนวณยอดรวม)
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // คำนวณยอดรวม = ราคา x จำนวน
  const quantityNumber = parseInt(quantity, 10) || 0;
  const totalPrice = selectedProduct
    ? selectedProduct.price * quantityNumber
    : 0;

  // รีเซ็ตฟอร์มกลับสู่ค่าเริ่มต้น
  function resetForm() {
    setSelectedProductId('');
    setQuantity('');
  }

  // กดปุ่ม "ขาย"
  async function handleSell(e) {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedProduct) {
      setErrorMsg('กรุณาเลือกสินค้า');
      return;
    }

    if (!quantityNumber || quantityNumber <= 0) {
      setErrorMsg('กรุณากรอกจำนวนที่ต้องการขายให้ถูกต้อง');
      return;
    }

    // ตรวจสอบว่าสต๊อกเพียงพอหรือไม่
    if (quantityNumber > selectedProduct.stock) {
      setErrorMsg(
        `สินค้าคงเหลือไม่พอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit || ''})`
      );
      return;
    }

    setSubmitting(true);

    // 1. บันทึกรายการขายลงตาราง sales
    const { error: saleError } = await supabase.from('sales').insert([
      {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: quantityNumber,
        total_price: totalPrice,
        sold_at: new Date().toISOString(),
      },
    ]);

    if (saleError) {
      setErrorMsg('บันทึกการขายไม่สำเร็จ: ' + saleError.message);
      setSubmitting(false);
      return;
    }

    // 2. อัปเดต stock ในตาราง products ให้ลดลงตามจำนวนที่ขาย
    const newStock = selectedProduct.stock - quantityNumber;
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', selectedProduct.id);

    if (updateError) {
      setErrorMsg(
        'บันทึกการขายสำเร็จ แต่อัปเดตสต๊อกไม่สำเร็จ: ' + updateError.message
      );
      setSubmitting(false);
      return;
    }

    // สำเร็จ: แจ้งเตือน รีเซ็ตฟอร์ม และโหลดสินค้าใหม่ (เพื่อให้ stock อัปเดต)
    setSuccessMsg(
      `ขาย ${selectedProduct.name} จำนวน ${quantityNumber} ${selectedProduct.unit || ''} สำเร็จ ยอดรวม ${totalPrice.toFixed(2)} บาท`
    );
    resetForm();
    fetchProducts();
    setSubmitting(false);
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {errorMsg && (
        <p style={{ color: '#dc2626', fontWeight: 600 }}>{errorMsg}</p>
      )}
      {successMsg && (
        <p style={{ color: '#16a34a', fontWeight: 600 }}>{successMsg}</p>
      )}

      {loading ? (
        <p>กำลังโหลดรายการสินค้า...</p>
      ) : (
        <form onSubmit={handleSell}>
          {/* Dropdown เลือกสินค้า แสดงชื่อและราคา */}
          <label htmlFor="product">สินค้า</label>
          <select
            id="product"
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            required
          >
            <option value="">-- เลือกสินค้า --</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} - {Number(product.price).toFixed(2)} บาท (คงเหลือ {product.stock})
              </option>
            ))}
          </select>

          {/* ช่องกรอกจำนวน */}
          <label htmlFor="quantity">จำนวน</label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="จำนวนที่ต้องการขาย"
            required
          />

          {/* แสดงยอดรวมอัตโนมัติ */}
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
            ยอดรวม: {totalPrice.toFixed(2)} บาท
          </div>

          <button type="submit" disabled={submitting}>
            {submitting ? 'กำลังบันทึก...' : 'ขาย'}
          </button>
        </form>
      )}
    </div>
  );
}
