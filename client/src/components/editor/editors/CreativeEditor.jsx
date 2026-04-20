import { useState } from 'react';
import { CheckSquare, Square, BookOpen, User } from 'lucide-react';

export default function CreativeEditor({ section, onChange, allApprovedArticles }) {
  const selectedIds = section.articleIds || [];
  const toggle = (id) => {
    const ids = selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id];
    onChange({ ...section, articleIds: ids });
  };

  const CATEGORIES = ['article', 'poem', 'achievement', 'announcement', 'event', 'other'];
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? allApprovedArticles : allApprovedArticles.filter(a => a.category === filter);

  return (
    <div className="section-editor">
      <h3 className="editor-section-title">
        ✍️ {section.title}
        <span className="count-badge">{selectedIds.length} selected</span>
      </h3>

      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        Select which approved student submissions to include in the Creative Section.
      </p>

      {/* Category filter */}
      <div className="filter-tabs" style={{ marginBottom: '1rem' }}>
        {['all', ...CATEGORIES].map(cat => (
          <button
            key={cat}
            className={`filter-tab ${filter === cat ? 'active' : ''}`}
            onClick={() => setFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-section-hint">
          <BookOpen size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
          No {filter === 'all' ? '' : filter + ' '}articles approved yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(article => {
            const isSelected = selectedIds.includes(article._id);
            return (
              <div
                key={article._id}
                className={`creative-article-row ${isSelected ? 'selected' : ''}`}
                onClick={() => toggle(article._id)}
              >
                <div className="creative-check">
                  {isSelected ? <CheckSquare size={18} color="#06d6a0" /> : <Square size={18} style={{ opacity: 0.4 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {article.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}>
                    <User size={11} /> {article.author?.name}
                    <span>· {article.department}</span>
                    <span>· {article.category}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
