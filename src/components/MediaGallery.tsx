import React from 'react';

interface MediaGalleryProps {
  mediaUrls: string[];
  className?: string;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({ mediaUrls, className = "" }) => {
  if (!mediaUrls || mediaUrls.length === 0) {
    return null;
  }

  const renderImages = () => {
    const count = mediaUrls.length;

    switch (count) {
      case 1:
        return (
          <div className="w-full">
            <img
              src={mediaUrls[0]}
              alt="Post media"
              className="w-full h-auto max-h-96 object-cover rounded-md"
            />
          </div>
        );

      case 2:
        return (
          <div className="grid grid-cols-2 gap-1 w-full">
            {mediaUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post media ${index + 1}`}
                className="w-full h-48 object-cover rounded-md"
              />
            ))}
          </div>
        );

      case 3:
        return (
          <div className="grid grid-cols-2 gap-1 w-full">
            <img
              src={mediaUrls[0]}
              alt="Post media 1"
              className="w-full h-48 object-cover rounded-md row-span-2"
            />
            <img
              src={mediaUrls[1]}
              alt="Post media 2"
              className="w-full h-24 object-cover rounded-md"
            />
            <img
              src={mediaUrls[2]}
              alt="Post media 3"
              className="w-full h-24 object-cover rounded-md"
            />
          </div>
        );

      case 4:
        return (
          <div className="grid grid-cols-2 gap-1 w-full">
            {mediaUrls.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Post media ${index + 1}`}
                className="w-full h-24 object-cover rounded-md"
              />
            ))}
          </div>
        );

      default:
        return (
          <div className="grid grid-cols-2 gap-1 w-full">
            {mediaUrls.slice(0, 4).map((url, index) => (
              <div key={index} className="relative">
                <img
                  src={url}
                  alt={`Post media ${index + 1}`}
                  className="w-full h-24 object-cover rounded-md"
                />
                {index === 3 && count > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
                    <span className="text-white font-bold text-lg">+{count - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className={`mt-4 ${className}`}>
      {renderImages()}
    </div>
  );
};

export default MediaGallery; 