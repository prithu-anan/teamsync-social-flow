import { useState } from "react";
import { Download, File, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImagePreviewModal from "./ImagePreviewModal";

interface FileMessageProps {
  fileUrl: string;
  fileName?: string;
  fileType?: string;
  onDownload?: () => void;
}

const FileMessage = ({ fileUrl, fileName = "file", fileType, onDownload }: FileMessageProps) => {
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  const isImage = fileType?.startsWith('image/') || 
                  fileName?.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i);
  
  const isPdf = fileType === 'application/pdf' || fileName?.toLowerCase().endsWith('.pdf');
  const isDocument = fileType?.startsWith('application/') || 
                    fileName?.match(/\.(doc|docx|txt|rtf)$/i);
  const isSpreadsheet = fileType?.includes('spreadsheet') || 
                       fileName?.match(/\.(xls|xlsx|csv)$/i);
  const isPresentation = fileType?.includes('presentation') || 
                        fileName?.match(/\.(ppt|pptx)$/i);
  
  const getFileIcon = () => {
    if (isPdf) return "📄";
    if (isDocument) return "📝";
    if (isSpreadsheet) return "📊";
    if (isPresentation) return "📋";
    if (isImage) return "🖼️";
    return "📎";
  };
  
  const getFileTypeLabel = () => {
    if (isPdf) return "PDF Document";
    if (isDocument) return "Document";
    if (isSpreadsheet) return "Spreadsheet";
    if (isPresentation) return "Presentation";
    if (isImage) return "Image";
    return "File";
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isImage) {
    return (
      <div className="mt-2">
        {/* Image thumbnail */}
        <div className="relative group">
          <img 
            src={fileUrl} 
            alt={fileName}
            className="max-w-xs max-h-48 rounded-lg border shadow-sm hover:shadow-md transition-shadow cursor-pointer object-cover" 
            onClick={() => setShowImagePreview(true)}
          />
          {/* Download overlay */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleDownload}
              className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        

        
        {/* Image preview modal */}
        {showImagePreview && (
          <ImagePreviewModal
            imageUrl={fileUrl}
            fileName={fileName}
            onClose={() => setShowImagePreview(false)}
          />
        )}
      </div>
    );
  }

  // Generic file display
  return (
    <div className="mt-2">
      <div className="inline-flex items-center gap-3 px-3 py-2 bg-muted hover:bg-muted/80 rounded-lg border transition-colors max-w-xs">
        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-lg">
          {getFileIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">
            {fileName}
          </div>
          <div className="text-xs text-muted-foreground">
            {getFileTypeLabel()}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownload}
          className="h-8 w-8 p-0"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default FileMessage; 