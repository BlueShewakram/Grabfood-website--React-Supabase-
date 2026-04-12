import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Star, Clock, MapPin } from 'lucide-react';
import { supabase } from '../supabaseClient';

const CUISINES = ['All', 'American', 'Japanese', 'Italian', 'Chinese', 'Mexican', 'Thai', 'Korean', 'Mediterranean'];

export default function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data, error: fetchError } = await supabase
        .from('restaurants')
        .select('*');

      if (fetchError) {
        setError('Could not connect to database. Please try again later!');
        setLoading(false);
        return;
      }
      setRestaurants(data);
      setLoading(false);
    };
    fetchRestaurants();
  }, []);

  const filtered = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) ||
                          r.cuisine_type.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = activeFilter === 'All' || r.cuisine_type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return (
    <div className="hero">
      <div style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)' }}>Loading restaurants...</div>
    </div>
  );

  if (error) return (
    <div className="hero">
      <div style={{ color: 'var(--color-error)', fontSize: '1.1rem' }}>{error}</div>
    </div>
  );

  return (
    <div>
      {/* Hero */}
      <div className="hero">
        <h1>What are you <span>craving</span> today?</h1>
        <p>Discover the best food & drinks near you. Order in just a few taps.</p>

        <div className="search-bar">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search restaurants or cuisines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-row">
          {CUISINES.map(c => (
            <button
              key={c}
              className={`chip ${activeFilter === c ? 'active' : ''}`}
              onClick={() => setActiveFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Restaurant Grid */}
      {filtered.length === 0 ? (
        <div className="text-center" style={{ padding: '40px 0', color: 'var(--color-text-muted)' }}>
          No restaurants found. Try a different search term.
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map(rest => (
            <Link to={`/restaurant/${rest.id}`} key={rest.id} className="restaurant-card">
              <div className="restaurant-img-wrapper">
                <img
                  src={rest.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'}
                  alt={rest.name}
                  className="restaurant-img"
                />
              </div>
              <div className="restaurant-info">
                <span className="badge badge-cuisine">{rest.cuisine_type}</span>
                <h3>{rest.name}</h3>
                <div className="restaurant-meta">
                  {rest.rating && (
                    <span className="badge badge-rating">
                      <Star size={13} fill="currentColor" /> {rest.rating}
                    </span>
                  )}
                  {rest.delivery_time && (
                    <span className="badge-time flex items-center gap-2">
                      <Clock size={13} /> {rest.delivery_time}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-2" style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                  <MapPin size={13} /> {rest.street_address}, {rest.city}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
