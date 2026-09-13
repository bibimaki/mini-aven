'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function SellPage() {
  // รายการสินค้าทั้งหมด
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // สินค้าที่เลือก
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('');

  // ข้อความแจ้งเตือน
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // โหลดสินค้าเมื่อเปิดหน้า
  useEffect(() => {
    fetchProducts();
  }, []);

  // ดึงสินค้าจาก Supabase
  async function fetchProducts() {
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      setErrorMsg('โหลดรายการสินค้าไม่สำเร็จ: ' + error.message);
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  }

  // หาสินค้าที่เลือก
  const selectedProduct = products.find(
    (product) => product.id === selectedProductId
  );

  // แปลงจำนวนเป็นตัวเลข
  const quantityNumber = parseInt(quantity, 10) || 0;

  // คำนวณยอดรวม
  const totalPrice = selectedProduct
    ? Number(selectedProduct.price) * quantityNumber
    : 0;

  // รีเซ็ตฟอร์ม
  function resetForm() {
    setSelectedProductId('');
    setQuantity('');
  }

  // กดปุ่มขาย
  async function handleSell(e) {
    e.preventDefault();

    setErrorMsg('');
    setSuccessMsg('');

    // ตรวจสอบการเลือกสินค้า
    if (!selectedProduct) {
      setErrorMsg('กรุณาเลือกสินค้า');
      return;
    }

    // ตรวจสอบจำนวน
    if (!quantityNumber || quantityNumber <= 0) {
      setErrorMsg('กรุณากรอกจำนวนที่ต้องการขายให้ถูกต้อง');
      return;
    }

    // ตรวจสอบ Stock
    if (quantityNumber > selectedProduct.stock) {
      setErrorMsg(
        `สินค้าคงเหลือไม่พอ (คงเหลือ ${selectedProduct.stock} ${selectedProduct.unit || ''})`
      );
      return;
    }

    setSubmitting(true);

    // ส่งคำสั่งไปยัง Supabase RPC
    // ระบบจะตรวจ Stock + หัก Stock + บันทึก sales
    // ภายในคำสั่งเดียว
    const { data, error } = await supabase.rpc('create_pos_sale', {
      p_product_id: selectedProduct.id,
      p_quantity: quantityNumber,
    });

    // ถ้าเกิด Error
    if (error) {
      setErrorMsg('ขายสินค้าไม่สำเร็จ: ' + error.message);
      setSubmitting(false);
      return;
    }

    // รองรับกรณี Supabase คืนค่ามาเป็น array
    const sale = Array.isArray(data) ? data[0] : data;

    const finalTotal = sale?.total_price ?? totalPrice;

    // แสดงข้อความสำเร็จ
    setSuccessMsg(
      `ขาย ${selectedProduct.name} จำนวน ${quantityNumber} ${
        selectedProduct.unit || ''
      } สำเร็จ ยอดรวม ${Number(finalTotal).toFixed(2)} บาท`
    );

    // ล้างฟอร์ม
    resetForm();

    // โหลด Stock ใหม่
    await fetchProducts();

    setSubmitting(false);
  }

  return (
    <div>
      <h1>ขายสินค้า</h1>

      {/* ข้อความ Error */}
      {errorMsg && (
        <p
          style={{
            color: '#dc2626',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          {errorMsg}
        </p>
      )}

      {/* ข้อความสำเร็จ */}
      {successMsg && (
        <p
          style={{
            color: '#16a34a',
            fontWeight: 600,
            marginBottom: '16px',
          }}
        >
          {successMsg}
        </p>
      )}

      {loading ? (
        <p>กำลังโหลดรายการสินค้า...</p>
      ) : (
        <form onSubmit={handleSell}>
          {/* เลือกสินค้า */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="product"
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              สินค้า
            </label>

            <select
              id="product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
              }}
            >
              <option value="">-- เลือกสินค้า --</option>

              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} - {Number(product.price).toFixed(2)} บาท
                  {' '} (คงเหลือ {product.stock} {product.unit || ''})
                </option>
              ))}
            </select>
          </div>

          {/* จำนวน */}
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="quantity"
              style={{
                display: 'block',
                fontWeight: 600,
                marginBottom: '6px',
              }}
            >
              จำนวน
            </label>

            <input
              id="quantity"
              type="number"
              min="1"
              max={selectedProduct?.stock || undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="จำนวนที่ต้องการขาย"
              required
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid #ccc',
              }}
            />
          </div>

          {/* รายละเอียดสินค้า */}
          {selectedProduct && (
            <div
              style={{
                padding: '16px',
                marginBottom: '16px',
                background: '#f5f5f5',
                borderRadius: '10px',
              }}
            >
              <p>
                <strong>สินค้า:</strong> {selectedProduct.name}
              </p>

              <p>
                <strong>ราคา:</strong>{' '}
                {Number(selectedProduct.price).toFixed(2)} บาท
              </p>

              <p>
                <strong>คงเหลือ:</strong> {selectedProduct.stock}{' '}
                {selectedProduct.unit || ''}
              </p>
            </div>
          )}

          {/* ยอดรวม */}
          <div
            style={{
              fontWeight: 700,
              fontSize: '1.2rem',
              marginBottom: '16px',
            }}
          >
            ยอดรวม: {totalPrice.toFixed(2)} บาท
          </div>

          {/* ปุ่มขาย */}
          <button
            type="submit"
            disabled={submitting || !selectedProduct}
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {submitting ? 'กำลังบันทึก...' : 'ขายสินค้า'}
          </button>
        </form>
      )}
    </div>
  );
}
