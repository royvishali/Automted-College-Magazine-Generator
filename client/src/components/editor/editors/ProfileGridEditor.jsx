import { useRef, useState } from 'react';
import api from '../../../api/axios';
import toast from 'react-hot-toast';
import { PlusCircle, Trash2, Upload } from 'lucide-react';

function ProfileCard({ profile, index, onChange, onDelete }) {
  const imgRef = useRef();
  const [uploading, setUploading] = useState(false);
  const set = (key, val) => onChange(index, { ...profile, [key]: val });

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
    <div className="profile-card">
      {/* Photo */}
      <div className="profile-photo-wrap" onClick={() => imgRef.current?.click()} style={{ cursor: 'pointer' }}>
        <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => uploadPhoto(e.target.files[0])} />
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.name} className="profile-photo" />
        ) : (
          <div className="profile-photo-placeholder">
            {uploading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <Upload size={16} />}
          </div>
        )}
      </div>
      {/* Fields */}
      <div className="profile-fields">
        <input className="editor-input" value={profile.name} onChange={e => set('name', e.target.value)} placeholder="Full Name" style={{ marginBottom: '0.35rem' }} />
        <input className="editor-input" value={profile.designation} onChange={e => set('designation', e.target.value)} placeholder="Designation" style={{ marginBottom: '0.35rem' }} />
        <input className="editor-input" value={profile.qualification} onChange={e => set('qualification', e.target.value)} placeholder="Qualification (e.g. M.Tech, PhD)" />
      </div>
      <button className="icon-btn danger" onClick={() => onDelete(index)} title="Remove"><Trash2 size={14} /></button>
    </div>
  );
}

export default function ProfileGridEditor({ section, onChange }) {
  const profiles = section.profiles || [];

  const addProfile = () => onChange({ ...section, profiles: [...profiles, { name: '', designation: '', qualification: '', photoUrl: '' }] });
  const updateProfile = (i, updated) => { const p = [...profiles]; p[i] = updated; onChange({ ...section, profiles: p }); };
  const deleteProfile = (i) => onChange({ ...section, profiles: profiles.filter((_, idx) => idx !== i) });

  const isCommittee = section.type === 'committee';

  return (
    <div className="section-editor">
      <h3 className="editor-section-title">
        {isCommittee ? '🎖️' : '👥'} {section.title}
        <span className="count-badge">{profiles.length}</span>
      </h3>

      <div className="profile-grid">
        {profiles.map((profile, i) => (
          <ProfileCard key={i} profile={profile} index={i} onChange={updateProfile} onDelete={deleteProfile} />
        ))}
        <button className="add-profile-btn" onClick={addProfile}>
          <PlusCircle size={20} />
          <span>Add {isCommittee ? 'Member' : 'Faculty'}</span>
        </button>
      </div>

      {profiles.length === 0 && (
        <div className="empty-section-hint">
          Click "Add {isCommittee ? 'Member' : 'Faculty'}" to start building the {isCommittee ? 'committee' : 'faculty'} list.
        </div>
      )}
    </div>
  );
}
