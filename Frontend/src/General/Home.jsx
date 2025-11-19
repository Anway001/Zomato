import React, { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../CartContext';
import { API_BASE_URL } from '../api';
import BottomNav from './BottomNav';
import './Home.css';

function truncateText(text) {
    const maxLength = 90;
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function Home() {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const containerRef = useRef(null);
    const videoRefs = useRef([]);
    const activeIndexRef = useRef(0);
    const targetIndexRef = useRef(null);
    const scrollTimeoutRef = useRef(null);
    const isAnimatingRef = useRef(false);
    const [videos, setVideos] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [likes, setLikes] = useState({});
    const [likeCounts, setLikeCounts] = useState({});
    const [saves, setSaves] = useState({});
    const [saveCounts, setSaveCounts] = useState({});
    const [comments, setComments] = useState({});
    const [commentInputs, setCommentInputs] = useState({});
    const [visibleComments, setVisibleComments] = useState({});
    const [commentCounts, setCommentCounts] = useState({});
    const [commentLoading, setCommentLoading] = useState({});

    const getVideoKey = (item, index) => (item._id ? String(item._id) : `video-${index}`);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/food`, { withCredentials: true })
            .then((response) => {
                if (!response.data?.isAuthenticated) {
                    navigate('/user/login', { replace: true });
                    return;
                }
                if (response.data?.foodItems) {
                    setVideos(response.data.foodItems);
                    setActiveIndex(0);
                }
            })
            .catch((err) => {
                if (err.response?.status === 401) {
                    navigate('/user/login', { replace: true });
                    return;
                }
            });
    }, [navigate]);

    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, videos.length);
    }, [videos.length]);

    useEffect(() => {
        if (!videos.length) {
            setLikes({});
            setLikeCounts({});
            setSaves({});
            setSaveCounts({});
            setComments({});
            setCommentInputs({});
            setVisibleComments({});
            setCommentCounts({});
            setCommentLoading({});
            return;
        }
        setLikes((prev) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                const initialLiked = Boolean(
                    item.isLiked ||
                    item.userLiked ||
                    item.liked ||
                    item.hasLiked ||
                    item.likedByUser
                );
                next[key] = prev[key] !== undefined ? prev[key] : initialLiked;
            });
            return next;
        });
        setLikeCounts(() => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                const count = typeof item.likeCount === 'number' ? item.likeCount : 0;
                next[key] = count;
            });
            return next;
        });
        setSaveCounts(() => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                const count = typeof item.saveCount === 'number' ? item.saveCount : 0;
                next[key] = count;
            });
            return next;
        });
        setSaves((prev) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                const initialSaved = Boolean(
                    item.isSaved ||
                    item.userSaved ||
                    item.saved ||
                    item.hasSaved ||
                    item.savedByUser
                );
                next[key] = prev[key] !== undefined ? prev[key] : initialSaved;
            });
            return next;
        });
        setComments((prev) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = prev[key] ?? [];
            });
            return next;
        });
        setCommentInputs((prev) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = prev[key] ?? '';
            });
            return next;
        });
        setVisibleComments((prev) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = prev[key] ?? false;
            });
            return next;
        });
        setCommentCounts(() => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                const count = typeof item.commentCount === 'number' ? item.commentCount : 0;
                next[key] = count;
            });
            return next;
        });
        setCommentLoading((prev) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = prev[key] ?? false;
            });
            return next;
        });
    }, [videos]);

    useEffect(() => {
        activeIndexRef.current = activeIndex;
    }, [activeIndex]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return;
        }

        const handleWheel = (event) => {
            if (!videos.length) {
                return;
            }
            event.preventDefault();
            if (isAnimatingRef.current) {
                return;
            }
            const direction = event.deltaY > 0 ? 1 : -1;
            const nextIndex = Math.min(Math.max(activeIndexRef.current + direction, 0), videos.length - 1);
            if (nextIndex === activeIndexRef.current) {
                return;
            }
            isAnimatingRef.current = true;
            targetIndexRef.current = nextIndex;
            container.scrollTo({
                top: nextIndex * container.clientHeight,
                behavior: 'smooth'
            });
            setActiveIndex(nextIndex);
        };

        const handleScroll = () => {
            if (!videos.length) {
                return;
            }
            const { scrollTop, clientHeight } = container;
            const index = Math.round(scrollTop / clientHeight);
            if (!isAnimatingRef.current && index !== activeIndexRef.current) {
                setActiveIndex(index);
            }
            if (targetIndexRef.current !== null) {
                const expected = targetIndexRef.current * clientHeight;
                if (Math.abs(scrollTop - expected) < 1) {
                    isAnimatingRef.current = false;
                    targetIndexRef.current = null;
                }
            }
            if (scrollTimeoutRef.current) {
                window.clearTimeout(scrollTimeoutRef.current);
            }
            scrollTimeoutRef.current = window.setTimeout(() => {
                if (!videos.length) {
                    return;
                }
                const finalIndex = Math.round(container.scrollTop / container.clientHeight);
                if (finalIndex !== activeIndexRef.current) {
                    setActiveIndex(finalIndex);
                }
                targetIndexRef.current = finalIndex;
                container.scrollTo({
                    top: finalIndex * container.clientHeight,
                    behavior: 'smooth'
                });
                window.setTimeout(() => {
                    isAnimatingRef.current = false;
                    targetIndexRef.current = null;
                }, 250);
            }, 120);
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('scroll', handleScroll);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                window.clearTimeout(scrollTimeoutRef.current);
                scrollTimeoutRef.current = null;
            }
            targetIndexRef.current = null;
            isAnimatingRef.current = false;
        };
    }, [videos.length]);

    useEffect(() => {
        if (!videos.length) {
            return;
        }
        videoRefs.current.forEach((video, index) => {
            if (!video) {
                return;
            }
            if (index === activeIndex) {
                const playPromise = video.play();
                if (playPromise && typeof playPromise.catch === 'function') {
                    playPromise.catch(() => {});
                }
            } else {
                video.pause();
                video.currentTime = 0;
            }
        });
    }, [activeIndex, videos.length]);

    const fetchComments = async (item, key) => {
        const itemId = item._id || item.id;
        if (!itemId) {
            return;
        }
        setCommentLoading((prev) => ({ ...prev, [key]: true }));
        try {
            const response = await axios.get(`${API_BASE_URL}/api/food/${itemId}/comments`, { withCredentials: true });
            const list = Array.isArray(response.data?.comments) ? response.data.comments : [];
            setComments((prev) => ({ ...prev, [key]: list }));
            setCommentCounts((prev) => ({ ...prev, [key]: list.length }));
        } catch (error) {
        } finally {
            setCommentLoading((prev) => ({ ...prev, [key]: false }));
        }
    };

    const toggleComments = (item, key) => {
        if (!visibleComments[key]) {
            fetchComments(item, key);
        }
        setVisibleComments((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCommentChange = (key, value) => {
        setCommentInputs((prev) => ({ ...prev, [key]: value }));
    };

    const handleLike = async (item, key) => {
        const itemId = item._id || item.id;
        if (!itemId) {
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/food/likes`, { foodId: itemId }, { withCredentials: true });
            setLikes((prev) => {
                const nextLiked = !prev[key];
                setLikeCounts((prevCounts) => {
                    const current = prevCounts[key] ?? 0;
                    const nextCount = nextLiked ? current + 1 : Math.max(current - 1, 0);
                    return { ...prevCounts, [key]: nextCount };
                });
                return { ...prev, [key]: nextLiked };
            });
        } catch (error) {
        }
    };

    const handleSave = async (item, key) => {
        const itemId = item._id || item.id;
        if (!itemId) {
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/food/saves`, { foodId: itemId }, { withCredentials: true });
            setSaves((prev) => {
                const isSaved = !prev[key];
                setSaveCounts((counts) => {
                    const current = counts[key] ?? 0;
                    const updated = isSaved ? current + 1 : Math.max(current - 1, 0);
                    return { ...counts, [key]: updated };
                });
                return { ...prev, [key]: isSaved };
            });
        } catch (error) {
        }
    };

    const handleShare = (item) => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ title: item.name, url: window.location.href }).catch(() => {});
        }
    };

    const submitComment = async (event, item, key) => {
        event.preventDefault();
        const value = (commentInputs[key] || '').trim();
        if (!value) {
            return;
        }
        const itemId = item._id || item.id;
        if (!itemId) {
            return;
        }
        try {
            const response = await axios.post(`${API_BASE_URL}/api/food/${itemId}/comments`, { content: value }, { withCredentials: true });
            const created = response.data?.comment;
            const count = typeof response.data?.count === 'number' ? response.data.count : null;
            setComments((prev) => {
                const list = prev[key] ? [...prev[key]] : [];
                if (created) {
                    list.push(created);
                } else {
                    list.push({ content: value });
                }
                return { ...prev, [key]: list };
            });
            if (count !== null) {
                setCommentCounts((prev) => ({ ...prev, [key]: count }));
            } else {
                setCommentCounts((prev) => {
                    const current = prev[key] ?? 0;
                    return { ...prev, [key]: current + 1 };
                });
            }
            setCommentInputs((prev) => ({ ...prev, [key]: '' }));
        } catch (error) {
        }
    };

    return (
        <>
            <div className="reels-container" ref={containerRef}>
                {videos.map((item, index) => {
                    const key = getVideoKey(item, index);
                    const isLiked = !!likes[key];
                    const likeCount = likeCounts[key] ?? (typeof item.likeCount === 'number' ? item.likeCount : 0);
                    const isSaved = !!saves[key];
                    const saveCount = saveCounts[key] ?? (typeof item.saveCount === 'number' ? item.saveCount : 0);
                    const commentList = Array.isArray(comments[key]) ? comments[key] : [];
                    const showComments = !!visibleComments[key];
                    const commentCount = commentCounts[key] ?? (typeof item.commentCount === 'number' ? item.commentCount : commentList.length);
                    const isLoadingComments = !!commentLoading[key];

                    return (
                        <div className="reel" key={key}>
                            <video
                                ref={(element) => {
                                    videoRefs.current[index] = element;
                                }}
                                className="reel-video"
                                src={item.video}
                                controls={false}
                                loop
                            />
                            <div className="reel-overlay">
                                <div className="overlay-content">
                                    <div className="reel-description">
                                        {truncateText(item.name)}
                                    </div>
                                    {showComments && (
                                        <div className="comment-panel">
                                            <div className="comment-list">
                                                {isLoadingComments ? (
                                                    <div className="comment-empty">Loading comments...</div>
                                                ) : commentList.length ? (
                                                    commentList.map((entry, commentIndex) => {
                                                        const author = entry && typeof entry === 'object' && entry !== null && entry.user && entry.user.fullname ? `${entry.user.fullname}: ` : '';
                                                        const content = entry && typeof entry === 'object' && entry !== null ? entry.content : entry;
                                                        return (
                                                            <div key={`comment-${key}-${commentIndex}`} className="comment-item">
                                                                {author}{content || ''}
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <div className="comment-empty">No comments yet.</div>
                                                )}
                                            </div>
                                            <form className="comment-form" onSubmit={(event) => submitComment(event, item, key)}>
                                                <input
                                                    value={commentInputs[key] || ''}
                                                    onChange={(event) => handleCommentChange(key, event.target.value)}
                                                    placeholder="Add a comment"
                                                    autoComplete="off"
                                                />
                                                <button type="submit">Post</button>
                                            </form>
                                        </div>
                                    )}
                                    <Link to={`/partner/${item.foodpartner}`} className="reel-button">Visit Store !!</Link>
                                </div>
                                <div className="interaction-stack">
                                    <button
                                        type="button"
                                        className={`glass-button${isLiked ? ' active' : ''}`}
                                        onClick={() => handleLike(item, key)}
                                    >
                                        <span className="glass-icon">{isLiked ? '♥' : '♡'}</span>
                                        <span className="glass-label">{isLiked ? 'Liked' : 'Like'} ({likeCount})</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`glass-button${showComments ? ' active' : ''}`}
                                        onClick={() => toggleComments(item, key)}
                                    >
                                        <span className="glass-icon">💬</span>
                                        <span className="glass-label">{commentCount > 0 ? commentCount : 'Comment'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        className={`glass-button${isSaved ? ' active' : ''}`}
                                        onClick={() => handleSave(item, key)}
                                    >
                                        <span className="glass-icon">🔖</span>
                                        <span className="glass-label">{isSaved ? 'Saved' : 'Save'} ({saveCount})</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="glass-button"
                                        onClick={() => addToCart(item)}
                                    >
                                        <span className="glass-icon">🛒</span>
                                        <span className="glass-label">Add to Cart</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="glass-button"
                                        onClick={() => handleShare(item)}
                                    >
                                        <span className="glass-icon">⤴</span>
                                        <span className="glass-label">Share</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <BottomNav theme="dark" />
        </>
    );
}

export default Home;
