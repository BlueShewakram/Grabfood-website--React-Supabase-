import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Minus, Plus, Trash2, Banknote, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Checkout({ cart, clearCart, removeFromCart, updateQuantity, user }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle');
  const [orderId, setOrderId] = useState(null);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = 2.99;
  const finalTotal = cartTotal + deliveryFee;

  const handleCheckout = async () => {
    setStatus('placing');

    try {
      // 1. Find an available rider
      const { data: rider } = await supabase
        .from('riders')
        .select('id')
        .eq('status', 'available')
        .limit(1)
        .single();

      // 2. Create the ORDER (normalized - no embedded items/payment/delivery)
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          restaurant_id: cart[0].restaurantID,
          rider_id: rider?.id || null,
          total_price: finalTotal,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 3. Create ORDER ITEMS (normalized - separate table!)
      const orderItems = cart.map(i => ({
        order_id: order.id,
        menu_item_id: i.itemID,
        name: i.name,
        quantity: i.quantity,
        price: i.price
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // 4. Create PAYMENT record (normalized - separate table!)
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          payment_method: 'COD',
          payment_status: 'pending',
          amount: finalTotal
        });

      if (paymentError) throw paymentError;

      // 5. Create DELIVERY record (normalized - separate table!)
      const { error: deliveryError } = await supabase
        .from('deliveries')
        .insert({
          order_id: order.id,
          status: 'pending',
          estimated_time: new Date(Date.now() + 30 * 60000).toISOString()
        });

      if (deliveryError) throw deliveryError;

      setOrderId(order.id);
      setStatus('success');
      clearCart();
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Failed to place order. Please try again.");
      setStatus('idle');
    }
  };

  // ── Success Screen ──
  if (status === 'success') {
    return (
      <div className="success-page">
        <CheckCircle2 size={72} className="success-icon" />
        <h1>Order Placed!</h1>
        <p className="text-secondary mt-4" style={{ fontSize: '1.1rem' }}>
          Your order <strong style={{ color: 'var(--color-primary)' }}>#{orderId?.slice(-6).toUpperCase()}</strong> is now being prepared.
        </p>
        <p className="text-muted mt-2">A rider will be assigned shortly. Payment: Cash on Delivery</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/')} style={{ marginTop: '32px' }}>
          Back to Home
        </button>
      </div>
    );
  }

  // ── Empty Cart ──
  if (cart.length === 0) {
    return (
      <div className="success-page">
        <ShoppingBagEmpty />
        <h2 style={{ marginTop: '20px' }}>Your Cart is Empty</h2>
        <p className="text-muted mt-2">Browse restaurants and add some delicious items!</p>
        <button className="btn btn-primary mt-4" onClick={() => navigate('/')} style={{ marginTop: '24px' }}>
          Find Food
        </button>
      </div>
    );
  }

  // ── Checkout Form ──
  return (
    <div style={{ marginTop: '32px', maxWidth: '640px', margin: '32px auto 60px', padding: '0 16px' }}>
      <h1>Checkout</h1>

      {/* Delivery Info */}
      <div className="cart-panel" style={{ marginTop: '24px' }}>
        <h3 className="mb-4">📍 Delivery to</h3>
        <div style={{ padding: '12px 16px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
          <div className="text-muted" style={{ fontSize: '0.88rem', marginTop: '4px' }}>{user.streetAddress}, {user.city}</div>
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>{user.phone}</div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="cart-panel" style={{ marginTop: '16px' }}>
        <h3 className="mb-4">🛒 Order Summary</h3>
        <div className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '12px' }}>
          From: <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{cart[0]?.restaurantName || 'Restaurant'}</span>
        </div>

        {cart.map((item, idx) => (
          <div key={idx} className="cart-item">
            <div className="flex items-center gap-2" style={{ flex: 1 }}>
              <div className="flex items-center gap-2">
                <button className="btn-icon" onClick={() => updateQuantity(item.itemID, -1)} style={{ width: '28px', height: '28px', borderRadius: '8px' }}>
                  <Minus size={12} />
                </button>
                <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>{item.quantity}</span>
                <button className="btn-icon" onClick={() => updateQuantity(item.itemID, 1)} style={{ width: '28px', height: '28px', borderRadius: '8px' }}>
                  <Plus size={12} />
                </button>
              </div>
              <span style={{ marginLeft: '8px' }}>{item.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</span>
              <button onClick={() => removeFromCart(item.itemID)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', padding: '4px' }}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-between mt-4" style={{ fontSize: '0.92rem' }}>
          <span className="text-secondary">Subtotal</span>
          <span>${cartTotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between" style={{ fontSize: '0.92rem', paddingBottom: '16px', borderBottom: '1px solid var(--color-border)' }}>
          <span className="text-secondary">Delivery Fee</span>
          <span>${deliveryFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between" style={{ marginTop: '16px', fontWeight: 800, fontSize: '1.2rem' }}>
          <span>Total</span>
          <span style={{ color: 'var(--color-primary)' }}>${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Options */}
      <div className="cart-panel" style={{ marginTop: '16px' }}>
        <h3 className="mb-4">💳 Payment Method</h3>

        <div className="payment-options">
          {/* COD - active and available */}
          <div className="payment-option active">
            <div className="radio-dot"></div>
            <Banknote size={20} style={{ color: 'var(--color-primary)' }} />
            <div>
              <div style={{ fontWeight: 600 }}>Cash on Delivery (COD)</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Pay when your food arrives</div>
            </div>
          </div>

          {/* Credit Card - unavailable */}
          <div className="payment-option disabled">
            <div className="radio-dot"></div>
            <CreditCard size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>Credit / Debit Card</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Visa, Mastercard, JCB</div>
            </div>
            <span className="unavailable-tag">Coming Soon</span>
          </div>

          {/* GCash - unavailable */}
          <div className="payment-option disabled">
            <div className="radio-dot"></div>
            <Smartphone size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>GCash</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Pay via GCash e-wallet</div>
            </div>
            <span className="unavailable-tag">Coming Soon</span>
          </div>

          {/* GrabPay - unavailable */}
          <div className="payment-option disabled">
            <div className="radio-dot"></div>
            <Wallet size={20} />
            <div>
              <div style={{ fontWeight: 600 }}>GrabPay</div>
              <div className="text-muted" style={{ fontSize: '0.8rem' }}>Pay via GrabPay wallet</div>
            </div>
            <span className="unavailable-tag">Coming Soon</span>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <button
        className="btn btn-primary"
        style={{ width: '100%', marginTop: '24px', padding: '16px 0', fontSize: '1.05rem', marginBottom: '40px' }}
        onClick={handleCheckout}
        disabled={status === 'placing'}
      >
        {status === 'placing' ? 'Placing Order...' : `Place Order • $${finalTotal.toFixed(2)}`}
      </button>
    </div>
  );
}

// Simple empty bag icon component
function ShoppingBagEmpty() {
  return (
    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', border: '1px solid var(--color-border)' }}>
      <span style={{ fontSize: '2rem' }}>🛒</span>
    </div>
  );
}
