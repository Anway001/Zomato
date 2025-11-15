import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import '../styles/theme.css'
import './Profile.css'
import axios from 'axios';

function Profile() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [followError, setFollowError] = useState(null);
  const [fullscreenVideo, setFullscreenVideo] = useState(-1);
  const reelsContainerRef = useRef(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!id) {
        setError('Food partner not specified');
        setProfile(null);
        setVideos([]);
        setFollowersCount(0);
        setIsFollowing(false);
        setFollowError(null);
        setIsOwnProfile(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const response = await axios.get(`http://localhost:8080/api/foodpartner/${id}`, {
          withCredentials: true
        });

        console.log('Profile data:', response.data);

        setProfile(response.data.partner ?? null);
        const foodItems = response.data.partner?.foodItems || [];
        const followerValue = Number(response.data.partner?.followersCount ?? 0);
        setVideos(foodItems);
        setFollowersCount(Number.isNaN(followerValue) ? 0 : followerValue);
        setIsFollowing(response.data.isFollowing ?? false);
        setFollowError(null);
        setError(null);

        // Check if this is the current user's own profile (only if they're a food partner)
        try {
          const currentUserResponse = await axios.get('http://localhost:8080/api/auth/me', {
            withCredentials: true
          });
          setIsOwnProfile(currentUserResponse.data?.type === 'foodpartner' && currentUserResponse.data?.partner?._id === id);
        } catch (error) {
          setIsOwnProfile(false);
        }

        setLoading(false);
      } catch (err) {
        console.error('Profile fetch failed:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to fetch profile');
        setProfile(null);
        setVideos([]);
        setFollowersCount(0);
        setIsFollowing(false);
        setFollowError(err.response?.data?.message || null);
        setIsOwnProfile(false);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  useEffect(() => {
    if (fullscreenVideo >= 0 && reelsContainerRef.current) {
      const scrollPosition = fullscreenVideo * window.innerHeight;
      setTimeout(() => {
        reelsContainerRef.current.scrollTop = scrollPosition;
      }, 0);
    }
  }, [fullscreenVideo]);

  const handleFollowToggle = () => {
    if (!id || followLoading) {
      return;
    }
    setFollowLoading(true);
    axios.post(`http://localhost:8080/api/follow/${id}`, {}, { withCredentials: true })
    .then(response => {
      setIsFollowing(response.data?.isFollowing ?? false);
      setFollowersCount(prev => {
        const nextValue = Number(response.data?.followersCount);
        if (Number.isNaN(nextValue)) {
          return prev;
        }
        return nextValue;
      });
      setFollowError(null);
    })
    .catch(err => {
      setFollowError(err.response?.data?.message || 'Unable to update follow status');
    })
    .finally(() => {
      setFollowLoading(false);
    });
  };

  const businessName = profile?.name || 'Business name';
  const address = profile?.address || 'Address';
  const totalMeals = profile?.totalMeals ?? 0;
  const customers = profile?.customersServed ?? 0;
  const followerTotal = Number.isFinite(followersCount) ? followersCount : 0;
  const followerLabel = followerTotal === 1 ? 'follower' : 'followers';

  const getUniqueCuisines = () => {
    if (!videos || videos.length === 0) return [];
    const cuisines = new Set();
    videos.forEach(item => {
      if (item.category) cuisines.add(item.category);
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => cuisines.add(tag));
      }
    });
    return Array.from(cuisines).slice(0, 3);
  };

  const getAverageLikes = () => {
    if (!videos || videos.length === 0) return 0;
    const totalLikes = videos.reduce((sum, item) => sum + (item.likeCount || 0), 0);
    return Math.round(totalLikes / videos.length);
  };

  const getPriceRange = () => {
    if (!videos || videos.length === 0) return 'N/A';
    const prices = videos.map(item => item.price || 0).filter(p => p > 0);
    if (prices.length === 0) return 'N/A';
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) return `₹${minPrice}`;
    return `₹${minPrice} - ₹${maxPrice}`;
  };

  const cuisines = getUniqueCuisines();
  const avgLikes = getAverageLikes();
  const priceRange = getPriceRange();



  return (
    <>
      {fullscreenVideo >= 0 && (
        <div className="reels-fullscreen">
          <button className="reels-close-btn" onClick={() => setFullscreenVideo(-1)}>✕</button>
          <div className="reels-container" ref={reelsContainerRef}>
            {videos.map((video, i) => (
              <div key={video._id || video.id || i} className="reel">
                <video
                  className="reel-video"
                  src={video.video}
                  controls={false}
                  autoPlay={i === fullscreenVideo}
                  loop
                  muted
                  playsInline
                />
              </div>
            ))}
          </div>
          <div className="reels-counter">{fullscreenVideo + 1} / {videos.length}</div>
        </div>
      )}
      <div className="profile-container">
        {error && (
          <div className="error-message" style={{ color: 'red', padding: '10px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <div className="profile-card">
        <div className="profile-left">
          <div className="profile-image" aria-hidden>
            <div className="profile-image-placeholder">
              {businessName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="profile-right">
          {/* Top chips: name & address - removed forced inline alignment so CSS controls it */}
          <div className="top-chips">
            <div className="chip-stack">
              <div className="business-name">{businessName}</div>
              <div style={{ height: 8 }} />
              <div className="business-address">{address}</div>
            </div>
          </div>

          <div className="info-badges">
            {cuisines.length > 0 && (
              <div className="badge">
                <span className="badge-label">Type</span>
                <span className="badge-value">{cuisines.join(', ')}</span>
              </div>
            )}
            {priceRange !== 'N/A' && (
              <div className="badge">
                <span className="badge-label">Price</span>
                <span className="badge-value">{priceRange}</span>
              </div>
            )}
            {avgLikes > 0 && (
              <div className="badge">
                <span className="badge-label">Avg Likes</span>
                <span className="badge-value">❤️ {avgLikes}</span>
              </div>
            )}
          </div>

          <div className="follow-actions">
            {isOwnProfile ? (
              <Link to="/partner/dashboard" className="dashboard-button">
                Manage Dashboard
              </Link>
            ) : (
              <button
                type="button"
                className={`follow-button${isFollowing ? ' following' : ''}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? 'Please wait...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            <span className="followers-count">{followerTotal} {followerLabel}</span>
          </div>
          {followError && (
            <div className="follow-error">{followError}</div>
          )}

          {/* Stats */}
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-value">{totalMeals}</div>
              <div className="stat-label">total meals</div>
            </div>

            <div className="stat-box">
              <div className="stat-value">{customers}</div>
              <div className="stat-label">customers served</div>
            </div>

            <div className="stat-box">
              <div className="stat-value">{followerTotal}</div>
              <div className="stat-label">{followerLabel}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div className="videos-section">
        <h3 className="section-title">VIDEOS</h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b6b6b' }}>Loading videos…</div>
        ) : videos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 20, color: '#6b6b6b' }}>
            No videos yet. Add food videos from your dashboard to show up here.
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video, i) => {
              // often video objects have an _id or id field — use it if present, otherwise fallback to index
              const key = video._id || video.id || i;
              const views = video.views ?? video.viewCount ?? null;

              return (
                <div 
                  key={key} 
                  className="video-box"
                  onClick={() => setFullscreenVideo(i)}
                  role="button"
                  tabIndex={0}
                >
                  <video
                    src={video.video}
                    controls={false}
                    style={{
                      width: '100%',
                      height: '200%',
                      objectFit: 'cover',
                      borderRadius: '12px'
                    }}
                    poster={video?.thumbnail || video?.image || video?.coverImage}
                  />
                  {views !== null && views !== undefined && (
                    <div className="views-count">{String(views)} views</div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

export default Profile;
