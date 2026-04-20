import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';

const SECTION_META = {
  cover: { icon: '🏷️', color: '#f72585' },
  toc: { icon: '📋', color: '#7209b7' },
  hod_message: { icon: '👨‍💼', color: '#3a0ca3' },
  dept_details: { icon: '🏛️', color: '#4361ee' },
  vision_mission: { icon: '🎯', color: '#4cc9f0' },
  faculty_profiles: { icon: '👥', color: '#06d6a0' },
  events: { icon: '🎪', color: '#118ab2' },
  cocurricular: { icon: '🏆', color: '#ffd166' },
  extracurricular: { icon: '🎭', color: '#ef476f' },
  faculty_achievements: { icon: '📚', color: '#06d6a0' },
  placements: { icon: '💼', color: '#a8dadc' },
  industrial_visits: { icon: '🏭', color: '#e9c46a' },
  creative: { icon: '✍️', color: '#f4a261' },
  committee: { icon: '🎖️', color: '#e76f51' },
};

function SortableItem({ section, isActive, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : 'auto',
  };

  const meta = SECTION_META[section.type] || { icon: '📄', color: '#888' };

  return (
    <div ref={setNodeRef} style={style} className={`section-nav-item ${isActive ? 'active' : ''} ${!section.visible ? 'hidden-section' : ''}`}>
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <span className="section-icon" style={{ color: meta.color }}>{meta.icon}</span>
      <span className="section-label" onClick={onClick}>{section.title || section.type}</span>
      <span className={`visibility-dot ${section.visible ? 'visible' : 'invisible'}`} />
    </div>
  );
}

export default function SectionNavigator({ sections, activeId, onSelect, onReorder, onToggleVisible }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event) {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIdx = sections.findIndex(s => s.id === active.id);
      const newIdx = sections.findIndex(s => s.id === over.id);
      onReorder(arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, order: i })));
    }
  }

  return (
    <div className="section-navigator">
      <div className="nav-header">
        <span>📑 Sections</span>
        <span className="nav-count">{sections.filter(s => s.visible).length} visible</span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          {sections.map(section => (
            <SortableItem
              key={section.id}
              section={section}
              isActive={section.id === activeId}
              onClick={() => onSelect(section.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="nav-footer">
        <p className="nav-hint">⠿ Drag to reorder · Click to edit</p>
      </div>
    </div>
  );
}
