import React, { useState } from 'react';
import './LazyVideo.css';

function LazyVideo({ 
    src, 
    className = '', 
    fallback = '🍽️',
    onError,
    ...props 
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoadedData = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const handleError = (e) => {
        setIsLoading(false);
        setHasError(true);
        if (onError) onError(e);
    };

    if (hasError) {
        return (
            <div className={`lazy-video-placeholder ${className}`}>
                <div className="placeholder-content">
                    <span className="placeholder-icon">{fallback}</span>
                    <p>Video not available</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {isLoading && (
                <div className={`lazy-video-skeleton ${className}`}></div>
            )}
            <video
                src={src}
                className={`lazy-video ${className} ${isLoading ? 'loading' : ''}`}
                onLoadedData={handleLoadedData}
                onError={handleError}
                {...props}
            />
        </>
    );
}

export default LazyVideo;
