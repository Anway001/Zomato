import React, { useState } from 'react';
import './LazyImage.css';

function LazyImage({ 
    src, 
    alt = 'Image', 
    className = '', 
    fallback = '🍽️',
    onError,
    ...props 
}) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
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
            <div className={`lazy-image-placeholder ${className}`}>
                <div className="placeholder-content">
                    <span className="placeholder-icon">{fallback}</span>
                    <p>Image not available</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {isLoading && (
                <div className={`lazy-image-skeleton ${className}`}></div>
            )}
            <img
                src={src}
                alt={alt}
                className={`lazy-image ${className} ${isLoading ? 'loading' : ''}`}
                onLoad={handleLoad}
                onError={handleError}
                {...props}
            />
        </>
    );
}

export default LazyImage;
