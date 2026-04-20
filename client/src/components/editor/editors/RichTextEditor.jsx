import { useRef, useState } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

export default function RichTextEditor({ section, onChange }) {
  const [uploading, setUploading] = useState(false);
  const imgRef = useRef();
  const set = (key, val) => onChange({ ...section, [key]: val });

  const isHodMessage = section.type === 'hod_message';

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/editor/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('authorPhoto', `http://localhost:5000${res.data.url}`);
      toast.success('Photo uploaded!');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  return (
    <div className="section-editor">
      <h3 className="editor-section-title">
        {section.type === 'hod_message' ? '👨‍💼' : section.type === 'dept_details' ? '🏛️' : '🎯'} {section.title}
      </h3>

      {isHodMessage && (
        <div className="field-grid" style={{ marginBottom: '1rem' }}>
          {/* Author photo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              className="author-photo-wrapper"
              onClick={() => imgRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handlePhotoUpload(e.target.files[0])} />
              {section.authorPhoto ? (
                <img src={section.authorPhoto} alt="Author" className="author-photo" />
              ) : (
                <div className="author-photo-placeholder">
                  {uploading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <Upload size={18} />}
                </div>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="field-group">
                <label>Name / Designation</label>
                <input className="editor-input" value={section.authorName || ''} onChange={e => set('authorName', e.target.value)} placeholder="Dr. Name Here" />
              </div>
            </div>
          </div>
        </div>
      )}

      {section.type === 'dept_details' && (
        <div className="field-grid two-col" style={{ marginBottom: '1rem' }}>
          {['established', 'intake', 'accreditation', 'hod'].map(key => (
            <div className="field-group" key={key}>
              <label style={{ textTransform: 'capitalize' }}>{key === 'hod' ? 'HoD Name' : key}</label>
              <input className="editor-input" value={section.stats?.[key] || ''} onChange={e => set('stats', { ...(section.stats || {}), [key]: e.target.value })} />
            </div>
          ))}
        </div>
      )}

      {/* Main text area */}
      <div className="field-group">
        <label>Content</label>
        <textarea
          className="editor-textarea"
          value={section.richText || ''}
          onChange={e => set('richText', e.target.value)}
          placeholder={
            section.type === 'hod_message' ? "Write the HoD's message here..."
            : section.type === 'vision_mission' ? "Vision: ...\nMission: ...\n\nProgram Educational Objectives:\n1. ..."
            : "Write department details here..."
          }
          rows={14}
        />
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {(section.richText || '').length} characters · Newlines preserved
        </div>
      </div>
    </div>
  );
}
