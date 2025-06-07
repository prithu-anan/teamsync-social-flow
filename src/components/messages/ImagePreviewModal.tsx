import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImagePreviewModalProps {
  imageUrl: string;
  fileName: string;
  onClose: () => void;
}

const ImagePreviewModal = ({ imageUrl, fileName, onClose }: ImagePreviewModalProps) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative flex flex-col items-center">
        {/* Top right, outside the image */}
        <div className="w-full flex justify-end gap-2 mb-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleDownload}
            className="text-white hover:text-white/80 hover:bg-white/10"
            aria-label="Download image"
          >
            <Download className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:text-white/80 hover:bg-white/10"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <img 
          src={imageUrl} 
          alt={fileName} 
          className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

export default ImagePreviewModal; 