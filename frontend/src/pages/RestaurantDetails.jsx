import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, ArrowLeft, Plus, Minus, Star, Clock, MapPin } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function RestaurantDetails({ cart, addToCart, updateQuantity }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch restaurant info
      const { data: restData, error: restError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();

      if (restError) {
        console.error(restError);
        setLoading(false);
        return;
      }
      setRestaurant(restData);

      // Fetch menu items for this restaurant (NORMALIZED - separate table!)
      const { data: menuData, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', id);

      if (!menuError) {
        setMenuItems(menuData);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="hero"><p className="text-muted">Loading menu...</p></div>;
  if (!restaurant) return <div className="hero"><p className="text-muted">Restaurant not found</p></div>;

  const handleAdd = (item) => {
    addToCart({ itemID: item.id, name: item.name, price: item.price }, restaurant.id, restaurant.name);
  };

  const getCartItem = (itemId) => cart.find(i => i.itemID === itemId);
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div>
      <div className="page-header">
        <Link to="/" className="back-link">
          <ArrowLeft size={18} /> Back to restaurants
        </Link>
        <h1>{restaurant.name}</h1>
        <div className="flex items-center gap-3 mt-2">
          <span className="badge badge-cuisine">{restaurant.cuisine_type}</span>
          {restaurant.rating && (
            <span className="badge badge-rating"><Star size={13} fill="currentColor" /> {restaurant.rating}</span>
          )}
          {restaurant.delivery_time && (
            <span className="text-secondary flex items-center gap-2" style={{ fontSize: '0.88rem' }}>
              <Clock size={14} /> {restaurant.delivery_time}
            </span>
          )}
          <span className="text-muted flex items-center gap-2" style={{ fontSize: '0.85rem' }}>
            <MapPin size={14} /> {restaurant.street_address}, {restaurant.city}
          </span>
        </div>
      </div>

      <div className="menu-container">
        {/* Menu Items - fetched from separate normalized table */}
        <div>
          <h2 className="mb-4">Menu</h2>
          {menuItems.map(item => {
            const inCart = getCartItem(item.id);
            return (
              <div key={item.id} className="menu-item">
                <div className="menu-item-info">
                  <h3>{item.name}</h3>
                  <p className="text-muted" style={{ fontSize: '0.85rem', margin: '4px 0', maxWidth: '400px' }}>
                    {item.description}
                  </p>
                  <div className="menu-item-price">${Number(item.price).toFixed(2)}</div>
                </div>
                <div>
                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <button className="btn-icon" onClick={() => updateQuantity(item.id, -1)} style={{ width: '34px', height: '34px' }}>
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>{inCart.quantity}</span>
                      <button className="btn-icon" onClick={() => updateQuantity(item.id, 1)} style={{ width: '34px', height: '34px', borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button className="btn btn-outline btn-sm" onClick={() => handleAdd(item)}>
                      <Plus size={14} /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart Panel */}
        <div>
          <div className="cart-panel">
            <h3>
              <ShoppingCart size={18} /> Your Order
            </h3>

            {cart.length === 0 ? (
              <p className="text-muted mt-4" style={{ fontSize: '0.88rem' }}>
                Your cart is empty. Add items from the menu!
              </p>
            ) : (
              <>
                <div style={{ marginTop: '16px' }}>
                  {cart.map((item, idx) => (
                    <div key={idx} className="cart-item">
                      <div className="cart-item-name">
                        <span className="cart-qty">{item.quantity}x</span>
                        {item.name}
                      </div>
                      <div style={{ fontWeight: 600 }}>${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px solid var(--color-border)', fontWeight: 700, fontSize: '1.1rem' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--color-primary)' }}>${cartTotal.toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-primary mt-4"
                  style={{ width: '100%' }}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
