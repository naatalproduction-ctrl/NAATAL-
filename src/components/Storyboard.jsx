import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { storyboardAPI } from '../services/api';
import './Storyboard.css';

// Unique ID generator
let idCounter = 0;
const generateId = () => `element-${Date.now()}-${++idCounter}`;

// Element types
const ELEMENT_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  LINK: 'link',
  STICKY: 'sticky',
  SHAPE: 'shape',
  LINE: 'line',
  ARROW: 'arrow',
  ARC: 'arc',
};

// Infinite canvas — no fixed bounds
const clampBounds = (x, y) => ({ x, y });

// Sticky note colors
const STICKY_COLORS = [
  '#FFF9C4', // yellow
  '#C8E6C9', // green
  '#BBDEFB', // blue
  '#F8BBD0', // pink
  '#FFE0B2', // orange
  '#E1BEE7', // purple
];

// Board colors (Freeform-style)
const BOARD_COLORS = [
  '#007aff', '#34c759', '#ff9500', '#ff3b30',
  '#af52de', '#ff2d55', '#5856d6', '#00c7be',
  '#ff6482', '#30b0c7', '#a2845e', '#8e8e93',
];

// Shape types
const SHAPES = ['rectangle', 'circle', 'diamond'];

// Connector types (line, arrow, arc)
const CONNECTOR_TYPES = ['line', 'arrow', 'arc'];

// Snap threshold in canvas pixels
const SNAP_THRESHOLD = 20;

// Get anchor points for an element (top, right, bottom, left, center)
const getAnchorPoints = (el) => {
  const isConnector = el.type === ELEMENT_TYPES.LINE ||
    el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC;
  if (isConnector) return [];

  const cx = el.x + el.width / 2;
  const cy = el.y + (el.height || 100) / 2;
  const w = el.width;
  const h = el.height || 100;

  return [
    { id: el.id, anchor: 'top',    x: cx,          y: el.y },
    { id: el.id, anchor: 'right',  x: el.x + w,    y: cy },
    { id: el.id, anchor: 'bottom', x: cx,          y: el.y + h },
    { id: el.id, anchor: 'left',   x: el.x,        y: cy },
    { id: el.id, anchor: 'center', x: cx,          y: cy },
  ];
};

// Find the nearest anchor point within threshold
const findNearestAnchor = (x, y, elements, threshold = SNAP_THRESHOLD) => {
  let best = null;
  let bestDist = threshold;
  for (const el of elements) {
    const anchors = getAnchorPoints(el);
    for (const anchor of anchors) {
      const dx = anchor.x - x;
      const dy = anchor.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = anchor;
      }
    }
  }
  return best;
};

// Get anchor position from element and anchor name
const getAnchorPosition = (el, anchorName) => {
  if (!el || !anchorName) return null;
  const cx = el.x + el.width / 2;
  const cy = el.y + (el.height || 100) / 2;
  switch (anchorName) {
    case 'top':    return { x: cx, y: el.y };
    case 'right':  return { x: el.x + el.width, y: cy };
    case 'bottom': return { x: cx, y: el.y + (el.height || 100) };
    case 'left':   return { x: el.x, y: cy };
    case 'center': return { x: cx, y: cy };
    default: return null;
  }
};

// Convert DB element to canvas element
const dbToCanvas = (dbEl) => {
  let props = dbEl.properties || {};
  // Handle case where properties is returned as a JSON string
  if (typeof props === 'string') {
    try { props = JSON.parse(props); } catch { props = {}; }
  }
  return {
    id: `db-${dbEl.id}`,
    type: dbEl.element_type,
    x: parseFloat(dbEl.pos_x) || 0,
    y: parseFloat(dbEl.pos_y) || 0,
    width: parseFloat(dbEl.width) || 200,
    height: parseFloat(dbEl.height) || 200,
    content: dbEl.content || '',
    ...props,
  };
};

// ============================================
// BOARD GALLERY VIEW (Freeform-style)
// ============================================
function BoardGallery({ onOpenBoard, embedded = false }) {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('all'); // all, favorites, archived
  const [showNewBoard, setShowNewBoard] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardColor, setNewBoardColor] = useState('#007aff');
  const [contextMenu, setContextMenu] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [renameBoard, setRenameBoard] = useState(null);
  const [renameValue, setRenameValue] = useState('');

  const fetchBoards = useCallback(async () => {
    try {
      setLoading(true);
      const archived = view === 'archived';
      const res = await storyboardAPI.getAll(archived);
      if (res.success) {
        let data = res.data;
        if (view === 'favorites') {
          data = data.filter(b => b.is_favorite);
        }
        setBoards(data);
      }
    } catch (err) {
      console.error('Erreur chargement boards:', err);
    } finally {
      setLoading(false);
    }
  }, [view]);

  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);

  const handleCreateBoard = async () => {
    try {
      const res = await storyboardAPI.create({
        title: newBoardTitle || 'Sans titre',
        color: newBoardColor,
      });
      if (res.success) {
        setShowNewBoard(false);
        setNewBoardTitle('');
        setNewBoardColor('#007aff');
        onOpenBoard(res.data.id);
      }
    } catch (err) {
      console.error('Erreur creation board:', err);
    }
  };

  const handleToggleFavorite = async (id, current) => {
    try {
      await storyboardAPI.update(id, { is_favorite: !current });
      fetchBoards();
    } catch (err) {
      console.error('Erreur toggle favori:', err);
    }
    setContextMenu(null);
  };

  const handleArchive = async (id) => {
    try {
      await storyboardAPI.update(id, { is_archived: true });
      fetchBoards();
    } catch (err) {
      console.error('Erreur archivage:', err);
    }
    setContextMenu(null);
  };

  const handleUnarchive = async (id) => {
    try {
      await storyboardAPI.update(id, { is_archived: false });
      fetchBoards();
    } catch (err) {
      console.error('Erreur desarchivage:', err);
    }
    setContextMenu(null);
  };

  const handleDuplicate = async (id) => {
    try {
      await storyboardAPI.duplicate(id);
      fetchBoards();
    } catch (err) {
      console.error('Erreur duplication:', err);
    }
    setContextMenu(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce storyboard ?')) return;
    try {
      await storyboardAPI.delete(id);
      fetchBoards();
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
    setContextMenu(null);
  };

  const handleRename = async (id) => {
    if (!renameValue.trim()) return;
    try {
      await storyboardAPI.update(id, { title: renameValue.trim() });
      setRenameBoard(null);
      setRenameValue('');
      fetchBoards();
    } catch (err) {
      console.error('Erreur renommage:', err);
    }
  };

  const filteredBoards = boards.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'A l\'instant';
    if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)}h`;
    if (diff < 604800000) return `Il y a ${Math.floor(diff / 86400000)}j`;
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={`sb-gallery ${embedded ? 'sb-embedded' : ''}`} onClick={() => setContextMenu(null)}>
      {/* Sidebar - only in standalone mode */}
      {!embedded && (
      <aside className="sb-sidebar">
        <div className="sb-sidebar-header">
          <Link to="/" className="sb-sidebar-back">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </Link>
          <h1 className="sb-sidebar-title">Storyboard</h1>
        </div>

        <nav className="sb-sidebar-nav">
          <button
            className={`sb-sidebar-item ${view === 'all' ? 'active' : ''}`}
            onClick={() => setView('all')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1.5" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" />
            </svg>
            <span>Tous les tableaux</span>
            {boards.length > 0 && <span className="sb-sidebar-count">{boards.length}</span>}
          </button>

          <button
            className={`sb-sidebar-item ${view === 'favorites' ? 'active' : ''}`}
            onClick={() => setView('favorites')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>Favoris</span>
          </button>

          <button
            className={`sb-sidebar-item ${view === 'archived' ? 'active' : ''}`}
            onClick={() => setView('archived')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="21 8 21 21 3 21 3 8" />
              <rect x="1" y="3" width="22" height="5" />
              <line x1="10" y1="12" x2="14" y2="12" />
            </svg>
            <span>Archives</span>
          </button>
        </nav>
      </aside>
      )}

      {/* Main content */}
      <main className="sb-gallery-main">
        {/* Top bar */}
        <div className="sb-gallery-topbar">
          {/* Embedded filter tabs */}
          {embedded && (
            <div className="sb-embedded-filters">
              <button className={`sb-filter-btn ${view === 'all' ? 'active' : ''}`} onClick={() => setView('all')}>
                Tous
              </button>
              <button className={`sb-filter-btn ${view === 'favorites' ? 'active' : ''}`} onClick={() => setView('favorites')}>
                Favoris
              </button>
              <button className={`sb-filter-btn ${view === 'archived' ? 'active' : ''}`} onClick={() => setView('archived')}>
                Archives
              </button>
            </div>
          )}

          <div className="sb-gallery-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <motion.button
            className="sb-new-board-btn"
            onClick={() => setShowNewBoard(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Nouveau tableau
          </motion.button>
        </div>

        {/* Board grid */}
        {loading ? (
          <div className="sb-gallery-loading">
            <div className="sb-loading-spinner" />
            <p>Chargement...</p>
          </div>
        ) : filteredBoards.length === 0 ? (
          <div className="sb-gallery-empty">
            <div className="sb-empty-illustration">
              <svg viewBox="0 0 120 120" fill="none">
                <rect x="15" y="20" width="90" height="80" rx="12" stroke="#c7c7cc" strokeWidth="2" strokeDasharray="6 4" />
                <line x1="60" y1="45" x2="60" y2="75" stroke="#c7c7cc" strokeWidth="2" />
                <line x1="45" y1="60" x2="75" y2="60" stroke="#c7c7cc" strokeWidth="2" />
              </svg>
            </div>
            <h3>
              {view === 'favorites' && 'Aucun favori'}
              {view === 'archived' && 'Aucune archive'}
              {view === 'all' && (searchQuery ? 'Aucun resultat' : 'Aucun storyboard')}
            </h3>
            <p>
              {view === 'all' && !searchQuery && 'Creez votre premier tableau pour commencer a organiser vos idees.'}
              {view === 'favorites' && 'Marquez des tableaux comme favoris pour les retrouver ici.'}
              {view === 'archived' && 'Les tableaux archives apparaitront ici.'}
              {searchQuery && 'Essayez un autre terme de recherche.'}
            </p>
            {view === 'all' && !searchQuery && (
              <motion.button
                className="sb-empty-create-btn"
                onClick={() => setShowNewBoard(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Creer un tableau
              </motion.button>
            )}
          </div>
        ) : (
          <motion.div
            className="sb-board-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {filteredBoards.map((board, index) => (
              <motion.div
                key={board.id}
                className="sb-board-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({ id: board.id, x: e.clientX, y: e.clientY, board });
                }}
              >
                <div
                  className="sb-board-preview"
                  onClick={() => onOpenBoard(board.id)}
                  style={{ '--board-color': board.color || '#007aff' }}
                >
                  <div className="sb-board-preview-inner">
                    {board.thumbnail ? (
                      <img
                        src={board.thumbnail}
                        alt={board.title}
                        className="sb-board-thumbnail"
                        draggable={false}
                      />
                    ) : (
                      <div className="sb-board-dots">
                        {Array.from({ length: 9 }).map((_, i) => (
                          <div key={i} className="sb-board-dot" style={{
                            opacity: Math.random() * 0.5 + 0.2,
                            width: Math.random() * 8 + 4,
                            height: Math.random() * 8 + 4,
                          }} />
                        ))}
                      </div>
                    )}
                    {board.element_count > 0 && (
                      <span className="sb-board-element-count">
                        {board.element_count} element{board.element_count > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="sb-board-hover-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                    <span>Ouvrir</span>
                  </div>
                </div>

                <div className="sb-board-info">
                  {renameBoard === board.id ? (
                    <input
                      className="sb-board-rename-input"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => handleRename(board.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(board.id);
                        if (e.key === 'Escape') { setRenameBoard(null); setRenameValue(''); }
                      }}
                      autoFocus
                    />
                  ) : (
                    <h3
                      className="sb-board-title"
                      onDoubleClick={() => {
                        setRenameBoard(board.id);
                        setRenameValue(board.title);
                      }}
                    >
                      {board.is_favorite && (
                        <svg className="sb-board-star" viewBox="0 0 24 24" fill="#ff9500" stroke="#ff9500" strokeWidth="1.5">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      )}
                      {board.title}
                    </h3>
                  )}
                  <p className="sb-board-date">{formatDate(board.updated_at || board.created_at)}</p>
                </div>

                {/* Context menu button */}
                <button
                  className="sb-board-menu-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = e.currentTarget.getBoundingClientRect();
                    setContextMenu({ id: board.id, x: rect.right, y: rect.bottom, board });
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="6" r="1.5" />
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </main>

      {/* Context menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            className="sb-context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => onOpenBoard(contextMenu.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Ouvrir
            </button>
            <button onClick={() => {
              setRenameBoard(contextMenu.id);
              setRenameValue(contextMenu.board.title);
              setContextMenu(null);
            }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Renommer
            </button>
            <button onClick={() => handleToggleFavorite(contextMenu.id, contextMenu.board.is_favorite)}>
              <svg viewBox="0 0 24 24" fill={contextMenu.board.is_favorite ? '#ff9500' : 'none'} stroke={contextMenu.board.is_favorite ? '#ff9500' : 'currentColor'} strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {contextMenu.board.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            </button>
            <button onClick={() => handleDuplicate(contextMenu.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Dupliquer
            </button>
            <div className="sb-context-divider" />
            {view !== 'archived' ? (
              <button onClick={() => handleArchive(contextMenu.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                Archiver
              </button>
            ) : (
              <button onClick={() => handleUnarchive(contextMenu.id)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                </svg>
                Desarchiver
              </button>
            )}
            <button className="sb-context-danger" onClick={() => handleDelete(contextMenu.id)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              Supprimer
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New board modal */}
      <AnimatePresence>
        {showNewBoard && (
          <motion.div
            className="sb-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNewBoard(false)}
          >
            <motion.div
              className="sb-modal"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="sb-modal-title">Nouveau tableau</h2>

              <div className="sb-modal-field">
                <label>Nom</label>
                <input
                  type="text"
                  placeholder="Sans titre"
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateBoard(); }}
                  autoFocus
                />
              </div>

              <div className="sb-modal-field">
                <label>Couleur</label>
                <div className="sb-modal-colors">
                  {BOARD_COLORS.map(color => (
                    <button
                      key={color}
                      className={`sb-modal-color ${newBoardColor === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewBoardColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div className="sb-modal-preview" style={{ '--board-color': newBoardColor }}>
                <div className="sb-board-preview-inner">
                  <div className="sb-board-dots">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="sb-board-dot" style={{
                        opacity: 0.4,
                        width: 6,
                        height: 6,
                      }} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="sb-modal-actions">
                <button className="sb-modal-cancel" onClick={() => setShowNewBoard(false)}>
                  Annuler
                </button>
                <button className="sb-modal-create" onClick={handleCreateBoard}>
                  Creer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// BOARD EDITOR (Canvas)
// ============================================
function BoardEditor({ boardId, onBack, onNewBoard, embedded = false }) {
  const [boardTitle, setBoardTitle] = useState('');
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isSpaceHeld, setIsSpaceHeld] = useState(false);
  const isSpaceHeldRef = useRef(false);
  const [dragInfo, setDragInfo] = useState(null);
  const [resizeInfo, setResizeInfo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [stickyColor, setStickyColor] = useState(STICKY_COLORS[0]);
  const [shapeType, setShapeType] = useState('rectangle');
  const [connectorType, setConnectorType] = useState('line');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y, elementId }
  const [clipboard, setClipboard] = useState(null);
  const [showLinkModal, setShowLinkModal] = useState(null); // { x, y } canvas coords
  const [linkModalUrl, setLinkModalUrl] = useState('');
  const [history, setHistory] = useState([[]]);
  const attachMenuRef = useRef(null);
  const fontMenuRef = useRef(null);
  const contextMenuRef = useRef(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [drawInfo, setDrawInfo] = useState(null);
  const [controlPointDrag, setControlPointDrag] = useState(null);
  const [marqueeInfo, setMarqueeInfo] = useState(null); // { startX, startY, currentX, currentY } in canvas coords
  const controlPointDragRef = useRef(null);
  const drawInfoRef = useRef(null);
  const marqueeRef = useRef(null);
  const marqueeUsedRef = useRef(false);
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const fileInputRef = useRef(null);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const scrollbarDragRef = useRef(null); // { axis: 'x'|'y', startMouse, startPan }
  const saveTimeoutRef = useRef(null);
  // Touch support refs
  const lastTapRef = useRef(0); // for double-tap detection
  const touchStartRef = useRef(null); // { x, y, time, id } for single-finger drag
  const pinchStartRef = useRef(null); // { dist, zoom, panX, panY, midX, midY } for pinch-to-zoom
  const touchPanRef = useRef(null); // { x, y } for two-finger pan
  const longPressTimerRef = useRef(null); // for long-press context menu
  const longPressElementRef = useRef(null); // element id for long-press
  const elementsRef = useRef(elements);
  const zoomRef = useRef(zoom);
  const panOffsetRef = useRef(panOffset);
  const boardIdRef = useRef(boardId);

  // Keep refs in sync with state
  useEffect(() => { elementsRef.current = elements; }, [elements]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);
  useEffect(() => { boardIdRef.current = boardId; }, [boardId]);

  // Prevent native browser zoom on storyboard page (iOS pinch-to-zoom)
  useEffect(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    const original = meta?.getAttribute('content');
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    // Also prevent gesturestart (Safari)
    const preventGesture = (e) => e.preventDefault();
    document.addEventListener('gesturestart', preventGesture, { passive: false });
    document.addEventListener('gesturechange', preventGesture, { passive: false });
    return () => {
      if (meta && original) meta.setAttribute('content', original);
      document.removeEventListener('gesturestart', preventGesture);
      document.removeEventListener('gesturechange', preventGesture);
    };
  }, []);

  // Track wrapper dimensions for scrollbar calculations
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWrapperSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    ro.observe(wrapper);
    // Initial measurement
    const rect = wrapper.getBoundingClientRect();
    setWrapperSize({ width: rect.width, height: rect.height });
    return () => ro.disconnect();
  }, []);

  // Dynamic canvas bounds — grows when elements reach edges
  const canvasBounds = useMemo(() => {
    const EDGE_PADDING = 300;
    const MIN_W = 5000;
    const MIN_H = 5000;

    if (elements.length === 0) {
      return { width: MIN_W, height: MIN_H };
    }

    let maxX = 0, maxY = 0;
    elements.forEach(el => {
      const right = (el.x || 0) + (el.width || 150);
      const bottom = (el.y || 0) + (el.height || 50);
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });

    return {
      width: Math.max(MIN_W, maxX + EDGE_PADDING),
      height: Math.max(MIN_H, maxY + EDGE_PADDING),
    };
  }, [elements]);

  // Close attach menu on click/touch outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showAttachMenu]);

  // Close font menu on click/touch outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target)) {
        setShowFontMenu(false);
      }
    };
    if (showFontMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
      };
    }
  }, [showFontMenu]);

  // Close font/size menus when selection changes
  useEffect(() => { setShowFontMenu(false); setShowSizeMenu(false); setContextMenu(null); }, [selectedId]);

  // Close context menu on click/touch outside or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    const handleScroll = () => setContextMenu(null);
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('touchstart', handleClose);
    document.addEventListener('wheel', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('touchstart', handleClose);
      document.removeEventListener('wheel', handleScroll);
    };
  }, [contextMenu]);

  // Generate a small thumbnail of the canvas viewport for gallery preview
  const thumbnailTimeoutRef = useRef(null);
  const generateThumbnailRef = useRef(null);
  const generateThumbnail = useCallback(async () => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !boardId) return;
    try {
      const rect = wrapper.getBoundingClientRect();
      const captured = await html2canvas(wrapper, {
        backgroundColor: '#ffffff',
        scale: 0.25,
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: rect.width,
        height: rect.height,
        x: 0,
        y: 0,
        ignoreElements: (el) => {
          return el.classList?.contains('sb-resize-handle') ||
                 el.classList?.contains('sb-selection-box');
        },
      });
      const dataUrl = captured.toDataURL('image/jpeg', 0.5);
      await storyboardAPI.update(boardId, { thumbnail: dataUrl });
    } catch (err) {
      console.error('Erreur génération thumbnail:', err);
    }
  }, [boardId]);

  // Keep ref in sync
  useEffect(() => { generateThumbnailRef.current = generateThumbnail; }, [generateThumbnail]);

  // Load board data
  useEffect(() => {
    const loadBoard = async () => {
      try {
        setLoadingBoard(true);
        const res = await storyboardAPI.getById(boardId);
        if (res.success) {
          const board = res.data;
          setBoardTitle(board.title || 'Sans titre');
          setZoom(parseFloat(board.zoom) || 1);
          setPanOffset({
            x: parseFloat(board.pan_x) || 0,
            y: parseFloat(board.pan_y) || 0,
          });

          if (board.elements && board.elements.length > 0) {
            const canvasElements = board.elements.map(dbToCanvas);
            // Remap sourceId/targetId to match loaded element IDs (db-X format)
            for (const el of canvasElements) {
              if (el.sourceId != null) {
                // sourceId could be: numeric (42), string "42", or already "db-42"
                const sid = String(el.sourceId);
                if (sid.startsWith('db-')) {
                  // Already in db-X format, check if element exists
                  if (canvasElements.some(e => e.id === sid)) {
                    el.sourceId = sid;
                  }
                } else {
                  // Numeric ID from DB, convert to db-X
                  const remapped = `db-${sid}`;
                  if (canvasElements.some(e => e.id === remapped)) {
                    el.sourceId = remapped;
                  }
                }
              }
              if (el.targetId != null) {
                const tid = String(el.targetId);
                if (tid.startsWith('db-')) {
                  if (canvasElements.some(e => e.id === tid)) {
                    el.targetId = tid;
                  }
                } else {
                  const remapped = `db-${tid}`;
                  if (canvasElements.some(e => e.id === remapped)) {
                    el.targetId = remapped;
                  }
                }
              }
            }
            setElements(canvasElements);
            setHistory([canvasElements]);
          }
        }
      } catch (err) {
        console.error('Erreur chargement board:', err);
      } finally {
        setLoadingBoard(false);
      }
    };

    loadBoard();
  }, [boardId]);

  // Générer la thumbnail une fois le board chargé et les éléments rendus
  useEffect(() => {
    if (!loadingBoard && boardId) {
      const timer = setTimeout(() => {
        if (generateThumbnailRef.current) {
          generateThumbnailRef.current();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loadingBoard, boardId]);

  // Auto-save
  const autoSave = useCallback(async (currentElements, currentZoom, currentPan) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await storyboardAPI.saveElements(boardId, {
          elements: currentElements,
          zoom: currentZoom,
          pan_x: currentPan.x,
          pan_y: currentPan.y,
        });
        setLastSaved(new Date());

        // Generate thumbnail with a longer debounce (avoid too frequent captures)
        if (thumbnailTimeoutRef.current) {
          clearTimeout(thumbnailTimeoutRef.current);
        }
        thumbnailTimeoutRef.current = setTimeout(() => {
          generateThumbnail();
        }, 2000);
      } catch (err) {
        console.error('Erreur sauvegarde:', err);
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [boardId, generateThumbnail]);

  // Save to history
  const pushHistory = useCallback((newElements) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, newElements];
    });
    setHistoryIndex(prev => prev + 1);
    autoSave(newElements, zoom, panOffset);
  }, [historyIndex, autoSave, zoom, panOffset]);

  // Undo/Redo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      const prev = history[historyIndex - 1];
      setElements(prev);
      autoSave(prev, zoom, panOffset);
    }
  }, [historyIndex, history, autoSave, zoom, panOffset]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      const next = history[historyIndex + 1];
      setElements(next);
      autoSave(next, zoom, panOffset);
    }
  }, [historyIndex, history, autoSave, zoom, panOffset]);

  // Keyboard shortcuts - moved after function definitions (see below duplicateElement)

  // Save immediately on unmount (don't lose pending changes)
  useEffect(() => {
    return () => {
      if (thumbnailTimeoutRef.current) {
        clearTimeout(thumbnailTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Save immediately instead of discarding
        const currentElements = elementsRef.current;
        const currentZoom = zoomRef.current;
        const currentPan = panOffsetRef.current;
        const currentBoardId = boardIdRef.current;
        if (currentElements && currentElements.length > 0 && currentBoardId) {
          storyboardAPI.saveElements(currentBoardId, {
            elements: currentElements,
            zoom: currentZoom,
            pan_x: currentPan.x,
            pan_y: currentPan.y,
          }).catch(err => console.error('Erreur sauvegarde au démontage:', err));
        }
      }
    };
  }, []);

  // Get canvas-relative coordinates
  const getCanvasCoords = useCallback((clientX, clientY) => {
    const rect = wrapperRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - panOffset.x) / zoom,
      y: (clientY - rect.top - panOffset.y) / zoom,
    };
  }, [panOffset, zoom]);

  // Add text element
  const addText = useCallback((x, y) => {
    const newElement = {
      id: generateId(),
      type: ELEMENT_TYPES.TEXT,
      x, y,
      width: 250, height: 30,
      content: 'Texte',
      fontSize: 14, fontWeight: 'normal', color: '#1d1d1f',
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(newElement.id);
    setEditingId(newElement.id);
    setTool('select');
  }, [elements, pushHistory]);

  // Add sticky note
  const addSticky = useCallback((x, y) => {
    const newElement = {
      id: generateId(),
      type: ELEMENT_TYPES.STICKY,
      x, y, width: 200, height: 200,
      content: '', color: stickyColor,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(newElement.id);
    setEditingId(newElement.id);
    setTool('select');
  }, [elements, pushHistory, stickyColor]);

  // Add shape
  const addShape = useCallback((x, y) => {
    const newElement = {
      id: generateId(),
      type: ELEMENT_TYPES.SHAPE,
      x, y, width: 150, height: 150,
      shape: shapeType,
      fillColor: 'transparent', strokeColor: '#1d1d1f', strokeWidth: 2,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(newElement.id);
    setTool('select');
  }, [elements, pushHistory, shapeType]);

  // Finalize connector (line/arrow/arc) after draw
  const finalizeConnector = useCallback((type, x1, y1, x2, y2, sourceSnap, targetSnap) => {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 5) return; // too small

    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const w = Math.abs(dx);
    const h = Math.abs(dy);
    const padding = 20;

    // Local coords relative to bounding box
    const lx1 = x1 - minX + padding;
    const ly1 = y1 - minY + padding;
    const lx2 = x2 - minX + padding;
    const ly2 = y2 - minY + padding;

    // Control point for arc (perpendicular midpoint offset)
    let cx, cy;
    if (type === 'arc') {
      const mx = (lx1 + lx2) / 2;
      const my = (ly1 + ly2) / 2;
      const nx = -(ly2 - ly1);
      const ny = lx2 - lx1;
      const nl = Math.sqrt(nx * nx + ny * ny) || 1;
      cx = mx + (nx / nl) * dist * 0.3;
      cy = my + (ny / nl) * dist * 0.3;
    }

    const newElement = {
      id: generateId(),
      type,
      x: minX - padding,
      y: minY - padding,
      width: w + padding * 2,
      height: h + padding * 2,
      x1: lx1, y1: ly1,
      x2: lx2, y2: ly2,
      ...(type === 'arc' ? { cx, cy } : {}),
      strokeColor: '#1d1d1f',
      strokeWidth: 2,
      // Connection data
      ...(sourceSnap ? { sourceId: sourceSnap.id, sourceAnchor: sourceSnap.anchor } : {}),
      ...(targetSnap ? { targetId: targetSnap.id, targetAnchor: targetSnap.anchor } : {}),
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(newElement.id);
    setTool('select');
  }, [elements, pushHistory]);

  // Add link — opens modal instead of prompt()
  const addLink = useCallback((x, y) => {
    setShowLinkModal({ x, y });
    setLinkModalUrl('');
    setTool('select');
  }, []);

  // Confirm link insertion from modal
  const confirmAddLink = useCallback(() => {
    if (!showLinkModal || !linkModalUrl.trim()) return;
    const url = linkModalUrl.trim();

    // Extract thumbnail for known services
    let thumbnail = null;
    let label = url;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) {
      thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
      label = 'YouTube';
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      label = 'Vimeo';
    }

    // Try to extract domain name as label
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      if (label === url) label = parsed.hostname.replace('www.', '');
    } catch { /* keep url as label */ }

    const newElement = {
      id: generateId(),
      type: ELEMENT_TYPES.LINK,
      x: showLinkModal.x, y: showLinkModal.y,
      width: 280, height: thumbnail ? 200 : 52,
      url: url.startsWith('http') ? url : `https://${url}`,
      label,
      thumbnail,
    };
    const newElements = [...elements, newElement];
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(newElement.id);
    setShowLinkModal(null);
    setLinkModalUrl('');
  }, [showLinkModal, linkModalUrl, elements, pushHistory]);

  // Add image
  const addImage = useCallback((file, x, y) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxW = 400;
        const ratio = img.width / img.height;
        const w = Math.min(img.width, maxW);
        const h = w / ratio;
        const newElement = {
          id: generateId(),
          type: ELEMENT_TYPES.IMAGE,
          x: x || 100, y: y || 100,
          width: w, height: h,
          src: e.target.result,
          originalWidth: img.width, originalHeight: img.height,
        };
        const newElements = [...elements, newElement];
        setElements(newElements);
        pushHistory(newElements);
        setSelectedId(newElement.id);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }, [elements, pushHistory]);

  // Delete element(s)
  const deleteElement = useCallback((id) => {
    const idsToDelete = selectedIds.size > 0 ? selectedIds : new Set([id]);
    const newElements = elements.filter(el => !idsToDelete.has(el.id));
    setElements(newElements);
    pushHistory(newElements);
    setSelectedId(null);
    setSelectedIds(new Set());
  }, [elements, pushHistory, selectedIds]);

  // Update element
  const updateElement = useCallback((id, updates) => {
    const newElements = elements.map(el =>
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  // Bring to front
  const bringToFront = useCallback((id) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newElements = [...elements.filter(e => e.id !== id), el];
    setElements(newElements);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  // Send to back
  const sendToBack = useCallback((id) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newElements = [el, ...elements.filter(e => e.id !== id)];
    setElements(newElements);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  // Copy element(s) to clipboard
  const copyElement = useCallback((id) => {
    if (selectedIds.size > 1) {
      const copied = elements.filter(e => selectedIds.has(e.id)).map(e => ({ ...e }));
      if (copied.length > 0) setClipboard(copied);
    } else {
      const el = elements.find(e => e.id === id);
      if (el) setClipboard({ ...el });
    }
  }, [elements, selectedIds]);

  // Cut element(s)
  const cutElement = useCallback((id) => {
    if (selectedIds.size > 1) {
      const copied = elements.filter(e => selectedIds.has(e.id)).map(e => ({ ...e }));
      if (copied.length === 0) return;
      setClipboard(copied);
      const newElements = elements.filter(e => !selectedIds.has(e.id));
      setElements(newElements);
      pushHistory(newElements);
      setSelectedId(null);
      setSelectedIds(new Set());
    } else {
      const el = elements.find(e => e.id === id);
      if (!el) return;
      setClipboard({ ...el });
      const newElements = elements.filter(e => e.id !== id);
      setElements(newElements);
      pushHistory(newElements);
      setSelectedId(null);
      setSelectedIds(new Set());
    }
  }, [elements, pushHistory, selectedIds]);

  // Paste element(s)
  const pasteElement = useCallback(() => {
    if (!clipboard) return;
    if (Array.isArray(clipboard)) {
      // Paste multiple elements
      const newEls = clipboard.map(el => ({ ...el, id: generateId(), x: el.x + 30, y: el.y + 30, locked: false }));
      const newElements = [...elements, ...newEls];
      setElements(newElements);
      pushHistory(newElements);
      const newIds = new Set(newEls.map(e => e.id));
      setSelectedIds(newIds);
      setSelectedId(newEls[newEls.length - 1].id);
    } else {
      const newEl = { ...clipboard, id: generateId(), x: clipboard.x + 30, y: clipboard.y + 30, locked: false };
      const newElements = [...elements, newEl];
      setElements(newElements);
      pushHistory(newElements);
      setSelectedId(newEl.id);
      setSelectedIds(new Set());
    }
  }, [clipboard, elements, pushHistory]);

  // Duplicate element(s)
  const duplicateElement = useCallback((id) => {
    if (selectedIds.size > 1) {
      const toDuplicate = elements.filter(e => selectedIds.has(e.id));
      if (toDuplicate.length === 0) return;
      const newEls = toDuplicate.map(el => ({ ...el, id: generateId(), x: el.x + 30, y: el.y + 30, locked: false }));
      const newElements = [...elements, ...newEls];
      setElements(newElements);
      pushHistory(newElements);
      const newIds = new Set(newEls.map(e => e.id));
      setSelectedIds(newIds);
      setSelectedId(newEls[newEls.length - 1].id);
    } else {
      const el = elements.find(e => e.id === id);
      if (!el) return;
      const newEl = { ...el, id: generateId(), x: el.x + 30, y: el.y + 30, locked: false };
      const newElements = [...elements, newEl];
      setElements(newElements);
      pushHistory(newElements);
      setSelectedId(newEl.id);
      setSelectedIds(new Set());
    }
  }, [elements, pushHistory, selectedIds]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore when typing in form fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable) return;
      // Ignore when focus is inside admin (outside storyboard)
      const inStoryboard = wrapperRef.current && (wrapperRef.current.contains(e.target) || document.activeElement === document.body);
      if (!inStoryboard) return;

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        autoSave(elements, zoom, panOffset);
      }
      // Select all (Cmd+A / Ctrl+A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        if (!editingId) {
          e.preventDefault();
          const allIds = new Set(elements.map(el => el.id));
          setSelectedIds(allIds);
          if (elements.length > 0) setSelectedId(elements[elements.length - 1].id);
        }
      }
      // Copy (Cmd+C / Ctrl+C)
      if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
        if ((selectedId || selectedIds.size > 0) && !editingId) {
          e.preventDefault();
          copyElement(selectedId);
        }
      }
      // Cut (Cmd+X / Ctrl+X)
      if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
        if ((selectedId || selectedIds.size > 0) && !editingId) {
          e.preventDefault();
          cutElement(selectedId);
        }
      }
      // Paste (Cmd+V / Ctrl+V)
      if ((e.metaKey || e.ctrlKey) && e.key === 'v') {
        if (!editingId) {
          e.preventDefault();
          pasteElement();
        }
      }
      // Duplicate (Cmd+D / Ctrl+D)
      if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
        if ((selectedId || selectedIds.size > 0) && !editingId) {
          e.preventDefault();
          duplicateElement(selectedId);
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if ((selectedId || selectedIds.size > 0) && !editingId) {
          e.preventDefault();
          deleteElement(selectedId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setSelectedIds(new Set());
        setEditingId(null);
        setTool('select');
      }
      // Space = pan mode (Figma-style)
      if (e.key === ' ' && !editingId) {
        e.preventDefault();
        if (!isSpaceHeldRef.current) {
          setIsSpaceHeld(true);
          isSpaceHeldRef.current = true;
        }
      }
      // Tool shortcuts (only when no modifier keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !editingId) {
        if (e.key === 'v' || e.key === 'V') { setTool('select'); }
        if (e.key === 't' || e.key === 'T') { setTool('text'); }
        if (e.key === 's' || e.key === 'S') { setTool('sticky'); }
        if (e.key === 'r' || e.key === 'R') { setTool('shape'); }
        if (e.key === 'l' || e.key === 'L') { setTool('link'); }
      }
    };
    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        setIsSpaceHeld(false);
        isSpaceHeldRef.current = false;
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedId, selectedIds, editingId, undo, redo, elements, zoom, panOffset, autoSave, copyElement, cutElement, pasteElement, duplicateElement, deleteElement]);

  // Toggle lock element
  const toggleLockElement = useCallback((id) => {
    const newElements = elements.map(el =>
      el.id === id ? { ...el, locked: !el.locked } : el
    );
    setElements(newElements);
    pushHistory(newElements);
  }, [elements, pushHistory]);

  // Context menu handler
  const handleContextMenu = useCallback((e, elementId) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(elementId);
    setContextMenu({ x: e.clientX, y: e.clientY, elementId });
  }, []);

  // Canvas click handler
  const handleCanvasClick = useCallback((e) => {
    if (e.target !== canvasRef.current && !e.target.classList.contains('storyboard-canvas-inner')) return;
    // Skip if a marquee selection just completed
    if (marqueeUsedRef.current) { marqueeUsedRef.current = false; return; }
    // Connector tools use drag, not click
    if (tool === 'line' || tool === 'arrow' || tool === 'arc') return;
    // Don't deselect if Cmd/Ctrl is held (used for multi-select click)
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    switch (tool) {
      case 'text': addText(x, y); break;
      case 'sticky': addSticky(x, y); break;
      case 'shape': addShape(x, y); break;
      case 'link': addLink(x, y); break;
      default:
        setSelectedId(null);
        setSelectedIds(new Set());
        setEditingId(null);
        break;
    }
  }, [tool, getCanvasCoords, addText, addSticky, addShape, addLink]);

  // Drag element
  const handleElementMouseDown = useCallback((e, id) => {
    // Space+click = pan (override element drag)
    if (isSpaceHeldRef.current && e.button === 0) {
      e.preventDefault();
      e.stopPropagation();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    if (editingId === id) return;
    e.stopPropagation();
    const el = elements.find(item => item.id === id);
    if (!el) return;

    // Multi-selection with Shift+click or Cmd+click
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
          if (selectedId === id) setSelectedId(next.size > 0 ? [...next][next.size - 1] : null);
        } else {
          next.add(id);
          if (selectedId) next.add(selectedId);
          setSelectedId(id);
        }
        return next;
      });
      return;
    }

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

    // If clicking on an already multi-selected element, drag the group
    if (selectedIds.size > 0 && selectedIds.has(id)) {
      const groupOffsets = {};
      selectedIds.forEach(sid => {
        const sEl = elements.find(item => item.id === sid);
        if (sEl) groupOffsets[sid] = { dx: x - sEl.x, dy: y - sEl.y };
      });
      setSelectedId(id);
      setDragInfo({ id, startX: x - el.x, startY: y - el.y, groupOffsets });
      return;
    }

    setSelectedId(id);
    setSelectedIds(new Set());
    bringToFront(id);

    // If dragging a connector, include connected elements in a group drag
    const isConnector = el.type === ELEMENT_TYPES.LINE ||
      el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC;
    if (isConnector && (el.sourceId || el.targetId)) {
      const groupOffsets = {};
      groupOffsets[id] = { dx: x - el.x, dy: y - el.y };
      if (el.sourceId) {
        const srcEl = elements.find(item => item.id === el.sourceId);
        if (srcEl) groupOffsets[el.sourceId] = { dx: x - srcEl.x, dy: y - srcEl.y };
      }
      if (el.targetId) {
        const tgtEl = elements.find(item => item.id === el.targetId);
        if (tgtEl) groupOffsets[el.targetId] = { dx: x - tgtEl.x, dy: y - tgtEl.y };
      }
      // Also include any other connectors attached to those elements
      elements.forEach(item => {
        const isConn = item.type === ELEMENT_TYPES.LINE ||
          item.type === ELEMENT_TYPES.ARROW || item.type === ELEMENT_TYPES.ARC;
        if (isConn && item.id !== id) {
          const srcLinked = item.sourceId && groupOffsets[item.sourceId];
          const tgtLinked = item.targetId && groupOffsets[item.targetId];
          if (srcLinked || tgtLinked) {
            if (!groupOffsets[item.id]) {
              groupOffsets[item.id] = { dx: x - item.x, dy: y - item.y };
            }
          }
        }
      });
      setDragInfo({ id, startX: x - el.x, startY: y - el.y, groupOffsets });
      return;
    }

    setDragInfo({ id, startX: x - el.x, startY: y - el.y, groupOffsets: null });
  }, [elements, editingId, selectedId, selectedIds, getCanvasCoords, bringToFront]);

  // Resize element
  const handleResizeMouseDown = useCallback((e, id, handle) => {
    e.stopPropagation();
    e.preventDefault();
    const el = elements.find(item => item.id === id);
    if (!el) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    setResizeInfo({
      id, handle, startX: x, startY: y,
      origX: el.x, origY: el.y, origW: el.width, origH: el.height,
    });
  }, [elements, getCanvasCoords]);

  // Update connectors that are connected to any moved element
  const updateConnectedConnectors = useCallback((allElements, movedIds) => {
    return allElements.map(el => {
      const isConn = el.type === ELEMENT_TYPES.LINE ||
        el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC;
      if (!isConn) return el;

      let sourcePos = null;
      let targetPos = null;

      // Get absolute positions of connected endpoints
      if (el.sourceId && movedIds.has(el.sourceId)) {
        const sourceEl = allElements.find(e => e.id === el.sourceId);
        if (sourceEl) {
          sourcePos = getAnchorPosition(sourceEl, el.sourceAnchor);
        }
      }
      if (el.targetId && movedIds.has(el.targetId)) {
        const targetEl = allElements.find(e => e.id === el.targetId);
        if (targetEl) {
          targetPos = getAnchorPosition(targetEl, el.targetAnchor);
        }
      }

      if (!sourcePos && !targetPos) return el;

      // Compute current absolute positions of both endpoints
      const absX1 = sourcePos ? sourcePos.x : (el.x + el.x1);
      const absY1 = sourcePos ? sourcePos.y : (el.y + el.y1);
      const absX2 = targetPos ? targetPos.x : (el.x + el.x2);
      const absY2 = targetPos ? targetPos.y : (el.y + el.y2);

      // Recompute bounding box
      const padding = 20;
      const minX = Math.min(absX1, absX2);
      const minY = Math.min(absY1, absY2);
      const w = Math.abs(absX2 - absX1);
      const h = Math.abs(absY2 - absY1);

      const newX = minX - padding;
      const newY = minY - padding;
      const newW = w + padding * 2;
      const newH = h + padding * 2;

      // Recompute local coords
      const lx1 = absX1 - newX;
      const ly1 = absY1 - newY;
      const lx2 = absX2 - newX;
      const ly2 = absY2 - newY;

      // Recompute control point for arcs (keep relative position)
      let newCx = el.cx;
      let newCy = el.cy;
      if (el.type === ELEMENT_TYPES.ARC && el.cx != null) {
        // Convert old control point to absolute, then back to new local
        const absCx = el.x + el.cx;
        const absCy = el.y + el.cy;
        newCx = absCx - newX;
        newCy = absCy - newY;
      }

      return {
        ...el,
        x: newX, y: newY, width: newW, height: newH,
        x1: lx1, y1: ly1, x2: lx2, y2: ly2,
        ...(el.type === ELEMENT_TYPES.ARC ? { cx: newCx, cy: newCy } : {}),
      };
    });
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Drawing connector preview
    if (drawInfoRef.current) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      // Snap to nearest anchor point
      const snap = findNearestAnchor(x, y, elementsRef.current);
      const snapX = snap ? snap.x : x;
      const snapY = snap ? snap.y : y;
      const updated = {
        ...drawInfoRef.current,
        currentX: snapX,
        currentY: snapY,
        snapTarget: snap || null,
      };
      setDrawInfo(updated);
      drawInfoRef.current = updated;
      return;
    }

    // Marquee selection drag
    if (marqueeRef.current) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const updated = { ...marqueeRef.current, currentX: x, currentY: y };
      marqueeRef.current = updated;
      setMarqueeInfo(updated);
      return;
    }

    // Dragging a control point (arc) -- mouse position = desired curve midpoint (t=0.5)
    // Convert to actual control point: cp = 2*mid - 0.5*p1 - 0.5*p2
    if (controlPointDragRef.current) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const el = elementsRef.current.find(item => item.id === controlPointDragRef.current.id);
      if (el) {
        const midLocalX = x - el.x;
        const midLocalY = y - el.y;
        const cpX = 2 * midLocalX - 0.5 * el.x1 - 0.5 * el.x2;
        const cpY = 2 * midLocalY - 0.5 * el.y1 - 0.5 * el.y2;
        setElements(prev => prev.map(item =>
          item.id === controlPointDragRef.current.id ? { ...item, cx: cpX, cy: cpY } : item
        ));
      }
      return;
    }

    if (dragInfo) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      if (dragInfo.groupOffsets) {
        // Group drag: move all selected elements + update connected connectors
        setElements(prev => {
          const movedIds = new Set(Object.keys(dragInfo.groupOffsets));
          let updated = prev.map(el => {
            const offset = dragInfo.groupOffsets[el.id];
            if (offset) {
              const rawX = x - offset.dx;
              const rawY = y - offset.dy;
              const clamped = clampBounds(rawX, rawY, el.width || 0, el.height || 0);
              return { ...el, x: clamped.x, y: clamped.y };
            }
            return el;
          });
          // Update connectors connected to any moved element
          updated = updateConnectedConnectors(updated, movedIds);
          return updated;
        });
      } else {
        setElements(prev => {
          let updated = prev.map(el => {
            if (el.id !== dragInfo.id) return el;
            const rawX = x - dragInfo.startX;
            const rawY = y - dragInfo.startY;
            const clamped = clampBounds(rawX, rawY, el.width || 0, el.height || 0);
            return { ...el, x: clamped.x, y: clamped.y };
          });
          // Update connectors connected to the moved element
          updated = updateConnectedConnectors(updated, new Set([dragInfo.id]));
          return updated;
        });
      }
      return;
    }

    if (resizeInfo) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const dx = x - resizeInfo.startX;
      const dy = y - resizeInfo.startY;

      // Handle connector endpoint dragging with snap
      if (resizeInfo.handle === 'p1' || resizeInfo.handle === 'p2') {
        const snap = findNearestAnchor(x, y, elementsRef.current);
        const snapX = snap ? snap.x : x;
        const snapY = snap ? snap.y : y;
        setElements(prev => prev.map(el => {
          if (el.id !== resizeInfo.id) return el;
          const localX = snapX - el.x;
          const localY = snapY - el.y;
          if (resizeInfo.handle === 'p1') {
            return {
              ...el, x1: localX, y1: localY,
              sourceId: snap ? snap.id : undefined,
              sourceAnchor: snap ? snap.anchor : undefined,
            };
          } else {
            return {
              ...el, x2: localX, y2: localY,
              targetId: snap ? snap.id : undefined,
              targetAnchor: snap ? snap.anchor : undefined,
            };
          }
        }));
        return;
      }

      setElements(prev => prev.map(el => {
        if (el.id !== resizeInfo.id) return el;
        let newX = resizeInfo.origX, newY = resizeInfo.origY;
        let newW = resizeInfo.origW, newH = resizeInfo.origH;

        // Determine if aspect ratio should be locked (images and links with thumbnails)
        const lockRatio = el.type === ELEMENT_TYPES.IMAGE || (el.type === ELEMENT_TYPES.LINK && el.thumbnail);
        const aspectRatio = resizeInfo.origW / resizeInfo.origH;

        if (lockRatio && (resizeInfo.handle === 'nw' || resizeInfo.handle === 'ne' || resizeInfo.handle === 'sw' || resizeInfo.handle === 'se')) {
          // Corner resize: lock aspect ratio
          if (resizeInfo.handle === 'se') {
            newW = Math.max(60, resizeInfo.origW + dx);
            newH = newW / aspectRatio;
          } else if (resizeInfo.handle === 'ne') {
            newW = Math.max(60, resizeInfo.origW + dx);
            newH = newW / aspectRatio;
            newY = resizeInfo.origY + (resizeInfo.origH - newH);
          } else if (resizeInfo.handle === 'sw') {
            newW = Math.max(60, resizeInfo.origW - dx);
            newX = resizeInfo.origX + (resizeInfo.origW - newW);
            newH = newW / aspectRatio;
          } else if (resizeInfo.handle === 'nw') {
            newW = Math.max(60, resizeInfo.origW - dx);
            newX = resizeInfo.origX + (resizeInfo.origW - newW);
            newH = newW / aspectRatio;
            newY = resizeInfo.origY + (resizeInfo.origH - newH);
          }
        } else {
          // Free resize for non-images or edge handles
          if (resizeInfo.handle.includes('e')) newW = Math.max(60, resizeInfo.origW + dx);
          if (resizeInfo.handle.includes('s')) newH = Math.max(30, resizeInfo.origH + dy);
          if (resizeInfo.handle.includes('w')) { newW = Math.max(60, resizeInfo.origW - dx); newX = resizeInfo.origX + dx; }
          if (resizeInfo.handle.includes('n')) { newH = Math.max(30, resizeInfo.origH - dy); newY = resizeInfo.origY + dy; }
        }

        return { ...el, x: newX, y: newY, width: newW, height: newH };
      }));
    }
  }, [isPanning, panStart, dragInfo, resizeInfo, getCanvasCoords]);

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    // Finalize marquee selection
    if (marqueeRef.current) {
      const m = marqueeRef.current;
      const mx1 = Math.min(m.startX, m.currentX);
      const my1 = Math.min(m.startY, m.currentY);
      const mx2 = Math.max(m.startX, m.currentX);
      const my2 = Math.max(m.startY, m.currentY);
      const marqueeW = mx2 - mx1;
      const marqueeH = my2 - my1;

      // Only select if the marquee is large enough (not just a click)
      if (marqueeW > 5 || marqueeH > 5) {
        marqueeUsedRef.current = true;
        const hitIds = new Set();
        elementsRef.current.forEach(el => {
          const isConnector = el.type === ELEMENT_TYPES.LINE || el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC;
          let elLeft, elTop, elRight, elBottom;
          if (isConnector) {
            elLeft = el.x + Math.min(el.x1 || 0, el.x2 || 0);
            elTop = el.y + Math.min(el.y1 || 0, el.y2 || 0);
            elRight = el.x + Math.max(el.x1 || 0, el.x2 || 0);
            elBottom = el.y + Math.max(el.y1 || 0, el.y2 || 0);
          } else {
            elLeft = el.x;
            elTop = el.y;
            elRight = el.x + (el.width || 0);
            elBottom = el.y + (el.height || 0);
          }
          // Check intersection (not just fully contained)
          if (elRight > mx1 && elLeft < mx2 && elBottom > my1 && elTop < my2) {
            hitIds.add(el.id);
          }
        });
        if (hitIds.size > 0) {
          setSelectedIds(hitIds);
          setSelectedId([...hitIds][hitIds.size - 1]);
        }
      }
      setMarqueeInfo(null);
      marqueeRef.current = null;
      return;
    }

    // Finalize connector drawing
    if (drawInfoRef.current) {
      const d = drawInfoRef.current;
      finalizeConnector(d.type, d.startX, d.startY, d.currentX, d.currentY, d.sourceSnap, d.snapTarget);
      setDrawInfo(null);
      drawInfoRef.current = null;
      return;
    }

    // Finalize control point drag
    if (controlPointDragRef.current) {
      pushHistory(elementsRef.current);
      setControlPointDrag(null);
      controlPointDragRef.current = null;
      return;
    }

    if (dragInfo) {
      const el = elements.find(e => e.id === dragInfo.id);
      if (el) pushHistory(elements);
    }
    if (resizeInfo) {
      pushHistory(elements);
    }
    setDragInfo(null);
    setResizeInfo(null);
    setIsPanning(false);
  }, [dragInfo, resizeInfo, elements, pushHistory, finalizeConnector]);

  // Pan with middle click, alt+click, or space+click, or start drawing connectors
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey) || (e.button === 0 && isSpaceHeldRef.current)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Start drawing connector (line/arrow/arc)
    if (e.button === 0 && (tool === 'line' || tool === 'arrow' || tool === 'arc')) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      // Snap start to nearest anchor (use ref for fresh elements)
      const snap = findNearestAnchor(x, y, elementsRef.current);
      const snapX = snap ? snap.x : x;
      const snapY = snap ? snap.y : y;
      const info = {
        type: tool === 'line' ? ELEMENT_TYPES.LINE : tool === 'arrow' ? ELEMENT_TYPES.ARROW : ELEMENT_TYPES.ARC,
        startX: snapX, startY: snapY,
        currentX: snapX, currentY: snapY,
        sourceSnap: snap || null,
        snapTarget: null,
      };
      setDrawInfo(info);
      drawInfoRef.current = info;
      setSelectedId(null);
      setSelectedIds(new Set());
      setEditingId(null);
      return;
    }

    // Start marquee selection on empty canvas (select tool, left click)
    if (e.button === 0 && tool === 'select') {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const info = { startX: x, startY: y, currentX: x, currentY: y };
      setMarqueeInfo(info);
      marqueeRef.current = info;
      // If not holding Shift/Cmd, clear current selection
      if (!e.shiftKey && !e.metaKey && !e.ctrlKey) {
        setSelectedId(null);
        setSelectedIds(new Set());
      }
      setEditingId(null);
    }
  }, [tool, getCanvasCoords]);

  // ---- TOUCH EVENT HANDLERS (mobile support) ----

  // Helper: get distance between two touch points
  const getTouchDistance = (t1, t2) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Helper: get midpoint between two touch points
  const getTouchMidpoint = (t1, t2) => ({
    x: (t1.clientX + t2.clientX) / 2,
    y: (t1.clientY + t2.clientY) / 2,
  });

  // Touch start on canvas wrapper
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      // Two-finger: pinch-to-zoom or pan
      e.preventDefault();
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const mid = getTouchMidpoint(e.touches[0], e.touches[1]);
      pinchStartRef.current = {
        dist,
        zoom: zoomRef.current,
        panX: panOffsetRef.current.x,
        panY: panOffsetRef.current.y,
        midX: mid.x,
        midY: mid.y,
      };
      touchPanRef.current = { x: mid.x, y: mid.y };
      // Cancel any single-finger drag/draw
      setDragInfo(null);
      setDrawInfo(null);
      drawInfoRef.current = null;
      setMarqueeInfo(null);
      marqueeRef.current = null;
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), id: touch.identifier };
    }
  }, []);

  // Touch move on canvas wrapper
  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getTouchDistance(e.touches[0], e.touches[1]);
      const mid = getTouchMidpoint(e.touches[0], e.touches[1]);

      if (pinchStartRef.current) {
        // Pinch-to-zoom centered on pinch midpoint
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (!rect) return;

        const scale = dist / pinchStartRef.current.dist;
        const newZoom = Math.min(3, Math.max(0.25, pinchStartRef.current.zoom * scale));

        // Point on canvas under the original pinch midpoint
        const cursorX = pinchStartRef.current.midX - rect.left;
        const cursorY = pinchStartRef.current.midY - rect.top;
        const pointX = (cursorX - pinchStartRef.current.panX) / pinchStartRef.current.zoom;
        const pointY = (cursorY - pinchStartRef.current.panY) / pinchStartRef.current.zoom;

        // Pan delta from finger movement
        const panDeltaX = mid.x - pinchStartRef.current.midX;
        const panDeltaY = mid.y - pinchStartRef.current.midY;

        const newPanX = cursorX - pointX * newZoom + panDeltaX;
        const newPanY = cursorY - pointY * newZoom + panDeltaY;

        setZoom(newZoom);
        setPanOffset({ x: newPanX, y: newPanY });
      }
      return;
    }

    if (e.touches.length === 1) {
      // Cancel long-press if finger moved significantly
      if (longPressTimerRef.current && touchStartRef.current) {
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - touchStartRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartRef.current.y);
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
      // Single-finger move: delegate to mouse move logic for drag/resize/draw
      const touch = e.touches[0];
      // Create a synthetic mouse-like event
      handleMouseMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
        preventDefault: () => {},
      });
    }
  }, [handleMouseMove]);

  // Touch end on canvas wrapper
  const handleTouchEnd = useCallback((e) => {
    // Reset pinch state when fingers lift
    if (e.touches.length < 2) {
      pinchStartRef.current = null;
      touchPanRef.current = null;
    }

    // Clear long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (e.touches.length === 0) {
      // Check for canvas tap before finalizing (tool placement)
      const touchStart = touchStartRef.current;
      if (touchStart) {
        const ct = e.changedTouches[0];
        if (ct) {
          const dx = Math.abs(ct.clientX - touchStart.x);
          const dy = Math.abs(ct.clientY - touchStart.y);
          const elapsed = Date.now() - touchStart.time;

          if (dx < 10 && dy < 10 && elapsed < 300) {
            // It was a tap — check if it landed on the canvas (not on an element or UI)
            const target = e.target;
            const hitElement = target.closest('.sb-element');
            const hitUI = target.closest('.sb-topbar, .sb-sub-toolbar, .sb-text-options, .sb-context-menu, .sb-attach-menu, .sb-link-modal');
            const isCanvas = !hitElement && !hitUI;
            if (isCanvas) {
              const { x, y } = getCanvasCoords(ct.clientX, ct.clientY);
              if (tool === 'text') { addText(x, y); }
              else if (tool === 'sticky') { addSticky(x, y); }
              else if (tool === 'shape') { addShape(x, y); }
              else if (tool === 'link') { addLink(x, y); }
              else if (tool === 'select') {
                // Deselect on empty canvas tap
                if (marqueeUsedRef.current) { marqueeUsedRef.current = false; }
                else {
                  setSelectedId(null);
                  setSelectedIds(new Set());
                  setEditingId(null);
                }
              }
            }
          }
        }
      }

      // All fingers lifted - finalize any drag/resize like mouse up
      handleMouseUp();
      touchStartRef.current = null;
    }
  }, [handleMouseUp, tool, getCanvasCoords, addText, addSticky, addShape, addLink]);

  // Touch start on an element (for dragging + long-press context menu)
  const handleElementTouchStart = useCallback((e, id) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), id: touch.identifier };

    // Long-press detection: show context menu after 500ms
    longPressElementRef.current = id;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      // Only trigger if finger hasn't moved much
      const ts = touchStartRef.current;
      if (ts) {
        // Position menu centered above the element
        const el = elementsRef.current.find(e => e.id === id);
        const wrapperRect = wrapperRef.current?.getBoundingClientRect();
        let menuX = ts.x, menuY = ts.y - 50;
        if (el && wrapperRect) {
          const elCenterX = el.x * zoomRef.current + panOffsetRef.current.x + wrapperRect.left + (el.width || 0) * zoomRef.current / 2;
          const elTopY = el.y * zoomRef.current + panOffsetRef.current.y + wrapperRect.top;
          menuX = Math.max(20, Math.min(window.innerWidth - 200, elCenterX - 100));
          menuY = Math.max(60, elTopY - 10);
        }
        setSelectedId(id);
        setContextMenu({ x: menuX, y: menuY, elementId: id });
        // Cancel the drag
        setDragInfo(null);
        longPressTimerRef.current = null;
      }
    }, 500);

    // Simulate mousedown for the element
    handleElementMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: 0,
      stopPropagation: () => {},
      preventDefault: () => {},
      shiftKey: false,
      metaKey: false,
      ctrlKey: false,
    }, id);
  }, [handleElementMouseDown]);

  // Touch start on resize handle
  const handleResizeTouchStart = useCallback((e, id, handle) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    handleResizeMouseDown({
      clientX: touch.clientX,
      clientY: touch.clientY,
      stopPropagation: () => {},
      preventDefault: () => {},
    }, id, handle);
  }, [handleResizeMouseDown]);

  // Double-tap detection for editing text/sticky notes
  const handleDoubleTap = useCallback((e, el) => {
    if (e.touches.length !== 1) return;
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeSinceLastTap < 300 && timeSinceLastTap > 0) {
      // Double-tap detected
      e.preventDefault();
      e.stopPropagation();
      if (el.locked) return;
      if (el.type === ELEMENT_TYPES.TEXT || el.type === ELEMENT_TYPES.STICKY) {
        setEditingId(el.id);
      }
      if (el.type === ELEMENT_TYPES.LINK) {
        window.open(el.url, '_blank');
      }
    }
  }, []);

  // Canvas touch start (for panning or starting draws/marquee)
  const handleCanvasTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now(), id: touch.identifier };

    // Start drawing connector or marquee (same logic as canvas mouse down)
    if (tool === 'line' || tool === 'arrow' || tool === 'arc') {
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      const snap = findNearestAnchor(x, y, elementsRef.current);
      const snapX = snap ? snap.x : x;
      const snapY = snap ? snap.y : y;
      const info = {
        type: tool === 'line' ? ELEMENT_TYPES.LINE : tool === 'arrow' ? ELEMENT_TYPES.ARROW : ELEMENT_TYPES.ARC,
        startX: snapX, startY: snapY,
        currentX: snapX, currentY: snapY,
        sourceSnap: snap || null,
        snapTarget: null,
      };
      setDrawInfo(info);
      drawInfoRef.current = info;
      setSelectedId(null);
      setSelectedIds(new Set());
      setEditingId(null);
      return;
    }

    // Marquee for select tool
    if (tool === 'select') {
      const { x, y } = getCanvasCoords(touch.clientX, touch.clientY);
      const info = { startX: x, startY: y, currentX: x, currentY: y };
      setMarqueeInfo(info);
      marqueeRef.current = info;
      setSelectedId(null);
      setSelectedIds(new Set());
      setEditingId(null);
    }
  }, [tool, getCanvasCoords]);

  // Canvas single tap is now handled in wrapper handleTouchEnd above

  // Attach touch handlers to the wrapper with { passive: false }
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.addEventListener('touchstart', handleTouchStart, { passive: false });
    wrapper.addEventListener('touchmove', handleTouchMove, { passive: false });
    wrapper.addEventListener('touchend', handleTouchEnd, { passive: false });
    return () => {
      wrapper.removeEventListener('touchstart', handleTouchStart);
      wrapper.removeEventListener('touchmove', handleTouchMove);
      wrapper.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Trackpad & wheel handler (Freeform-style navigation)
  // - Two-finger scroll = pan
  // - Pinch / ctrl+wheel = zoom centered on cursor
  const handleWheel = useCallback((e) => {
    // Ne pas intercepter le scroll dans les popovers, menus et selects
    const target = e.target;
    if (target.closest('.sb-text-options, .sb-font-menu, .sb-size-menu, .sb-attach-menu, .sb-context-menu, .sb-link-modal')) {
      return;
    }
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Pinch-to-zoom or ctrl+wheel — zoom centered on cursor position
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect) return;

      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;

      // Point on canvas under cursor before zoom
      const pointX = (cursorX - panOffset.x) / zoom;
      const pointY = (cursorY - panOffset.y) / zoom;

      const delta = -e.deltaY * 0.01;
      const newZoom = Math.min(3, Math.max(0.25, zoom + delta));

      // Adjust pan so the point under cursor stays in the same place
      const newPanX = cursorX - pointX * newZoom;
      const newPanY = cursorY - pointY * newZoom;

      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    } else {
      // Two-finger scroll = pan
      setPanOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  }, [zoom, panOffset]);

  // Attach wheel handler with { passive: false } to allow preventDefault
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    wrapper.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrapper.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // Drag & drop files
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    const { x, y } = getCanvasCoords(e.clientX, e.clientY);
    imageFiles.forEach((file, i) => addImage(file, x + i * 20, y + i * 20));
  }, [getCanvasCoords, addImage]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  // ---- Custom scrollbar logic ----
  const scrollbarInfo = useMemo(() => {
    const vw = wrapperSize.width;
    const vh = wrapperSize.height;
    if (!vw || !vh) return null;

    const cw = canvasBounds.width * zoom;
    const ch = canvasBounds.height * zoom;

    // The visible area in canvas-pixel space
    // panOffset is how much the canvas origin is shifted (positive = canvas moved right/down)
    // Total scrollable range: from showing left edge to showing right edge
    const totalW = cw + vw; // full scroll range horizontally
    const totalH = ch + vh; // full scroll range vertically

    // Current scroll position (0..1): how far we are from the leftmost/topmost position
    const scrollX = (vw - panOffset.x) / totalW;
    const scrollY = (vh - panOffset.y) / totalH;

    // Thumb size ratio
    const thumbRatioX = vw / totalW;
    const thumbRatioY = vh / totalH;

    const SCROLLBAR_MARGIN = 4;
    const MIN_THUMB = 30;
    const TRACK_SIZE = 8;

    // Horizontal scrollbar
    const hTrackLen = vw - SCROLLBAR_MARGIN * 2 - TRACK_SIZE; // leave room for corner
    const hThumbLen = Math.max(MIN_THUMB, thumbRatioX * hTrackLen);
    const hThumbPos = SCROLLBAR_MARGIN + scrollX * (hTrackLen - hThumbLen);

    // Vertical scrollbar
    const vTrackLen = vh - SCROLLBAR_MARGIN * 2 - TRACK_SIZE; // leave room for corner
    const vThumbLen = Math.max(MIN_THUMB, thumbRatioY * vTrackLen);
    const vThumbPos = SCROLLBAR_MARGIN + scrollY * (vTrackLen - vThumbLen);

    return {
      hThumbPos, hThumbLen, hTrackLen,
      vThumbPos, vThumbLen, vTrackLen,
      totalW, totalH,
      SCROLLBAR_MARGIN, TRACK_SIZE,
      showH: thumbRatioX < 0.98,
      showV: thumbRatioY < 0.98,
    };
  }, [wrapperSize, canvasBounds, zoom, panOffset]);

  const handleScrollbarMouseDown = useCallback((axis, e) => {
    e.preventDefault();
    e.stopPropagation();
    scrollbarDragRef.current = {
      axis,
      startMouse: axis === 'x' ? e.clientX : e.clientY,
      startPan: axis === 'x' ? panOffset.x : panOffset.y,
    };

    const handleMove = (ev) => {
      const info = scrollbarDragRef.current;
      if (!info) return;
      const delta = (info.axis === 'x' ? ev.clientX : ev.clientY) - info.startMouse;

      const vw = wrapperSize.width;
      const vh = wrapperSize.height;
      const cw = canvasBounds.width * zoomRef.current;
      const ch = canvasBounds.height * zoomRef.current;
      const SCROLLBAR_MARGIN = 4;
      const TRACK_SIZE = 8;

      if (info.axis === 'x') {
        const totalW = cw + vw;
        const hTrackLen = vw - SCROLLBAR_MARGIN * 2 - TRACK_SIZE;
        const thumbRatioX = vw / totalW;
        const hThumbLen = Math.max(30, thumbRatioX * hTrackLen);
        const scrollableTrack = hTrackLen - hThumbLen;
        if (scrollableTrack <= 0) return;
        const panDelta = (delta / scrollableTrack) * totalW;
        const newPanX = info.startPan - panDelta;
        setPanOffset(prev => ({ ...prev, x: newPanX }));
      } else {
        const totalH = ch + vh;
        const vTrackLen = vh - SCROLLBAR_MARGIN * 2 - TRACK_SIZE;
        const thumbRatioY = vh / totalH;
        const vThumbLen = Math.max(30, thumbRatioY * vTrackLen);
        const scrollableTrack = vTrackLen - vThumbLen;
        if (scrollableTrack <= 0) return;
        const panDelta = (delta / scrollableTrack) * totalH;
        const newPanY = info.startPan - panDelta;
        setPanOffset(prev => ({ ...prev, y: newPanY }));
      }
    };

    const handleUp = () => {
      scrollbarDragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [panOffset, wrapperSize, canvasBounds]);

  // File input handler
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) addImage(file);
    });
    e.target.value = '';
  }, [addImage]);

  // Export as PDF — clone elements into a temp container sized to bounding box
  const exportBoard = async () => {
    if (elements.length === 0) return;

    // Temporarily hide selection UI for clean export
    const prevSelected = selectedId;
    const prevSelectedIds = new Set(selectedIds);
    setSelectedId(null);
    setSelectedIds(new Set());

    // Wait for re-render so selection borders disappear
    await new Promise((r) => setTimeout(r, 200));

    try {
      // 1) Calculate bounding box of ALL elements (including connector overflow)
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const el of elements) {
        const elW = el.width || 200;
        const elH = el.height || 100;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + elW);
        maxY = Math.max(maxY, el.y + elH);

        // Connectors: local points can overflow the element bounding box
        const isConn = el.type === ELEMENT_TYPES.LINE ||
          el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC;
        if (isConn) {
          if (el.x1 != null) {
            minX = Math.min(minX, el.x + el.x1);
            minY = Math.min(minY, el.y + el.y1);
            maxX = Math.max(maxX, el.x + el.x1);
            maxY = Math.max(maxY, el.y + el.y1);
          }
          if (el.x2 != null) {
            minX = Math.min(minX, el.x + el.x2);
            minY = Math.min(minY, el.y + el.y2);
            maxX = Math.max(maxX, el.x + el.x2);
            maxY = Math.max(maxY, el.y + el.y2);
          }
          if (el.type === ELEMENT_TYPES.ARC && el.cx != null) {
            minX = Math.min(minX, el.x + el.cx);
            minY = Math.min(minY, el.y + el.cy);
            maxX = Math.max(maxX, el.x + el.cx);
            maxY = Math.max(maxY, el.y + el.cy);
          }
        }
      }

      // 2) Add padding
      const padding = 60;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = maxX + padding;
      maxY = maxY + padding;

      const cropW = maxX - minX;
      const cropH = maxY - minY;

      // 3) Clone the canvas-inner content into an offscreen container
      //    positioned so that elements appear at their correct relative positions
      const canvasInner = canvasRef.current?.querySelector('.storyboard-canvas-inner');
      if (!canvasInner) return;

      const clone = canvasInner.cloneNode(true);

      // Remove UI-only elements from the clone (selection handles, etc.)
      clone.querySelectorAll('.sb-resize-handle, .sb-selection-box, .sb-marquee, .sb-link-floating-bar, .sb-control-point, .sb-connector-endpoint, .sb-connector-control-point').forEach(el => el.remove());
      // Remove selected styling
      clone.querySelectorAll('.sb-selected').forEach(el => el.classList.remove('sb-selected'));
      // Ensure all elements and SVGs have overflow visible for html2canvas
      clone.querySelectorAll('.sb-element').forEach(el => { el.style.overflow = 'visible'; });
      clone.querySelectorAll('svg').forEach(svg => { svg.style.overflow = 'visible'; });

      const container = document.createElement('div');
      container.style.cssText = `
        position: fixed;
        left: -99999px;
        top: 0;
        width: ${cropW}px;
        height: ${cropH}px;
        overflow: hidden;
        background: #ffffff;
        z-index: -1;
      `;

      // Offset the clone so that minX,minY maps to 0,0 in the container
      clone.style.cssText = `
        position: absolute;
        left: ${-minX}px;
        top: ${-minY}px;
        width: ${maxX + padding}px;
        height: ${maxY + padding}px;
      `;

      container.appendChild(clone);
      document.body.appendChild(container);

      // Wait for images to settle
      await new Promise((r) => setTimeout(r, 100));

      // 4) Capture the container
      const captured = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: cropW,
        height: cropH,
      });

      // Clean up
      document.body.removeChild(container);

      const imgData = captured.toDataURL('image/png');
      const imgWidth = captured.width;
      const imgHeight = captured.height;

      // 5) Create PDF sized to fit
      const pdfW = imgWidth / 2;
      const pdfH = imgHeight / 2;
      const orientation = pdfW > pdfH ? 'landscape' : 'portrait';
      const pdf = new jsPDF(orientation, 'px', [pdfW, pdfH]);

      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
      pdf.save(`storyboard-${boardId}.pdf`);
    } catch (err) {
      console.error('Export PDF error:', err);
    }

    // Restore selection
    setSelectedId(prevSelected);
    setSelectedIds(prevSelectedIds);
  };

  // Reset view
  const resetView = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Render element
  const renderElement = (el) => {
    const isSelected = selectedId === el.id || selectedIds.has(el.id);
    const isPrimary = selectedId === el.id;
    const isEditing = editingId === el.id;

    const isConnector = el.type === ELEMENT_TYPES.LINE || el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC;

    // For connectors, compute a bounding box that includes all points
    // (endpoints + arc control point + quadratic bezier extremes) so the parent div fully contains the SVG
    let connBounds = null;
    if (isConnector) {
      const xVals = [el.x1, el.x2];
      const yVals = [el.y1, el.y2];
      if (el.type === ELEMENT_TYPES.ARC && el.cx != null) {
        xVals.push(el.cx);
        yVals.push(el.cy);
        // For quadratic bezier, compute the actual curve extremes
        // B(t) = (1-t)^2*P0 + 2*(1-t)*t*CP + t^2*P1
        // Extremes occur where B'(t)=0: t = (P0 - CP) / (P0 - 2*CP + P1)
        const computeExtreme = (p0, cp, p1) => {
          const denom = p0 - 2 * cp + p1;
          if (Math.abs(denom) < 0.001) return [];
          const t = (p0 - cp) / denom;
          if (t > 0 && t < 1) {
            return [(1 - t) * (1 - t) * p0 + 2 * (1 - t) * t * cp + t * t * p1];
          }
          return [];
        };
        computeExtreme(el.x1, el.cx, el.x2).forEach(v => xVals.push(v));
        computeExtreme(el.y1, el.cy, el.y2).forEach(v => yVals.push(v));
      }
      const pad = 10;
      const localMinX = Math.min(...xVals) - pad;
      const localMinY = Math.min(...yVals) - pad;
      const localMaxX = Math.max(...xVals) + pad;
      const localMaxY = Math.max(...yVals) + pad;
      connBounds = {
        // Offset of the expanded box relative to el.x, el.y
        offX: Math.min(0, localMinX),
        offY: Math.min(0, localMinY),
        w: Math.max(el.width, localMaxX) - Math.min(0, localMinX),
        h: Math.max(el.height, localMaxY) - Math.min(0, localMinY),
      };
    }

    const baseStyle = {
      position: 'absolute',
      left: isConnector ? el.x + connBounds.offX : el.x,
      top: isConnector ? el.y + connBounds.offY : el.y,
      width: isConnector ? connBounds.w : el.width,
      height: isConnector ? connBounds.h : (el.type === ELEMENT_TYPES.TEXT ? 'auto' : el.height),
      minHeight: el.type === ELEMENT_TYPES.TEXT ? el.height : undefined,
      cursor: 'default',
      zIndex: isSelected ? 999 : 'auto',
      ...(isConnector ? { border: 'none', background: 'transparent', overflow: 'visible' } : {}),
    };

    return (
      <div
        key={el.id}
        className={`sb-element ${isSelected ? 'sb-selected' : ''} ${isConnector ? 'sb-connector' : ''} ${el.locked ? 'sb-locked' : ''}`}
        style={baseStyle}
        onMouseDown={(e) => {
          if (!el.locked) {
            handleElementMouseDown(e, el.id);
          } else {
            e.stopPropagation();
            if (e.shiftKey || e.metaKey || e.ctrlKey) {
              setSelectedIds(prev => {
                const next = new Set(prev);
                if (next.has(el.id)) {
                  next.delete(el.id);
                  if (selectedId === el.id) setSelectedId(next.size > 0 ? [...next][next.size - 1] : null);
                } else {
                  next.add(el.id);
                  if (selectedId) next.add(selectedId);
                  setSelectedId(el.id);
                }
                return next;
              });
            } else {
              setSelectedId(el.id);
              setSelectedIds(new Set());
            }
          }
        }}
        onTouchStart={(e) => {
          handleDoubleTap(e, el);
          if (!el.locked) {
            handleElementTouchStart(e, el.id);
          } else {
            e.stopPropagation();
            setSelectedId(el.id);
            setSelectedIds(new Set());
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, el.id)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (el.locked) return;
          if (el.type === ELEMENT_TYPES.TEXT || el.type === ELEMENT_TYPES.STICKY) setEditingId(el.id);
          if (el.type === ELEMENT_TYPES.LINK) window.open(el.url, '_blank');
        }}
      >
        {el.type === ELEMENT_TYPES.TEXT && (
          <div
            className="sb-text-element"
            contentEditable={isEditing}
            suppressContentEditableWarning
            style={{ fontSize: el.fontSize, fontWeight: el.fontWeight, color: el.color, minHeight: 24, outline: 'none', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
            onBlur={(e) => { updateElement(el.id, { content: e.target.innerText }); setEditingId(null); }}
            onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
            onTouchStart={(e) => { if (isEditing) e.stopPropagation(); }}
          >{el.content}</div>
        )}

        {el.type === ELEMENT_TYPES.IMAGE && (
          <img src={el.src} alt="storyboard" className="sb-image-element" draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }} />
        )}

        {el.type === ELEMENT_TYPES.LINK && (
          <div className={`sb-link-element ${el.thumbnail ? 'sb-link-preview' : ''}`}>
            {el.thumbnail ? (
              <>
                <div className="sb-link-thumb">
                  <img src={el.thumbnail} alt="" draggable={false} />
                </div>
                <div className="sb-link-info">
                  <span>{el.label}</span>
                </div>
              </>
            ) : (
              <span>{el.label}</span>
            )}
          </div>
        )}

        {/* Floating action bar for link elements (Freeform-style) */}
        {el.type === ELEMENT_TYPES.LINK && isSelected && (
          <div className="sb-link-floating-bar" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
            <button
              className="sb-link-floating-btn"
              onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(el.url); }}
              title="Copier le lien"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>
            <button
              className="sb-link-floating-btn"
              onClick={(e) => { e.stopPropagation(); window.open(el.url, '_blank', 'noopener'); }}
              title="Voir la vidéo"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              className="sb-link-floating-btn"
              onClick={(e) => {
                e.stopPropagation();
                const newUrl = prompt('Modifier le lien :', el.url);
                if (newUrl && newUrl.trim()) {
                  const url = newUrl.trim();
                  let thumbnail = null;
                  let label = url;
                  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
                  if (ytMatch) {
                    thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg`;
                    label = 'YouTube';
                  }
                  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
                  if (vimeoMatch) label = 'Vimeo';
                  try {
                    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
                    if (label === url) label = parsed.hostname.replace('www.', '');
                  } catch { /* keep url as label */ }
                  updateElement(el.id, {
                    url: url.startsWith('http') ? url : `https://${url}`,
                    label,
                    thumbnail,
                    height: thumbnail ? 200 : 52,
                  });
                }
              }}
              title="Modifier le lien"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.174 6.812a1 1 0 00-3.986-3.987L3.842 16.174a2 2 0 00-.5.83l-1.321 4.352a.5.5 0 00.623.622l4.353-1.32a2 2 0 00.83-.497z" />
              </svg>
            </button>
            <button
              className="sb-link-floating-btn sb-link-floating-delete"
              onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }}
              title="Supprimer"
            >
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </div>
        )}

        {el.type === ELEMENT_TYPES.STICKY && (
          <div className="sb-sticky-element" style={{ backgroundColor: el.color }}>
            <div
              contentEditable={isEditing}
              suppressContentEditableWarning
              className="sb-sticky-content"
              style={{ outline: 'none' }}
              onBlur={(e) => { updateElement(el.id, { content: e.target.innerText }); setEditingId(null); }}
              onMouseDown={(e) => { if (isEditing) e.stopPropagation(); }}
              onTouchStart={(e) => { if (isEditing) e.stopPropagation(); }}
            >{el.content || (isEditing ? '' : 'Note...')}</div>
          </div>
        )}

        {el.type === ELEMENT_TYPES.SHAPE && (
          <div className="sb-shape-element">
            <svg width="100%" height="100%" viewBox={`0 0 ${el.width} ${el.height}`}>
              {el.shape === 'rectangle' && (
                <rect x={el.strokeWidth / 2} y={el.strokeWidth / 2} width={el.width - el.strokeWidth} height={el.height - el.strokeWidth} fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} rx="8" />
              )}
              {el.shape === 'circle' && (
                <ellipse cx={el.width / 2} cy={el.height / 2} rx={(el.width - el.strokeWidth) / 2} ry={(el.height - el.strokeWidth) / 2} fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} />
              )}
              {el.shape === 'diamond' && (
                <polygon points={`${el.width / 2},${el.strokeWidth} ${el.width - el.strokeWidth},${el.height / 2} ${el.width / 2},${el.height - el.strokeWidth} ${el.strokeWidth},${el.height / 2}`} fill={el.fillColor} stroke={el.strokeColor} strokeWidth={el.strokeWidth} />
              )}
            </svg>
          </div>
        )}

        {/* Connector elements: line, arrow, arc */}
        {isConnector && (() => {
          // Shift all local coords by -connBounds.offX/offY so they align
          // within the expanded parent div
          const dx = -connBounds.offX;
          const dy = -connBounds.offY;
          const sx1 = el.x1 + dx, sy1 = el.y1 + dy;
          const sx2 = el.x2 + dx, sy2 = el.y2 + dy;
          const scx = el.type === ELEMENT_TYPES.ARC ? el.cx + dx : 0;
          const scy = el.type === ELEMENT_TYPES.ARC ? el.cy + dy : 0;

          return (
          <svg
            className="sb-connector-element"
            width={connBounds.w}
            height={connBounds.h}
            viewBox={`0 0 ${connBounds.w} ${connBounds.h}`}
            style={{ overflow: 'visible' }}
          >
            <defs>
              {el.type === ELEMENT_TYPES.ARROW && (
                <marker
                  id={`arrowhead-${el.id}`}
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                  markerUnits="strokeWidth"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill={el.strokeColor || '#1d1d1f'} />
                </marker>
              )}
            </defs>
            {el.type === ELEMENT_TYPES.ARC ? (
              <path
                d={`M ${sx1} ${sy1} Q ${scx} ${scy} ${sx2} ${sy2}`}
                fill="none"
                stroke={el.strokeColor || '#1d1d1f'}
                strokeWidth={el.strokeWidth || 2}
                strokeLinecap="round"
              />
            ) : (
              <line
                x1={sx1} y1={sy1}
                x2={sx2} y2={sy2}
                stroke={el.strokeColor || '#1d1d1f'}
                strokeWidth={el.strokeWidth || 2}
                strokeLinecap="round"
                markerEnd={el.type === ELEMENT_TYPES.ARROW ? `url(#arrowhead-${el.id})` : undefined}
              />
            )}
            {/* Invisible thick hit area for easier selection */}
            {el.type === ELEMENT_TYPES.ARC ? (
              <path
                d={`M ${sx1} ${sy1} Q ${scx} ${scy} ${sx2} ${sy2}`}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
              />
            ) : (
              <line
                x1={sx1} y1={sy1}
                x2={sx2} y2={sy2}
                stroke="transparent"
                strokeWidth="12"
              />
            )}
            {/* Endpoint handles when selected */}
            {isSelected && !isEditing && (
              <>
                <circle
                  cx={sx1} cy={sy1} r="5"
                  className="sb-connector-endpoint"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setResizeInfo({ id: el.id, handle: 'p1', startX: coords.x, startY: coords.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height, origX1: el.x1, origY1: el.y1 });
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length !== 1) return;
                    e.stopPropagation();
                    e.preventDefault();
                    const t = e.touches[0];
                    const coords = getCanvasCoords(t.clientX, t.clientY);
                    setResizeInfo({ id: el.id, handle: 'p1', startX: coords.x, startY: coords.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height, origX1: el.x1, origY1: el.y1 });
                  }}
                />
                <circle
                  cx={sx2} cy={sy2} r="5"
                  className="sb-connector-endpoint"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setResizeInfo({ id: el.id, handle: 'p2', startX: coords.x, startY: coords.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height, origX2: el.x2, origY2: el.y2 });
                  }}
                  onTouchStart={(e) => {
                    if (e.touches.length !== 1) return;
                    e.stopPropagation();
                    e.preventDefault();
                    const t = e.touches[0];
                    const coords = getCanvasCoords(t.clientX, t.clientY);
                    setResizeInfo({ id: el.id, handle: 'p2', startX: coords.x, startY: coords.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height, origX2: el.x2, origY2: el.y2 });
                  }}
                />
                {el.type === ELEMENT_TYPES.ARC && (() => {
                  // Display the green dot at the curve midpoint (t=0.5), not at the control point
                  const midCurveX = 0.25 * sx1 + 0.5 * scx + 0.25 * sx2;
                  const midCurveY = 0.25 * sy1 + 0.5 * scy + 0.25 * sy2;
                  return (
                  <circle
                    cx={midCurveX} cy={midCurveY} r="5"
                    className="sb-connector-control-point"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const dragData = { id: el.id };
                      setControlPointDrag(dragData);
                      controlPointDragRef.current = dragData;
                    }}
                    onTouchStart={(e) => {
                      if (e.touches.length !== 1) return;
                      e.stopPropagation();
                      e.preventDefault();
                      const dragData = { id: el.id };
                      setControlPointDrag(dragData);
                      controlPointDragRef.current = dragData;
                    }}
                  />
                  );
                })()}
              </>
            )}
          </svg>
          );
        })()}

        {isSelected && !isEditing && !isConnector && !el.locked && (
          <>
            <div className="sb-handle sb-handle-nw" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'nw')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 'nw')} />
            <div className="sb-handle sb-handle-ne" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'ne')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 'ne')} />
            <div className="sb-handle sb-handle-sw" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'sw')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 'sw')} />
            <div className="sb-handle sb-handle-se" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'se')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 'se')} />
            <div className="sb-handle sb-handle-n" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'n')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 'n')} />
            <div className="sb-handle sb-handle-s" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 's')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 's')} />
            <div className="sb-handle sb-handle-e" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'e')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 'e')} />
            <div className="sb-handle sb-handle-w" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'w')} onTouchStart={(e) => handleResizeTouchStart(e, el.id, 'w')} />
          </>
        )}

        {/* Element options popover — appears below the selected element */}
        {isPrimary && !isEditing && el.type !== ELEMENT_TYPES.LINK && (
          <div
            className="sb-text-options"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            ref={fontMenuRef}
          >
            <div className="sb-text-opt-group">
              {/* === TEXT popover: color, Aa font weight, size === */}
              {el.type === ELEMENT_TYPES.TEXT && (
                <>
                  <input
                    type="color"
                    className="sb-text-color-circle"
                    value={el.color || '#000000'}
                    onChange={(e) => updateElement(el.id, { color: e.target.value })}
                    title="Couleur du texte"
                  />
                  <div className="sb-font-menu-wrapper">
                    <button
                      className={`sb-text-aa-btn ${showFontMenu ? 'active' : ''}`}
                      onClick={() => setShowFontMenu(!showFontMenu)}
                    >
                      Aa
                    </button>
                    {showFontMenu && (
                      <div className="sb-font-menu">
                        {[
                          { label: 'Leger', value: '300' },
                          { label: 'Normal', value: '400' },
                          { label: 'Gras', value: '700' },
                        ].map((fw) => (
                          <button
                            key={fw.value}
                            className={`sb-font-item ${String(el.fontWeight || '400') === fw.value ? 'active' : ''}`}
                            style={{ fontWeight: fw.value }}
                            onClick={() => {
                              updateElement(el.id, { fontWeight: fw.value });
                              setShowFontMenu(false);
                            }}
                          >
                            {fw.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="sb-font-menu-wrapper">
                    <button
                      className={`sb-text-size-btn ${showSizeMenu ? 'active' : ''}`}
                      onClick={() => { setShowSizeMenu(!showSizeMenu); setShowFontMenu(false); }}
                    >
                      {el.fontSize || 14}
                    </button>
                    {showSizeMenu && (
                      <div className="sb-font-menu sb-size-menu">
                        {[10, 12, 14, 18, 24, 36, 48, 64, 72, 96, 144].map((size) => (
                          <button
                            key={size}
                            className={`sb-font-item ${(el.fontSize || 14) === size ? 'active' : ''}`}
                            onClick={() => {
                              updateElement(el.id, { fontSize: size });
                              setShowSizeMenu(false);
                            }}
                          >
                            {(el.fontSize || 14) === size && (
                              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="2 8 6 12 14 4" /></svg>
                            )}
                            {size}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* === SHAPE popover: fill color, stroke color (with no-stroke toggle), Aa label === */}
              {el.type === ELEMENT_TYPES.SHAPE && (
                <>
                  <input
                    type="color"
                    className="sb-text-color-circle"
                    value={el.fillColor === 'transparent' ? '#ffffff' : (el.fillColor || '#ffffff')}
                    onChange={(e) => updateElement(el.id, { fillColor: e.target.value })}
                    title="Couleur de remplissage"
                  />
                  <div className="sb-stroke-toggle-wrapper">
                    <input
                      type="color"
                      className="sb-text-color-circle sb-stroke-color-input"
                      value={el.strokeColor || '#1d1d1f'}
                      onChange={(e) => updateElement(el.id, { strokeColor: e.target.value })}
                      title="Couleur de bordure"
                      style={el.strokeColor === 'transparent' || !el.strokeColor ? { opacity: 0.4 } : {}}
                    />
                    {(el.strokeColor === 'transparent') && (
                      <svg className="sb-no-stroke-icon" viewBox="0 0 20 20" width="14" height="14">
                        <line x1="3" y1="3" x2="17" y2="17" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                  <div className="sb-font-menu-wrapper">
                    <button
                      className="sb-text-aa-btn"
                      onClick={() => {
                        const next = el.strokeColor === 'transparent' ? '#1d1d1f' : 'transparent';
                        updateElement(el.id, { strokeColor: next });
                      }}
                      title={el.strokeColor === 'transparent' ? 'Ajouter bordure' : 'Supprimer bordure'}
                    >
                      {el.strokeColor === 'transparent' ? (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#ff3b30" strokeWidth="2" strokeLinecap="round">
                          <line x1="4" y1="4" x2="20" y2="20" />
                          <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* === STICKY popover: color choices === */}
              {el.type === ELEMENT_TYPES.STICKY && (
                <>
                  {STICKY_COLORS.map(color => (
                    <button
                      key={color}
                      className={`sb-popover-color-btn ${el.color === color ? 'active' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => updateElement(el.id, { color })}
                    />
                  ))}
                </>
              )}

              {/* === CONNECTOR (line/arrow/arc) popover: color, thickness === */}
              {isConnector && (
                <>
                  <input
                    type="color"
                    className="sb-text-color-circle"
                    value={el.strokeColor || '#1d1d1f'}
                    onChange={(e) => updateElement(el.id, { strokeColor: e.target.value })}
                    title="Couleur du trait"
                  />
                  <div className="sb-font-menu-wrapper">
                    <button
                      className="sb-text-size-btn"
                      onClick={() => { setShowSizeMenu(!showSizeMenu); setShowFontMenu(false); }}
                    >
                      {el.strokeWidth || 2}px
                    </button>
                    {showSizeMenu && (
                      <div className="sb-font-menu sb-size-menu">
                        {[1, 2, 3, 4, 6, 8].map(w => (
                          <button
                            key={w}
                            className={`sb-font-item ${(el.strokeWidth || 2) === w ? 'active' : ''}`}
                            onClick={() => {
                              updateElement(el.id, { strokeWidth: w });
                              setShowSizeMenu(false);
                            }}
                          >
                            {(el.strokeWidth || 2) === w && (
                              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="2 8 6 12 14 4" /></svg>
                            )}
                            {w}px
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* === IMAGE popover: info === */}
              {el.type === ELEMENT_TYPES.IMAGE && (
                <span className="sb-popover-info">Image</span>
              )}



              {/* Delete button for all types */}
              <button
                className="sb-popover-delete-btn"
                onClick={() => deleteElement(el.id)}
                title="Supprimer"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loadingBoard) {
    return (
      <div className={`storyboard-page ${embedded ? 'sb-editor-embedded' : ''}`}>
        <div className="sb-loading-fullscreen">
          <div className="sb-loading-spinner" />
          <p>Chargement du tableau...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`storyboard-page ${embedded ? 'sb-editor-embedded' : ''}`}>
      {/* Top bar */}
      <div className="sb-topbar" style={{ position: 'relative' }}>
        <div className="sb-topbar-left">
          <button className="sb-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1 className="sb-title">{boardTitle}</h1>
        </div>

        <div className="sb-topbar-center">
          <div className="sb-toolbar sb-toolbar-dark">
            <button className={`sb-tool-btn ${tool === 'select' ? 'active' : ''}`} onClick={() => setTool('select')} title="Selection (V)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /></svg>
            </button>
            <button className={`sb-tool-btn ${tool === 'text' ? 'active' : ''}`} onClick={() => setTool('text')} title="Texte (T)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <text x="12" y="16.5" textAnchor="middle" fill="currentColor" stroke="none" fontSize="12" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif">A</text>
              </svg>
            </button>
            <button className={`sb-tool-btn ${tool === 'sticky' ? 'active' : ''}`} onClick={() => setTool('sticky')} title="Note adhesive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M5 3h14a2 2 0 012 2v10l-6 6H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                <path d="M15 15v6l6-6h-6z" />
              </svg>
            </button>
            <button className={`sb-tool-btn ${tool === 'shape' || tool === 'line' || tool === 'arrow' || tool === 'arc' ? 'active' : ''}`} onClick={() => setTool('shape')} title="Forme">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="15" cy="9" r="6" />
                <rect x="3" y="11" width="11" height="11" rx="2" />
              </svg>
            </button>
            <div className="sb-attach-wrapper" ref={attachMenuRef}>
              <button className={`sb-tool-btn ${showAttachMenu ? 'active' : ''}`} onClick={() => setShowAttachMenu(!showAttachMenu)} title="Piece jointe">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              {showAttachMenu && (
                <>
                  <div className="sb-attach-overlay" onClick={() => setShowAttachMenu(false)} />
                  <div className="sb-attach-menu" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
                    <div className="sb-attach-header">Piece jointe</div>
                    <button className="sb-attach-item" onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                      <span>Ajouter une photo</span>
                    </button>
                    <button className="sb-attach-item" onClick={() => {
                      const rect = wrapperRef.current?.getBoundingClientRect();
                      if (rect) {
                        const centerX = (rect.width / 2 - panOffset.x) / zoom;
                        const centerY = (rect.height / 2 - panOffset.y) / zoom;
                        setShowLinkModal({ x: centerX, y: centerY });
                        setLinkModalUrl('');
                      }
                      setShowAttachMenu(false);
                    }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
                      <span>Ajouter un lien</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="sb-topbar-right">
          <button className="sb-action-btn" onClick={undo} title="Annuler" disabled={historyIndex <= 0}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></svg>
          </button>
          <button className="sb-action-btn" onClick={redo} title="Refaire" disabled={historyIndex >= history.length - 1}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" /></svg>
          </button>
          <div className="sb-tool-divider" />
          <button className="sb-action-btn" onClick={() => setShowGrid(!showGrid)} title="Grille">
            <svg viewBox="0 0 24 24" fill="none" stroke={showGrid ? '#0a84ff' : 'currentColor'} strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          </button>
          <div className="sb-zoom-controls">
            <button className="sb-zoom-btn" onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}>-</button>
            <span className="sb-zoom-label" onClick={resetView}>{Math.round(zoom * 100)}%</span>
            <button className="sb-zoom-btn" onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}>+</button>
          </div>
          <div className="sb-tool-divider" />
          <div className="sb-actions-pill">
            <button className="sb-pill-btn" onClick={exportBoard} title="Exporter">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" />
                <polyline points="8 8 12 4 16 8" />
                <line x1="12" y1="4" x2="12" y2="16" />
              </svg>
            </button>
            <button className="sb-pill-btn" onClick={onNewBoard} title="Nouveau projet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sub toolbars */}
      {(tool === 'shape' || tool === 'line' || tool === 'arrow' || tool === 'arc') && (
        <div className="sb-sub-toolbar">
          <span className="sb-sub-label">Forme :</span>
          {SHAPES.map(s => (
            <button key={s} className={`sb-shape-btn ${shapeType === s && tool === 'shape' ? 'active' : ''}`} onClick={() => { setShapeType(s); setTool('shape'); }}>
              {s === 'rectangle' && <svg width="20" height="20" viewBox="0 0 20 20"><rect x="2" y="4" width="16" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" rx="2" /></svg>}
              {s === 'circle' && <svg width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>}
              {s === 'diamond' && <svg width="20" height="20" viewBox="0 0 20 20"><polygon points="10,2 18,10 10,18 2,10" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>}
            </button>
          ))}
          <div className="sb-tool-divider" style={{ height: 20, margin: '0 4px' }} />
          {CONNECTOR_TYPES.map(ct => (
            <button
              key={ct}
              className={`sb-shape-btn ${tool === ct ? 'active' : ''}`}
              onClick={() => { setConnectorType(ct); setTool(ct); }}
            >
              {ct === 'line' && (
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <line x1="3" y1="17" x2="17" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
              {ct === 'arrow' && (
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <line x1="3" y1="17" x2="15" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <polyline points="10,4 16,4 16,10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {ct === 'arc' && (
                <svg width="20" height="20" viewBox="0 0 20 20">
                  <path d="M 3 17 Q 3 3 17 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="3" cy="17" r="2" fill="currentColor" />
                  <circle cx="17" cy="3" r="2" fill="currentColor" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}


      {/* Canvas area */}
      <div
        ref={wrapperRef}
        className={`storyboard-canvas-wrapper ${isSpaceHeld ? (isPanning ? 'sb-panning' : 'sb-space-held') : ''}`}
        style={showGrid ? (() => {
          const gridBase = 24;
          const gridSize = gridBase * zoom;
          const dotSize = Math.max(0.5, Math.min(1.5, 1 * zoom));
          const dotColor = 'rgba(180, 180, 185, 1)';
          return {
            backgroundImage: `radial-gradient(circle, ${dotColor} ${dotSize}px, transparent ${dotSize}px)`,
            backgroundSize: `${gridSize}px ${gridSize}px`,
            backgroundPosition: `${panOffset.x % gridSize}px ${panOffset.y % gridSize}px`,
          };
        })() : undefined}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          ref={canvasRef}
          className={`storyboard-canvas ${isPanning ? 'sb-panning' : ''} ${isSpaceHeld && !isPanning ? 'sb-space-held' : ''}`}
          style={{
            width: `${canvasBounds.width}px`,
            height: `${canvasBounds.height}px`,
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
          onTouchStart={handleCanvasTouchStart}
        >
          <div className="storyboard-canvas-inner">
            {elements.map(renderElement)}
          </div>
        </div>

        {/* Drawing preview for connectors */}
        {drawInfo && (
          <svg
            className="sb-draw-preview"
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
              {/* Anchor points on all elements */}
              {elements.filter(el => !CONNECTOR_TYPES.includes(el.type)).map(el => {
                const anchors = getAnchorPoints(el);
                return anchors.map(a => (
                  <circle
                    key={`${a.id}-${a.anchor}`}
                    cx={a.x} cy={a.y}
                    r={4 / zoom}
                    className="sb-anchor-point"
                    fill={
                      (drawInfo.snapTarget && drawInfo.snapTarget.id === a.id && drawInfo.snapTarget.anchor === a.anchor) ||
                      (drawInfo.sourceSnap && drawInfo.sourceSnap.id === a.id && drawInfo.sourceSnap.anchor === a.anchor)
                        ? '#34c759' : 'rgba(0, 122, 255, 0.4)'
                    }
                    stroke={
                      (drawInfo.snapTarget && drawInfo.snapTarget.id === a.id && drawInfo.snapTarget.anchor === a.anchor) ||
                      (drawInfo.sourceSnap && drawInfo.sourceSnap.id === a.id && drawInfo.sourceSnap.anchor === a.anchor)
                        ? '#34c759' : '#007aff'
                    }
                    strokeWidth={1.5 / zoom}
                  />
                ));
              })}

              {/* Snap ring indicator */}
              {drawInfo.snapTarget && (
                <circle
                  cx={drawInfo.snapTarget.x} cy={drawInfo.snapTarget.y}
                  r={10 / zoom}
                  fill="none"
                  stroke="#34c759"
                  strokeWidth={2 / zoom}
                  opacity="0.6"
                />
              )}

              {drawInfo.type === ELEMENT_TYPES.ARC ? (() => {
                const mx = (drawInfo.startX + drawInfo.currentX) / 2;
                const my = (drawInfo.startY + drawInfo.currentY) / 2;
                const dx = drawInfo.currentX - drawInfo.startX;
                const dy = drawInfo.currentY - drawInfo.startY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const nx = -dy, ny = dx;
                const nl = Math.sqrt(nx * nx + ny * ny) || 1;
                const cx = mx + (nx / nl) * dist * 0.3;
                const cy = my + (ny / nl) * dist * 0.3;
                return (
                  <path
                    d={`M ${drawInfo.startX} ${drawInfo.startY} Q ${cx} ${cy} ${drawInfo.currentX} ${drawInfo.currentY}`}
                    fill="none"
                    stroke="#007aff"
                    strokeWidth={2 / zoom}
                    strokeLinecap="round"
                    strokeDasharray={`${4 / zoom}`}
                  />
                );
              })() : (
                <>
                  <line
                    x1={drawInfo.startX} y1={drawInfo.startY}
                    x2={drawInfo.currentX} y2={drawInfo.currentY}
                    stroke="#007aff"
                    strokeWidth={2 / zoom}
                    strokeLinecap="round"
                    strokeDasharray={`${4 / zoom}`}
                  />
                  {drawInfo.type === ELEMENT_TYPES.ARROW && (() => {
                    const dx = drawInfo.currentX - drawInfo.startX;
                    const dy = drawInfo.currentY - drawInfo.startY;
                    const angle = Math.atan2(dy, dx);
                    const headLen = 12 / zoom;
                    const x2 = drawInfo.currentX;
                    const y2 = drawInfo.currentY;
                    return (
                      <polygon
                        points={`${x2},${y2} ${x2 - headLen * Math.cos(angle - 0.4)},${y2 - headLen * Math.sin(angle - 0.4)} ${x2 - headLen * Math.cos(angle + 0.4)},${y2 - headLen * Math.sin(angle + 0.4)}`}
                        fill="#007aff"
                      />
                    );
                  })()}
                </>
              )}
              <circle cx={drawInfo.startX} cy={drawInfo.startY} r={4 / zoom} fill="#007aff" />
              <circle cx={drawInfo.currentX} cy={drawInfo.currentY} r={4 / zoom} fill="#007aff" />
            </g>
          </svg>
        )}

        {/* Marquee selection rectangle */}
        {marqueeInfo && (() => {
          const mx1 = Math.min(marqueeInfo.startX, marqueeInfo.currentX);
          const my1 = Math.min(marqueeInfo.startY, marqueeInfo.currentY);
          const mw = Math.abs(marqueeInfo.currentX - marqueeInfo.startX);
          const mh = Math.abs(marqueeInfo.currentY - marqueeInfo.startY);
          if (mw < 2 && mh < 2) return null;
          return (
            <svg
              className="sb-marquee-overlay"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1001 }}
            >
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
                <rect
                  x={mx1} y={my1} width={mw} height={mh}
                  fill="rgba(0, 122, 255, 0.06)"
                  stroke="rgba(0, 122, 255, 0.5)"
                  strokeWidth={1 / zoom}
                  strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                  rx={1 / zoom}
                />
              </g>
            </svg>
          );
        })()}

        {/* Group bounding box for multi-selection */}
        {selectedIds.size > 1 && !marqueeInfo && (() => {
          let gx1 = Infinity, gy1 = Infinity, gx2 = -Infinity, gy2 = -Infinity;
          selectedIds.forEach(id => {
            const el = elements.find(e => e.id === id);
            if (!el) return;
            const isConn = el.type === ELEMENT_TYPES.LINE || el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC;
            let l, t, r, b;
            if (isConn) {
              l = el.x + Math.min(el.x1 || 0, el.x2 || 0);
              t = el.y + Math.min(el.y1 || 0, el.y2 || 0);
              r = el.x + Math.max(el.x1 || 0, el.x2 || 0);
              b = el.y + Math.max(el.y1 || 0, el.y2 || 0);
            } else {
              l = el.x;
              t = el.y;
              r = el.x + (el.width || 0);
              b = el.y + (el.height || 0);
            }
            if (l < gx1) gx1 = l;
            if (t < gy1) gy1 = t;
            if (r > gx2) gx2 = r;
            if (b > gy2) gy2 = b;
          });
          if (gx1 === Infinity) return null;
          const pad = 6;
          gx1 -= pad; gy1 -= pad; gx2 += pad; gy2 += pad;
          const hr = 4.5 / zoom;
          const cx = (gx1 + gx2) / 2;
          const cy = (gy1 + gy2) / 2;
          const handleProps = { r: hr, fill: '#007aff', stroke: '#ffffff', strokeWidth: 1.5 / zoom };
          return (
            <svg
              className="sb-group-bbox"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 998 }}
            >
              <g transform={`translate(${panOffset.x}, ${panOffset.y}) scale(${zoom})`}>
                <rect
                  x={gx1} y={gy1} width={gx2 - gx1} height={gy2 - gy1}
                  fill="none"
                  stroke="#007aff"
                  strokeWidth={1 / zoom}
                />
                {/* Corner handles */}
                <circle cx={gx1} cy={gy1} {...handleProps} />
                <circle cx={gx2} cy={gy1} {...handleProps} />
                <circle cx={gx1} cy={gy2} {...handleProps} />
                <circle cx={gx2} cy={gy2} {...handleProps} />
                {/* Edge midpoint handles */}
                <circle cx={cx} cy={gy1} {...handleProps} />
                <circle cx={cx} cy={gy2} {...handleProps} />
                <circle cx={gx1} cy={cy} {...handleProps} />
                <circle cx={gx2} cy={cy} {...handleProps} />
              </g>
            </svg>
          );
        })()}

        {elements.length === 0 && (
          <div className="sb-empty-state">
            <div className="sb-empty-icon">
              <svg viewBox="0 0 80 80" fill="none" stroke="#c7c7cc" strokeWidth="1.5">
                <rect x="10" y="10" width="60" height="60" rx="8" />
                <line x1="40" y1="25" x2="40" y2="55" />
                <line x1="25" y1="40" x2="55" y2="40" />
              </svg>
            </div>
            <h3>Commencez votre storyboard</h3>
            <p>Cliquez sur un outil puis sur le canevas pour ajouter des elements.<br />
              Glissez-deposez des images directement sur le plan de travail.</p>
           </div>
        )}

        {/* Custom scrollbars */}
        {scrollbarInfo && scrollbarInfo.showV && (
          <div
            className="sb-scrollbar sb-scrollbar-v"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="sb-scrollbar-thumb"
              style={{
                top: `${scrollbarInfo.vThumbPos}px`,
                height: `${scrollbarInfo.vThumbLen}px`,
              }}
              onMouseDown={(e) => handleScrollbarMouseDown('y', e)}
            />
          </div>
        )}
        {scrollbarInfo && scrollbarInfo.showH && (
          <div
            className="sb-scrollbar sb-scrollbar-h"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div
              className="sb-scrollbar-thumb"
              style={{
                left: `${scrollbarInfo.hThumbPos}px`,
                width: `${scrollbarInfo.hThumbLen}px`,
              }}
              onMouseDown={(e) => handleScrollbarMouseDown('x', e)}
            />
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu && (() => {
        const el = elements.find(e => e.id === contextMenu.elementId);
        if (!el) return null;
        const isFirst = elements[elements.length - 1]?.id === el.id;
        const isLast = elements[0]?.id === el.id;
        return (
          <div
            ref={contextMenuRef}
            className="sb-context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <button
              className={`sb-ctx-item ${isFirst ? 'disabled' : ''}`}
              disabled={isFirst}
              onClick={() => { bringToFront(el.id); setContextMenu(null); }}
            >
              Placer au premier plan
            </button>
            <button
              className={`sb-ctx-item ${isLast ? 'disabled' : ''}`}
              disabled={isLast}
              onClick={() => { sendToBack(el.id); setContextMenu(null); }}
            >
              Placer a l'arriere-plan
            </button>
            <div className="sb-ctx-divider" />
            <button className="sb-ctx-item" onClick={() => { cutElement(el.id); setContextMenu(null); }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
              Couper
            </button>
            <button className="sb-ctx-item" onClick={() => { copyElement(el.id); setContextMenu(null); }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copier
            </button>
            <button className={`sb-ctx-item ${!clipboard ? 'disabled' : ''}`} disabled={!clipboard} onClick={() => { pasteElement(); setContextMenu(null); }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" />
              </svg>
              Coller
            </button>
            <button className="sb-ctx-item" onClick={() => { duplicateElement(el.id); setContextMenu(null); }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="8" y="8" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /><line x1="14.5" y1="11.5" x2="14.5" y2="17.5" /><line x1="11.5" y1="14.5" x2="17.5" y2="14.5" />
              </svg>
              Dupliquer
            </button>
            <button className="sb-ctx-item" onClick={() => { toggleLockElement(el.id); setContextMenu(null); }}>
              {el.locked ? (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 019.9-1" />
                </svg>
              )}
              {el.locked ? 'Deverrouiller' : 'Verrouiller'}
            </button>
            <div className="sb-ctx-divider" />
            <button className="sb-ctx-item sb-ctx-danger" onClick={() => { deleteElement(el.id); setContextMenu(null); }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              {selectedIds.size > 1 ? `Supprimer (${selectedIds.size})` : 'Supprimer'}
            </button>
          </div>
        );
      })()}

      {/* Link modal */}
      {showLinkModal && (
        <div className="sb-link-modal-overlay" onClick={() => setShowLinkModal(null)} onTouchEnd={() => setShowLinkModal(null)}>
          <div className="sb-link-modal" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()} onTouchEnd={(e) => e.stopPropagation()}>
            <div className="sb-link-modal-icon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#86868b" strokeWidth="1.5">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </div>
            <h3 className="sb-link-modal-title">Ajouter un lien</h3>
            <p className="sb-link-modal-desc">Saisissez l'adresse du lien.</p>
            <input
              type="text"
              className="sb-link-modal-input"
              value={linkModalUrl}
              onChange={(e) => setLinkModalUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') confirmAddLink(); if (e.key === 'Escape') setShowLinkModal(null); }}
              placeholder="https://www.exemple.com/"
              autoFocus
            />
            <div className="sb-link-modal-actions">
              <button className="sb-link-modal-cancel" onClick={() => setShowLinkModal(null)}>Annuler</button>
              <button className="sb-link-modal-insert" disabled={!linkModalUrl.trim()} onClick={confirmAddLink}>Inserer</button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
    </div>
  );
}

// ============================================
// MAIN STORYBOARD COMPONENT
// ============================================
export default function Storyboard({ embedded = false }) {
  const [activeBoardId, setActiveBoardId] = useState(null);

  const handleNewBoard = async () => {
    try {
      const res = await storyboardAPI.create({
        title: 'Sans titre',
        color: '#007aff',
      });
      if (res.success) {
        setActiveBoardId(res.data.id);
      }
    } catch (err) {
      console.error('Erreur creation board:', err);
    }
  };

  if (activeBoardId) {
    return (
      <BoardEditor
        boardId={activeBoardId}
        onBack={() => setActiveBoardId(null)}
        onNewBoard={handleNewBoard}
        embedded={embedded}
      />
    );
  }

  return <BoardGallery onOpenBoard={(id) => setActiveBoardId(id)} embedded={embedded} />;
}
