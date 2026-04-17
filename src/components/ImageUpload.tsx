"use client"
import React, { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  defaultImage?: string;
}

export default function ImageUpload({ onImageUploaded, defaultImage }: ImageUploadProps) {
  const { success, error: showError } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError("Invalid file type");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      await uploadToDrive(base64, file.name, file.type);
    };
    reader.readAsDataURL(file);
  };

  const uploadToDrive = async (base64: string, fileName: string, mimeType: string) => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, fileName, mimeType })
      });
      const data = await res.json();
      if (data.success && data.url) {
        success("Image uploaded successfully!");
        onImageUploaded(data.url);
      } else {
        throw new Error(data.error || 'Failed to upload');
      }
    } catch (err: any) {
      showError(err.message);
      setPreview(defaultImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {preview ? (
        <div className="relative w-48 h-48 rounded-md overflow-hidden border-2 border-primary/20">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => { setPreview(null); onImageUploaded(''); }}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">Click to upload photo</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*"
            onChange={handleFileChange} 
          />
        </label>
      )}
      
      {isUploading && (
        <p className="text-sm text-blue-500 animate-pulse">Uploading to Drive...</p>
      )}
    </div>
  );
}
