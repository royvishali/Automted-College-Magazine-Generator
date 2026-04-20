import { useRef, useState } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, Upload, Image } from 'lucide-react';

function EventCard({ event, index, onChange, onDelete }) {
  const imgRef = useRef();
  const [uploading, setUploading] = useState(false);
  const set = (key, val) => onChange(index, { ...event, [key]: val });

  const uploadPhoto = async (file) => {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const res = await api.post('/editor/upload-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('photoUrl', `http://localhost:5000${res.data.url}`);
      toast.success('Photo uploaded!');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  return (
    <div className="event-card">
      <div className="event-photo-section">
        <div
          className="event-photo-wrap"
          onClick={() => imgRef.current?.click()}
          style={{
            background: event.photoUrl ? `url(${event.photoUrl}) center/cover` : undefined,
            cursor: 'pointer',
          }}
        >
          <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadPhoto(e.target.files[0])} />
          {!event.photoUrl && (
            uploading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : <><Image size={20} /><span>Add Photo</span></>
          )}
        </div>
      </div>
      <div className="event-fields">
        <input className="editor-input" value={event.title} onChange={e => set('title', e.target.value)} placeholder="Event Title" style={{ fontWeight: 600 }} />
        <input className="editor-input" value={event.date} onChange={e => set('date', e.target.value)} placeholder="Date (e.g. 15 March 2025)" style={{ marginTop: '0.4rem' }} />
        <textarea className="editor-textarea" value={event.description} onChange={e => set('description', e.target.value)} placeholder="Description..." rows={3} style={{ marginTop: '0.4rem' }} />
      </div>
      <button className="icon-btn danger" onClick={() => onDelete(index)} title="Remove"><Trash2 size={14} /></button>
    </div>
  );
}

export default function EventEditor({ section, onChange }) {
  const events = section.events || [];
  const isVisit = section.type === 'industrial_visits';
  const isExtracurricular = section.type === 'extracurricular';

  const addEvent = () => onChange({ ...section, events: [...events, { title: '', description: '', date: '', photoUrl: '' }] });
  const updateEvent = (i, updated) => { const e = [...events]; e[i] = updated; onChange({ ...section, events: e }); };
  const deleteEvent = (i) => onChange({ ...section, events: events.filter((_, idx) => idx !== i) });

  const label = isVisit ? 'Visit' : isExtracurricular ? 'Achievement' : 'Event';
  const icon = isVisit ? '🏭' : isExtracurricular ? '🎭' : '🎪';

  return (
    <div className="section-editor">
      <h3 className="editor-section-title">
        {icon} {section.title}
        <span className="count-badge">{events.length}</span>
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {events.map((event, i) => (
          <EventCard key={i} event={event} index={i} onChange={updateEvent} onDelete={deleteEvent} />
        ))}
      </div>

      <button className="add-btn" onClick={addEvent} style={{ marginTop: '1rem' }}>
        <PlusCircle size={16} /> Add {label}
      </button>

      {events.length === 0 && (
        <div className="empty-section-hint">No {label.toLowerCase()}s yet. Click "Add {label}" to begin.</div>
      )}
    </div>
  );
}
