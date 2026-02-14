import { useState, useRef, useCallback, useEffect } from 'react';
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

// Convert DB element to canvas element
const dbToCanvas = (dbEl) => ({
  id: `db-${dbEl.id}`,
  type: dbEl.element_type,
  x: parseFloat(dbEl.pos_x) || 0,
  y: parseFloat(dbEl.pos_y) || 0,
  width: parseFloat(dbEl.width) || 200,
  height: parseFloat(dbEl.height) || 200,
  content: dbEl.content || '',
  ...(dbEl.properties || {}),
});

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
                    <div className="sb-board-dots">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="sb-board-dot" style={{
                          opacity: Math.random() * 0.5 + 0.2,
                          width: Math.random() * 8 + 4,
                          height: Math.random() * 8 + 4,
                        }} />
                      ))}
                    </div>
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
function BoardEditor({ boardId, onBack, embedded = false }) {
  const [boardTitle, setBoardTitle] = useState('');
  const [elements, setElements] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [tool, setTool] = useState('select');
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
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
  const saveTimeoutRef = useRef(null);
  const elementsRef = useRef(elements);

  // Keep refs in sync with state
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  // Close attach menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(e.target)) {
        setShowAttachMenu(false);
      }
    };
    if (showAttachMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAttachMenu]);

  // Close font menu on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (fontMenuRef.current && !fontMenuRef.current.contains(e.target)) {
        setShowFontMenu(false);
      }
    };
    if (showFontMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showFontMenu]);

  // Close font/size menus when selection changes
  useEffect(() => { setShowFontMenu(false); setShowSizeMenu(false); setContextMenu(null); }, [selectedId]);

  // Close context menu on click outside or scroll
  useEffect(() => {
    if (!contextMenu) return;
    const handleClose = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    const handleScroll = () => setContextMenu(null);
    document.addEventListener('mousedown', handleClose);
    document.addEventListener('wheel', handleScroll);
    return () => {
      document.removeEventListener('mousedown', handleClose);
      document.removeEventListener('wheel', handleScroll);
    };
  }, [contextMenu]);

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
      } catch (err) {
        console.error('Erreur sauvegarde:', err);
      } finally {
        setSaving(false);
      }
    }, 1500);
  }, [boardId]);

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

  // Cleanup auto-save timeout
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
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
      content: 'Double-cliquez pour editer',
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
  const finalizeConnector = useCallback((type, x1, y1, x2, y2) => {
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
      // Tool shortcuts (only when no modifier keys)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && !editingId) {
        if (e.key === 'v' || e.key === 'V') { setTool('select'); }
        if (e.key === 't' || e.key === 'T') { setTool('text'); }
        if (e.key === 's' || e.key === 'S') { setTool('sticky'); }
        if (e.key === 'r' || e.key === 'R') { setTool('shape'); }
        if (e.key === 'l' || e.key === 'L') { setTool('link'); }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      setDrawInfo(prev => ({ ...prev, currentX: x, currentY: y }));
      drawInfoRef.current = { ...drawInfoRef.current, currentX: x, currentY: y };
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

    // Dragging a control point (arc)
    if (controlPointDragRef.current) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const el = elementsRef.current.find(item => item.id === controlPointDragRef.current.id);
      if (el) {
        const localX = x - el.x;
        const localY = y - el.y;
        setElements(prev => prev.map(item =>
          item.id === controlPointDragRef.current.id ? { ...item, cx: localX, cy: localY } : item
        ));
      }
      return;
    }

    if (dragInfo) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      if (dragInfo.groupOffsets) {
        // Group drag: move all selected elements
        setElements(prev => prev.map(el => {
          const offset = dragInfo.groupOffsets[el.id];
          if (offset) return { ...el, x: x - offset.dx, y: y - offset.dy };
          return el;
        }));
      } else {
        setElements(prev => prev.map(el =>
          el.id === dragInfo.id
            ? { ...el, x: x - dragInfo.startX, y: y - dragInfo.startY }
            : el
        ));
      }
      return;
    }

    if (resizeInfo) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const dx = x - resizeInfo.startX;
      const dy = y - resizeInfo.startY;

      // Handle connector endpoint dragging
      if (resizeInfo.handle === 'p1' || resizeInfo.handle === 'p2') {
        setElements(prev => prev.map(el => {
          if (el.id !== resizeInfo.id) return el;
          const localX = x - el.x;
          const localY = y - el.y;
          if (resizeInfo.handle === 'p1') {
            return { ...el, x1: localX, y1: localY };
          } else {
            return { ...el, x2: localX, y2: localY };
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
      finalizeConnector(drawInfoRef.current.type, drawInfoRef.current.startX, drawInfoRef.current.startY, drawInfoRef.current.currentX, drawInfoRef.current.currentY);
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

  // Pan with middle click or alt+click, or start drawing connectors
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    // Start drawing connector (line/arrow/arc)
    if (e.button === 0 && (tool === 'line' || tool === 'arrow' || tool === 'arc')) {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY);
      const info = { type: tool === 'line' ? ELEMENT_TYPES.LINE : tool === 'arrow' ? ELEMENT_TYPES.ARROW : ELEMENT_TYPES.ARC, startX: x, startY: y, currentX: x, currentY: y };
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

  // File input handler
  const handleFileSelect = useCallback((e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) addImage(file);
    });
    e.target.value = '';
  }, [addImage]);

  // Export as PDF
  const exportBoard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Temporarily hide selection UI for clean export
    const prevSelected = selectedId;
    setSelectedId(null);

    // Wait for re-render
    await new Promise((r) => setTimeout(r, 100));

    try {
      // Capture the entire canvas content
      const canvasEl = await html2canvas(canvas, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: 0,
        width: canvas.scrollWidth,
        height: canvas.scrollHeight,
      });

      const imgData = canvasEl.toDataURL('image/png');
      const imgWidth = canvasEl.width;
      const imgHeight = canvasEl.height;

      // Determine PDF orientation based on canvas aspect ratio
      const orientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
      const pdf = new jsPDF(orientation, 'px', [imgWidth / 2, imgHeight / 2]);

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth / 2, imgHeight / 2);
      pdf.save(`storyboard-${boardId}.pdf`);
    } catch (err) {
      console.error('Export PDF error:', err);
    }

    // Restore selection
    setSelectedId(prevSelected);
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

    const baseStyle = {
      position: 'absolute',
      left: el.x, top: el.y,
      width: el.width,
      height: isConnector ? el.height : (el.type === ELEMENT_TYPES.TEXT ? 'auto' : el.height),
      minHeight: el.type === ELEMENT_TYPES.TEXT ? el.height : undefined,
      cursor: el.locked ? 'default' : (dragInfo?.id === el.id ? 'grabbing' : 'grab'),
      zIndex: isSelected ? 999 : 'auto',
      ...(isConnector ? { border: 'none', background: 'transparent' } : {}),
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                  <span>{el.label}</span>
                </div>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0066cc" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                <span>{el.label}</span>
              </>
            )}
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
        {(el.type === ELEMENT_TYPES.LINE || el.type === ELEMENT_TYPES.ARROW || el.type === ELEMENT_TYPES.ARC) && (
          <svg
            className="sb-connector-element"
            width={el.width}
            height={el.height}
            viewBox={`0 0 ${el.width} ${el.height}`}
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
                d={`M ${el.x1} ${el.y1} Q ${el.cx} ${el.cy} ${el.x2} ${el.y2}`}
                fill="none"
                stroke={el.strokeColor || '#1d1d1f'}
                strokeWidth={el.strokeWidth || 2}
                strokeLinecap="round"
              />
            ) : (
              <line
                x1={el.x1} y1={el.y1}
                x2={el.x2} y2={el.y2}
                stroke={el.strokeColor || '#1d1d1f'}
                strokeWidth={el.strokeWidth || 2}
                strokeLinecap="round"
                markerEnd={el.type === ELEMENT_TYPES.ARROW ? `url(#arrowhead-${el.id})` : undefined}
              />
            )}
            {/* Invisible thick hit area for easier selection */}
            {el.type === ELEMENT_TYPES.ARC ? (
              <path
                d={`M ${el.x1} ${el.y1} Q ${el.cx} ${el.cy} ${el.x2} ${el.y2}`}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
              />
            ) : (
              <line
                x1={el.x1} y1={el.y1}
                x2={el.x2} y2={el.y2}
                stroke="transparent"
                strokeWidth="12"
              />
            )}
            {/* Endpoint handles when selected */}
            {isSelected && !isEditing && (
              <>
                <circle
                  cx={el.x1} cy={el.y1} r="5"
                  className="sb-connector-endpoint"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setResizeInfo({ id: el.id, handle: 'p1', startX: coords.x, startY: coords.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height, origX1: el.x1, origY1: el.y1 });
                  }}
                />
                <circle
                  cx={el.x2} cy={el.y2} r="5"
                  className="sb-connector-endpoint"
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const coords = getCanvasCoords(e.clientX, e.clientY);
                    setResizeInfo({ id: el.id, handle: 'p2', startX: coords.x, startY: coords.y, origX: el.x, origY: el.y, origW: el.width, origH: el.height, origX2: el.x2, origY2: el.y2 });
                  }}
                />
                {el.type === ELEMENT_TYPES.ARC && (
                  <circle
                    cx={el.cx} cy={el.cy} r="5"
                    className="sb-connector-control-point"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      const dragData = { id: el.id };
                      setControlPointDrag(dragData);
                      controlPointDragRef.current = dragData;
                    }}
                  />
                )}
              </>
            )}
          </svg>
        )}

        {isSelected && !isEditing && !isConnector && !el.locked && (
          <>
            <div className="sb-handle sb-handle-nw" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'nw')} />
            <div className="sb-handle sb-handle-ne" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'ne')} />
            <div className="sb-handle sb-handle-sw" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'sw')} />
            <div className="sb-handle sb-handle-se" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'se')} />
            <div className="sb-handle sb-handle-n" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'n')} />
            <div className="sb-handle sb-handle-s" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 's')} />
            <div className="sb-handle sb-handle-e" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'e')} />
            <div className="sb-handle sb-handle-w" onMouseDown={(e) => handleResizeMouseDown(e, el.id, 'w')} />
          </>
        )}

        {/* Element options popover — appears below the selected element */}
        {isPrimary && !isEditing && (
          <div
            className="sb-text-options"
            onMouseDown={(e) => e.stopPropagation()}
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

              {/* === LINK popover: edit URL === */}
              {el.type === ELEMENT_TYPES.LINK && (
                <input
                  type="text"
                  className="sb-popover-url-input"
                  value={el.url || ''}
                  placeholder="https://..."
                  onChange={(e) => updateElement(el.id, { url: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                />
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
      <div className="sb-topbar">
        <div className="sb-topbar-left">
          <button className="sb-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5m7-7l-7 7 7 7" />
            </svg>
          </button>
          <h1 className="sb-title">{boardTitle}</h1>
          <span className="sb-subtitle">
            {saving ? 'Sauvegarde...' : lastSaved ? 'Sauvegarde auto' : 'Edition'}
          </span>
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
                <div className="sb-attach-menu">
                  <button className="sb-attach-item" onClick={() => { fileInputRef.current?.click(); setShowAttachMenu(false); }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
                    <span>Ajouter une photo</span>
                  </button>
                  <button className="sb-attach-item" onClick={() => {
                    // Ouvrir le modal de lien au centre visible du canvas
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
            <svg viewBox="0 0 24 24" fill="none" stroke={showGrid ? '#007aff' : 'currentColor'} strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          </button>
          <div className="sb-zoom-controls">
            <button className="sb-zoom-btn" onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}>-</button>
            <span className="sb-zoom-label" onClick={resetView}>{Math.round(zoom * 100)}%</span>
            <button className="sb-zoom-btn" onClick={() => setZoom(prev => Math.min(3, prev + 0.25))}>+</button>
          </div>
          <div className="sb-tool-divider" />
          <button className="sb-action-btn" onClick={exportBoard} title="Exporter en PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          </button>
        </div>
      </div>

      {/* Sub toolbars */}
      {tool === 'sticky' && (
        <div className="sb-sub-toolbar">
          <span className="sb-sub-label">Couleur :</span>
          {STICKY_COLORS.map(color => (
            <button key={color} className={`sb-color-btn ${stickyColor === color ? 'active' : ''}`} style={{ backgroundColor: color }} onClick={() => setStickyColor(color)} />
          ))}
        </div>
      )}

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
        className="storyboard-canvas-wrapper"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <div
          ref={canvasRef}
          className={`storyboard-canvas ${showGrid ? 'sb-grid' : ''} ${isPanning ? 'sb-panning' : ''}`}
          style={{ transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
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
        <div className="sb-link-modal-overlay" onClick={() => setShowLinkModal(null)}>
          <div className="sb-link-modal" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
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

  if (activeBoardId) {
    return (
      <BoardEditor
        boardId={activeBoardId}
        onBack={() => setActiveBoardId(null)}
        embedded={embedded}
      />
    );
  }

  return <BoardGallery onOpenBoard={(id) => setActiveBoardId(id)} embedded={embedded} />;
}
