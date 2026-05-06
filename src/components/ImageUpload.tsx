"use client"
import React, { useState, useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/components/Toast';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  defaultImage?: string;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        const MAX_SIZE = 1024;
        if (width > height) {
          if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
        } else {
          if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
  });
}

export default function ImageUpload({ onImageUploaded, defaultImage }: ImageUploadProps) {
  const { success, error: showError } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showError('ไฟล์ไม่ถูกต้อง กรุณาเลือกไฟล์รูปภาพ');
      return;
    }

    // Show local preview immediately
    const localPreview = URL.createObjectURL(file);
    setPreview(localPreview);

    await uploadToDrive(file);
  };

  const uploadToDrive = async (file: File) => {
    setIsUploading(true);
    try {
      // Compress before upload to avoid GAS/Vercel payload limits
      const compressedBase64 = await compressImage(file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64: compressedBase64,
          mimeType: 'image/jpeg',
          fileName: file.name.replace(/\.[^/.]+$/, '') + '.jpg',
        }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        success('อัปโหลดรูปภาพสำเร็จ');
        onImageUploaded(data.url);
      } else {
        throw new Error(data.error || 'Failed to upload');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการอัปโหลด';
      showError(message);
      setPreview(defaultImage || null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {preview ? (
        <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-sm">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          {!isUploading && (
            <button
              type="button"
              onClick={() => { setPreview(null); onImageUploaded(''); }}
              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition shadow"
            >
              <X size={14} />
            </button>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      ) : (
        <label className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed rounded-2xl cursor-pointer transition-colors ${isUploading ? 'border-primary/40 bg-primary/5' : 'border-slate-200 hover:border-primary hover:bg-slate-50'}`}>
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Upload className="w-8 h-8 text-slate-400" />
            <p className="text-xs font-medium text-slate-500">คลิกเพื่ออัปโหลดรูปภาพ</p>
            <p className="text-[10px] text-slate-400">PNG, JPG, WEBP</p>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            disabled={isUploading}
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
}
