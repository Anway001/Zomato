import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api';
import BottomNav from './BottomNav';
import './Home.css';

function truncateText(text) {
    const maxLength = 90;
    return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

function getVideoKey(item, index) {
    return item._id ? String(item._id) : `saved-${index}`;
}

function Saved() {
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
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/api/food/saves`, { withCredentials: true })
            .then((response) => {
                const list = response.data?.foodItems || [];
                setVideos(list);
                setActiveIndex(0);
                setError(null);
            })
            .catch((err) => {
                console.error('Failed to fetch saved items:', err.response?.data || err.message);
                setVideos([]);
                setActiveIndex(0);
                setError(err.response?.data?.message || 'Failed to load saved reels');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

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
        setLikes((previous) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = previous[key] !== undefined ? previous[key] : Boolean(item.isLiked);
            });
            return next;
        });
        setLikeCounts(() => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = typeof item.likeCount === 'number' ? item.likeCount : 0;
            });
            return next;
        });
        setSaveCounts(() => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = typeof item.saveCount === 'number' ? item.saveCount : 0;
            });
            return next;
        });
        setSaves((previous) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = previous[key] !== undefined ? previous[key] : Boolean(item.isSaved);
            });
            return next;
        });
        setComments((previous) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = previous[key] ?? [];
            });
            return next;
        });
        setCommentInputs((previous) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = previous[key] ?? '';
            });
            return next;
        });
        setVisibleComments((previous) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = previous[key] ?? false;
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
        setCommentLoading((previous) => {
            const next = {};
            videos.forEach((item, index) => {
                const key = getVideoKey(item, index);
                next[key] = previous[key] ?? false;
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
        setCommentLoading((previous) => ({ ...previous, [key]: true }));
        try {
            const response = await axios.get(`${API_BASE_URL}/api/food/${itemId}/comments`, { withCredentials: true });
            const list = Array.isArray(response.data?.comments) ? response.data.comments : [];
            setComments((previous) => ({ ...previous, [key]: list }));
            setCommentCounts((previous) => ({ ...previous, [key]: list.length }));
        } catch (error) {
            console.error('Failed to load comments:', error.response?.data || error.message);
        } finally {
            setCommentLoading((previous) => ({ ...previous, [key]: false }));
        }
    };

    const toggleComments = (item, key) => {
        if (!visibleComments[key]) {
            fetchComments(item, key);
        }
        setVisibleComments((previous) => ({ ...previous, [key]: !previous[key] }));
    };

    const handleCommentChange = (key, value) => {
        setCommentInputs((previous) => ({ ...previous, [key]: value }));
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
            setComments((previous) => {
                const list = previous[key] ? [...previous[key]] : [];
                if (created) {
                    list.push(created);
                } else {
                    list.push({ content: value });
                }
                return { ...previous, [key]: list };
            });
            if (count !== null) {
                setCommentCounts((previous) => ({ ...previous, [key]: count }));
            } else {
                setCommentCounts((previous) => {
                    const current = previous[key] ?? 0;
                    return { ...previous, [key]: current + 1 };
                });
            }
            setCommentInputs((previous) => ({ ...previous, [key]: '' }));
        } catch (error) {
            console.error('Failed to add comment:', error.response?.data || error.message);
        }
    };

    const handleLike = async (item, key) => {
        const itemId = item._id || item.id;
        if (!itemId) {
            return;
        }
        try {
            await axios.post(`${API_BASE_URL}/api/food/likes`, { foodId: itemId }, { withCredentials: true });
            setLikes((previous) => {
                const nextLiked = !previous[key];
                setLikeCounts((counts) => {
                    const current = counts[key] ?? 0;
                    const nextCount = nextLiked ? current + 1 : Math.max(current - 1, 0);
                    return { ...counts, [key]: nextCount };
                });
                return { ...previous, [key]: nextLiked };
            });
        } catch (error) {
            console.error('Failed to toggle like:', error.response?.data || error.message);
        }
    };

    const handleSave = async (item, key) => {
        const itemId = item._id || item.id;
        if (!itemId) {
            return;
        }
        const wasSaved = Boolean(saves[key]);
        try {
            await axios.post(`${API_BASE_URL}/api/food/saves`, { foodId: itemId }, { withCredentials: true });
            setSaves((previous) => {
                const isSaved = !previous[key];
                setSaveCounts((counts) => {
                    const current = counts[key] ?? 0;
                    const updated = isSaved ? current + 1 : Math.max(current - 1, 0);
                    return { ...counts, [key]: updated };
                });
                return { ...previous, [key]: isSaved };
            });
            if (wasSaved) {
                setVideos((currentVideos) => {
                    const filtered = currentVideos.filter((video) => (video._id || video.id) !== itemId);
                    if (!filtered.length) {
                        setActiveIndex(0);
                    } else if (activeIndex >= filtered.length) {
                        setActiveIndex(filtered.length - 1);
                    }
                    return filtered;
                });
            }
        } catch (error) {
            console.error('Failed to toggle save:', error.response?.data || error.message);
        }
    };

    const handleShare = (item) => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            navigator.share({ title: item.name, url: window.location.href }).catch(() => {});
        }
    };

    const hasReels = !loading && !error && videos.length;

    return (
        <>
            {hasReels ? (
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
                                    muted
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
            ) : (
                <div style={{ color: '#fff', textAlign: 'center', padding: '80px 16px' }}>
                    {loading ? 'Loading saved reels…' : error || "You haven't saved any reels yet."}
                </div>
            )}
            <BottomNav theme="dark" />
        </>
    );
}

export default Saved;
