import { useState, useRef } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Upload, Image } from 'lucide-react';

export default function CoverEditor({ section, onChange }) {
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef();

  const set = (key, val) => onChange({ ...section, [key]: val });

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/editor/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('coverImageUrl', `http://localhost:5000${res.data.url}`);
      toast.success('Cover image uploaded!');
    } catch { toast.error('Image upload failed'); }
    setUploading(false);
  };

  return (
    <div className="section-editor cover-editor">
      <h3 className="editor-section-title">🏷️ Cover Page</h3>

      {/* Cover Preview */}
      <div className="cover-preview" style={{
        background: section.coverImageUrl
          ? `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.7)), url(${section.coverImageUrl}) center/cover`
          : 'linear-gradient(135deg, #0a0a18, #1a1a3e)',
        borderRadius: 12, padding: '2.5rem', marginBottom: '1.5rem',
        textAlign: 'center', position: 'relative', minHeight: 220,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontSize: '0.7rem', letterSpacing: '0.3em', textTransform: 'uppercase', opacity: 0.6, color: '#fff', marginBottom: '0.5rem' }}>
          {section.collegeName} · {section.departmentName}
        </div>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fff', fontFamily: 'Georgia, serif', lineHeight: 1.1 }}>
          {section.magazineName || 'ZEPHYR 2025'}
        </div>
        <div style={{ width: 40, height: 3, background: '#f72585', borderRadius: 2, margin: '0.75rem auto' }} />
        <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
          {section.tagline || 'Voices. Vision. Victory.'}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>{section.year}</div>
      </div>

      {/* Fields */}
      <div className="field-grid">
        <div className="field-group">
          <label>Magazine Name</label>
          <input className="editor-input" value={section.magazineName || ''} onChange={e => set('magazineName', e.target.value)} placeholder="ZEPHYR 2025" />
        </div>
        <div className="field-group">
          <label>Year</label>
          <input className="editor-input" value={section.year || ''} onChange={e => set('year', e.target.value)} placeholder="2025" />
        </div>
        <div className="field-group">
          <label>Tagline</label>
          <input className="editor-input" value={section.tagline || ''} onChange={e => set('tagline', e.target.value)} placeholder="Voices. Vision. Victory." />
        </div>
        <div className="field-group">
          <label>Department</label>
          <input className="editor-input" value={section.departmentName || ''} onChange={e => set('departmentName', e.target.value)} placeholder="Computer Engineering" />
        </div>
        <div className="field-group">
          <label>College Name</label>
          <input className="editor-input" value={section.collegeName || ''} onChange={e => set('collegeName', e.target.value)} placeholder="FCRIT" />
        </div>
      </div>

      {/* Image Upload */}
      <div className="field-group" style={{ marginTop: '1rem' }}>
        <label>Cover Background Image</label>
        <div
          className="img-upload-zone"
          onClick={() => imgRef.current?.click()}
          style={{ borderColor: section.coverImageUrl ? '#06d6a0' : undefined }}
        >
          <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImageUpload(e.target.files[0])} />
          {uploading ? <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} /> : (
            <>
              {section.coverImageUrl
                ? <Image size={20} color="#06d6a0" />
                : <Upload size={20} style={{ opacity: 0.5 }} />
              }
              <span style={{ fontSize: '0.78rem', opacity: 0.7 }}>
                {section.coverImageUrl ? 'Image set — click to replace' : 'Click to upload cover image'}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
