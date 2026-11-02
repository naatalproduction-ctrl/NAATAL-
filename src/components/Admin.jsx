// ============================================
// NAATAL - Panel d'Administration
// ============================================
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { usersAPI, comptabiliteAPI, projetsAPI, attachmentsAPI, cinemaAPI, boutiqueAPI, uploadsAPI, storyboardAPI, partnersAPI, prestationsAPI, offresAPI, tasksAPI, leadsAPI, prospectsAPI } from '../services/api'
import Storyboard from './Storyboard'
import PortfolioAdmin from './PortfolioAdmin'
import './Admin.css'

// Composant AnimatedCounter - Animation style chrono
function AnimatedCounter({ value, duration = 800, prefix = '', suffix = '' }) {
  const [displayValue, setDisplayValue] = useState(0)
  const previousValue = useRef(0)
  
  useEffect(() => {
    const startValue = previousValue.current
    const endValue = typeof value === 'number' ? value : parseFloat(value) || 0
    const startTime = performance.now()
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function pour un effet plus dynamique
      const easeOutExpo = 1 - Math.pow(2, -10 * progress)
      
      const current = startValue + (endValue - startValue) * easeOutExpo
      setDisplayValue(Math.floor(current))
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setDisplayValue(endValue)
        previousValue.current = endValue
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])
  
  // Formater le nombre avec des espaces
  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }
  
  return (
    <span className="animated-counter">
      {prefix}{formatNumber(displayValue)}{suffix}
    </span>
  )
}

// Chip feature draggable + editable inline (offres admin)
function FeatureChip({ value, index, total, excluded = false, onChange, onRemove, onMove, dragState, setDragState, listKey }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => { if (editing) inputRef.current?.focus() }, [editing])

  const commit = () => {
    const v = draft.trim()
    if (v && v !== value) onChange(v)
    else setDraft(value)
    setEditing(false)
  }

  const isDragging = dragState?.list === listKey && dragState?.from === index
  const isHovered = dragState?.list === listKey && dragState?.over === index && dragState?.from !== index

  return (
    <div
      className={`feature-chip ${excluded ? 'feature-chip--excluded' : ''} ${isDragging ? 'feature-chip--dragging' : ''} ${isHovered ? 'feature-chip--over' : ''}`}
      draggable={!editing}
      onDragStart={(e) => {
        setDragState({ list: listKey, from: index, over: index })
        e.dataTransfer.effectAllowed = 'move'
        try { e.dataTransfer.setData('text/plain', String(index)) } catch (_) {}
      }}
      onDragOver={(e) => {
        if (dragState?.list !== listKey) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragState.over !== index) setDragState({ ...dragState, over: index })
      }}
      onDrop={(e) => {
        e.preventDefault()
        if (dragState?.list === listKey && dragState.from !== index) {
          onMove(dragState.from, index)
        }
        setDragState(null)
      }}
      onDragEnd={() => setDragState(null)}
    >
      <span className="feature-chip-grip" title="Glisser pour réordonner">⋮⋮</span>
      <button
        type="button"
        className="feature-chip-move"
        disabled={index === 0}
        onClick={() => onMove(index, index - 1)}
        title="Monter"
      >▲</button>
      <button
        type="button"
        className="feature-chip-move"
        disabled={index === total - 1}
        onClick={() => onMove(index, index + 1)}
        title="Descendre"
      >▼</button>

      {editing ? (
        <input
          ref={inputRef}
          className="feature-chip-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
            else if (e.key === 'Escape') { setDraft(value); setEditing(false) }
          }}
        />
      ) : (
        <span
          className="feature-chip-text"
          onClick={() => setEditing(true)}
          title="Cliquer pour modifier"
        >{value}</span>
      )}

      <button type="button" className="btn-remove-feature" onClick={onRemove} title="Supprimer">x</button>
    </div>
  )
}

const GENERAL_FIELDS = [
  { key: 'site_name', info: 'name', label: 'Nom du site', type: 'text' },
  { key: 'contact_email', info: 'email', label: 'Email', type: 'email' },
  { key: 'contact_phone', info: 'phone', label: 'Téléphone', type: 'tel' },
]

export default function Admin() {
  const {
    medias,
    messages,
    siteInfo,
    admin,
    login, 
    logout, 
    isAuthenticated,
    addMedia,
    updateMedia,
    deleteMedia,
    fetchMedias,
    markMessageAsRead,
    deleteMessage,
    unreadCount,
    loading,
    updateSettings
  } = useSite()

  const [activeTab, setActiveTabState] = useState(() => {
    return sessionStorage.getItem('naatal_admin_tab') || 'dashboard'
  })
  const setActiveTab = (tab) => {
    sessionStorage.setItem('naatal_admin_tab', tab)
    setActiveTabState(tab)
  }
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [generalDraft, setGeneralDraft] = useState({})
  const [generalStatus, setGeneralStatus] = useState(null)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const generalValue = (field) => generalDraft[field.key] ?? siteInfo[field.info] ?? ''
  const generalChanges = Object.fromEntries(
    GENERAL_FIELDS
      .filter(field => generalValue(field).trim() !== (siteInfo[field.info] || ''))
      .map(field => [field.key, generalValue(field).trim()])
  )

  const handleSaveGeneral = async () => {
    const missing = GENERAL_FIELDS.find(field => !generalValue(field).trim())
    if (missing) {
      setGeneralStatus({ type: 'error', text: `${missing.label} : champ requis` })
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(generalValue(GENERAL_FIELDS[1]).trim())) {
      setGeneralStatus({ type: 'error', text: 'Adresse email invalide' })
      return
    }
    setSavingGeneral(true)
    setGeneralStatus(null)
    const result = await updateSettings(generalChanges)
    setSavingGeneral(false)
    if (result?.success) {
      setGeneralDraft({})
      setGeneralStatus({ type: 'success', text: 'Informations enregistrées' })
    } else {
      setGeneralStatus({ type: 'error', text: result?.error || 'Enregistrement impossible' })
    }
  }
  const [darkMode, setDarkMode] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [editingMedia, setEditingMedia] = useState(null)
  const [showAddMedia, setShowAddMedia] = useState(false)
  const [newMedia, setNewMedia] = useState({
    name: '',
    type: 'youtube',
    url: '',
    description: '',
    featured: false
  })

  // État pour la gestion des utilisateurs
  const [users, setUsers] = useState([])
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'admin' })
  const [userError, setUserError] = useState('')
  const [userSuccess, setUserSuccess] = useState('')

  // État pour la comptabilité
  const [transactions, setTransactions] = useState([])
  const [comptaStats, setComptaStats] = useState(null)
  const [comptaCategories, setComptaCategories] = useState({ revenu: [], depense: [] })
  const [showAddTransaction, setShowAddTransaction] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [newTransaction, setNewTransaction] = useState({
    type: 'revenu',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    client: '',
    project: '',
    payment_method: '',
    reference: '',
    notes: '',
    payment_type: 'comptant',
    total_project: '',
    acompte_number: 1,
    total_acomptes: 1
  })
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1
  const [comptaFilter, setComptaFilter] = useState({ type: '', year: currentYear, month: currentMonth })
  const [comptaError, setComptaError] = useState('')
  const [comptaSuccess, setComptaSuccess] = useState('')
  const [expandedTransactions, setExpandedTransactions] = useState({})

  // État pour les pièces jointes
  const [attachments, setAttachments] = useState({})
  const [uploadingFile, setUploadingFile] = useState(false)
  const fileInputRef = useRef(null)

  // État pour les projets
  const [projets, setProjets] = useState([])
  const [projetsStats, setProjetsStats] = useState(null)
  const [projetsOptions, setProjetsOptions] = useState({ types: [], statuts: [] })
  const [showAddProjet, setShowAddProjet] = useState(false)
  const [editingProjet, setEditingProjet] = useState(null)
  const [viewingProjet, setViewingProjet] = useState(null)
  const [newProjet, setNewProjet] = useState({
    titre: '',
    type: 'film',
    statut: 'en_developpement',
    synopsis: '',
    logline: '',
    genre: '',
    duree_prevue: '',
    format: '',
    langue: 'Français',
    realisateur: '',
    producteur: '',
    scenariste: '',
    directeur_photo: '',
    casting: '',
    client: '',
    production: 'NAATAL Production',
    date_debut: '',
    date_fin_prevue: '',
    budget_prevu: '',
    notes: '',
    priorite: 3,
    progression: 0
  })
  const [projetFilter, setProjetFilter] = useState({ type: '', statut: '', search: '' })
  const [projetError, setProjetError] = useState('')
  const [projetSuccess, setProjetSuccess] = useState('')

  // État pour Cinéma
  const [cinemaItems, setCinemaItems] = useState([])
  const [showAddCinema, setShowAddCinema] = useState(false)
  const [editingCinema, setEditingCinema] = useState(null)
  const [newCinema, setNewCinema] = useState({
    title: '',
    year: new Date().getFullYear(),
    director: '',
    genre: '',
    duration: '',
    description: '',
    video_url: '',
    poster_url: '',
    trailer_url: '',
    cover_url: '',
    status: 'draft',
    display_order: 0
  })
  const [cinemaError, setCinemaError] = useState('')
  const [cinemaSuccess, setCinemaSuccess] = useState('')

  // État pour Boutique
  const [boutiqueItems, setBoutiqueItems] = useState([])
  const [showAddBoutique, setShowAddBoutique] = useState(false)
  const [editingBoutique, setEditingBoutique] = useState(null)
  const [newBoutique, setNewBoutique] = useState({
    name: '',
    price: '',
    currency: 'EUR',
    description: '',
    features: [],
    image_url: '',
    purchase_url: '',
    color: 'rgba(107, 174, 255, 0.2)',
    status: 'active',
    display_order: 0
  })
  const [boutiqueError, setBoutiqueError] = useState('')
  const [boutiqueSuccess, setBoutiqueSuccess] = useState('')
  const [newFeature, setNewFeature] = useState('')

  // État pour les partenaires
  const [partnersItems, setPartnersItems] = useState([])
  const [showAddPartner, setShowAddPartner] = useState(false)
  const [editingPartner, setEditingPartner] = useState(null)
  const [newPartner, setNewPartner] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    display_order: 0,
    is_active: true
  })
  const [partnerError, setPartnerError] = useState('')
  const [partnerSuccess, setPartnerSuccess] = useState('')
  const partnerLogoInputRef = useRef(null)
  const editPartnerLogoInputRef = useRef(null)

  // État pour les prestations
  const [prestationsItems, setPrestationsItems] = useState([])
  const [showAddPrestation, setShowAddPrestation] = useState(false)
  const [editingPrestation, setEditingPrestation] = useState(null)
  const [newPrestation, setNewPrestation] = useState({
    title: '',
    description: '',
    icon: 'video',
    details: [],
    image_url: '',
    status: 'active',
    display_order: 0
  })
  const [prestationError, setPrestationError] = useState('')
  const [prestationSuccess, setPrestationSuccess] = useState('')
  const [newDetail, setNewDetail] = useState('')

  // État pour les offres
  const [offresItems, setOffresItems] = useState([])
  const [showAddOffre, setShowAddOffre] = useState(false)
  const [editingOffre, setEditingOffre] = useState(null)
  const [newOffre, setNewOffre] = useState({
    name: '', type: 'package', target: '', description: '', price: 0,
    period: '/ mois', features: [], not_included: [], cta: 'Choisir',
    is_featured: false, status: 'active', display_order: 0
  })
  const [offreError, setOffreError] = useState('')
  const [offreSuccess, setOffreSuccess] = useState('')
  const [newOffreFeature, setNewOffreFeature] = useState('')

  // État pour les tâches
  const [tasks, setTasks] = useState([])
  const [tasksStats, setTasksStats] = useState(null)
  const [showAddTask, setShowAddTask] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [taskFilter, setTaskFilter] = useState('all')
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '', category: '' })
  const [taskError, setTaskError] = useState('')
  const [taskSuccess, setTaskSuccess] = useState('')
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverCol, setDragOverCol] = useState(null)

  // État pour Leads Power
  const [leads, setLeads] = useState([])
  const [leadsStats, setLeadsStats] = useState(null)
  const [showAddLead, setShowAddLead] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [leadFilter, setLeadFilter] = useState('all')
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', phone2: '', phone3: '', company: '', service: '', budget: '', message: '', channel: 'whatsapp' })
  const [showAddProspect, setShowAddProspect] = useState(false)
  const [newProspect, setNewProspect] = useState({ name: '', phone: '', email: '', company: '', address: '', category: '', channel: 'whatsapp', notes: '' })

  // État pour Prospection
  const [leadsSubTab, setLeadsSubTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState('Abidjan')
  const [searchLimit, setSearchLimit] = useState(10)
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchType, setSearchType] = useState('maps')
  const [selectedProspects, setSelectedProspects] = useState([])
  const [prospects, setProspects] = useState([])
  const [prospectsStats, setProspectsStats] = useState(null)
  const [prospectFilter, setProspectFilter] = useState('all')

  // État pour les uploads de covers
  const [uploadingCover, setUploadingCover] = useState(false)
  const cinemaCoverInputRef = useRef(null)
  const boutiqueCoverInputRef = useRef(null)
  const editCinemaCoverInputRef = useRef(null)
  const editBoutiqueCoverInputRef = useRef(null)

  // Charger les utilisateurs
  const fetchUsers = async () => {
    if (admin?.role === 'superadmin') {
      try {
        const response = await usersAPI.getAll()
        if (response.success) {
          setUsers(response.data)
        }
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err)
      }
    }
  }

  // Charger les données de comptabilité
  const fetchComptaData = async () => {
    try {
      // Passer les filtres année/mois aux stats
      const statsParams = {}
      if (comptaFilter.year) statsParams.year = comptaFilter.year
      if (comptaFilter.month) statsParams.month = comptaFilter.month
      
      const [statsRes, transRes, catRes] = await Promise.all([
        comptabiliteAPI.getStats(statsParams),
        comptabiliteAPI.getAll(comptaFilter),
        comptabiliteAPI.getCategories()
      ])
      if (statsRes.success) setComptaStats(statsRes.data)
      if (transRes.success) setTransactions(transRes.data)
      if (catRes.success) setComptaCategories(catRes.data)
    } catch (err) {
      console.error('Erreur chargement comptabilité:', err)
    }
  }

  // Charger les données des projets
  const fetchProjetsData = async () => {
    try {
      const [statsRes, projetsRes, optionsRes] = await Promise.all([
        projetsAPI.getStats(),
        projetsAPI.getAll(projetFilter),
        projetsAPI.getOptions()
      ])
      if (statsRes.success) setProjetsStats(statsRes.data)
      if (projetsRes.success) setProjets(projetsRes.data)
      if (optionsRes.success) setProjetsOptions(optionsRes.data)
    } catch (err) {
      console.error('Erreur chargement projets:', err)
    }
  }

  // Charger les données Cinéma
  const fetchCinemaData = async () => {
    try {
      const response = await cinemaAPI.getAll()
      if (response.success) {
        setCinemaItems(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement cinéma:', err)
    }
  }

  // Charger les données Boutique
  const fetchBoutiqueData = async () => {
    try {
      const response = await boutiqueAPI.getAll()
      if (response.success) {
        setBoutiqueItems(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement boutique:', err)
    }
  }

  const fetchPartnersData = async () => {
    try {
      const response = await partnersAPI.getAll()
      if (response.success) {
        setPartnersItems(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement partenaires:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && admin?.role === 'superadmin') {
      fetchUsers()
    }
  }, [isAuthenticated, admin])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'partners') {
      fetchPartnersData()
    }
  }, [isAuthenticated, activeTab])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'comptabilite') {
      fetchComptaData()
    }
  }, [isAuthenticated, activeTab, comptaFilter])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'projets') {
      fetchProjetsData()
    }
  }, [isAuthenticated, activeTab, projetFilter])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'cinema') {
      fetchCinemaData()
    }
  }, [isAuthenticated, activeTab])

  useEffect(() => {
    if (isAuthenticated && activeTab === 'boutique') {
      fetchBoutiqueData()
    }
  }, [isAuthenticated, activeTab])

  // Charger les données Prestations
  const fetchPrestationsData = async () => {
    try {
      const response = await prestationsAPI.getAll()
      if (response.success) {
        setPrestationsItems(response.data)
      }
    } catch (err) {
      console.error('Erreur chargement prestations:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'prestations') {
      fetchPrestationsData()
    }
  }, [isAuthenticated, activeTab])

  // Charger les données Offres
  const fetchOffresData = async () => {
    try {
      const response = await offresAPI.getAll()
      if (response.success) setOffresItems(response.data)
    } catch (err) {
      console.error('Erreur chargement offres:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'offres') {
      fetchOffresData()
    }
  }, [isAuthenticated, activeTab])

  // Charger les données des tâches
  const fetchTasksData = async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        tasksAPI.getAll(),
        tasksAPI.getStats()
      ])
      if (tasksRes.success) setTasks(tasksRes.data)
      if (statsRes.success) setTasksStats(statsRes.data)
    } catch (err) {
      console.error('Erreur chargement taches:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'tasks') {
      fetchTasksData()
    }
  }, [isAuthenticated, activeTab])

  // Leads Power
  const fetchLeadsData = async () => {
    try {
      const [leadsRes, statsRes] = await Promise.all([
        leadsAPI.getAll(),
        leadsAPI.getStats()
      ])
      if (leadsRes.success) setLeads(leadsRes.data)
      if (statsRes.success) setLeadsStats(statsRes.data)
    } catch (err) {
      console.error('Erreur chargement leads:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'leads') {
      fetchLeadsData()
    }
  }, [isAuthenticated, activeTab])

  const handleCreateLead = async () => {
    if (!newLead.name) return
    const result = await leadsAPI.create({ ...newLead, source: 'admin' })
    if (result.success) {
      setShowAddLead(false)
      setNewLead({ name: '', email: '', phone: '', phone2: '', phone3: '', company: '', service: '', budget: '', message: '', channel: 'whatsapp' })
      fetchLeadsData()
    }
  }

  const handleCreateProspect = async () => {
    if (!newProspect.name) return
    const result = await prospectsAPI.save({
      name: newProspect.name,
      phone: newProspect.phone,
      email: newProspect.email,
      address: newProspect.address || newProspect.company,
      category: newProspect.category,
      channel: newProspect.channel,
      notes: newProspect.notes,
      website: '',
      place_id: `manual_${Date.now()}`,
      search_query: 'manual',
      location: 'Abidjan',
    })
    if (result.success) {
      setShowAddProspect(false)
      setNewProspect({ name: '', phone: '', email: '', company: '', address: '', category: '', channel: 'whatsapp', notes: '' })
      fetchProspects()
    }
  }

  const handleUpdateLead = async (id, data) => {
    const result = await leadsAPI.update(id, data)
    if (result.success) {
      setEditingLead(null)
      fetchLeadsData()
    }
  }

  const handleDeleteLead = async (id) => {
    if (window.confirm('Supprimer ce lead ?')) {
      await leadsAPI.delete(id)
      fetchLeadsData()
    }
  }

  const getLeadStatusColor = (status) => {
    switch (status) {
      case 'nouveau': return '#3b82f6'
      case 'envoye': return '#6366f1'
      case 'contacte': return '#f59e0b'
      case 'a_relancer': return '#f97316'
      case 'en_discussion': return '#06b6d4'
      case 'devis': return '#8b5cf6'
      case 'rdv_fixe': return '#a855f7'
      case 'signe': return '#22c55e'
      case 'converti': return '#22c55e'
      case 'pas_interesse': return '#ef4444'
      case 'perdu': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getLeadStatusLabel = (status) => {
    switch (status) {
      case 'nouveau': return 'Nouveau'
      case 'envoye': return 'Envoyé'
      case 'contacte': return 'Contacté'
      case 'a_relancer': return 'À relancer'
      case 'en_discussion': return 'En discussion'
      case 'devis': return 'Devis envoyé'
      case 'rdv_fixe': return 'RDV fixé'
      case 'signe': return 'Signé'
      case 'converti': return 'Converti'
      case 'pas_interesse': return 'Pas intéressé'
      case 'perdu': return 'Perdu'
      default: return status
    }
  }

  const channelIcons = {
    whatsapp: '💬',
    instagram: '📸',
    linkedin: '💼',
    email: '📧',
    telephone: '📞',
    facebook: '👥',
    site: '🌐',
  }

  const getChannelLabel = (ch) => {
    const labels = { whatsapp: 'WhatsApp', instagram: 'Instagram', linkedin: 'LinkedIn', email: 'Email', telephone: 'Téléphone', facebook: 'Facebook', site: 'Site web' }
    return labels[ch] || ch
  }

  // Prospection
  const handleSearch = async () => {
    if (!searchQuery) return
    setSearching(true)
    try {
      const searchFn = searchType === 'google' ? prospectsAPI.searchGoogle : prospectsAPI.search
      const result = await searchFn({ searchQuery, location: searchLocation, limit: searchLimit })
      if (result.success) {
        setSearchResults(result.data)
        setSelectedProspects([])
      }
    } catch (err) {
      console.error('Erreur recherche:', err)
    }
    setSearching(false)
  }

  const fetchProspects = async () => {
    try {
      const [pRes, sRes] = await Promise.all([prospectsAPI.getAll(), prospectsAPI.getStats()])
      if (pRes.success) setProspects(pRes.data)
      if (sRes.success) setProspectsStats(sRes.data)
    } catch (err) {
      console.error('Erreur chargement prospects:', err)
    }
  }

  useEffect(() => {
    if (isAuthenticated && activeTab === 'leads' && leadsSubTab === 'prospects') {
      fetchProspects()
    }
  }, [isAuthenticated, activeTab, leadsSubTab])

  const handleSaveSelected = async () => {
    const toSave = searchResults.filter((_, i) => selectedProspects.includes(i)).map(p => ({
      ...p,
      search_query: searchQuery,
      location: searchLocation
    }))
    const result = await prospectsAPI.saveBulk(toSave)
    if (result.success) {
      setSelectedProspects([])
      alert(`${result.count} prospect(s) sauvegardé(s)`)
    }
  }

  const handleSaveAllResults = async () => {
    const toSave = searchResults.map(p => ({ ...p, search_query: searchQuery, location: searchLocation }))
    const result = await prospectsAPI.saveBulk(toSave)
    if (result.success) {
      alert(`${result.count} prospect(s) sauvegardé(s)`)
    }
  }

  const handleConvertProspect = async (id) => {
    const result = await prospectsAPI.convert(id)
    if (result.success) {
      fetchProspects()
      fetchLeadsData()
    }
  }

  const handleDeleteProspect = async (id) => {
    if (window.confirm('Supprimer ce prospect ?')) {
      await prospectsAPI.delete(id)
      fetchProspects()
    }
  }

  const toggleSelectProspect = (index) => {
    setSelectedProspects(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  // Créer une tâche
  const handleCreateTask = async () => {
    setTaskError('')
    setTaskSuccess('')

    if (!newTask.title) {
      setTaskError('Le titre est requis')
      return
    }

    try {
      const response = await tasksAPI.create(newTask)
      if (response.success) {
        setTaskSuccess('Tâche ajoutée avec succès')
        setShowAddTask(false)
        setNewTask({ title: '', description: '', priority: 'medium', due_date: '', assigned_to: '', category: '' })
        fetchTasksData()
        setTimeout(() => setTaskSuccess(''), 3000)
      }
    } catch (err) {
      setTaskError(err.message || 'Erreur lors de l\'ajout')
    }
  }

  // Modifier une tâche
  const handleUpdateTask = async () => {
    setTaskError('')
    setTaskSuccess('')

    if (!editingTask) return

    try {
      const response = await tasksAPI.update(editingTask.id, {
        title: editingTask.title,
        description: editingTask.description,
        status: editingTask.status,
        priority: editingTask.priority,
        due_date: editingTask.due_date || null,
        assigned_to: editingTask.assigned_to,
        category: editingTask.category
      })
      if (response.success) {
        setTaskSuccess('Tâche modifiée')
        setEditingTask(null)
        fetchTasksData()
        setTimeout(() => setTaskSuccess(''), 3000)
      }
    } catch (err) {
      setTaskError(err.message || 'Erreur lors de la modification')
    }
  }

  // Supprimer une tâche
  const handleDeleteTask = async (id) => {
    if (!window.confirm('Supprimer cette tâche ?')) return

    try {
      const response = await tasksAPI.delete(id)
      if (response.success) {
        setTaskSuccess('Tâche supprimée')
        fetchTasksData()
        setTimeout(() => setTaskSuccess(''), 3000)
      }
    } catch (err) {
      setTaskError(err.message || 'Erreur lors de la suppression')
    }
  }

  // Changer le statut d'une tâche (cycle: todo -> in_progress -> done -> todo)
  const handleToggleTaskStatus = async (task) => {
    const statusCycle = { todo: 'in_progress', in_progress: 'done', done: 'todo' }
    const newStatus = statusCycle[task.status]

    try {
      const response = await tasksAPI.update(task.id, { status: newStatus })
      if (response.success) {
        fetchTasksData()
      }
    } catch (err) {
      console.error('Erreur changement statut:', err)
    }
  }

  // Créer une transaction
  // Rafraîchir toutes les données du dashboard
  const handleRefreshDashboard = async () => {
    setRefreshing(true)
    try {
      await fetchMedias()
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Erreur refresh:', err)
    }
    setRefreshing(false)
  }

  const handleCreateTransaction = async () => {
    setComptaError('')
    setComptaSuccess('')
    
    if (!newTransaction.category || !newTransaction.amount) {
      setComptaError('Catégorie et montant sont requis')
      return
    }
    
    try {
      const response = await comptabiliteAPI.create({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
        total_project: newTransaction.total_project ? parseFloat(newTransaction.total_project) : null,
        acompte_number: parseInt(newTransaction.acompte_number) || 1,
        total_acomptes: parseInt(newTransaction.total_acomptes) || 1
      })
      if (response.success) {
        setComptaSuccess('Transaction ajoutée avec succès')
        setShowAddTransaction(false)
        setNewTransaction({
          type: 'revenu',
          category: '',
          description: '',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          client: '',
          project: '',
          payment_method: '',
          reference: '',
          notes: '',
          payment_type: 'comptant',
          total_project: '',
          acompte_number: 1,
          total_acomptes: 1
        })
        fetchComptaData()
        setTimeout(() => setComptaSuccess(''), 3000)
      }
    } catch (err) {
      setComptaError(err.message || 'Erreur lors de l\'ajout')
    }
  }

  // Modifier une transaction
  const handleUpdateTransaction = async () => {
    setComptaError('')
    setComptaSuccess('')
    
    if (!editingTransaction) return
    
    console.log('=== handleUpdateTransaction ===')
    console.log('editingTransaction:', editingTransaction)
    
    try {
      const updateData = {
        type: editingTransaction.type,
        category: editingTransaction.category,
        description: editingTransaction.description,
        amount: parseFloat(editingTransaction.amount),
        date: editingTransaction.date,
        client: editingTransaction.client,
        project: editingTransaction.project,
        payment_method: editingTransaction.payment_method,
        reference: editingTransaction.reference,
        notes: editingTransaction.notes,
        payment_type: editingTransaction.payment_type || 'comptant',
        total_project: editingTransaction.total_project ? parseFloat(editingTransaction.total_project) : null,
        acompte_number: parseInt(editingTransaction.acompte_number) || 1,
        total_acomptes: parseInt(editingTransaction.total_acomptes) || 1
      }
      
      console.log('Update data:', updateData)
      
      const response = await comptabiliteAPI.update(editingTransaction.id, updateData)
      console.log('API response:', response)
      
      if (response.success) {
        setComptaSuccess('Transaction modifiée')
        setEditingTransaction(null)
        fetchComptaData()
        setTimeout(() => setComptaSuccess(''), 3000)
      } else {
        setComptaError(response.error || 'Erreur lors de la modification')
      }
    } catch (err) {
      console.error('Update error:', err)
      setComptaError(err.message || 'Erreur lors de la modification')
    }
  }

  // Supprimer une transaction
  const handleDeleteTransaction = async (id) => {
    if (!window.confirm('Supprimer cette transaction ?')) return
    
    try {
      const response = await comptabiliteAPI.delete(id)
      if (response.success) {
        setComptaSuccess('Transaction supprimée')
        fetchComptaData()
        setTimeout(() => setComptaSuccess(''), 3000)
      }
    } catch (err) {
      setComptaError(err.message || 'Erreur lors de la suppression')
    }
  }

  // ============================================
  // GESTION DES PROJETS
  // ============================================

  // Créer un projet
  const handleCreateProjet = async () => {
    setProjetError('')
    setProjetSuccess('')
    
    if (!newProjet.titre || !newProjet.type) {
      setProjetError('Le titre et le type sont requis')
      return
    }
    
    try {
      const response = await projetsAPI.create({
        ...newProjet,
        duree_prevue: newProjet.duree_prevue || null,
        budget_prevu: newProjet.budget_prevu ? parseFloat(newProjet.budget_prevu) : null,
        priorite: parseInt(newProjet.priorite) || 3,
        progression: parseInt(newProjet.progression) || 0
      })
      if (response.success) {
        setProjetSuccess('Projet créé avec succès')
        setShowAddProjet(false)
        setNewProjet({
          titre: '',
          type: 'film',
          statut: 'en_developpement',
          synopsis: '',
          logline: '',
          genre: '',
          duree_prevue: '',
          format: '',
          langue: 'Français',
          realisateur: '',
          producteur: '',
          scenariste: '',
          directeur_photo: '',
          casting: '',
          client: '',
          production: 'NAATAL Production',
          date_debut: '',
          date_fin_prevue: '',
          budget_prevu: '',
          notes: '',
          priorite: 3,
          progression: 0
        })
        fetchProjetsData()
        setTimeout(() => setProjetSuccess(''), 3000)
      } else {
        setProjetError(response.error || 'Erreur lors de la création')
      }
    } catch (err) {
      setProjetError(err.message || 'Erreur lors de la création')
    }
  }

  // Modifier un projet
  const handleUpdateProjet = async () => {
    console.log('=== handleUpdateProjet called ===')
    console.log('editingProjet:', editingProjet)
    
    setProjetError('')
    setProjetSuccess('')
    
    if (!editingProjet || !editingProjet.titre || !editingProjet.type) {
      setProjetError('Le titre et le type sont requis')
      console.log('Validation failed')
      return
    }
    
    try {
      console.log('Calling API update for id:', editingProjet.id)
      const response = await projetsAPI.update(editingProjet.id, {
        titre: editingProjet.titre,
        type: editingProjet.type,
        statut: editingProjet.statut,
        synopsis: editingProjet.synopsis || null,
        logline: editingProjet.logline || null,
        genre: editingProjet.genre || null,
        duree_prevue: editingProjet.duree_prevue || null,
        format: editingProjet.format || null,
        langue: editingProjet.langue || null,
        realisateur: editingProjet.realisateur || null,
        producteur: editingProjet.producteur || null,
        scenariste: editingProjet.scenariste || null,
        directeur_photo: editingProjet.directeur_photo || null,
        casting: editingProjet.casting || null,
        client: editingProjet.client || null,
        production: editingProjet.production || null,
        date_debut: editingProjet.date_debut || null,
        date_fin_prevue: editingProjet.date_fin_prevue || null,
        budget_prevu: editingProjet.budget_prevu ? parseFloat(editingProjet.budget_prevu) : null,
        notes: editingProjet.notes || null,
        priorite: parseInt(editingProjet.priorite) || 3,
        progression: parseInt(editingProjet.progression) || 0
      })
      console.log('API response:', response)
      if (response.success) {
        setProjetSuccess('Projet modifié avec succès')
        setEditingProjet(null)
        fetchProjetsData()
        setTimeout(() => setProjetSuccess(''), 3000)
      } else {
        setProjetError(response.error || 'Erreur lors de la modification')
      }
    } catch (err) {
      console.error('Update error:', err)
      setProjetError(err.message || 'Erreur lors de la modification')
    }
  }

  // Supprimer un projet
  const handleDeleteProjet = async (id) => {
    if (!window.confirm('Supprimer ce projet ? Cette action est irréversible.')) return
    
    try {
      const response = await projetsAPI.delete(id)
      if (response.success) {
        setProjetSuccess('Projet supprimé')
        setViewingProjet(null)
        fetchProjetsData()
        setTimeout(() => setProjetSuccess(''), 3000)
      }
    } catch (err) {
      setProjetError(err.message || 'Erreur lors de la suppression')
    }
  }

  // Toggle priorité d'un projet (étoile)
  const togglePriorite = async (projet) => {
    try {
      // Si priorité >= 4 (haute), on met à 1 (basse), sinon on met à 5 (haute)
      const newPriorite = projet.priorite >= 4 ? 1 : 5
      
      const response = await projetsAPI.update(projet.id, {
        priorite: newPriorite
      })
      
      if (response.success) {
        // Mettre à jour la liste locale
        setProjets(prevProjets => 
          prevProjets.map(p => 
            p.id === projet.id ? { ...p, priorite: newPriorite } : p
          )
        )
        // Rafraîchir les stats
        fetchProjetsData()
      }
    } catch (err) {
      console.error('Erreur toggle priorité:', err)
    }
  }

  // ============================================
  // Gestion des pièces jointes
  // ============================================
  const fetchAttachments = async (entityType, entityId) => {
    try {
      const response = await attachmentsAPI.getByEntity(entityType, entityId)
      if (response.success) {
        setAttachments(prev => ({
          ...prev,
          [`${entityType}-${entityId}`]: response.data
        }))
      }
    } catch (err) {
      console.error('Erreur chargement pièces jointes:', err)
    }
  }

  const handleFileUpload = async (entityType, entityId, file) => {
    if (!file) return
    
    setUploadingFile(true)
    try {
      const response = await attachmentsAPI.upload(entityType, entityId, file)
      if (response.success) {
        fetchAttachments(entityType, entityId)
        if (entityType === 'transaction') {
          setComptaSuccess('Fichier ajouté')
          setTimeout(() => setComptaSuccess(''), 3000)
        } else {
          setProjetSuccess('Fichier ajouté')
          setTimeout(() => setProjetSuccess(''), 3000)
        }
      } else {
        throw new Error(response.error)
      }
    } catch (err) {
      const errorMsg = err.message || 'Erreur lors de l\'upload'
      if (entityType === 'transaction') {
        setComptaError(errorMsg)
      } else {
        setProjetError(errorMsg)
      }
    } finally {
      setUploadingFile(false)
    }
  }

  const handleDeleteAttachment = async (id, entityType, entityId) => {
    if (!window.confirm('Supprimer ce fichier ?')) return
    
    try {
      const response = await attachmentsAPI.delete(id)
      if (response.success) {
        fetchAttachments(entityType, entityId)
      }
    } catch (err) {
      console.error('Erreur suppression fichier:', err)
    }
  }

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('pdf')) return '📄'
    if (mimeType?.includes('image')) return '🖼️'
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝'
    if (mimeType?.includes('excel') || mimeType?.includes('sheet')) return '📊'
    return '📎'
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // ============================================
  // Gestion du Cinéma
  // ============================================
  const handleCreateCinema = async () => {
    setCinemaError('')
    setCinemaSuccess('')
    
    if (!newCinema.title) {
      setCinemaError('Le titre est requis')
      return
    }
    
    try {
      const response = await cinemaAPI.create(newCinema)
      if (response.success) {
        setCinemaSuccess('Film ajouté avec succès')
        setShowAddCinema(false)
        setNewCinema({
          title: '',
          year: new Date().getFullYear(),
          director: '',
          genre: '',
          duration: '',
          description: '',
          video_url: '',
          poster_url: '',
          trailer_url: '',
          cover_url: '',
          status: 'draft',
          display_order: 0
        })
        fetchCinemaData()
        setTimeout(() => setCinemaSuccess(''), 3000)
      }
    } catch (err) {
      setCinemaError(err.message || 'Erreur lors de la création')
    }
  }

  const handleUpdateCinema = async () => {
    if (!editingCinema) return
    
    try {
      const response = await cinemaAPI.update(editingCinema.id, editingCinema)
      if (response.success) {
        setCinemaSuccess('Film mis à jour')
        setEditingCinema(null)
        fetchCinemaData()
        setTimeout(() => setCinemaSuccess(''), 3000)
      }
    } catch (err) {
      setCinemaError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteCinema = async (id) => {
    if (!window.confirm('Supprimer ce film ? Cette action est irréversible.')) return
    
    try {
      const response = await cinemaAPI.delete(id)
      if (response.success) {
        setCinemaSuccess('Film supprimé')
        fetchCinemaData()
        setTimeout(() => setCinemaSuccess(''), 3000)
      }
    } catch (err) {
      setCinemaError(err.message || 'Erreur lors de la suppression')
    }
  }

  // ============================================
  // Gestion de la Boutique
  // ============================================
  const handleCreateBoutique = async () => {
    setBoutiqueError('')
    setBoutiqueSuccess('')
    
    if (!newBoutique.name) {
      setBoutiqueError('Le nom est requis')
      return
    }
    
    try {
      const response = await boutiqueAPI.create({
        ...newBoutique,
        price: newBoutique.price ? parseFloat(newBoutique.price) : null
      })
      if (response.success) {
        setBoutiqueSuccess('Produit ajouté avec succès')
        setShowAddBoutique(false)
        setNewBoutique({
          name: '',
          price: '',
          currency: 'EUR',
          description: '',
          features: [],
          image_url: '',
          purchase_url: '',
          color: 'rgba(107, 174, 255, 0.2)',
          status: 'active',
          display_order: 0
        })
        fetchBoutiqueData()
        setTimeout(() => setBoutiqueSuccess(''), 3000)
      }
    } catch (err) {
      setBoutiqueError(err.message || 'Erreur lors de la création')
    }
  }

  const handleUpdateBoutique = async () => {
    if (!editingBoutique) return
    
    try {
      const response = await boutiqueAPI.update(editingBoutique.id, {
        ...editingBoutique,
        price: editingBoutique.price ? parseFloat(editingBoutique.price) : null
      })
      if (response.success) {
        setBoutiqueSuccess('Produit mis à jour')
        setEditingBoutique(null)
        fetchBoutiqueData()
        setTimeout(() => setBoutiqueSuccess(''), 3000)
      }
    } catch (err) {
      setBoutiqueError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeleteBoutique = async (id) => {
    if (!window.confirm('Supprimer ce produit ? Cette action est irréversible.')) return
    
    try {
      const response = await boutiqueAPI.delete(id)
      if (response.success) {
        setBoutiqueSuccess('Produit supprimé')
        fetchBoutiqueData()
        setTimeout(() => setBoutiqueSuccess(''), 3000)
      }
    } catch (err) {
      setBoutiqueError(err.message || 'Erreur lors de la suppression')
    }
  }

  // CRUD Prestations
  const handleCreatePrestation = async () => {
    setPrestationError('')
    setPrestationSuccess('')

    if (!newPrestation.title) {
      setPrestationError('Le titre est requis')
      return
    }

    try {
      const response = await prestationsAPI.create(newPrestation)
      if (response.success) {
        setPrestationSuccess('Prestation ajoutée avec succès')
        setShowAddPrestation(false)
        setNewPrestation({ title: '', description: '', icon: 'video', details: [], image_url: '', status: 'active', display_order: 0 })
        fetchPrestationsData()
        setTimeout(() => setPrestationSuccess(''), 3000)
      }
    } catch (err) {
      setPrestationError(err.message || 'Erreur lors de la création')
    }
  }

  const handleUpdatePrestation = async () => {
    if (!editingPrestation) return
    setPrestationError('')

    try {
      const response = await prestationsAPI.update(editingPrestation.id, editingPrestation)
      if (response.success) {
        setPrestationSuccess('Prestation mise à jour')
        setEditingPrestation(null)
        fetchPrestationsData()
        setTimeout(() => setPrestationSuccess(''), 3000)
      }
    } catch (err) {
      setPrestationError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeletePrestation = async (id) => {
    if (!window.confirm('Supprimer cette prestation ? Cette action est irréversible.')) return

    try {
      const response = await prestationsAPI.delete(id)
      if (response.success) {
        setPrestationSuccess('Prestation supprimée')
        fetchPrestationsData()
        setTimeout(() => setPrestationSuccess(''), 3000)
      }
    } catch (err) {
      setPrestationError(err.message || 'Erreur lors de la suppression')
    }
  }

  const addDetail = (isEditing = false) => {
    const detail = newDetail.trim()
    if (!detail) return

    if (isEditing && editingPrestation) {
      const details = typeof editingPrestation.details === 'string'
        ? JSON.parse(editingPrestation.details)
        : editingPrestation.details || []
      setEditingPrestation({ ...editingPrestation, details: [...details, detail] })
    } else {
      setNewPrestation({ ...newPrestation, details: [...newPrestation.details, detail] })
    }
    setNewDetail('')
  }

  const removeDetail = (index, isEditing = false) => {
    if (isEditing && editingPrestation) {
      const details = typeof editingPrestation.details === 'string'
        ? JSON.parse(editingPrestation.details)
        : editingPrestation.details || []
      setEditingPrestation({ ...editingPrestation, details: details.filter((_, i) => i !== index) })
    } else {
      setNewPrestation({ ...newPrestation, details: newPrestation.details.filter((_, i) => i !== index) })
    }
  }

  // CRUD Offres
  const handleCreateOffre = async () => {
    setOffreError(''); setOffreSuccess('')
    if (!newOffre.name) { setOffreError('Le nom est requis'); return }
    try {
      const response = await offresAPI.create(newOffre)
      if (response.success) {
        setOffreSuccess('Offre ajoutee avec succes')
        setShowAddOffre(false)
        setNewOffre({ name: '', type: 'package', target: '', description: '', price: 0, period: '/ mois', features: [], not_included: [], cta: 'Choisir', is_featured: false, status: 'active', display_order: 0 })
        fetchOffresData()
        setTimeout(() => setOffreSuccess(''), 3000)
      }
    } catch (err) { setOffreError(err.message || 'Erreur lors de la creation') }
  }

  const handleUpdateOffre = async () => {
    if (!editingOffre) return
    setOffreError('')
    try {
      const response = await offresAPI.update(editingOffre.id, editingOffre)
      if (response.success) {
        setOffreSuccess('Offre mise a jour')
        setEditingOffre(null)
        fetchOffresData()
        setTimeout(() => setOffreSuccess(''), 3000)
      }
    } catch (err) { setOffreError(err.message || 'Erreur lors de la mise a jour') }
  }

  const handleDeleteOffre = async (id) => {
    if (!window.confirm('Supprimer cette offre ?')) return
    try {
      const response = await offresAPI.delete(id)
      if (response.success) {
        setOffreSuccess('Offre supprimee')
        fetchOffresData()
        setTimeout(() => setOffreSuccess(''), 3000)
      }
    } catch (err) { setOffreError(err.message || 'Erreur lors de la suppression') }
  }

  const addOffreFeature = (field, isEditing = false) => {
    const val = newOffreFeature.trim()
    if (!val) return
    if (isEditing && editingOffre) {
      const arr = typeof editingOffre[field] === 'string' ? JSON.parse(editingOffre[field]) : editingOffre[field] || []
      setEditingOffre({ ...editingOffre, [field]: [...arr, val] })
    } else {
      setNewOffre({ ...newOffre, [field]: [...(newOffre[field] || []), val] })
    }
    setNewOffreFeature('')
  }

  const removeOffreFeature = (field, index, isEditing = false) => {
    if (isEditing && editingOffre) {
      const arr = typeof editingOffre[field] === 'string' ? JSON.parse(editingOffre[field]) : editingOffre[field] || []
      setEditingOffre({ ...editingOffre, [field]: arr.filter((_, i) => i !== index) })
    } else {
      setNewOffre({ ...newOffre, [field]: (newOffre[field] || []).filter((_, i) => i !== index) })
    }
  }

  const updateOffreFeature = (field, index, value, isEditing = false) => {
    if (isEditing && editingOffre) {
      const arr = typeof editingOffre[field] === 'string' ? JSON.parse(editingOffre[field]) : editingOffre[field] || []
      setEditingOffre({ ...editingOffre, [field]: arr.map((v, i) => (i === index ? value : v)) })
    } else {
      setNewOffre({ ...newOffre, [field]: (newOffre[field] || []).map((v, i) => (i === index ? value : v)) })
    }
  }

  const moveOffreFeature = (field, from, to, isEditing = false) => {
    const src = isEditing && editingOffre
      ? (typeof editingOffre[field] === 'string' ? JSON.parse(editingOffre[field]) : editingOffre[field] || [])
      : (newOffre[field] || [])
    if (from < 0 || to < 0 || from >= src.length || to >= src.length || from === to) return
    const arr = [...src]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    if (isEditing && editingOffre) setEditingOffre({ ...editingOffre, [field]: arr })
    else setNewOffre({ ...newOffre, [field]: arr })
  }

  const [featureDrag, setFeatureDrag] = useState(null)

  // CRUD Partenaires
  const handleCreatePartner = async () => {
    setPartnerError('')
    setPartnerSuccess('')

    if (!newPartner.name || !newPartner.logo_url) {
      setPartnerError('Le nom et le logo sont requis')
      return
    }

    try {
      const response = await partnersAPI.create(newPartner)
      if (response.success) {
        setPartnerSuccess('Partenaire ajouté avec succès')
        setShowAddPartner(false)
        setNewPartner({ name: '', logo_url: '', website_url: '', display_order: 0, is_active: true })
        fetchPartnersData()
        setTimeout(() => setPartnerSuccess(''), 3000)
      }
    } catch (err) {
      setPartnerError(err.message || 'Erreur lors de la création')
    }
  }

  const handleUpdatePartner = async () => {
    if (!editingPartner) return

    try {
      const response = await partnersAPI.update(editingPartner.id, editingPartner)
      if (response.success) {
        setPartnerSuccess('Partenaire mis à jour')
        setEditingPartner(null)
        fetchPartnersData()
        setTimeout(() => setPartnerSuccess(''), 3000)
      }
    } catch (err) {
      setPartnerError(err.message || 'Erreur lors de la mise à jour')
    }
  }

  const handleDeletePartner = async (id) => {
    if (!window.confirm('Supprimer ce partenaire ? Cette action est irréversible.')) return

    try {
      const response = await partnersAPI.delete(id)
      if (response.success) {
        setPartnerSuccess('Partenaire supprimé')
        fetchPartnersData()
        setTimeout(() => setPartnerSuccess(''), 3000)
      }
    } catch (err) {
      setPartnerError(err.message || 'Erreur lors de la suppression')
    }
  }

  const handlePartnerLogoUpload = async (file, isEditing = false) => {
    if (!file) return
    setUploadingCover(true)
    try {
      const response = await uploadsAPI.uploadCover(file, 'partner')
      if (response.success) {
        const logoUrl = response.data.url
        if (isEditing && editingPartner) {
          setEditingPartner({ ...editingPartner, logo_url: logoUrl })
        } else {
          setNewPartner(prev => ({ ...prev, logo_url: logoUrl }))
        }
      }
    } catch (err) {
      setPartnerError('Erreur lors de l\'upload du logo')
    } finally {
      setUploadingCover(false)
    }
  }

  const getPartnerLogoUrl = (url) => {
    if (!url) return null
    if (url.startsWith('http')) return url
    const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'
    return `${baseUrl}${url}`
  }

  const addFeature = (isEditing = false) => {
    if (!newFeature.trim()) return
    if (isEditing && editingBoutique) {
      setEditingBoutique({
        ...editingBoutique,
        features: [...(editingBoutique.features || []), newFeature.trim()]
      })
    } else {
      setNewBoutique({
        ...newBoutique,
        features: [...newBoutique.features, newFeature.trim()]
      })
    }
    setNewFeature('')
  }

  const removeFeature = (index, isEditing = false) => {
    if (isEditing && editingBoutique) {
      setEditingBoutique({
        ...editingBoutique,
        features: (editingBoutique.features || []).filter((_, i) => i !== index)
      })
    } else {
      setNewBoutique({
        ...newBoutique,
        features: newBoutique.features.filter((_, i) => i !== index)
      })
    }
  }

  // ============================================
  // Gestion des uploads de covers
  // ============================================
  const handleCoverUpload = async (file, type, isEditing = false, section = 'cinema') => {
    if (!file) return
    
    setUploadingCover(true)
    try {
      const response = await uploadsAPI.uploadCover(file, type)
      if (response.success) {
        const imageUrl = uploadsAPI.getCoverUrl(response.data.url)
        
        if (section === 'cinema') {
          if (isEditing && editingCinema) {
            setEditingCinema({ ...editingCinema, cover_url: imageUrl })
          } else {
            setNewCinema({ ...newCinema, cover_url: imageUrl })
          }
          setCinemaSuccess('Image uploadée avec succès')
          setTimeout(() => setCinemaSuccess(''), 3000)
        } else if (section === 'boutique') {
          if (isEditing && editingBoutique) {
            setEditingBoutique({ ...editingBoutique, image_url: imageUrl })
          } else {
            setNewBoutique({ ...newBoutique, image_url: imageUrl })
          }
          setBoutiqueSuccess('Image uploadée avec succès')
          setTimeout(() => setBoutiqueSuccess(''), 3000)
        }
      } else {
        throw new Error(response.error || 'Erreur lors de l\'upload')
      }
    } catch (err) {
      const errorMsg = err.message || 'Erreur lors de l\'upload de l\'image'
      if (section === 'cinema') {
        setCinemaError(errorMsg)
      } else {
        setBoutiqueError(errorMsg)
      }
    } finally {
      setUploadingCover(false)
    }
  }

  // Obtenir la couleur du statut
  const getStatutColor = (statut) => {
    const colors = {
      'en_developpement': '#f59e0b',
      'pre_production': '#8b5cf6',
      'production': '#3b82f6',
      'post_production': '#ec4899',
      'termine': '#22c55e',
      'diffusion': '#06b6d4',
      'archive': '#6b7280'
    }
    return colors[statut] || '#6b7280'
  }

  // Obtenir la couleur du type
  const getTypeColor = (type) => {
    const colors = {
      'film': '#8b5cf6',
      'court-metrage': '#ec4899',
      'publicite': '#f59e0b',
      'documentaire': '#3b82f6',
      'clip': '#06b6d4',
      'corporate': '#22c55e',
      'serie': '#ef4444',
      'autre': '#6b7280'
    }
    return colors[type] || '#6b7280'
  }

  // Formater un montant en FCFA
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount) + ' FCFA'
  }

  // Créer un utilisateur
  const handleCreateUser = async () => {
    setUserError('')
    setUserSuccess('')
    
    if (!newUser.username || !newUser.email || !newUser.password) {
      setUserError('Tous les champs sont requis')
      return
    }
    
    try {
      const response = await usersAPI.create(newUser)
      if (response.success) {
        setUserSuccess('Utilisateur créé avec succès')
        setShowAddUser(false)
        setNewUser({ username: '', email: '', password: '', role: 'admin' })
        fetchUsers()
        setTimeout(() => setUserSuccess(''), 3000)
      }
    } catch (err) {
      setUserError(err.message || 'Erreur lors de la création')
    }
  }

  // Modifier un utilisateur
  const handleUpdateUser = async () => {
    setUserError('')
    setUserSuccess('')
    
    if (!editingUser || !editingUser.username || !editingUser.email) {
      setUserError('Le nom et l\'email sont requis')
      return
    }
    
    try {
      const updateData = {
        username: editingUser.username,
        email: editingUser.email,
        role: editingUser.role,
        is_active: editingUser.is_active
      }
      if (editingUser.newPassword) {
        updateData.password = editingUser.newPassword
      }
      
      const response = await usersAPI.update(editingUser.id, updateData)
      if (response.success) {
        setUserSuccess('Utilisateur modifié avec succès')
        setEditingUser(null)
        fetchUsers()
        setTimeout(() => setUserSuccess(''), 3000)
      }
    } catch (err) {
      setUserError(err.message || 'Erreur lors de la modification')
    }
  }

  // Supprimer un utilisateur
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return
    
    try {
      const response = await usersAPI.delete(userId)
      if (response.success) {
        setUserSuccess('Utilisateur supprimé')
        fetchUsers()
        setTimeout(() => setUserSuccess(''), 3000)
      }
    } catch (err) {
      setUserError(err.message || 'Erreur lors de la suppression')
    }
  }

  // Gérer la connexion
  const handleLogin = async (e) => {
    e.preventDefault()
    const result = await login(username, password)
    if (!result.success) {
      setError(result.error || 'Identifiants incorrects')
    } else {
      setError('')
    }
  }

  // Formater la date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Ajouter un média
  const handleAddMedia = async () => {
    if (!newMedia.name || !newMedia.url) {
      alert('Veuillez remplir le nom et l\'URL')
      return
    }
    const result = await addMedia(newMedia)
    if (result.success) {
      setShowAddMedia(false)
      setNewMedia({ name: '', type: 'youtube', url: '', description: '', featured: false })
    }
  }

  // Sauvegarder les modifications d'un média
  const handleSaveMedia = async () => {
    if (!editingMedia) return
    const result = await updateMedia(editingMedia.id, editingMedia)
    if (result.success) {
      setEditingMedia(null)
    }
  }

  // Supprimer un média
  const handleDeleteMedia = async (id) => {
    if (window.confirm('Supprimer ce média ?')) {
      await deleteMedia(id)
    }
  }

  // Extraire l'ID YouTube d'une URL
  const getYouTubeThumbnail = (url) => {
    const match = url.match(/embed\/([^?]+)/)
    if (match) {
      return `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg`
    }
    return null
  }

  // Icônes SVG
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    media: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    ),
    messages: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
        <polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
    settings: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
    comptabilite: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    arrowUp: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5,12 12,5 19,12"/>
      </svg>
    ),
    arrowDown: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <polyline points="19,12 12,19 5,12"/>
      </svg>
    ),
    eye: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    logout: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16,17 21,12 16,7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    back: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12,19 5,12 12,5"/>
      </svg>
    ),
    trash: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="3,6 5,6 21,6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    ),
    edit: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    plus: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    x: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    check: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20,6 9,17 4,12"/>
      </svg>
    ),
    play: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="5,3 19,12 5,21 5,3"/>
      </svg>
    ),
    film: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
      </svg>
    ),
    briefcase: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    megaphone: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3 11l18-5v12L3 13v-2z"/>
        <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>
      </svg>
    ),
    youtube: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/>
        <polygon points="9.75,15.02 15.5,11.75 9.75,8.48 9.75,15.02"/>
      </svg>
    ),
    link: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
      </svg>
    ),
    globe: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    reply: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polyline points="9,17 4,12 9,7"/>
        <path d="M20 18v-2a4 4 0 0 0-4-4H4"/>
      </svg>
    ),
    projets: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        <line x1="12" y1="11" x2="12" y2="17"/>
        <line x1="9" y1="14" x2="15" y2="14"/>
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    user: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    clock: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12,6 12,12 16,14"/>
      </svg>
    ),
    star: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26 12,2"/>
      </svg>
    ),
    close: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    cinema: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
        <line x1="7" y1="2" x2="7" y2="22"/>
        <line x1="17" y1="2" x2="17" y2="22"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <line x1="2" y1="7" x2="7" y2="7"/>
        <line x1="2" y1="17" x2="7" y2="17"/>
        <line x1="17" y1="17" x2="22" y2="17"/>
        <line x1="17" y1="7" x2="22" y2="7"/>
      </svg>
    ),
    boutique: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    cart: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="9" cy="21" r="1"/>
        <circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
    ),
    video: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <polygon points="23 7 16 12 23 17 23 7"/>
        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
      </svg>
    ),
    storyboard: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <circle cx="15" cy="15" r="2.5"/>
      </svg>
    ),
    partners: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    prestations: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
    tasks: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 11l3 3L22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    leads: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    )
  }

  // Icône par catégorie
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  const pageTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  }

  // ============================================
  // PAGE DE CONNEXION
  // ============================================
  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <motion.div 
          className="login-card"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div className="login-logo" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, type: "spring" }}>
            <img src="/img/logo 3.png" alt="N PROD" className="login-logo-img" />
          </motion.div>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
            Connectez-vous pour accéder au panneau d'administration
          </motion.p>
          
          <motion.form onSubmit={handleLogin} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="Nom d'utilisateur" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
            <div className="input-group">
              <input 
                type="password" 
                placeholder="Mot de passe" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
              />
            </div>
            <AnimatePresence>
              {error && (
                <motion.p className="error-message" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {error}
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              Se connecter
            </motion.button>
          </motion.form>
          
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <Link to="/" className="back-home">{icons.back}<span>Retour au site</span></Link>
          </motion.div>
        </motion.div>
        <div className="login-bg">
          <motion.div className="bg-circle c1" animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }} transition={{ duration: 8, repeat: Infinity }} />
          <motion.div className="bg-circle c2" animate={{ scale: [1.2, 1, 1.2], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 10, repeat: Infinity }} />
        </div>
      </div>
    )
  }

  // ============================================
  // PANEL ADMIN
  // ============================================
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard },
    { id: 'projets', label: 'Projets', icon: icons.projets },
    { id: 'media', label: 'Médias', icon: icons.media },
    { id: 'cinema', label: 'Cinéma', icon: icons.cinema },
    { id: 'boutique', label: 'Boutique', icon: icons.boutique },
    { id: 'prestations', label: 'Prestations', icon: icons.prestations },
    { id: 'offres', label: 'Offres', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg> },
    { id: 'tasks', label: 'Tâches', icon: icons.tasks },
    { id: 'messages', label: 'Messages', icon: icons.messages, badge: unreadCount },
    { id: 'comptabilite', label: 'Comptabilité', icon: icons.comptabilite },
    { id: 'storyboard', label: 'Storyboard', icon: icons.storyboard },
    { id: 'leads', label: 'Leads Power', icon: icons.leads },
    { id: 'partners', label: 'Partenaires', icon: icons.partners },
    { id: 'portfolio', label: 'Portfolio', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg> },
    { id: 'settings', label: 'Paramètres', icon: icons.settings }
  ]

  const totalMedias = medias.length

  return (
    <div className="admin">
      {/* Mobile hamburger */}
      <button className="admin-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        <span></span><span></span><span></span>
      </button>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-logo">
          <motion.img src="/img/logo 3.png" alt="N PROD" className="logo-icon-img" whileHover={{ scale: 1.05 }} />
        </div>
        
        <nav className="admin-nav">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 5 }}
            >
              <span className="nav-icon">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
              {tab.badge > 0 && <span className="nav-badge">{tab.badge}</span>}
            </motion.button>
          ))}
        </nav>
        
        <div className="admin-footer">
          <Link to="/" className="view-site">{icons.eye}<span>Voir le site</span></Link>
          <button onClick={logout} className="logout-btn">{icons.logout}<span>Déconnexion</span></button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${darkMode ? '' : 'light-mode'}`}>
        <motion.header className="admin-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          {activeTab !== 'dashboard' && <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>}
          {activeTab === 'dashboard' && <h1 className="header-spacer"></h1>}
          <div className="admin-header-actions">
            <button className="header-action-btn" onClick={() => setDarkMode(!darkMode)} title={darkMode ? 'Mode jour' : 'Mode nuit'}>
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>
            <button className="header-action-btn notification-btn" onClick={() => { setShowNotifications(!showNotifications); if (unreadCount > 0) setActiveTab('messages'); }} title="Notifications">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            <div className="admin-user">
              <div className="user-avatar">{admin?.username?.[0]?.toUpperCase() || 'A'}</div>
            </div>
          </div>
        </motion.header>

        <div className="admin-content">
          <AnimatePresence mode="wait">
            
            {/* ============================================ */}
            {/* DASHBOARD */}
            {/* ============================================ */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" {...pageTransition} className="dashboard">
                {/* Hero Card */}
                <motion.div className="dash-hero" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="dash-hero-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  </div>
                  <div className="dash-hero-info">
                    <h2>Tableau de bord</h2>
                    <p>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="dash-hero-refresh">
                    <span className="refresh-status">
                      <span className="refresh-dot"></span>
                      Mis a jour {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <button className={`refresh-btn ${refreshing ? 'spinning' : ''}`} onClick={handleRefreshDashboard} disabled={refreshing}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    </button>
                  </div>
                </motion.div>

                {/* Stats rapides */}
                <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
                  {[
                    { icon: icons.media, value: totalMedias, label: 'Medias', color: '#8b5cf6', onClick: () => setActiveTab('media') },
                    { icon: icons.messages, value: messages.length, label: `Messages`, color: '#22c55e', onClick: () => setActiveTab('messages'), badge: unreadCount },
                    { icon: icons.briefcase, value: totalMedias, label: 'Vidéos', color: '#3b82f6' },
                    { icon: icons.globe, value: 'En ligne', label: 'Statut', color: '#22c55e' }
                  ].map((stat, index) => (
                    <motion.div
                      key={index}
                      className="stat-card"
                      variants={itemVariants}
                      whileHover={{ y: -3 }}
                      onClick={stat.onClick}
                      style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
                    >
                      <div className="stat-icon" style={{ background: `${stat.color}20`, color: stat.color }}>{stat.icon}</div>
                      <div className="stat-info">
                        <h3>{stat.value}</h3>
                        <p>{stat.label}</p>
                      </div>
                      {stat.badge > 0 && <span className="stat-badge">{stat.badge}</span>}
                    </motion.div>
                  ))}
                </motion.div>

                {/* Comptabilité avec filtres */}
                <motion.div className="dash-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <div className="dash-section-header">
                    <h3>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                      Comptabilite
                    </h3>
                  </div>

                  {/* Filtres de date */}
                  <div className="dash-compta-filters">
                    <div className="dash-filter-group">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <select value={comptaFilter.year} onChange={e => setComptaFilter({...comptaFilter, year: parseInt(e.target.value)})}>
                        {[...Array(5)].map((_, i) => {
                          const year = currentYear - 2 + i
                          return <option key={year} value={year}>{year}</option>
                        })}
                      </select>
                    </div>
                    <div className="dash-month-pills">
                      <button className={!comptaFilter.month ? 'active' : ''} onClick={() => setComptaFilter({...comptaFilter, month: ''})}>Annee</button>
                      {['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                        <button key={i} className={comptaFilter.month === i + 1 ? 'active' : ''} onClick={() => setComptaFilter({...comptaFilter, month: i + 1})}>{m}</button>
                      ))}
                    </div>
                  </div>

                  {/* Cartes financières */}
                  <div className="compta-cards">
                    <div className="compta-card revenus">
                      <div className="compta-card-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                        <span>Revenus</span>
                      </div>
                      <div className="compta-card-value">
                        <AnimatedCounter value={comptaStats?.totals?.revenus || 0} duration={600} /> F
                      </div>
                      <div className="compta-card-sub">
                        <AnimatedCounter value={comptaStats?.totals?.countRevenus || 0} duration={400} /> transactions
                      </div>
                    </div>
                    <div className="compta-card depenses">
                      <div className="compta-card-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                        <span>Depenses</span>
                      </div>
                      <div className="compta-card-value">
                        <AnimatedCounter value={comptaStats?.totals?.depenses || 0} duration={600} /> F
                      </div>
                      <div className="compta-card-sub">
                        <AnimatedCounter value={comptaStats?.totals?.countDepenses || 0} duration={400} /> transactions
                      </div>
                    </div>
                    <div className="compta-card solde">
                      <div className="compta-card-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                        <span>Solde</span>
                      </div>
                      <div className="compta-card-value">
                        <AnimatedCounter value={comptaStats?.totals?.balance || 0} duration={600} /> F
                      </div>
                      <div className="compta-card-sub">{comptaStats?.totals?.balance >= 0 ? 'Benefice' : 'Deficit'}</div>
                    </div>
                  </div>
                  <div className="compta-card projets-count dash-full-card">
                    <div className="compta-card-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                      <span>Projets</span>
                    </div>
                    <div className="compta-card-value">
                      <AnimatedCounter value={projetsStats?.total || 0} duration={400} />
                    </div>
                    <div className="compta-card-sub">{projetsStats?.enProduction || 0} en production</div>
                  </div>
                </motion.div>

                {/* Messages récents */}
                {unreadCount > 0 && (
                  <motion.div className="dash-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <div className="dash-section-header">
                      <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                        Messages non lus
                      </h3>
                    </div>
                    <div className="dash-messages">
                      {messages.filter(m => !m.is_read).slice(0, 3).map(msg => (
                        <div key={msg.id} className="dash-message" onClick={() => { setActiveTab('messages'); setSelectedMessage(msg); }}>
                          <div className="dash-msg-avatar">{msg.name?.[0]?.toUpperCase()}</div>
                          <div className="dash-msg-content">
                            <strong>{msg.name}</strong>
                            <p>{msg.message?.substring(0, 60)}...</p>
                          </div>
                          <span className="dash-msg-time">{new Date(msg.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Boutique */}
                {boutiqueItems.length > 0 && (
                  <motion.div className="dash-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                    <div className="dash-section-header">
                      <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                        Boutique
                      </h3>
                    </div>
                    <div className="dash-boutique-stats">
                      <div className="dash-boutique-count">
                        <span className="dash-boutique-number">{boutiqueItems.filter(i => i.status === 'active').length}</span>
                        <span className="dash-boutique-label">articles en ligne</span>
                      </div>
                      <div className="dash-boutique-count">
                        <span className="dash-boutique-number">{boutiqueItems.length}</span>
                        <span className="dash-boutique-label">total articles</span>
                      </div>
                    </div>
                    <div className="dash-boutique-grid">
                      {boutiqueItems.filter(i => i.status === 'active').slice(0, 4).map(item => (
                        <div key={item.id} className="dash-boutique-item" onClick={() => setActiveTab('boutique')}>
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="dash-boutique-img" />
                          ) : (
                            <div className="dash-boutique-placeholder">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                            </div>
                          )}
                          <div className="dash-boutique-info">
                            <strong>{item.name}</strong>
                            <span>{item.price ? `${Number(item.price).toLocaleString()} ${item.currency || 'EUR'}` : ''}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Tâches */}
                {tasksStats && (tasksStats.total > 0 || true) && (
                  <motion.div className="dash-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <div className="dash-section-header">
                      <h3>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        Tâches
                      </h3>
                      <button className="dash-section-link" onClick={() => setActiveTab('tasks')}>Voir tout</button>
                    </div>
                    <div className="dash-tasks-stats">
                      <div className="dash-task-stat">
                        <span className="dash-task-stat-number">{tasksStats?.todo || 0}</span>
                        <span className="dash-task-stat-label">A faire</span>
                      </div>
                      <div className="dash-task-stat">
                        <span className="dash-task-stat-number in-progress">{tasksStats?.in_progress || 0}</span>
                        <span className="dash-task-stat-label">En cours</span>
                      </div>
                      <div className="dash-task-stat">
                        <span className="dash-task-stat-number done">{tasksStats?.done || 0}</span>
                        <span className="dash-task-stat-label">Termine</span>
                      </div>
                      {tasksStats?.overdue > 0 && (
                        <div className="dash-task-stat">
                          <span className="dash-task-stat-number overdue">{tasksStats.overdue}</span>
                          <span className="dash-task-stat-label">En retard</span>
                        </div>
                      )}
                    </div>
                    {tasksStats?.recent?.length > 0 && (
                      <div className="dash-tasks-recent">
                        {tasksStats.recent.map(task => (
                          <div key={task.id} className="dash-task-item" onClick={() => setActiveTab('tasks')}>
                            <div className={`dash-task-checkbox ${task.status}`}>
                              {task.status === 'done' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                              {task.status === 'in_progress' && <div className="dash-task-progress-dot"></div>}
                            </div>
                            <div className="dash-task-info">
                              <span className={`dash-task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</span>
                              <div className="dash-task-meta">
                                <span className={`task-priority ${task.priority}`}>{task.priority === 'urgent' ? 'Urgent' : task.priority === 'high' ? 'Haute' : task.priority === 'medium' ? 'Moyenne' : 'Basse'}</span>
                                {task.due_date && <span className={`task-due ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}>{new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

              </motion.div>
            )}

            {/* ============================================ */}
            {/* PROJETS */}
            {/* ============================================ */}
            {activeTab === 'projets' && (
              <motion.div key="projets" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    Projets
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddProjet(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {icons.plus} Nouveau Projet
                  </motion.button>
                </div>

                {/* Stats des projets */}
                {projetsStats && (
                  <motion.div className="projets-stats" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.div className="stat-card" variants={itemVariants}>
                      <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#8b5cf6' }}>
                        {icons.projets}
                      </div>
                      <div className="stat-content">
                        <span className="stat-value">
                          <AnimatedCounter value={projetsStats.total || 0} duration={500} />
                        </span>
                        <span className="stat-label">Total Projets</span>
                      </div>
                    </motion.div>
                    <motion.div className="stat-card" variants={itemVariants}>
                      <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                        {icons.clock}
                      </div>
                      <div className="stat-content">
                        <span className="stat-value">
                          <AnimatedCounter value={projetsStats.en_cours || 0} duration={500} />
                        </span>
                        <span className="stat-label">En cours</span>
                      </div>
                    </motion.div>
                    <motion.div className="stat-card" variants={itemVariants}>
                      <div className="stat-icon" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}>
                        {icons.check}
                      </div>
                      <div className="stat-content">
                        <span className="stat-value">
                          <AnimatedCounter value={projetsStats.termines || 0} duration={500} />
                        </span>
                        <span className="stat-label">Terminés</span>
                      </div>
                    </motion.div>
                    <motion.div className="stat-card" variants={itemVariants}>
                      <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}>
                        {icons.star}
                      </div>
                      <div className="stat-content">
                        <span className="stat-value">
                          <AnimatedCounter value={projetsStats.haute_priorite || 0} duration={500} />
                        </span>
                        <span className="stat-label">Haute priorité</span>
                      </div>
                    </motion.div>
                  </motion.div>
                )}

                {/* Filtres */}
                <motion.div className="projets-filters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="filter-group">
                    <select 
                      value={projetFilter.type} 
                      onChange={(e) => setProjetFilter({...projetFilter, type: e.target.value})}
                    >
                      <option value="">Tous les types</option>
                      {projetsOptions.types?.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                    <select 
                      value={projetFilter.statut} 
                      onChange={(e) => setProjetFilter({...projetFilter, statut: e.target.value})}
                    >
                      <option value="">Tous les statuts</option>
                      {projetsOptions.statuts?.map(s => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <div className="search-input">
                      {icons.search}
                      <input
                        type="text"
                        placeholder="Rechercher un projet..."
                        value={projetFilter.search}
                        onChange={(e) => setProjetFilter({...projetFilter, search: e.target.value})}
                      />
                    </div>
                  </div>
                </motion.div>

                {/* Messages de succès/erreur */}
                <AnimatePresence>
                  {projetSuccess && (
                    <motion.div className="alert alert-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {projetSuccess}
                    </motion.div>
                  )}
                  {projetError && (
                    <motion.div className="alert alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {projetError}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Liste des projets */}
                <motion.div className="projets-grid" variants={containerVariants} initial="hidden" animate="visible">
                  {projets.length === 0 ? (
                    <motion.div className="empty-state" variants={itemVariants}>
                      <div className="empty-icon">{icons.projets}</div>
                      <h3>Aucun projet</h3>
                      <p>Créez votre premier projet pour commencer</p>
                      <button className="btn-primary" onClick={() => setShowAddProjet(true)}>
                        {icons.plus} Créer un projet
                      </button>
                    </motion.div>
                  ) : (
                    projets.map((projet) => (
                      <motion.div 
                        key={projet.id} 
                        className="projet-card"
                        variants={itemVariants}
                        whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(0,0,0,0.3)' }}
                        layout
                      >
                        <div className="projet-card-header">
                          <div className="projet-badges">
                            <span className="badge badge-type" style={{ background: `${getTypeColor(projet.type)}20`, color: getTypeColor(projet.type) }}>
                              {projetsOptions.types?.find(t => t.value === projet.type)?.label || projet.type}
                            </span>
                            <span className="badge badge-statut" style={{ background: `${getStatutColor(projet.statut)}20`, color: getStatutColor(projet.statut) }}>
                              {projetsOptions.statuts?.find(s => s.value === projet.statut)?.label || projet.statut}
                            </span>
                          </div>
                          <button 
                            className={`priority-badge ${projet.priorite >= 4 ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePriorite(projet);
                            }}
                            title={projet.priorite >= 4 ? 'Retirer la priorité haute' : 'Marquer comme priorité haute'}
                          >
                            {icons.star}
                          </button>
                        </div>

                        <h3 className="projet-title">{projet.titre}</h3>
                        
                        {projet.logline && (
                          <p className="projet-logline">{projet.logline}</p>
                        )}

                        <div className="projet-meta">
                          {projet.realisateur && (
                            <div className="meta-item">
                              {icons.user}
                              <span>{projet.realisateur}</span>
                            </div>
                          )}
                          {projet.client && (
                            <div className="meta-item">
                              {icons.briefcase}
                              <span>{projet.client}</span>
                            </div>
                          )}
                          {projet.date_debut && (
                            <div className="meta-item">
                              {icons.calendar}
                              <span>{new Date(projet.date_debut).toLocaleDateString('fr-FR')}</span>
                            </div>
                          )}
                        </div>

                        {/* Barre de progression */}
                        <div className="projet-progress">
                          <div className="progress-header">
                            <span>Progression</span>
                            <span>{projet.progression || 0}%</span>
                          </div>
                          <div className="progress-bar">
                            <motion.div 
                              className="progress-fill"
                              initial={{ width: 0 }}
                              animate={{ width: `${projet.progression || 0}%` }}
                              style={{ background: getStatutColor(projet.statut) }}
                            />
                          </div>
                        </div>

                        {projet.budget_prevu && (
                          <div className="projet-budget">
                            <span className="budget-label">Budget:</span>
                            <span className="budget-value">{formatMoney(projet.budget_prevu)}</span>
                          </div>
                        )}

                        <div className="projet-actions">
                          <motion.button
                            className="btn-icon"
                            onClick={() => setViewingProjet(projet)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Voir détails"
                          >
                            {icons.eye}
                          </motion.button>
                          <motion.button
                            className="btn-icon"
                            onClick={() => { console.log('Edit clicked, projet:', projet); setEditingProjet(projet); fetchAttachments('projet', projet.id); }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Modifier"
                          >
                            {icons.edit}
                          </motion.button>
                          <motion.button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteProjet(projet.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Supprimer"
                          >
                            {icons.trash}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>

                {/* Modal: Voir les détails d'un projet */}
                <AnimatePresence>
                  {viewingProjet && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setViewingProjet(null)}>
                      <motion.div className="modal modal-large projet-detail-modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <div className="modal-title-group">
                            <h2>{viewingProjet.titre}</h2>
                            <div className="projet-badges">
                              <span className="badge badge-type" style={{ background: `${getTypeColor(viewingProjet.type)}20`, color: getTypeColor(viewingProjet.type) }}>
                                {projetsOptions.types?.find(t => t.value === viewingProjet.type)?.label || viewingProjet.type}
                              </span>
                              <span className="badge badge-statut" style={{ background: `${getStatutColor(viewingProjet.statut)}20`, color: getStatutColor(viewingProjet.statut) }}>
                                {projetsOptions.statuts?.find(s => s.value === viewingProjet.statut)?.label || viewingProjet.statut}
                              </span>
                            </div>
                          </div>
                          <button className="modal-close" onClick={() => setViewingProjet(null)}>{icons.close}</button>
                        </div>
                        
                        <div className="modal-body projet-detail-content">
                          {/* Section Synopsis */}
                          {(viewingProjet.logline || viewingProjet.synopsis) && (
                            <div className="detail-section">
                              <h4>Description</h4>
                              {viewingProjet.logline && <p className="logline"><strong>Logline:</strong> {viewingProjet.logline}</p>}
                              {viewingProjet.synopsis && <p className="synopsis">{viewingProjet.synopsis}</p>}
                            </div>
                          )}

                          {/* Section Infos techniques */}
                          <div className="detail-section">
                            <h4>Informations techniques</h4>
                            <div className="detail-grid">
                              {viewingProjet.genre && <div className="detail-item"><span className="label">Genre:</span><span className="value">{viewingProjet.genre}</span></div>}
                              {viewingProjet.duree_prevue && <div className="detail-item"><span className="label">Durée:</span><span className="value">{viewingProjet.duree_prevue}</span></div>}
                              {viewingProjet.format && <div className="detail-item"><span className="label">Format:</span><span className="value">{viewingProjet.format}</span></div>}
                              {viewingProjet.langue && <div className="detail-item"><span className="label">Langue:</span><span className="value">{viewingProjet.langue}</span></div>}
                            </div>
                          </div>

                          {/* Section Équipe */}
                          <div className="detail-section">
                            <h4>Équipe</h4>
                            <div className="detail-grid">
                              {viewingProjet.realisateur && <div className="detail-item"><span className="label">Réalisateur:</span><span className="value">{viewingProjet.realisateur}</span></div>}
                              {viewingProjet.producteur && <div className="detail-item"><span className="label">Producteur:</span><span className="value">{viewingProjet.producteur}</span></div>}
                              {viewingProjet.scenariste && <div className="detail-item"><span className="label">Scénariste:</span><span className="value">{viewingProjet.scenariste}</span></div>}
                              {viewingProjet.directeur_photo && <div className="detail-item"><span className="label">Dir. Photo:</span><span className="value">{viewingProjet.directeur_photo}</span></div>}
                            </div>
                            {viewingProjet.casting && (
                              <div className="detail-item full-width">
                                <span className="label">Casting:</span>
                                <span className="value">{viewingProjet.casting}</span>
                              </div>
                            )}
                          </div>

                          {/* Section Production */}
                          <div className="detail-section">
                            <h4>Production</h4>
                            <div className="detail-grid">
                              {viewingProjet.client && <div className="detail-item"><span className="label">Client:</span><span className="value">{viewingProjet.client}</span></div>}
                              {viewingProjet.production && <div className="detail-item"><span className="label">Production:</span><span className="value">{viewingProjet.production}</span></div>}
                            </div>
                          </div>

                          {/* Section Dates et Budget */}
                          <div className="detail-section">
                            <h4>Planning & Budget</h4>
                            <div className="detail-grid">
                              {viewingProjet.date_debut && <div className="detail-item"><span className="label">Date début:</span><span className="value">{new Date(viewingProjet.date_debut).toLocaleDateString('fr-FR')}</span></div>}
                              {viewingProjet.date_fin_prevue && <div className="detail-item"><span className="label">Fin prévue:</span><span className="value">{new Date(viewingProjet.date_fin_prevue).toLocaleDateString('fr-FR')}</span></div>}
                              {viewingProjet.budget_prevu && <div className="detail-item"><span className="label">Budget prévu:</span><span className="value">{formatMoney(viewingProjet.budget_prevu)}</span></div>}
                              {viewingProjet.budget_actuel && <div className="detail-item"><span className="label">Budget actuel:</span><span className="value">{formatMoney(viewingProjet.budget_actuel)}</span></div>}
                            </div>
                          </div>

                          {/* Progression */}
                          <div className="detail-section">
                            <h4>Progression</h4>
                            <div className="projet-progress large">
                              <div className="progress-header">
                                <span>Avancement du projet</span>
                                <span>{viewingProjet.progression || 0}%</span>
                              </div>
                              <div className="progress-bar">
                                <motion.div 
                                  className="progress-fill"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${viewingProjet.progression || 0}%` }}
                                  style={{ background: getStatutColor(viewingProjet.statut) }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Notes */}
                          {viewingProjet.notes && (
                            <div className="detail-section">
                              <h4>Notes</h4>
                              <p className="notes-text">{viewingProjet.notes}</p>
                            </div>
                          )}
                        </div>

                        <div className="modal-footer">
                          <button className="btn-secondary" onClick={() => setViewingProjet(null)}>Fermer</button>
                          <button className="btn-primary" onClick={() => { setEditingProjet(viewingProjet); fetchAttachments('projet', viewingProjet.id); setViewingProjet(null); }}>
                            {icons.edit} Modifier
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Ajouter un projet */}
                <AnimatePresence>
                  {showAddProjet && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddProjet(false)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Nouveau Projet</h2>
                          <button className="modal-close" onClick={() => setShowAddProjet(false)}>{icons.close}</button>
                        </div>
                        
                        <div className="modal-body projet-form">
                          {/* Section principale */}
                          <div className="form-section">
                            <h4>Informations principales</h4>
                            <div className="form-row">
                              <div className="form-group flex-2">
                                <label>Titre du projet *</label>
                                <input
                                  type="text"
                                  value={newProjet.titre}
                                  onChange={(e) => setNewProjet({...newProjet, titre: e.target.value})}
                                  placeholder="Ex: Mon Film"
                                />
                              </div>
                              <div className="form-group">
                                <label>Type *</label>
                                <select value={newProjet.type} onChange={(e) => setNewProjet({...newProjet, type: e.target.value})}>
                                  {projetsOptions.types?.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Statut *</label>
                                <select value={newProjet.statut} onChange={(e) => setNewProjet({...newProjet, statut: e.target.value})}>
                                  {projetsOptions.statuts?.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Logline</label>
                              <input
                                type="text"
                                value={newProjet.logline}
                                onChange={(e) => setNewProjet({...newProjet, logline: e.target.value})}
                                placeholder="Résumé en une phrase"
                              />
                            </div>
                            <div className="form-group">
                              <label>Synopsis</label>
                              <textarea
                                value={newProjet.synopsis}
                                onChange={(e) => setNewProjet({...newProjet, synopsis: e.target.value})}
                                placeholder="Description détaillée du projet..."
                                rows={4}
                              />
                            </div>
                          </div>

                          {/* Section technique */}
                          <div className="form-section">
                            <h4>Informations techniques</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Genre</label>
                                <input
                                  type="text"
                                  value={newProjet.genre}
                                  onChange={(e) => setNewProjet({...newProjet, genre: e.target.value})}
                                  placeholder="Ex: Drame, Comédie..."
                                />
                              </div>
                              <div className="form-group">
                                <label>Durée prévue</label>
                                <input
                                  type="text"
                                  value={newProjet.duree_prevue}
                                  onChange={(e) => setNewProjet({...newProjet, duree_prevue: e.target.value})}
                                  placeholder="Ex: 90 min"
                                />
                              </div>
                              <div className="form-group">
                                <label>Format</label>
                                <input
                                  type="text"
                                  value={newProjet.format}
                                  onChange={(e) => setNewProjet({...newProjet, format: e.target.value})}
                                  placeholder="Ex: 4K, HD..."
                                />
                              </div>
                              <div className="form-group">
                                <label>Langue</label>
                                <input
                                  type="text"
                                  value={newProjet.langue}
                                  onChange={(e) => setNewProjet({...newProjet, langue: e.target.value})}
                                  placeholder="Ex: Français"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section équipe */}
                          <div className="form-section">
                            <h4>Équipe</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Réalisateur</label>
                                <input
                                  type="text"
                                  value={newProjet.realisateur}
                                  onChange={(e) => setNewProjet({...newProjet, realisateur: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Producteur</label>
                                <input
                                  type="text"
                                  value={newProjet.producteur}
                                  onChange={(e) => setNewProjet({...newProjet, producteur: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Scénariste</label>
                                <input
                                  type="text"
                                  value={newProjet.scenariste}
                                  onChange={(e) => setNewProjet({...newProjet, scenariste: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Directeur Photo</label>
                                <input
                                  type="text"
                                  value={newProjet.directeur_photo}
                                  onChange={(e) => setNewProjet({...newProjet, directeur_photo: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Casting</label>
                              <input
                                type="text"
                                value={newProjet.casting}
                                onChange={(e) => setNewProjet({...newProjet, casting: e.target.value})}
                                placeholder="Acteurs principaux..."
                              />
                            </div>
                          </div>

                          {/* Section production */}
                          <div className="form-section">
                            <h4>Production</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Client</label>
                                <input
                                  type="text"
                                  value={newProjet.client}
                                  onChange={(e) => setNewProjet({...newProjet, client: e.target.value})}
                                  placeholder="Nom du client..."
                                />
                              </div>
                              <div className="form-group">
                                <label>Production</label>
                                <input
                                  type="text"
                                  value={newProjet.production}
                                  onChange={(e) => setNewProjet({...newProjet, production: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section planning */}
                          <div className="form-section">
                            <h4>Planning & Budget</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Date de début</label>
                                <input
                                  type="date"
                                  value={newProjet.date_debut}
                                  onChange={(e) => setNewProjet({...newProjet, date_debut: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Date de fin prévue</label>
                                <input
                                  type="date"
                                  value={newProjet.date_fin_prevue}
                                  onChange={(e) => setNewProjet({...newProjet, date_fin_prevue: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Budget prévu (FCFA)</label>
                                <input
                                  type="number"
                                  value={newProjet.budget_prevu}
                                  onChange={(e) => setNewProjet({...newProjet, budget_prevu: e.target.value})}
                                  placeholder="0"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section avancement */}
                          <div className="form-section">
                            <h4>Avancement</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Priorité (1-5)</label>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={newProjet.priorite}
                                  onChange={(e) => setNewProjet({...newProjet, priorite: parseInt(e.target.value)})}
                                />
                                <span className="range-value">{newProjet.priorite}/5</span>
                              </div>
                              <div className="form-group">
                                <label>Progression (%)</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={newProjet.progression}
                                  onChange={(e) => setNewProjet({...newProjet, progression: parseInt(e.target.value)})}
                                />
                                <span className="range-value">{newProjet.progression}%</span>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Notes</label>
                              <textarea
                                value={newProjet.notes}
                                onChange={(e) => setNewProjet({...newProjet, notes: e.target.value})}
                                placeholder="Notes supplémentaires..."
                                rows={3}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="modal-footer">
                          <button className="btn-secondary" onClick={() => setShowAddProjet(false)}>Annuler</button>
                          <button className="btn-primary" onClick={handleCreateProjet}>
                            {icons.plus} Créer le projet
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Modifier un projet */}
                <AnimatePresence>
                  {editingProjet && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingProjet(null)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Modifier: {editingProjet.titre}</h2>
                          <button className="modal-close" onClick={() => setEditingProjet(null)}>{icons.close}</button>
                        </div>
                        
                        <div className="modal-body projet-form">
                          {/* Section principale */}
                          <div className="form-section">
                            <h4>Informations principales</h4>
                            <div className="form-row">
                              <div className="form-group flex-2">
                                <label>Titre du projet *</label>
                                <input
                                  type="text"
                                  value={editingProjet.titre}
                                  onChange={(e) => setEditingProjet({...editingProjet, titre: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Type *</label>
                                <select value={editingProjet.type} onChange={(e) => setEditingProjet({...editingProjet, type: e.target.value})}>
                                  {projetsOptions.types?.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Statut *</label>
                                <select value={editingProjet.statut} onChange={(e) => setEditingProjet({...editingProjet, statut: e.target.value})}>
                                  {projetsOptions.statuts?.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Logline</label>
                              <input
                                type="text"
                                value={editingProjet.logline || ''}
                                onChange={(e) => setEditingProjet({...editingProjet, logline: e.target.value})}
                              />
                            </div>
                            <div className="form-group">
                              <label>Synopsis</label>
                              <textarea
                                value={editingProjet.synopsis || ''}
                                onChange={(e) => setEditingProjet({...editingProjet, synopsis: e.target.value})}
                                rows={4}
                              />
                            </div>
                          </div>

                          {/* Section technique */}
                          <div className="form-section">
                            <h4>Informations techniques</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Genre</label>
                                <input
                                  type="text"
                                  value={editingProjet.genre || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, genre: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Durée prévue</label>
                                <input
                                  type="text"
                                  value={editingProjet.duree_prevue || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, duree_prevue: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Format</label>
                                <input
                                  type="text"
                                  value={editingProjet.format || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, format: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Langue</label>
                                <input
                                  type="text"
                                  value={editingProjet.langue || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, langue: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section équipe */}
                          <div className="form-section">
                            <h4>Équipe</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Réalisateur</label>
                                <input
                                  type="text"
                                  value={editingProjet.realisateur || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, realisateur: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Producteur</label>
                                <input
                                  type="text"
                                  value={editingProjet.producteur || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, producteur: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Scénariste</label>
                                <input
                                  type="text"
                                  value={editingProjet.scenariste || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, scenariste: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Directeur Photo</label>
                                <input
                                  type="text"
                                  value={editingProjet.directeur_photo || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, directeur_photo: e.target.value})}
                                />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Casting</label>
                              <input
                                type="text"
                                value={editingProjet.casting || ''}
                                onChange={(e) => setEditingProjet({...editingProjet, casting: e.target.value})}
                              />
                            </div>
                          </div>

                          {/* Section production */}
                          <div className="form-section">
                            <h4>Production</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Client</label>
                                <input
                                  type="text"
                                  value={editingProjet.client || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, client: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Production</label>
                                <input
                                  type="text"
                                  value={editingProjet.production || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, production: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section planning */}
                          <div className="form-section">
                            <h4>Planning & Budget</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Date de début</label>
                                <input
                                  type="date"
                                  value={editingProjet.date_debut ? editingProjet.date_debut.split('T')[0] : ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, date_debut: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Date de fin prévue</label>
                                <input
                                  type="date"
                                  value={editingProjet.date_fin_prevue ? editingProjet.date_fin_prevue.split('T')[0] : ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, date_fin_prevue: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Budget prévu (FCFA)</label>
                                <input
                                  type="number"
                                  value={editingProjet.budget_prevu || ''}
                                  onChange={(e) => setEditingProjet({...editingProjet, budget_prevu: e.target.value})}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Section avancement */}
                          <div className="form-section">
                            <h4>Avancement</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Priorité (1-5)</label>
                                <input
                                  type="range"
                                  min="1"
                                  max="5"
                                  value={editingProjet.priorite || 3}
                                  onChange={(e) => setEditingProjet({...editingProjet, priorite: parseInt(e.target.value)})}
                                />
                                <span className="range-value">{editingProjet.priorite || 3}/5</span>
                              </div>
                              <div className="form-group">
                                <label>Progression (%)</label>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="5"
                                  value={editingProjet.progression || 0}
                                  onChange={(e) => setEditingProjet({...editingProjet, progression: parseInt(e.target.value)})}
                                />
                                <span className="range-value">{editingProjet.progression || 0}%</span>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Notes</label>
                              <textarea
                                value={editingProjet.notes || ''}
                                onChange={(e) => setEditingProjet({...editingProjet, notes: e.target.value})}
                                rows={3}
                              />
                            </div>
                            
                            {/* Section Pièces jointes */}
                            <div className="form-group attachments-section">
                              <label>
                                Pièces jointes
                                <span className="label-hint">Contrats, scripts, documents...</span>
                              </label>
                              
                              {/* Liste des fichiers existants */}
                              {attachments[`projet-${editingProjet.id}`]?.length > 0 && (
                                <div className="attachments-list">
                                  {attachments[`projet-${editingProjet.id}`].map(file => (
                                    <div key={file.id} className="attachment-item">
                                      <span className="attachment-icon">{getFileIcon(file.mime_type)}</span>
                                      <div className="attachment-info">
                                        <span className="attachment-name">{file.original_name}</span>
                                        <span className="attachment-size">{formatFileSize(file.file_size)}</span>
                                      </div>
                                      <div className="attachment-actions">
                                        <a 
                                          href={attachmentsAPI.getDownloadUrl(file.id)} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="btn-attachment"
                                          title="Télécharger"
                                        >
                                          ↓
                                        </a>
                                        <button 
                                          type="button"
                                          className="btn-attachment btn-delete-attachment"
                                          onClick={() => handleDeleteAttachment(file.id, 'projet', editingProjet.id)}
                                          title="Supprimer"
                                        >
                                          ×
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Bouton d'ajout de fichier */}
                              <label className="file-upload-btn">
                                <input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleFileUpload('projet', editingProjet.id, e.target.files[0])
                                      e.target.value = ''
                                    }
                                  }}
                                  disabled={uploadingFile}
                                />
                                <span className="file-upload-icon">📎</span>
                                <span>{uploadingFile ? 'Envoi...' : 'Ajouter un fichier'}</span>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setEditingProjet(null)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleUpdateProjet(); }}>
                            {icons.check} Enregistrer
                          </button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* MÉDIAS */}
            {/* ============================================ */}
            {activeTab === 'media' && (
              <motion.div key="media" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    Medias <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>({totalMedias})</span>
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddMedia(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {icons.plus} Ajouter une vidéo
                  </motion.button>
                </div>

                {/* Liste des médias */}
                <div className="media-cards-grid">
                  {medias.map((media) => (
                    <motion.div
                      key={media.id}
                      className="media-card-new"
                      variants={itemVariants}
                      whileHover={{ y: -5, boxShadow: '0 10px 40px rgba(139, 92, 246, 0.15)' }}
                      layout
                    >
                      {/* Thumbnail YouTube */}
                      <div className="media-thumbnail">
                        {getYouTubeThumbnail(media.url) ? (
                          <img src={getYouTubeThumbnail(media.url)} alt={media.name} />
                        ) : (
                          <div className="media-placeholder">
                            {icons.play}
                          </div>
                        )}
                        <div className="media-overlay">
                          <motion.button
                            className="play-btn"
                            onClick={() => window.open(media.url.replace('/embed/', '/watch?v='), '_blank')}
                            whileHover={{ scale: 1.1 }}
                          >
                            {icons.play}
                          </motion.button>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="media-card-content">
                        {editingMedia?.id === media.id ? (
                          <div className="media-edit-inline">
                            <input
                              type="text"
                              value={editingMedia.name}
                              onChange={e => setEditingMedia({...editingMedia, name: e.target.value})}
                              placeholder="Titre"
                            />
                            <input
                              type="text"
                              value={editingMedia.url}
                              onChange={e => setEditingMedia({...editingMedia, url: e.target.value})}
                              placeholder="URL YouTube"
                            />
                            <textarea
                              value={editingMedia.description || ''}
                              onChange={e => setEditingMedia({...editingMedia, description: e.target.value})}
                              placeholder="Sous-titre (optionnel)"
                              rows={2}
                            />
                            <div className="edit-inline-actions">
                              <button className="btn-save" onClick={handleSaveMedia}>{icons.check} Sauvegarder</button>
                              <button className="btn-cancel" onClick={() => setEditingMedia(null)}>{icons.x}</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <h4>{media.name}</h4>
                            {media.description && <p className="media-description">{media.description}</p>}
                            <div className="media-url-display">
                              {icons.link}
                              <span>{media.url.substring(0, 40)}...</span>
                            </div>
                            <div className="media-card-actions">
                              <motion.button
                                className="action-btn edit"
                                onClick={() => setEditingMedia({...media})}
                                whileHover={{ scale: 1.1 }}
                                title="Modifier"
                              >
                                {icons.edit}
                              </motion.button>
                              <motion.button
                                className="action-btn delete"
                                onClick={() => handleDeleteMedia(media.id)}
                                whileHover={{ scale: 1.1 }}
                                title="Supprimer"
                              >
                                {icons.trash}
                              </motion.button>
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Modal Ajouter */}
                <AnimatePresence>
                  {showAddMedia && (
                    <motion.div
                      className="modal-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowAddMedia(false)}
                    >
                      <motion.div
                        className="modal"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="modal-header">
                          <h3>Ajouter une vidéo</h3>
                          <button className="close-btn" onClick={() => setShowAddMedia(false)}>{icons.x}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Titre *</label>
                            <input
                              type="text"
                              value={newMedia.name}
                              onChange={e => setNewMedia({...newMedia, name: e.target.value})}
                              placeholder="Ex: MAS & HITACHI"
                            />
                          </div>
                          <div className="form-group">
                            <label>URL YouTube *</label>
                            <input
                              type="text"
                              value={newMedia.url}
                              onChange={e => setNewMedia({...newMedia, url: e.target.value})}
                              placeholder="https://www.youtube.com/embed/VIDEO_ID"
                            />
                            <span className="form-hint">Collez n'importe quel lien YouTube</span>
                          </div>
                          <div className="form-group">
                            <label>Sous-titre</label>
                            <textarea
                              value={newMedia.description}
                              onChange={e => setNewMedia({...newMedia, description: e.target.value})}
                              placeholder="Sous-titre optionnel..."
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-cancel" onClick={() => setShowAddMedia(false)}>Annuler</button>
                          <motion.button className="btn-primary" onClick={handleAddMedia} whileHover={{ scale: 1.02 }}>
                            {icons.plus} Ajouter
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Guide */}
                <motion.div className="media-guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <h4>Comment ajouter une vidéo YouTube ?</h4>
                  <ol>
                    <li>Allez sur votre vidéo YouTube</li>
                    <li>Cliquez sur "Partager"</li>
                    <li>Copiez le lien et collez-le dans le champ URL</li>
                  </ol>
                </motion.div>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* CINÉMA */}
            {/* ============================================ */}
            {activeTab === 'cinema' && (
              <motion.div key="cinema" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/><line x1="17" y1="17" x2="22" y2="17"/></svg>
                    Cinema
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddCinema(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {icons.plus} Ajouter un film
                  </motion.button>
                </div>

                {/* Messages de feedback */}
                <AnimatePresence>
                  {cinemaError && (
                    <motion.div className="alert alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {cinemaError}
                    </motion.div>
                  )}
                  {cinemaSuccess && (
                    <motion.div className="alert alert-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {cinemaSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Liste des films */}
                <div className="cinema-items-grid">
                  {cinemaItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">{icons.cinema}</div>
                      <h3>Aucun film</h3>
                      <p>Commencez par ajouter votre premier film</p>
                    </div>
                  ) : (
                    cinemaItems.map((item, index) => (
                      <motion.div 
                        key={item.id}
                        className="cinema-item-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="cinema-item-header">
                          <div className="cinema-item-badges">
                            <span className={`badge badge-status ${item.status}`}>{item.status === 'published' ? 'Publié' : 'Brouillon'}</span>
                            {item.year && <span className="badge badge-year">{item.year}</span>}
                          </div>
                          <span className="cinema-order">#{item.display_order || 0}</span>
                        </div>
                        <h3 className="cinema-item-title">{item.title}</h3>
                        {item.director && <p className="cinema-item-director">Réalisateur: {item.director}</p>}
                        <div className="cinema-item-meta">
                          {item.genre && <span>{item.genre}</span>}
                          {item.duration && <span>{item.duration}</span>}
                        </div>
                        {item.video_url && (
                          <div className="cinema-item-video">
                            <span className="video-indicator">{icons.video} Vidéo liée</span>
                          </div>
                        )}
                        <div className="cinema-item-actions">
                          <motion.button 
                            className="btn-icon"
                            onClick={() => setEditingCinema(item)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Modifier"
                          >
                            {icons.edit}
                          </motion.button>
                          <motion.button 
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteCinema(item.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Supprimer"
                          >
                            {icons.trash}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Modal: Ajouter un film */}
                <AnimatePresence>
                  {showAddCinema && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddCinema(false)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Ajouter un film</h2>
                          <button className="modal-close" onClick={() => setShowAddCinema(false)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations générales</h4>
                            <div className="form-row">
                              <div className="form-group flex-2">
                                <label>Titre *</label>
                                <input type="text" value={newCinema.title} onChange={(e) => setNewCinema({...newCinema, title: e.target.value})} placeholder="Titre du film" />
                              </div>
                              <div className="form-group">
                                <label>Année</label>
                                <input type="number" value={newCinema.year} onChange={(e) => setNewCinema({...newCinema, year: parseInt(e.target.value) || ''})} />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Réalisateur</label>
                                <input type="text" value={newCinema.director} onChange={(e) => setNewCinema({...newCinema, director: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Genre</label>
                                <input type="text" value={newCinema.genre} onChange={(e) => setNewCinema({...newCinema, genre: e.target.value})} placeholder="Drame, Comédie..." />
                              </div>
                              <div className="form-group">
                                <label>Durée</label>
                                <input type="text" value={newCinema.duration} onChange={(e) => setNewCinema({...newCinema, duration: e.target.value})} placeholder="1h30min" />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={newCinema.description} onChange={(e) => setNewCinema({...newCinema, description: e.target.value})} rows={3} placeholder="Synopsis ou description du film" />
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Médias</h4>
                            <div className="form-group">
                              <label>Image de couverture</label>
                              <div className="cover-upload-group">
                                <input 
                                  type="url" 
                                  value={newCinema.cover_url} 
                                  onChange={(e) => setNewCinema({...newCinema, cover_url: e.target.value})} 
                                  placeholder="https://... ou importez un fichier" 
                                />
                                <input
                                  type="file"
                                  ref={cinemaCoverInputRef}
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleCoverUpload(e.target.files[0], 'cinema', false, 'cinema')}
                                />
                                <button 
                                  type="button" 
                                  className="btn-upload"
                                  onClick={() => cinemaCoverInputRef.current?.click()}
                                  disabled={uploadingCover}
                                >
                                  {uploadingCover ? (
                                    <span className="upload-spinner"></span>
                                  ) : (
                                    <>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                      </svg>
                                      Importer
                                    </>
                                  )}
                                </button>
                              </div>
                              {newCinema.cover_url && (
                                <div className="cover-preview">
                                  <img src={newCinema.cover_url} alt="Aperçu" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                              )}
                            </div>
                            <div className="form-group">
                              <label>URL Vidéo (YouTube Embed)</label>
                              <input type="url" value={newCinema.video_url} onChange={(e) => setNewCinema({...newCinema, video_url: e.target.value})} placeholder="https://www.youtube.com/embed/..." />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>URL Affiche/Poster</label>
                                <input type="url" value={newCinema.poster_url} onChange={(e) => setNewCinema({...newCinema, poster_url: e.target.value})} placeholder="https://..." />
                              </div>
                              <div className="form-group">
                                <label>URL Bande-annonce</label>
                                <input type="url" value={newCinema.trailer_url} onChange={(e) => setNewCinema({...newCinema, trailer_url: e.target.value})} placeholder="https://..." />
                              </div>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Publication</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={newCinema.status} onChange={(e) => setNewCinema({...newCinema, status: e.target.value})}>
                                  <option value="draft">Brouillon</option>
                                  <option value="published">Publié</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre d'affichage</label>
                                <input type="number" value={newCinema.display_order} onChange={(e) => setNewCinema({...newCinema, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setShowAddCinema(false)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleCreateCinema}>Ajouter le film</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Modifier un film */}
                <AnimatePresence>
                  {editingCinema && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingCinema(null)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Modifier le film</h2>
                          <button className="modal-close" onClick={() => setEditingCinema(null)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations générales</h4>
                            <div className="form-row">
                              <div className="form-group flex-2">
                                <label>Titre *</label>
                                <input type="text" value={editingCinema.title} onChange={(e) => setEditingCinema({...editingCinema, title: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Année</label>
                                <input type="number" value={editingCinema.year || ''} onChange={(e) => setEditingCinema({...editingCinema, year: parseInt(e.target.value) || null})} />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Réalisateur</label>
                                <input type="text" value={editingCinema.director || ''} onChange={(e) => setEditingCinema({...editingCinema, director: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Genre</label>
                                <input type="text" value={editingCinema.genre || ''} onChange={(e) => setEditingCinema({...editingCinema, genre: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Durée</label>
                                <input type="text" value={editingCinema.duration || ''} onChange={(e) => setEditingCinema({...editingCinema, duration: e.target.value})} />
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={editingCinema.description || ''} onChange={(e) => setEditingCinema({...editingCinema, description: e.target.value})} rows={3} />
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Médias</h4>
                            <div className="form-group">
                              <label>Image de couverture</label>
                              <div className="cover-upload-group">
                                <input 
                                  type="url" 
                                  value={editingCinema.cover_url || ''} 
                                  onChange={(e) => setEditingCinema({...editingCinema, cover_url: e.target.value})} 
                                  placeholder="https://... ou importez un fichier" 
                                />
                                <input
                                  type="file"
                                  ref={editCinemaCoverInputRef}
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleCoverUpload(e.target.files[0], 'cinema', true, 'cinema')}
                                />
                                <button 
                                  type="button" 
                                  className="btn-upload"
                                  onClick={() => editCinemaCoverInputRef.current?.click()}
                                  disabled={uploadingCover}
                                >
                                  {uploadingCover ? (
                                    <span className="upload-spinner"></span>
                                  ) : (
                                    <>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                      </svg>
                                      Importer
                                    </>
                                  )}
                                </button>
                              </div>
                              {editingCinema.cover_url && (
                                <div className="cover-preview">
                                  <img src={editingCinema.cover_url} alt="Aperçu" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                              )}
                            </div>
                            <div className="form-group">
                              <label>URL Vidéo (YouTube Embed)</label>
                              <input type="url" value={editingCinema.video_url || ''} onChange={(e) => setEditingCinema({...editingCinema, video_url: e.target.value})} />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>URL Affiche/Poster</label>
                                <input type="url" value={editingCinema.poster_url || ''} onChange={(e) => setEditingCinema({...editingCinema, poster_url: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>URL Bande-annonce</label>
                                <input type="url" value={editingCinema.trailer_url || ''} onChange={(e) => setEditingCinema({...editingCinema, trailer_url: e.target.value})} />
                              </div>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Publication</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={editingCinema.status} onChange={(e) => setEditingCinema({...editingCinema, status: e.target.value})}>
                                  <option value="draft">Brouillon</option>
                                  <option value="published">Publié</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre d'affichage</label>
                                <input type="number" value={editingCinema.display_order || 0} onChange={(e) => setEditingCinema({...editingCinema, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setEditingCinema(null)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleUpdateCinema}>Enregistrer</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* BOUTIQUE */}
            {/* ============================================ */}
            {activeTab === 'boutique' && (
              <motion.div key="boutique" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                    Boutique
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddBoutique(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {icons.plus} Ajouter un produit
                  </motion.button>
                </div>

                {/* Messages de feedback */}
                <AnimatePresence>
                  {boutiqueError && (
                    <motion.div className="alert alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {boutiqueError}
                    </motion.div>
                  )}
                  {boutiqueSuccess && (
                    <motion.div className="alert alert-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {boutiqueSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Liste des produits */}
                <div className="boutique-items-grid">
                  {boutiqueItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">{icons.boutique}</div>
                      <h3>Aucun produit</h3>
                      <p>Commencez par ajouter votre premier produit</p>
                    </div>
                  ) : (
                    boutiqueItems.map((item, index) => (
                      <motion.div 
                        key={item.id}
                        className="boutique-item-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        style={{ borderLeftColor: item.color || 'rgba(107, 174, 255, 0.5)' }}
                      >
                        <div className="boutique-item-header">
                          <span className={`badge badge-status ${item.status}`}>{item.status === 'active' ? 'Actif' : 'Inactif'}</span>
                          <span className="boutique-order">#{item.display_order || 0}</span>
                        </div>
                        <h3 className="boutique-item-title">{item.name}</h3>
                        <p className="boutique-item-price">{item.price} {item.currency}</p>
                        {item.description && <p className="boutique-item-desc">{item.description.substring(0, 80)}...</p>}
                        {item.features && item.features.length > 0 && (
                          <div className="boutique-item-features">
                            <span>{item.features.length} caractéristique(s)</span>
                          </div>
                        )}
                        <div className="boutique-item-actions">
                          <motion.button 
                            className="btn-icon"
                            onClick={() => setEditingBoutique(item)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Modifier"
                          >
                            {icons.edit}
                          </motion.button>
                          <motion.button 
                            className="btn-icon btn-danger"
                            onClick={() => handleDeleteBoutique(item.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Supprimer"
                          >
                            {icons.trash}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Modal: Ajouter un produit */}
                <AnimatePresence>
                  {showAddBoutique && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddBoutique(false)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Ajouter un produit</h2>
                          <button className="modal-close" onClick={() => setShowAddBoutique(false)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations générales</h4>
                            <div className="form-row">
                              <div className="form-group flex-2">
                                <label>Nom du produit *</label>
                                <input type="text" value={newBoutique.name} onChange={(e) => setNewBoutique({...newBoutique, name: e.target.value})} placeholder="Nom du produit" />
                              </div>
                              <div className="form-group">
                                <label>Prix</label>
                                <input type="number" step="0.01" value={newBoutique.price} onChange={(e) => setNewBoutique({...newBoutique, price: e.target.value})} placeholder="0.00" />
                              </div>
                              <div className="form-group">
                                <label>Devise</label>
                                <select value={newBoutique.currency} onChange={(e) => setNewBoutique({...newBoutique, currency: e.target.value})}>
                                  <option value="EUR">EUR</option>
                                  <option value="FCFA">FCFA</option>
                                  <option value="USD">USD</option>
                                </select>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={newBoutique.description} onChange={(e) => setNewBoutique({...newBoutique, description: e.target.value})} rows={3} placeholder="Description du produit" />
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Caractéristiques</h4>
                            <div className="features-list">
                              {newBoutique.features.map((feature, index) => (
                                <div key={index} className="feature-item">
                                  <span>{feature}</span>
                                  <button type="button" className="btn-remove-feature" onClick={() => removeFeature(index)}>×</button>
                                </div>
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Ajouter une caractéristique" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                              <button type="button" className="btn-add-feature" onClick={() => addFeature()}>+</button>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Image & Liens</h4>
                            <div className="form-group">
                              <label>Image de couverture</label>
                              <div className="cover-upload-group">
                                <input 
                                  type="url" 
                                  value={newBoutique.image_url} 
                                  onChange={(e) => setNewBoutique({...newBoutique, image_url: e.target.value})} 
                                  placeholder="https://... ou importez un fichier" 
                                />
                                <input
                                  type="file"
                                  ref={boutiqueCoverInputRef}
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => handleCoverUpload(e.target.files[0], 'boutique', false, 'boutique')}
                                />
                                <button 
                                  type="button" 
                                  className="btn-upload"
                                  onClick={() => boutiqueCoverInputRef.current?.click()}
                                  disabled={uploadingCover}
                                >
                                  {uploadingCover ? (
                                    <span className="upload-spinner"></span>
                                  ) : (
                                    <>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="17 8 12 3 7 8"/>
                                        <line x1="12" y1="3" x2="12" y2="15"/>
                                      </svg>
                                      Importer
                                    </>
                                  )}
                                </button>
                              </div>
                              {newBoutique.image_url && (
                                <div className="cover-preview">
                                  <img src={newBoutique.image_url} alt="Aperçu" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                              )}
                            </div>
                            <div className="form-group">
                              <label>URL d'achat</label>
                              <input type="url" value={newBoutique.purchase_url} onChange={(e) => setNewBoutique({...newBoutique, purchase_url: e.target.value})} placeholder="https://... (lien vers la page d'achat)" />
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Affichage</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={newBoutique.status} onChange={(e) => setNewBoutique({...newBoutique, status: e.target.value})}>
                                  <option value="active">Actif</option>
                                  <option value="inactive">Inactif</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre d'affichage</label>
                                <input type="number" value={newBoutique.display_order} onChange={(e) => setNewBoutique({...newBoutique, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                              <div className="form-group">
                                <label>Couleur d'accentuation</label>
                                <input type="text" value={newBoutique.color} onChange={(e) => setNewBoutique({...newBoutique, color: e.target.value})} placeholder="rgba(107, 174, 255, 0.2)" />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setShowAddBoutique(false)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleCreateBoutique}>Ajouter le produit</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Modifier un produit */}
                <AnimatePresence>
                  {editingBoutique && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingBoutique(null)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Modifier le produit</h2>
                          <button className="modal-close" onClick={() => setEditingBoutique(null)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations générales</h4>
                            <div className="form-row">
                              <div className="form-group flex-2">
                                <label>Nom du produit *</label>
                                <input type="text" value={editingBoutique.name} onChange={(e) => setEditingBoutique({...editingBoutique, name: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Prix</label>
                                <input type="number" step="0.01" value={editingBoutique.price || ''} onChange={(e) => setEditingBoutique({...editingBoutique, price: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Devise</label>
                                <select value={editingBoutique.currency} onChange={(e) => setEditingBoutique({...editingBoutique, currency: e.target.value})}>
                                  <option value="EUR">EUR</option>
                                  <option value="FCFA">FCFA</option>
                                  <option value="USD">USD</option>
                                </select>
                              </div>
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={editingBoutique.description || ''} onChange={(e) => setEditingBoutique({...editingBoutique, description: e.target.value})} rows={3} />
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Caractéristiques</h4>
                            <div className="features-list">
                              {(editingBoutique.features || []).map((feature, index) => (
                                <div key={index} className="feature-item">
                                  <span>{feature}</span>
                                  <button type="button" className="btn-remove-feature" onClick={() => removeFeature(index, true)}>×</button>
                                </div>
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Ajouter une caractéristique" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature(true))} />
                              <button type="button" className="btn-add-feature" onClick={() => addFeature(true)}>+</button>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Image & Liens</h4>
                            <div className="form-group">
                              <label>Image de couverture</label>
                              <div className="cover-upload-group">
                                <input type="url" value={editingBoutique.image_url || ''} onChange={(e) => setEditingBoutique({...editingBoutique, image_url: e.target.value})} placeholder="https://... ou uploadez une image" />
                                <input 
                                  type="file" 
                                  ref={editBoutiqueCoverInputRef} 
                                  style={{ display: 'none' }} 
                                  accept="image/jpeg,image/png,image/gif,image/webp"
                                  onChange={(e) => {
                                    if (e.target.files[0]) {
                                      handleCoverUpload(e.target.files[0], 'image_url', true, 'boutique');
                                    }
                                  }}
                                />
                                <button 
                                  type="button" 
                                  className="btn-upload"
                                  onClick={() => editBoutiqueCoverInputRef.current?.click()}
                                  disabled={uploadingCover}
                                >
                                  {uploadingCover ? (
                                    <span className="upload-spinner"></span>
                                  ) : (
                                    <>
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
                                      </svg>
                                      Upload
                                    </>
                                  )}
                                </button>
                              </div>
                              {editingBoutique.image_url && (
                                <div className="cover-preview">
                                  <img src={editingBoutique.image_url} alt="Aperçu" onError={(e) => e.target.style.display = 'none'} />
                                </div>
                              )}
                            </div>
                            <div className="form-group">
                              <label>URL d'achat</label>
                              <input type="url" value={editingBoutique.purchase_url || ''} onChange={(e) => setEditingBoutique({...editingBoutique, purchase_url: e.target.value})} placeholder="https://... (lien vers la page d'achat)" />
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Affichage</h4>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={editingBoutique.status} onChange={(e) => setEditingBoutique({...editingBoutique, status: e.target.value})}>
                                  <option value="active">Actif</option>
                                  <option value="inactive">Inactif</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre d'affichage</label>
                                <input type="number" value={editingBoutique.display_order || 0} onChange={(e) => setEditingBoutique({...editingBoutique, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                              <div className="form-group">
                                <label>Couleur d'accentuation</label>
                                <input type="text" value={editingBoutique.color || ''} onChange={(e) => setEditingBoutique({...editingBoutique, color: e.target.value})} />
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setEditingBoutique(null)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleUpdateBoutique}>Enregistrer</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* PRESTATIONS */}
            {/* ============================================ */}
            {activeTab === 'prestations' && (
              <motion.div key="prestations" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Prestations
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddPrestation(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {icons.plus} Ajouter une prestation
                  </motion.button>
                </div>

                <AnimatePresence>
                  {prestationError && (
                    <motion.div className="alert alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {prestationError}
                    </motion.div>
                  )}
                  {prestationSuccess && (
                    <motion.div className="alert alert-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {prestationSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="boutique-items-grid">
                  {prestationsItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">{icons.prestations}</div>
                      <h3>Aucune prestation</h3>
                      <p>Commencez par ajouter votre première prestation</p>
                    </div>
                  ) : (
                    prestationsItems.map((item, index) => {
                      const details = typeof item.details === 'string' ? JSON.parse(item.details) : item.details || []
                      return (
                        <motion.div
                          key={item.id}
                          className="boutique-item-card"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          style={{ borderLeftColor: 'rgba(201, 168, 76, 0.5)' }}
                        >
                          <div className="boutique-item-header">
                            <span className={`badge badge-status ${item.status}`}>{item.status === 'active' ? 'Actif' : 'Inactif'}</span>
                            <span className="boutique-order">#{item.display_order || 0}</span>
                          </div>
                          <h3 className="boutique-item-title">{item.title}</h3>
                          <p className="boutique-item-desc">{item.description?.substring(0, 100)}...</p>
                          {details.length > 0 && (
                            <div className="boutique-item-features">
                              <span>{details.length} détail(s)</span>
                            </div>
                          )}
                          <div className="boutique-item-actions">
                            <motion.button
                              className="btn-icon"
                              onClick={() => setEditingPrestation({
                                ...item,
                                details: typeof item.details === 'string' ? JSON.parse(item.details) : item.details || []
                              })}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Modifier"
                            >
                              {icons.edit}
                            </motion.button>
                            <motion.button
                              className="btn-icon btn-danger"
                              onClick={() => handleDeletePrestation(item.id)}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Supprimer"
                            >
                              {icons.trash}
                            </motion.button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Modal: Ajouter une prestation */}
                <AnimatePresence>
                  {showAddPrestation && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddPrestation(false)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Ajouter une prestation</h2>
                          <button className="modal-close" onClick={() => setShowAddPrestation(false)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations générales</h4>
                            <div className="form-group">
                              <label>Titre *</label>
                              <input type="text" value={newPrestation.title} onChange={(e) => setNewPrestation({...newPrestation, title: e.target.value})} placeholder="Ex: Production" />
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={newPrestation.description} onChange={(e) => setNewPrestation({...newPrestation, description: e.target.value})} rows={3} placeholder="Description de la prestation" />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Icône</label>
                                <select value={newPrestation.icon} onChange={(e) => setNewPrestation({...newPrestation, icon: e.target.value})}>
                                  <option value="conception">Conception</option>
                                  <option value="gestion">Gestion</option>
                                  <option value="preproduction">Pré-production</option>
                                  <option value="production">Production</option>
                                  <option value="postproduction">Post-production</option>
                                  <option value="diffusion">Diffusion</option>
                                  <option value="video">Vidéo</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={newPrestation.status} onChange={(e) => setNewPrestation({...newPrestation, status: e.target.value})}>
                                  <option value="active">Actif</option>
                                  <option value="inactive">Inactif</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre</label>
                                <input type="number" value={newPrestation.display_order} onChange={(e) => setNewPrestation({...newPrestation, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Détails / Points clés</h4>
                            <div className="features-list">
                              {newPrestation.details.map((detail, index) => (
                                <div key={index} className="feature-item">
                                  <span>{detail}</span>
                                  <button type="button" className="btn-remove-feature" onClick={() => removeDetail(index)}>×</button>
                                </div>
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newDetail} onChange={(e) => setNewDetail(e.target.value)} placeholder="Ajouter un détail" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDetail())} />
                              <button type="button" className="btn-add-feature" onClick={() => addDetail()}>+</button>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setShowAddPrestation(false)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleCreatePrestation}>Ajouter la prestation</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Modifier une prestation */}
                <AnimatePresence>
                  {editingPrestation && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingPrestation(null)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Modifier la prestation</h2>
                          <button className="modal-close" onClick={() => setEditingPrestation(null)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations générales</h4>
                            <div className="form-group">
                              <label>Titre *</label>
                              <input type="text" value={editingPrestation.title} onChange={(e) => setEditingPrestation({...editingPrestation, title: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={editingPrestation.description || ''} onChange={(e) => setEditingPrestation({...editingPrestation, description: e.target.value})} rows={3} />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Icône</label>
                                <select value={editingPrestation.icon} onChange={(e) => setEditingPrestation({...editingPrestation, icon: e.target.value})}>
                                  <option value="conception">Conception</option>
                                  <option value="gestion">Gestion</option>
                                  <option value="preproduction">Pré-production</option>
                                  <option value="production">Production</option>
                                  <option value="postproduction">Post-production</option>
                                  <option value="diffusion">Diffusion</option>
                                  <option value="video">Vidéo</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={editingPrestation.status} onChange={(e) => setEditingPrestation({...editingPrestation, status: e.target.value})}>
                                  <option value="active">Actif</option>
                                  <option value="inactive">Inactif</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre</label>
                                <input type="number" value={editingPrestation.display_order || 0} onChange={(e) => setEditingPrestation({...editingPrestation, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Détails / Points clés</h4>
                            <div className="features-list">
                              {(editingPrestation.details || []).map((detail, index) => (
                                <div key={index} className="feature-item">
                                  <span>{detail}</span>
                                  <button type="button" className="btn-remove-feature" onClick={() => removeDetail(index, true)}>×</button>
                                </div>
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newDetail} onChange={(e) => setNewDetail(e.target.value)} placeholder="Ajouter un détail" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDetail(true))} />
                              <button type="button" className="btn-add-feature" onClick={() => addDetail(true)}>+</button>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setEditingPrestation(null)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleUpdatePrestation}>Enregistrer</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* OFFRES */}
            {/* ============================================ */}
            {activeTab === 'offres' && (
              <motion.div key="offres" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg>
                    Offres
                  </h3>
                  <motion.button className="btn-primary" onClick={() => setShowAddOffre(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {icons.plus} Ajouter une offre
                  </motion.button>
                </div>

                <AnimatePresence>
                  {offreError && <motion.div className="alert alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{offreError}</motion.div>}
                  {offreSuccess && <motion.div className="alert alert-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{offreSuccess}</motion.div>}
                </AnimatePresence>

                <div className="boutique-items-grid">
                  {offresItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/></svg></div>
                      <h3>Aucune offre</h3>
                      <p>Ajoutez vos packages et projets ponctuels</p>
                    </div>
                  ) : (
                    offresItems.map((item, index) => {
                      const features = typeof item.features === 'string' ? JSON.parse(item.features) : item.features || []
                      return (
                        <motion.div key={item.id} className="boutique-item-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                          style={{ borderLeftColor: item.is_featured ? 'rgba(201, 168, 76, 0.8)' : item.type === 'oneoff' ? 'rgba(100, 200, 150, 0.5)' : 'rgba(255, 255, 255, 0.15)' }}>
                          <div className="boutique-item-header">
                            <span className={`badge badge-status ${item.status}`}>{item.status === 'active' ? 'Actif' : 'Inactif'}</span>
                            <span className="boutique-order" style={{ background: item.type === 'oneoff' ? 'rgba(100,200,150,0.15)' : 'rgba(201,168,76,0.15)', color: item.type === 'oneoff' ? '#64c896' : '#c9a84c' }}>
                              {item.type === 'package' ? 'Package' : 'Ponctuel'}
                            </span>
                          </div>
                          <h3 className="boutique-item-title">{item.name}</h3>
                          <p className="boutique-item-desc">{item.description?.substring(0, 80)}{item.description?.length > 80 ? '...' : ''}</p>
                          <div className="boutique-item-features">
                            <span style={{color:'#c9a84c',fontWeight:600}}>{item.type === 'package' ? new Intl.NumberFormat('fr-FR').format(item.price) + ' FCFA ' + item.period : item.period}</span>
                            {item.is_featured && <span style={{color:'#c9a84c',fontSize:10,letterSpacing:1}}>POPULAIRE</span>}
                          </div>
                          {features.length > 0 && <div className="boutique-item-features"><span>{features.length} feature(s)</span></div>}
                          <div className="boutique-item-actions">
                            <motion.button className="btn-icon" onClick={() => {
                              const f = typeof item.features === 'string' ? JSON.parse(item.features) : item.features || []
                              const ni = typeof item.not_included === 'string' ? JSON.parse(item.not_included) : item.not_included || []
                              setEditingOffre({ ...item, features: f, not_included: ni })
                            }} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Modifier">{icons.edit}</motion.button>
                            <motion.button className="btn-icon btn-danger" onClick={() => handleDeleteOffre(item.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} title="Supprimer">{icons.trash}</motion.button>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Modal: Ajouter une offre */}
                <AnimatePresence>
                  {showAddOffre && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddOffre(false)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Ajouter une offre</h2>
                          <button className="modal-close" onClick={() => setShowAddOffre(false)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations generales</h4>
                            <div className="form-group">
                              <label>Nom *</label>
                              <input type="text" value={newOffre.name} onChange={(e) => setNewOffre({...newOffre, name: e.target.value})} placeholder="Ex: Corporate" />
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={newOffre.description} onChange={(e) => setNewOffre({...newOffre, description: e.target.value})} rows={2} placeholder="Description courte" />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Type</label>
                                <select value={newOffre.type} onChange={(e) => setNewOffre({...newOffre, type: e.target.value})}>
                                  <option value="package">Package mensuel</option>
                                  <option value="oneoff">Projet ponctuel</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Cible</label>
                                <input type="text" value={newOffre.target} onChange={(e) => setNewOffre({...newOffre, target: e.target.value})} placeholder="Ex: PME & Startups" />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Prix (FCFA)</label>
                                <input type="number" value={newOffre.price} onChange={(e) => setNewOffre({...newOffre, price: parseInt(e.target.value) || 0})} />
                              </div>
                              <div className="form-group">
                                <label>Periode / Fourchette</label>
                                <input type="text" value={newOffre.period} onChange={(e) => setNewOffre({...newOffre, period: e.target.value})} placeholder="/ mois ou 300 000 - 700 000" />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Texte CTA</label>
                                <input type="text" value={newOffre.cta} onChange={(e) => setNewOffre({...newOffre, cta: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={newOffre.status} onChange={(e) => setNewOffre({...newOffre, status: e.target.value})}>
                                  <option value="active">Actif</option>
                                  <option value="inactive">Inactif</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre</label>
                                <input type="number" value={newOffre.display_order} onChange={(e) => setNewOffre({...newOffre, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                            </div>
                            <div className="form-group" style={{display:'flex',alignItems:'center',gap:8}}>
                              <input type="checkbox" checked={newOffre.is_featured} onChange={(e) => setNewOffre({...newOffre, is_featured: e.target.checked})} style={{width:'auto'}} />
                              <label style={{margin:0}}>Mise en avant (Le plus populaire)</label>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Features incluses</h4>
                            <div className="features-list">
                              {(newOffre.features || []).map((f, i) => (
                                <FeatureChip
                                  key={i}
                                  index={i}
                                  total={(newOffre.features || []).length}
                                  value={f}
                                  listKey="new-features"
                                  dragState={featureDrag}
                                  setDragState={setFeatureDrag}
                                  onChange={(v) => updateOffreFeature('features', i, v)}
                                  onRemove={() => removeOffreFeature('features', i)}
                                  onMove={(from, to) => moveOffreFeature('features', from, to)}
                                />
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newOffreFeature} onChange={(e) => setNewOffreFeature(e.target.value)} placeholder="Ajouter une feature" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOffreFeature('features'))} />
                              <button type="button" className="btn-add-feature" onClick={() => addOffreFeature('features')}>+</button>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Non inclus</h4>
                            <div className="features-list">
                              {(newOffre.not_included || []).map((f, i) => (
                                <FeatureChip
                                  key={i}
                                  index={i}
                                  total={(newOffre.not_included || []).length}
                                  value={f}
                                  excluded
                                  listKey="new-not-included"
                                  dragState={featureDrag}
                                  setDragState={setFeatureDrag}
                                  onChange={(v) => updateOffreFeature('not_included', i, v)}
                                  onRemove={() => removeOffreFeature('not_included', i)}
                                  onMove={(from, to) => moveOffreFeature('not_included', from, to)}
                                />
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newOffreFeature} onChange={(e) => setNewOffreFeature(e.target.value)} placeholder="Ex: Version anglaise" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOffreFeature('not_included'))} />
                              <button type="button" className="btn-add-feature" onClick={() => addOffreFeature('not_included')}>+</button>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setShowAddOffre(false)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleCreateOffre}>Ajouter l'offre</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Modifier une offre */}
                <AnimatePresence>
                  {editingOffre && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingOffre(null)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Modifier l'offre</h2>
                          <button className="modal-close" onClick={() => setEditingOffre(null)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-section">
                            <h4>Informations generales</h4>
                            <div className="form-group">
                              <label>Nom *</label>
                              <input type="text" value={editingOffre.name} onChange={(e) => setEditingOffre({...editingOffre, name: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label>Description</label>
                              <textarea value={editingOffre.description || ''} onChange={(e) => setEditingOffre({...editingOffre, description: e.target.value})} rows={2} />
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Type</label>
                                <select value={editingOffre.type} onChange={(e) => setEditingOffre({...editingOffre, type: e.target.value})}>
                                  <option value="package">Package mensuel</option>
                                  <option value="oneoff">Projet ponctuel</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Cible</label>
                                <input type="text" value={editingOffre.target || ''} onChange={(e) => setEditingOffre({...editingOffre, target: e.target.value})} />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Prix (FCFA)</label>
                                <input type="number" value={editingOffre.price} onChange={(e) => setEditingOffre({...editingOffre, price: parseInt(e.target.value) || 0})} />
                              </div>
                              <div className="form-group">
                                <label>Periode / Fourchette</label>
                                <input type="text" value={editingOffre.period || ''} onChange={(e) => setEditingOffre({...editingOffre, period: e.target.value})} />
                              </div>
                            </div>
                            <div className="form-row">
                              <div className="form-group">
                                <label>Texte CTA</label>
                                <input type="text" value={editingOffre.cta || ''} onChange={(e) => setEditingOffre({...editingOffre, cta: e.target.value})} />
                              </div>
                              <div className="form-group">
                                <label>Statut</label>
                                <select value={editingOffre.status} onChange={(e) => setEditingOffre({...editingOffre, status: e.target.value})}>
                                  <option value="active">Actif</option>
                                  <option value="inactive">Inactif</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <label>Ordre</label>
                                <input type="number" value={editingOffre.display_order || 0} onChange={(e) => setEditingOffre({...editingOffre, display_order: parseInt(e.target.value) || 0})} />
                              </div>
                            </div>
                            <div className="form-group" style={{display:'flex',alignItems:'center',gap:8}}>
                              <input type="checkbox" checked={editingOffre.is_featured || false} onChange={(e) => setEditingOffre({...editingOffre, is_featured: e.target.checked})} style={{width:'auto'}} />
                              <label style={{margin:0}}>Mise en avant (Le plus populaire)</label>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Features incluses</h4>
                            <div className="features-list">
                              {(editingOffre.features || []).map((f, i) => (
                                <FeatureChip
                                  key={i}
                                  index={i}
                                  total={(editingOffre.features || []).length}
                                  value={f}
                                  listKey="edit-features"
                                  dragState={featureDrag}
                                  setDragState={setFeatureDrag}
                                  onChange={(v) => updateOffreFeature('features', i, v, true)}
                                  onRemove={() => removeOffreFeature('features', i, true)}
                                  onMove={(from, to) => moveOffreFeature('features', from, to, true)}
                                />
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newOffreFeature} onChange={(e) => setNewOffreFeature(e.target.value)} placeholder="Ajouter une feature" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOffreFeature('features', true))} />
                              <button type="button" className="btn-add-feature" onClick={() => addOffreFeature('features', true)}>+</button>
                            </div>
                          </div>
                          <div className="form-section">
                            <h4>Non inclus</h4>
                            <div className="features-list">
                              {(editingOffre.not_included || []).map((f, i) => (
                                <FeatureChip
                                  key={i}
                                  index={i}
                                  total={(editingOffre.not_included || []).length}
                                  value={f}
                                  excluded
                                  listKey="edit-not-included"
                                  dragState={featureDrag}
                                  setDragState={setFeatureDrag}
                                  onChange={(v) => updateOffreFeature('not_included', i, v, true)}
                                  onRemove={() => removeOffreFeature('not_included', i, true)}
                                  onMove={(from, to) => moveOffreFeature('not_included', from, to, true)}
                                />
                              ))}
                            </div>
                            <div className="feature-input-group">
                              <input type="text" value={newOffreFeature} onChange={(e) => setNewOffreFeature(e.target.value)} placeholder="Ex: Version anglaise" onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOffreFeature('not_included', true))} />
                              <button type="button" className="btn-add-feature" onClick={() => addOffreFeature('not_included', true)}>+</button>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setEditingOffre(null)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleUpdateOffre}>Enregistrer</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* TÂCHES */}
            {/* ============================================ */}
            {activeTab === 'tasks' && (
              <motion.div key="tasks" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                    Taches <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>({tasks.length})</span>
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddTask(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {icons.plus} Nouvelle tâche
                  </motion.button>
                </div>

                <AnimatePresence>
                  {taskError && (
                    <motion.div className="alert alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {taskError}
                    </motion.div>
                  )}
                  {taskSuccess && (
                    <motion.div className="alert alert-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {taskSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Stats rapides */}
                {tasksStats && (
                  <div className="tasks-stats-bar">
                    <div className="tasks-stat-item">
                      <span className="tasks-stat-value">{tasksStats.total}</span>
                      <span className="tasks-stat-label">Total</span>
                    </div>
                    <div className="tasks-stat-item">
                      <span className="tasks-stat-value todo">{tasksStats.todo}</span>
                      <span className="tasks-stat-label">A faire</span>
                    </div>
                    <div className="tasks-stat-item">
                      <span className="tasks-stat-value in-progress">{tasksStats.in_progress}</span>
                      <span className="tasks-stat-label">En cours</span>
                    </div>
                    <div className="tasks-stat-item">
                      <span className="tasks-stat-value done">{tasksStats.done}</span>
                      <span className="tasks-stat-label">Termine</span>
                    </div>
                    {tasksStats.overdue > 0 && (
                      <div className="tasks-stat-item">
                        <span className="tasks-stat-value overdue">{tasksStats.overdue}</span>
                        <span className="tasks-stat-label">En retard</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Kanban Board - Drag & Drop */}
                <div className="tasks-kanban-flat">
                  {[
                    { id: 'todo', label: 'A faire', color: '#f59e0b' },
                    { id: 'in_progress', label: 'En cours', color: '#3b82f6' },
                    { id: 'done', label: 'Termine', color: '#22c55e' }
                  ].map(column => {
                    const columnTasks = tasks.filter(t => t.status === column.id)
                    return (
                      <div
                        key={column.id}
                        className={`tasks-kanban-zone ${dragOverCol === column.id ? 'drag-over' : ''}`}
                        onDragOver={e => { e.preventDefault(); setDragOverCol(column.id) }}
                        onDragLeave={() => setDragOverCol(null)}
                        onDrop={async e => {
                          e.preventDefault()
                          setDragOverCol(null)
                          if (draggedTask && draggedTask.status !== column.id) {
                            await tasksAPI.update(draggedTask.id, { status: column.id })
                            fetchTasksData()
                          }
                          setDraggedTask(null)
                        }}
                      >
                        <div className="tasks-zone-header">
                          <span className="tasks-zone-dot" style={{ background: column.color }} />
                          <span className="tasks-zone-title">{column.label}</span>
                          <span className="tasks-zone-count" style={{ color: column.color }}>{columnTasks.length}</span>
                        </div>
                        <div className="tasks-zone-cards">
                          <AnimatePresence>
                            {columnTasks.map(task => (
                              <motion.div
                                key={task.id}
                                className={`task-drag-card ${task.priority}`}
                                draggable
                                onDragStart={() => setDraggedTask(task)}
                                onDragEnd={() => { setDraggedTask(null); setDragOverCol(null) }}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                layout
                              >
                                <div className="task-drag-grip">
                                  <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor"><circle cx="3" cy="2" r="1.5"/><circle cx="7" cy="2" r="1.5"/><circle cx="3" cy="8" r="1.5"/><circle cx="7" cy="8" r="1.5"/><circle cx="3" cy="14" r="1.5"/><circle cx="7" cy="14" r="1.5"/></svg>
                                </div>
                                <div className="task-drag-content">
                                  <div className="task-drag-top">
                                    <div
                                      className={`task-checkbox ${task.status}`}
                                      onClick={() => handleToggleTaskStatus(task)}
                                    >
                                      {task.status === 'done' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20,6 9,17 4,12"/></svg>}
                                      {task.status === 'in_progress' && <div className="task-progress-dot"></div>}
                                    </div>
                                    <div className="task-drag-info">
                                      <div className={`task-title ${task.status === 'done' ? 'done' : ''}`}>{task.title}</div>
                                      {task.description && <div className="task-drag-desc">{task.description}</div>}
                                    </div>
                                    <div className="task-drag-btns">
                                      <motion.button
                                        className="action-btn edit"
                                        onClick={() => setEditingTask({ ...task, due_date: task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '' })}
                                        whileHover={{ scale: 1.1 }}
                                      >
                                        {icons.edit}
                                      </motion.button>
                                      <motion.button className="action-btn delete" onClick={() => handleDeleteTask(task.id)} whileHover={{ scale: 1.1 }}>
                                        {icons.trash}
                                      </motion.button>
                                    </div>
                                  </div>
                                  <div className="task-drag-meta">
                                    <span className={`task-priority ${task.priority}`}>
                                      {task.priority === 'urgent' ? 'urgent' : task.priority === 'high' ? 'haute' : task.priority === 'medium' ? 'moyenne' : 'basse'}
                                    </span>
                                    {task.due_date && (
                                      <span className={`task-due ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'overdue' : ''}`}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                                        {new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                      </span>
                                    )}
                                    {task.category && <span className="task-category-badge">{task.category}</span>}
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </AnimatePresence>
                          {columnTasks.length === 0 && (
                            <div className="tasks-zone-empty">Deposez une tache ici</div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Modal: Ajouter une tâche */}
                <AnimatePresence>
                  {showAddTask && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddTask(false)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Nouvelle tâche</h2>
                          <button className="modal-close" onClick={() => setShowAddTask(false)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Titre *</label>
                            <input type="text" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} placeholder="Titre de la tâche" />
                          </div>
                          <div className="form-group">
                            <label>Description</label>
                            <textarea value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} rows={3} placeholder="Description optionnelle" />
                          </div>
                          <div className="form-group">
                            <label>Priorité</label>
                            <div className="priority-selector">
                              {[
                                { value: 'low', label: 'Basse' },
                                { value: 'medium', label: 'Moyenne' },
                                { value: 'high', label: 'Haute' },
                                { value: 'urgent', label: 'Urgent' }
                              ].map(p => (
                                <button
                                  key={p.value}
                                  type="button"
                                  className={`priority-option ${p.value} ${newTask.priority === p.value ? 'active' : ''}`}
                                  onClick={() => setNewTask({...newTask, priority: p.value})}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Date d'échéance</label>
                              <input type="date" value={newTask.due_date} onChange={(e) => setNewTask({...newTask, due_date: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label>Assigné à</label>
                              <input type="text" value={newTask.assigned_to} onChange={(e) => setNewTask({...newTask, assigned_to: e.target.value})} placeholder="Nom de la personne" />
                            </div>
                            <div className="form-group">
                              <label>Catégorie</label>
                              <input type="text" value={newTask.category} onChange={(e) => setNewTask({...newTask, category: e.target.value})} placeholder="Ex: Production, Admin..." />
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setShowAddTask(false)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleCreateTask}>Ajouter la tâche</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Modifier une tâche */}
                <AnimatePresence>
                  {editingTask && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingTask(null)}>
                      <motion.div className="modal modal-large" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Modifier la tâche</h2>
                          <button className="modal-close" onClick={() => setEditingTask(null)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Titre *</label>
                            <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label>Description</label>
                            <textarea value={editingTask.description || ''} onChange={(e) => setEditingTask({...editingTask, description: e.target.value})} rows={3} />
                          </div>
                          <div className="form-group">
                            <label>Statut</label>
                            <div className="priority-selector">
                              {[
                                { value: 'todo', label: 'A faire' },
                                { value: 'in_progress', label: 'En cours' },
                                { value: 'done', label: 'Terminé' }
                              ].map(s => (
                                <button
                                  key={s.value}
                                  type="button"
                                  className={`priority-option status-${s.value} ${editingTask.status === s.value ? 'active' : ''}`}
                                  onClick={() => setEditingTask({...editingTask, status: s.value})}
                                >
                                  {s.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Priorité</label>
                            <div className="priority-selector">
                              {[
                                { value: 'low', label: 'Basse' },
                                { value: 'medium', label: 'Moyenne' },
                                { value: 'high', label: 'Haute' },
                                { value: 'urgent', label: 'Urgent' }
                              ].map(p => (
                                <button
                                  key={p.value}
                                  type="button"
                                  className={`priority-option ${p.value} ${editingTask.priority === p.value ? 'active' : ''}`}
                                  onClick={() => setEditingTask({...editingTask, priority: p.value})}
                                >
                                  {p.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Date d'échéance</label>
                              <input type="date" value={editingTask.due_date || ''} onChange={(e) => setEditingTask({...editingTask, due_date: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label>Assigné à</label>
                              <input type="text" value={editingTask.assigned_to || ''} onChange={(e) => setEditingTask({...editingTask, assigned_to: e.target.value})} />
                            </div>
                            <div className="form-group">
                              <label>Catégorie</label>
                              <input type="text" value={editingTask.category || ''} onChange={(e) => setEditingTask({...editingTask, category: e.target.value})} />
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button type="button" className="btn-secondary" onClick={() => setEditingTask(null)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleUpdateTask}>Enregistrer</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* MESSAGES */}
            {/* ============================================ */}
            {activeTab === 'messages' && (
              <motion.div key="messages" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Messages <span style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>({messages.length})</span>
                  </h3>
                </div>

                {messages.length === 0 ? (
                  <motion.div className="no-messages" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                    <div className="no-messages-icon">{icons.messages}</div>
                    <h3>Aucun message</h3>
                    <p>Les messages envoyés depuis le formulaire de contact apparaîtront ici.</p>
                  </motion.div>
                ) : (
                  <div className="messages-container">
                    <motion.div className="messages-list" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                      {messages.map((message, index) => (
                        <motion.div 
                          key={message.id}
                          className={`message-item ${!message.is_read ? 'unread' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                          onClick={() => { setSelectedMessage(message); markMessageAsRead(message.id) }}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ x: 5 }}
                        >
                          <div className="message-header">
                            <span className="message-name">{message.name}</span>
                            {!message.is_read && <span className="unread-badge">Nouveau</span>}
                          </div>
                          <div className="message-email">{message.email}</div>
                          {message.phone && <div className="message-phone">{message.phone}</div>}
                          <div className="message-preview">{message.message?.substring(0, 50)}...</div>
                          <div className="message-date">{formatDate(message.created_at)}</div>
                        </motion.div>
                      ))}
                    </motion.div>

                    <motion.div className="message-detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                      {selectedMessage ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={selectedMessage.id}>
                          <div className="detail-header">
                            <div>
                              <h3>{selectedMessage.name}</h3>
                              <a href={`mailto:${selectedMessage.email}`} className="detail-email">{selectedMessage.email}</a>
                              {selectedMessage.phone && <a href={`tel:${selectedMessage.phone}`} className="detail-phone">{selectedMessage.phone}</a>}
                            </div>
                            <button className="delete-btn" onClick={() => { deleteMessage(selectedMessage.id); setSelectedMessage(null) }}>
                              {icons.trash} Supprimer
                            </button>
                          </div>
                          <div className="detail-date">Reçu le {formatDate(selectedMessage.created_at)}</div>
                          <div className="detail-content">{selectedMessage.message}</div>
                          <div className="detail-actions">
                            <a href={`mailto:${selectedMessage.email}?subject=Re: Votre message sur NAATAL`} className="reply-btn">
                              {icons.reply} Répondre par email
                            </a>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="no-selection">
                          <div className="no-selection-icon">{icons.messages}</div>
                          <p>Sélectionnez un message pour le lire</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ============================================ */}
            {/* COMPTABILITÉ */}
            {/* ============================================ */}
            {activeTab === 'comptabilite' && (
              <motion.div key="comptabilite" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                    Comptabilite
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddTransaction(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {icons.plus} Nouvelle transaction
                  </motion.button>
                </div>

                {/* Messages de feedback */}
                <AnimatePresence>
                  {comptaError && (
                    <motion.div className="compta-alert error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {comptaError}
                    </motion.div>
                  )}
                  {comptaSuccess && (
                    <motion.div className="compta-alert success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {comptaSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Filtres */}
                <div className="dash-compta-filters">
                  <div className="dash-filter-group">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <select value={comptaFilter.year} onChange={e => setComptaFilter({...comptaFilter, year: parseInt(e.target.value)})}>
                      {[...Array(5)].map((_, i) => {
                        const year = currentYear - 2 + i
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                    <select value={comptaFilter.type} onChange={e => setComptaFilter({...comptaFilter, type: e.target.value})}>
                      <option value="">Tous les types</option>
                      <option value="revenu">Revenus</option>
                      <option value="depense">Depenses</option>
                    </select>
                  </div>
                  <div className="dash-month-pills">
                    <button className={!comptaFilter.month ? 'active' : ''} onClick={() => setComptaFilter({...comptaFilter, month: ''})}>Annee</button>
                    {['Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                      <button key={i} className={comptaFilter.month === i + 1 ? 'active' : ''} onClick={() => setComptaFilter({...comptaFilter, month: i + 1})}>{m}</button>
                    ))}
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="compta-cards" style={{ marginBottom: '24px' }}>
                  <div className="compta-card revenus">
                    <div className="compta-card-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                      <span>Revenus</span>
                    </div>
                    <div className="compta-card-value">
                      <AnimatedCounter value={comptaStats?.totals?.revenus || 0} duration={600} /> F
                    </div>
                    <div className="compta-card-sub">
                      <AnimatedCounter value={comptaStats?.totals?.countRevenus || 0} duration={400} /> transactions
                    </div>
                  </div>
                  <div className="compta-card depenses">
                    <div className="compta-card-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                      <span>Depenses</span>
                    </div>
                    <div className="compta-card-value">
                      <AnimatedCounter value={comptaStats?.totals?.depenses || 0} duration={600} /> F
                    </div>
                    <div className="compta-card-sub">
                      <AnimatedCounter value={comptaStats?.totals?.countDepenses || 0} duration={400} /> transactions
                    </div>
                  </div>
                  <div className="compta-card solde">
                    <div className="compta-card-header">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                      <span>Solde</span>
                    </div>
                    <div className="compta-card-value">
                      <AnimatedCounter value={comptaStats?.totals?.balance || 0} duration={600} /> F
                    </div>
                    <div className="compta-card-sub">{comptaStats?.totals?.balance >= 0 ? 'Benefice' : 'Deficit'}</div>
                  </div>
                </div>

                {/* Liste des transactions */}
                <motion.div className="transactions-list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                  <div className="transactions-header">
                    <span></span>
                    <span>Date</span>
                    <span>Description</span>
                    <span>Catégorie</span>
                    <span>Montant</span>
                    <span>Actions</span>
                  </div>
                  
                  {transactions.length === 0 ? (
                    <div className="no-transactions">
                      <div className="no-transactions-icon">{icons.comptabilite}</div>
                      <h3>Aucune transaction</h3>
                      <p>Commencez par ajouter une transaction</p>
                    </div>
                  ) : (
                    transactions.map((trans, index) => (
                      <motion.div 
                        key={trans.id}
                        className={`transaction-item ${trans.type} ${expandedTransactions[trans.id] ? 'expanded' : ''}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <div className="transaction-row" onClick={() => setExpandedTransactions(prev => ({...prev, [trans.id]: !prev[trans.id]}))}>
                          <span className="trans-expand">
                            <motion.span 
                              className="expand-arrow"
                              animate={{ rotate: expandedTransactions[trans.id] ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              ›
                            </motion.span>
                          </span>
                          <span className="trans-date">{new Date(trans.date).toLocaleDateString('fr-FR')}</span>
                          <span className="trans-desc">
                            <strong>{trans.description || trans.category}</strong>
                            {trans.client && <small>{trans.client}</small>}
                            {trans.payment_type === 'acompte' && (
                              <span className="payment-badge acompte">
                                Acompte {trans.acompte_number}/{trans.total_acomptes}
                              </span>
                            )}
                          </span>
                          <span className="trans-category">{trans.category}</span>
                          <span className={`trans-amount ${trans.type}`}>
                            {trans.type === 'revenu' ? '+' : '-'}{formatMoney(trans.amount)}
                            {trans.payment_type === 'acompte' && trans.total_project && parseFloat(trans.total_project) > parseFloat(trans.amount) && (
                              <small className="remaining-amount">
                                Reste: {formatMoney(parseFloat(trans.total_project) - parseFloat(trans.amount))}
                              </small>
                            )}
                          </span>
                          <span className="trans-actions" onClick={e => e.stopPropagation()}>
                            <button className="btn-edit" onClick={() => {
                              setEditingTransaction({
                                ...trans, 
                                amount: trans.amount?.toString() || '', 
                                total_project: trans.total_project?.toString() || '',
                                payment_type: trans.payment_type || 'comptant',
                                acompte_number: trans.acompte_number || 1,
                                total_acomptes: trans.total_acomptes || 1
                              });
                              fetchAttachments('transaction', trans.id);
                            }} title="Modifier">
                              {icons.edit}
                            </button>
                            <button className="btn-delete" onClick={() => handleDeleteTransaction(trans.id)} title="Supprimer">
                              {icons.trash}
                            </button>
                          </span>
                        </div>
                        
                        {/* Panneau de détails expandable */}
                        <AnimatePresence>
                          {expandedTransactions[trans.id] && (
                            <motion.div 
                              className="transaction-details"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="details-grid">
                                <div className="detail-col">
                                  <div className="detail-row">
                                    <span className="detail-label">Description</span>
                                    <span className="detail-value">{trans.description || '-'}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span className="detail-label">Client / Fournisseur</span>
                                    <span className="detail-value">{trans.client || '-'}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span className="detail-label">Projet</span>
                                    <span className="detail-value">{trans.project || '-'}</span>
                                  </div>
                                </div>
                                <div className="detail-col">
                                  <div className="detail-row">
                                    <span className="detail-label">Mode de paiement</span>
                                    <span className="detail-value">{trans.payment_method || '-'}</span>
                                  </div>
                                  <div className="detail-row">
                                    <span className="detail-label">Référence</span>
                                    <span className="detail-value">{trans.reference || '-'}</span>
                                  </div>
                                  {trans.payment_type === 'acompte' && (
                                    <div className="detail-row">
                                      <span className="detail-label">Type de paiement</span>
                                      <span className="detail-value highlight">Acompte {trans.acompte_number}/{trans.total_acomptes}</span>
                                    </div>
                                  )}
                                </div>
                                {trans.payment_type === 'acompte' && trans.total_project && (
                                  <div className="detail-col acompte-details">
                                    <div className="acompte-recap">
                                      <div className="acompte-line">
                                        <span>Montant total du projet</span>
                                        <strong>{formatMoney(trans.total_project)}</strong>
                                      </div>
                                      <div className="acompte-line">
                                        <span>Cet acompte</span>
                                        <strong className="current">{formatMoney(trans.amount)}</strong>
                                      </div>
                                      <div className="acompte-line remaining">
                                        <span>Reste à payer</span>
                                        <strong>{formatMoney(Math.max(0, parseFloat(trans.total_project) - parseFloat(trans.amount)))}</strong>
                                      </div>
                                      <div className="acompte-progress">
                                        <div className="progress-bar">
                                          <div 
                                            className="progress-fill"
                                            style={{ width: `${Math.min(100, (parseFloat(trans.amount) / parseFloat(trans.total_project)) * 100)}%` }}
                                          />
                                        </div>
                                        <span className="progress-text">
                                          {Math.round((parseFloat(trans.amount) / parseFloat(trans.total_project)) * 100)}% payé
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {trans.notes && (
                                <div className="detail-notes">
                                  <span className="detail-label">Notes</span>
                                  <p>{trans.notes}</p>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </motion.div>

                {/* Modal Ajouter Transaction */}
                <AnimatePresence>
                  {showAddTransaction && (
                    <motion.div 
                      className="modal-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowAddTransaction(false)}
                    >
                      <motion.div 
                        className="modal-content compta-modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="modal-header">
                          <h3>Nouvelle transaction</h3>
                          <button className="close-btn" onClick={() => setShowAddTransaction(false)}>{icons.x}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Type *</label>
                              <select 
                                value={newTransaction.type}
                                onChange={e => setNewTransaction({...newTransaction, type: e.target.value, category: ''})}
                              >
                                <option value="revenu">Revenu</option>
                                <option value="depense">Dépense</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Catégorie *</label>
                              <select 
                                value={newTransaction.category}
                                onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                              >
                                <option value="">Sélectionner...</option>
                                {comptaCategories[newTransaction.type]?.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Montant (FCFA) *</label>
                              <input 
                                type="number" 
                                value={newTransaction.amount}
                                onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
                                placeholder="0"
                              />
                            </div>
                            <div className="form-group">
                              <label>Date *</label>
                              <input 
                                type="date" 
                                value={newTransaction.date}
                                onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Description</label>
                            <input 
                              type="text" 
                              value={newTransaction.description}
                              onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                              placeholder="Description de la transaction"
                            />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Client / Fournisseur</label>
                              <input 
                                type="text" 
                                value={newTransaction.client}
                                onChange={e => setNewTransaction({...newTransaction, client: e.target.value})}
                                placeholder="Nom du client ou fournisseur"
                              />
                            </div>
                            <div className="form-group">
                              <label>Projet</label>
                              <input 
                                type="text" 
                                value={newTransaction.project}
                                onChange={e => setNewTransaction({...newTransaction, project: e.target.value})}
                                placeholder="Nom du projet"
                              />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Mode de paiement</label>
                              <select 
                                value={newTransaction.payment_method}
                                onChange={e => setNewTransaction({...newTransaction, payment_method: e.target.value})}
                              >
                                <option value="">Sélectionner...</option>
                                <option value="Espèces">Espèces</option>
                                <option value="Virement">Virement bancaire</option>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Chèque">Chèque</option>
                                <option value="Carte">Carte bancaire</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Référence</label>
                              <input 
                                type="text" 
                                value={newTransaction.reference}
                                onChange={e => setNewTransaction({...newTransaction, reference: e.target.value})}
                                placeholder="N° facture, reçu..."
                              />
                            </div>
                          </div>
                          
                          {/* Type de paiement (Comptant / Acompte) */}
                          {newTransaction.type === 'revenu' && (
                            <>
                              <div className="form-group payment-type-group">
                                <label>Type de paiement</label>
                                <div className="payment-type-selector">
                                  <button 
                                    type="button"
                                    className={`payment-type-btn ${newTransaction.payment_type === 'comptant' ? 'active' : ''}`}
                                    onClick={() => setNewTransaction({...newTransaction, payment_type: 'comptant', total_project: '', acompte_number: 1, total_acomptes: 1})}
                                  >
                                    <span className="payment-type-icon">💵</span>
                                    <span>Comptant</span>
                                  </button>
                                  <button 
                                    type="button"
                                    className={`payment-type-btn ${newTransaction.payment_type === 'acompte' ? 'active' : ''}`}
                                    onClick={() => setNewTransaction({...newTransaction, payment_type: 'acompte'})}
                                  >
                                    <span className="payment-type-icon">📊</span>
                                    <span>Acompte</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Champs conditionnels pour Acompte */}
                              {newTransaction.payment_type === 'acompte' && (
                                <motion.div 
                                  className="acompte-fields"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <div className="form-group">
                                    <label>Montant total du projet (FCFA) *</label>
                                    <input 
                                      type="number" 
                                      value={newTransaction.total_project}
                                      onChange={e => setNewTransaction({...newTransaction, total_project: e.target.value})}
                                      placeholder="Montant total du contrat"
                                    />
                                  </div>
                                  <div className="form-row">
                                    <div className="form-group">
                                      <label>Acompte N°</label>
                                      <select 
                                        value={newTransaction.acompte_number}
                                        onChange={e => setNewTransaction({...newTransaction, acompte_number: parseInt(e.target.value)})}
                                      >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                          <option key={n} value={n}>{n}{n === 1 ? 'er' : 'ème'} acompte</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="form-group">
                                      <label>Nombre total d'acomptes</label>
                                      <select 
                                        value={newTransaction.total_acomptes}
                                        onChange={e => setNewTransaction({...newTransaction, total_acomptes: parseInt(e.target.value)})}
                                      >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                          <option key={n} value={n}>{n} acompte{n > 1 ? 's' : ''}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  {newTransaction.total_project && newTransaction.amount && (
                                    <div className="acompte-summary">
                                      <div className="acompte-info">
                                        <span>Total projet:</span>
                                        <strong>{formatMoney(parseFloat(newTransaction.total_project) || 0)}</strong>
                                      </div>
                                      <div className="acompte-info">
                                        <span>Cet acompte:</span>
                                        <strong>{formatMoney(parseFloat(newTransaction.amount) || 0)}</strong>
                                      </div>
                                      <div className="acompte-info remaining">
                                        <span>Reste à payer:</span>
                                        <strong>{formatMoney(Math.max(0, (parseFloat(newTransaction.total_project) || 0) - (parseFloat(newTransaction.amount) || 0)))}</strong>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </>
                          )}
                          
                          <div className="form-group">
                            <label>Notes</label>
                            <textarea
                              value={newTransaction.notes}
                              onChange={e => setNewTransaction({...newTransaction, notes: e.target.value})}
                              placeholder="Notes supplémentaires..."
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-cancel" onClick={() => setShowAddTransaction(false)}>Annuler</button>
                          <motion.button className="btn-primary" onClick={handleCreateTransaction} whileHover={{ scale: 1.02 }}>
                            {icons.plus} Ajouter
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal Modifier Transaction */}
                <AnimatePresence>
                  {editingTransaction && (
                    <motion.div 
                      className="modal-overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setEditingTransaction(null)}
                    >
                      <motion.div 
                        className="modal-content compta-modal"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="modal-header">
                          <h3>Modifier la transaction</h3>
                          <button className="close-btn" onClick={() => setEditingTransaction(null)}>{icons.x}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-row">
                            <div className="form-group">
                              <label>Type *</label>
                              <select 
                                value={editingTransaction.type}
                                onChange={e => setEditingTransaction({...editingTransaction, type: e.target.value})}
                              >
                                <option value="revenu">Revenu</option>
                                <option value="depense">Dépense</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Catégorie *</label>
                              <select 
                                value={editingTransaction.category}
                                onChange={e => setEditingTransaction({...editingTransaction, category: e.target.value})}
                              >
                                <option value="">Sélectionner...</option>
                                {comptaCategories[editingTransaction.type]?.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Montant (FCFA) *</label>
                              <input 
                                type="number" 
                                value={editingTransaction.amount}
                                onChange={e => setEditingTransaction({...editingTransaction, amount: e.target.value})}
                              />
                            </div>
                            <div className="form-group">
                              <label>Date *</label>
                              <input 
                                type="date" 
                                value={editingTransaction.date?.split('T')[0]}
                                onChange={e => setEditingTransaction({...editingTransaction, date: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Description</label>
                            <input 
                              type="text" 
                              value={editingTransaction.description || ''}
                              onChange={e => setEditingTransaction({...editingTransaction, description: e.target.value})}
                            />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Client / Fournisseur</label>
                              <input 
                                type="text" 
                                value={editingTransaction.client || ''}
                                onChange={e => setEditingTransaction({...editingTransaction, client: e.target.value})}
                              />
                            </div>
                            <div className="form-group">
                              <label>Projet</label>
                              <input 
                                type="text" 
                                value={editingTransaction.project || ''}
                                onChange={e => setEditingTransaction({...editingTransaction, project: e.target.value})}
                              />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Mode de paiement</label>
                              <select 
                                value={editingTransaction.payment_method || ''}
                                onChange={e => setEditingTransaction({...editingTransaction, payment_method: e.target.value})}
                              >
                                <option value="">Sélectionner...</option>
                                <option value="Espèces">Espèces</option>
                                <option value="Virement">Virement bancaire</option>
                                <option value="Mobile Money">Mobile Money</option>
                                <option value="Chèque">Chèque</option>
                                <option value="Carte">Carte bancaire</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Référence</label>
                              <input 
                                type="text" 
                                value={editingTransaction.reference || ''}
                                onChange={e => setEditingTransaction({...editingTransaction, reference: e.target.value})}
                              />
                            </div>
                          </div>
                          
                          {/* Type de paiement (Comptant / Acompte) - Edit Modal */}
                          {editingTransaction.type === 'revenu' && (
                            <>
                              <div className="form-group payment-type-group">
                                <label>Type de paiement</label>
                                <div className="payment-type-selector">
                                  <button 
                                    type="button"
                                    className={`payment-type-btn ${(editingTransaction.payment_type || 'comptant') === 'comptant' ? 'active' : ''}`}
                                    onClick={() => setEditingTransaction({...editingTransaction, payment_type: 'comptant', total_project: null, acompte_number: 1, total_acomptes: 1})}
                                  >
                                    <span className="payment-type-icon">💵</span>
                                    <span>Comptant</span>
                                  </button>
                                  <button 
                                    type="button"
                                    className={`payment-type-btn ${editingTransaction.payment_type === 'acompte' ? 'active' : ''}`}
                                    onClick={() => setEditingTransaction({...editingTransaction, payment_type: 'acompte'})}
                                  >
                                    <span className="payment-type-icon">📊</span>
                                    <span>Acompte</span>
                                  </button>
                                </div>
                              </div>
                              
                              {/* Champs conditionnels pour Acompte */}
                              {editingTransaction.payment_type === 'acompte' && (
                                <motion.div 
                                  className="acompte-fields"
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <div className="form-group">
                                    <label>Montant total du projet (FCFA) *</label>
                                    <input 
                                      type="number" 
                                      value={editingTransaction.total_project || ''}
                                      onChange={e => setEditingTransaction({...editingTransaction, total_project: e.target.value})}
                                      placeholder="Montant total du contrat"
                                    />
                                  </div>
                                  <div className="form-row">
                                    <div className="form-group">
                                      <label>Acompte N°</label>
                                      <select 
                                        value={editingTransaction.acompte_number || 1}
                                        onChange={e => setEditingTransaction({...editingTransaction, acompte_number: parseInt(e.target.value)})}
                                      >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                          <option key={n} value={n}>{n}{n === 1 ? 'er' : 'ème'} acompte</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="form-group">
                                      <label>Nombre total d'acomptes</label>
                                      <select 
                                        value={editingTransaction.total_acomptes || 1}
                                        onChange={e => setEditingTransaction({...editingTransaction, total_acomptes: parseInt(e.target.value)})}
                                      >
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                          <option key={n} value={n}>{n} acompte{n > 1 ? 's' : ''}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>
                                  {editingTransaction.total_project && editingTransaction.amount && (
                                    <div className="acompte-summary">
                                      <div className="acompte-info">
                                        <span>Total projet:</span>
                                        <strong>{formatMoney(parseFloat(editingTransaction.total_project) || 0)}</strong>
                                      </div>
                                      <div className="acompte-info">
                                        <span>Cet acompte:</span>
                                        <strong>{formatMoney(parseFloat(editingTransaction.amount) || 0)}</strong>
                                      </div>
                                      <div className="acompte-info remaining">
                                        <span>Reste à payer:</span>
                                        <strong>{formatMoney(Math.max(0, (parseFloat(editingTransaction.total_project) || 0) - (parseFloat(editingTransaction.amount) || 0)))}</strong>
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </>
                          )}
                          
                          {/* Section Pièces jointes */}
                          <div className="form-group attachments-section">
                            <label>
                              Pièces jointes
                              <span className="label-hint">PDF, images, documents</span>
                            </label>
                            
                            {/* Liste des fichiers existants */}
                            {attachments[`transaction-${editingTransaction.id}`]?.length > 0 && (
                              <div className="attachments-list">
                                {attachments[`transaction-${editingTransaction.id}`].map(file => (
                                  <div key={file.id} className="attachment-item">
                                    <span className="attachment-icon">{getFileIcon(file.mime_type)}</span>
                                    <div className="attachment-info">
                                      <span className="attachment-name">{file.original_name}</span>
                                      <span className="attachment-size">{formatFileSize(file.file_size)}</span>
                                    </div>
                                    <div className="attachment-actions">
                                      <a 
                                        href={attachmentsAPI.getDownloadUrl(file.id)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="btn-attachment"
                                        title="Télécharger"
                                      >
                                        ↓
                                      </a>
                                      <button 
                                        type="button"
                                        className="btn-attachment btn-delete-attachment"
                                        onClick={() => handleDeleteAttachment(file.id, 'transaction', editingTransaction.id)}
                                        title="Supprimer"
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* Bouton d'ajout de fichier */}
                            <label className="file-upload-btn">
                              <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,.doc,.docx,.xls,.xlsx"
                                onChange={(e) => {
                                  if (e.target.files[0]) {
                                    handleFileUpload('transaction', editingTransaction.id, e.target.files[0])
                                    e.target.value = ''
                                  }
                                }}
                                disabled={uploadingFile}
                              />
                              <span className="file-upload-icon">📎</span>
                              <span>{uploadingFile ? 'Envoi...' : 'Ajouter un fichier'}</span>
                            </label>
                          </div>
                          
                          <div className="form-group">
                            <label>Notes</label>
                            <textarea
                              value={editingTransaction.notes || ''}
                              onChange={e => setEditingTransaction({...editingTransaction, notes: e.target.value})}
                              rows={2}
                            />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-cancel" onClick={() => setEditingTransaction(null)}>Annuler</button>
                          <motion.button className="btn-primary" onClick={handleUpdateTransaction} whileHover={{ scale: 1.02 }}>
                            {icons.check} Enregistrer
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* STORYBOARD */}
            {/* ============================================ */}
            {activeTab === 'storyboard' && (
              <motion.div key="storyboard" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                    Storyboard
                  </h3>
                </div>
                <Storyboard embedded={true} />
              </motion.div>
            )}

            {/* ============================================ */}
            {/* LEADS POWER + PROSPECTION */}
            {/* ============================================ */}
            {activeTab === 'leads' && (
              <motion.div key="leads" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Leads Power
                  </h3>
                </div>

                {/* Sub-tabs: Recherche, Prospects, Leads */}
                <div className="leads-subtabs">
                  <button className={`leads-subtab ${leadsSubTab === 'search' ? 'active' : ''}`} onClick={() => setLeadsSubTab('search')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                    Recherche
                  </button>
                  <button className={`leads-subtab ${leadsSubTab === 'prospects' ? 'active' : ''}`} onClick={() => setLeadsSubTab('prospects')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    Prospects ({prospects.length})
                  </button>
                  <button className={`leads-subtab ${leadsSubTab === 'messages' ? 'active' : ''}`} onClick={() => setLeadsSubTab('messages')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    Messages
                  </button>
                  <button className={`leads-subtab ${leadsSubTab === 'emailing' ? 'active' : ''}`} onClick={() => setLeadsSubTab('emailing')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/></svg>
                    Emailing
                  </button>
                  <button className={`leads-subtab ${leadsSubTab === 'leads' ? 'active' : ''}`} onClick={() => setLeadsSubTab('leads')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                    Leads ({leads.length})
                  </button>
                </div>

                {/* ---- TAB: RECHERCHE ---- */}
                {leadsSubTab === 'search' && (
                  <div className="prospect-search-section">
                    <div className="prospect-search-card">
                      <div className="prospect-search-type">
                        <button className={`search-type-btn ${searchType === 'maps' ? 'active' : ''}`} onClick={() => setSearchType('maps')}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          Google Maps
                        </button>
                        <button className={`search-type-btn ${searchType === 'google' ? 'active' : ''}`} onClick={() => setSearchType('google')}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                          Google Search
                        </button>
                      </div>
                      <div className="prospect-search-field">
                        <label>Requete de recherche</label>
                        <div className="prospect-input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="ex: restaurant Abidjan, agence immobiliere Cocody..."
                            onKeyDown={e => e.key === 'Enter' && handleSearch()}
                          />
                        </div>
                      </div>
                      <div className="prospect-search-field">
                        <label>Localisation</label>
                        <div className="prospect-input-wrapper">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <input
                            type="text"
                            value={searchLocation}
                            onChange={e => setSearchLocation(e.target.value)}
                            placeholder="Abidjan"
                          />
                        </div>
                      </div>
                      <div className="prospect-search-actions">
                        <motion.button
                          className="btn-prospect-search"
                          onClick={handleSearch}
                          disabled={searching || !searchQuery}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                          {searching ? 'Recherche...' : 'Lancer la recherche'}
                        </motion.button>
                        <select value={searchLimit} onChange={e => setSearchLimit(parseInt(e.target.value))} className="prospect-limit-select">
                          <option value={5}>5 resultats</option>
                          <option value={10}>10 resultats</option>
                          <option value={20}>20 resultats</option>
                        </select>
                      </div>
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="prospect-results">
                        <div className="prospect-results-header">
                          <h4>{searchResults.length} résultat(s) trouvé(s)</h4>
                          <div className="prospect-results-actions">
                            {selectedProspects.length > 0 && (
                              <motion.button className="btn-save-prospects" onClick={handleSaveSelected} whileHover={{ scale: 1.02 }}>
                                {icons.check} Sauvegarder ({selectedProspects.length})
                              </motion.button>
                            )}
                            <motion.button className="btn-save-all" onClick={handleSaveAllResults} whileHover={{ scale: 1.02 }}>
                              {icons.plus} Tout sauvegarder
                            </motion.button>
                          </div>
                        </div>
                        {searchResults.map((result, index) => (
                          <motion.div
                            key={index}
                            className={`prospect-result-card ${selectedProspects.includes(index) ? 'selected' : ''}`}
                            onClick={() => toggleSelectProspect(index)}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                          >
                            <div className="prospect-result-check">
                              <div className={`checkbox ${selectedProspects.includes(index) ? 'checked' : ''}`}>
                                {selectedProspects.includes(index) && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg>}
                              </div>
                            </div>
                            <div className="prospect-result-info">
                              <strong>{result.name}</strong>
                              {result.address && <span className="prospect-address">{result.address}</span>}
                              {result.category && <span className="prospect-category">{result.category}</span>}
                            </div>
                            <div className="prospect-result-meta">
                              {result.rating && <span className="prospect-rating">★ {result.rating} ({result.reviews_count})</span>}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ---- TAB: PROSPECTS ---- */}
                {leadsSubTab === 'prospects' && (
                  <div className="prospects-list-section">
                    <div className="leads-filters" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {['all', 'nouveau', 'contacte', 'interesse', 'converti', 'ignore'].map(f => (
                          <button key={f} className={`leads-filter-btn ${prospectFilter === f ? 'active' : ''}`} onClick={() => setProspectFilter(f)}>
                            {f === 'all' ? 'Tous' : f.charAt(0).toUpperCase() + f.slice(1)}
                          </button>
                        ))}
                      </div>
                      <motion.button className="btn-primary" onClick={() => setShowAddProspect(true)} whileHover={{ scale: 1.02 }} style={{ padding: '8px 16px', fontSize: 13 }}>
                        + Ajouter un prospect
                      </motion.button>
                    </div>

                    {/* Modal Ajouter Prospect */}
                    {showAddProspect && (
                      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowAddProspect(false)}>
                        <motion.div className="modal-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
                          <h3>Ajouter un prospect</h3>
                          <div className="form-grid">
                            <div className="form-group"><label>Nom *</label><input value={newProspect.name} onChange={e => setNewProspect({...newProspect, name: e.target.value})} placeholder="Nom du prospect" /></div>
                            <div className="form-group"><label>Entreprise</label><input value={newProspect.company} onChange={e => setNewProspect({...newProspect, company: e.target.value})} placeholder="Nom de l'entreprise" /></div>
                            <div className="form-group"><label>Téléphone</label><input value={newProspect.phone} onChange={e => setNewProspect({...newProspect, phone: e.target.value})} placeholder="+225 XX XX XX XX" /></div>
                            <div className="form-group"><label>Email</label><input value={newProspect.email} onChange={e => setNewProspect({...newProspect, email: e.target.value})} placeholder="email@example.com" /></div>
                            <div className="form-group"><label>Adresse</label><input value={newProspect.address} onChange={e => setNewProspect({...newProspect, address: e.target.value})} placeholder="Cocody, Abidjan" /></div>
                            <div className="form-group"><label>Catégorie</label><input value={newProspect.category} onChange={e => setNewProspect({...newProspect, category: e.target.value})} placeholder="Restaurant, Immobilier..." /></div>
                            <div className="form-group">
                              <label>Canal</label>
                              <select value={newProspect.channel} onChange={e => setNewProspect({...newProspect, channel: e.target.value})}>
                                <option value="whatsapp">💬 WhatsApp</option>
                                <option value="instagram">📸 Instagram</option>
                                <option value="linkedin">💼 LinkedIn</option>
                                <option value="email">📧 Email</option>
                                <option value="telephone">📞 Téléphone</option>
                                <option value="facebook">👥 Facebook</option>
                              </select>
                            </div>
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={newProspect.notes} onChange={e => setNewProspect({...newProspect, notes: e.target.value})} placeholder="Notes sur le prospect..." rows={3} /></div>
                          </div>
                          <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowAddProspect(false)}>Annuler</button>
                            <motion.button className="btn-primary" onClick={handleCreateProspect} whileHover={{ scale: 1.02 }}>Ajouter</motion.button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                    <div className="prospects-table">
                      <div className="prospects-table-header">
                        <span>Entreprise</span>
                        <span>Adresse</span>
                        <span>Contact</span>
                        <span>Note</span>
                        <span>Statut</span>
                        <span>Actions</span>
                      </div>
                      {prospects
                        .filter(p => prospectFilter === 'all' || p.status === prospectFilter)
                        .map(prospect => (
                        <motion.div key={prospect.id} className="prospects-table-row" layout>
                          <span className="prospect-cell-name">
                            <strong>{prospect.name}</strong>
                            {prospect.category && <small>{prospect.category}</small>}
                          </span>
                          <span className="prospect-cell-address"><small>{prospect.address || '-'}</small></span>
                          <span className="prospect-cell-contact">
                            {prospect.phone && <small>{prospect.phone}</small>}
                            {prospect.website && <small style={{ wordBreak: 'break-all' }}>{prospect.website}</small>}
                            {prospect.email && <small>{prospect.email}</small>}
                          </span>
                          <span className="prospect-cell-rating">{prospect.rating ? `★ ${prospect.rating}` : '-'}</span>
                          <span className="prospect-cell-status">
                            <select value={prospect.status} onChange={e => prospectsAPI.update(prospect.id, { status: e.target.value }).then(fetchProspects)} className="lead-status-select">
                              <option value="nouveau">Nouveau</option>
                              <option value="contacte">Contacté</option>
                              <option value="interesse">Intéressé</option>
                              <option value="converti">Converti</option>
                              <option value="ignore">Ignoré</option>
                            </select>
                          </span>
                          <span className="prospect-cell-actions">
                            <motion.button className="action-btn edit" onClick={() => handleConvertProspect(prospect.id)} whileHover={{ scale: 1.1 }} title="Convertir en lead">
                              {icons.leads}
                            </motion.button>
                            <motion.button className="action-btn delete" onClick={() => handleDeleteProspect(prospect.id)} whileHover={{ scale: 1.1 }} title="Supprimer">
                              {icons.trash}
                            </motion.button>
                          </span>
                        </motion.div>
                      ))}
                      {prospects.filter(p => prospectFilter === 'all' || p.status === prospectFilter).length === 0 && (
                        <div className="leads-empty">Aucun prospect sauvegardé. Lancez une recherche pour commencer.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* ---- TAB: LEADS ---- */}
                {leadsSubTab === 'leads' && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                      <motion.button className="btn-primary" onClick={() => setShowAddLead(true)} whileHover={{ scale: 1.05 }}>
                        {icons.plus} Ajouter un lead
                      </motion.button>
                    </div>

                    {/* Kanban Board - Drag & Drop */}
                    <div className="leads-kanban">
                      {['nouveau', 'envoye', 'a_relancer', 'en_discussion', 'rdv_fixe', 'signe', 'pas_interesse'].map(status => {
                        const statusLeads = leads.filter(l => l.status === status)
                        return (
                          <div
                            key={status}
                            className={`kanban-column ${dragOverCol === status ? 'kanban-column--dragover' : ''}`}
                            onDragOver={e => { e.preventDefault(); setDragOverCol(status); }}
                            onDragLeave={() => setDragOverCol(null)}
                            onDrop={e => {
                              e.preventDefault();
                              setDragOverCol(null);
                              const leadId = parseInt(e.dataTransfer.getData('leadId'));
                              if (leadId) handleUpdateLead(leadId, { status });
                            }}
                          >
                            <div className="kanban-column-header" style={{ borderTopColor: getLeadStatusColor(status) }}>
                              <span className="kanban-column-dot" style={{ background: getLeadStatusColor(status) }} />
                              <span className="kanban-column-title">{getLeadStatusLabel(status)}</span>
                              <span className="kanban-column-count">{statusLeads.length}</span>
                            </div>
                            <div className="kanban-column-body">
                              <AnimatePresence>
                                {statusLeads.map(lead => (
                                  <motion.div
                                    key={lead.id}
                                    className="kanban-card"
                                    draggable={editingLead?.id !== lead.id}
                                    onDragStart={e => {
                                      e.dataTransfer.setData('leadId', lead.id.toString());
                                      e.currentTarget.style.opacity = '0.4';
                                    }}
                                    onDragEnd={e => { e.currentTarget.style.opacity = '1'; }}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    style={{ cursor: editingLead?.id === lead.id ? 'default' : 'grab' }}
                                  >
                                    {editingLead?.id === lead.id ? (
                                      <div className="kanban-card-edit">
                                        <input value={editingLead.name} onChange={e => setEditingLead({...editingLead, name: e.target.value})} placeholder="Nom" />
                                        <input value={editingLead.email || ''} onChange={e => setEditingLead({...editingLead, email: e.target.value})} placeholder="Email" />
                                        <input value={editingLead.phone || ''} onChange={e => setEditingLead({...editingLead, phone: e.target.value})} placeholder="Téléphone" />
                                        <input value={editingLead.phone2 || ''} onChange={e => setEditingLead({...editingLead, phone2: e.target.value})} placeholder="Téléphone 2" />
                                        <input value={editingLead.phone3 || ''} onChange={e => setEditingLead({...editingLead, phone3: e.target.value})} placeholder="Téléphone 3" />
                                        <input value={editingLead.company || ''} onChange={e => setEditingLead({...editingLead, company: e.target.value})} placeholder="Entreprise" />
                                        <input value={editingLead.service || ''} onChange={e => setEditingLead({...editingLead, service: e.target.value})} placeholder="Service" />
                                        <textarea value={editingLead.notes || ''} onChange={e => setEditingLead({...editingLead, notes: e.target.value})} placeholder="Notes" rows={2} />
                                        <div className="kanban-card-edit-actions">
                                          <button className="btn-save" onClick={() => handleUpdateLead(editingLead.id, editingLead)}>{icons.check}</button>
                                          <button className="btn-cancel" onClick={() => setEditingLead(null)}>{icons.x}</button>
                                        </div>
                                      </div>
                                    ) : (
                                      <>
                                        <div className="kanban-card-header">
                                          <strong>{lead.name}</strong>
                                          {lead.company && <small>{lead.company}</small>}
                                        </div>
                                        <div className="kanban-card-info">
                                          {lead.channel && <span style={{ fontSize: 11, opacity: 0.7 }}>{channelIcons[lead.channel] || '📨'} {getChannelLabel(lead.channel)}</span>}
                                          {lead.phone && <span>{lead.phone}</span>}
                                          {lead.phone2 && <span>{lead.phone2}</span>}
                                          {lead.phone3 && <span>{lead.phone3}</span>}
                                          {lead.email && <span>{lead.email}</span>}
                                          {lead.service && <span className="kanban-card-service">{lead.service}</span>}
                                        </div>
                                        <div className="kanban-card-footer">
                                          <div className="kanban-card-actions">
                                            <motion.button className="action-btn edit" onClick={() => setEditingLead({...lead})} whileHover={{ scale: 1.1 }} title="Modifier">
                                              {icons.edit}
                                            </motion.button>
                                            <motion.button className="action-btn delete" onClick={() => handleDeleteLead(lead.id)} whileHover={{ scale: 1.1 }} title="Supprimer">
                                              {icons.trash}
                                            </motion.button>
                                          </div>
                                        </div>
                                        <span className="kanban-card-date">{new Date(lead.created_at).toLocaleDateString('fr-FR')}</span>
                                      </>
                                    )}
                                  </motion.div>
                                ))}
                              </AnimatePresence>
                              {statusLeads.length === 0 && (
                                <div className="kanban-empty">Glissez un lead ici</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ---- TAB: EMAILING ---- */}
                {/* ---- TAB: MESSAGES ---- */}
                {leadsSubTab === 'messages' && (
                  <div className="messages-templates-section">
                    {[
                      {
                        sector: 'Immobilier & Promotion',
                        icon: '🏗️',
                        templates: [
                          { label: 'Premier contact froid (inconnu)', channel: 'whatsapp', text: `Bonjour [Prénom] 👋\n\nJe suis [Votre prénom], fondateur de Naatal Studio — studio de production vidéo corporate basé à Abidjan.\n\nJe travaille avec des promoteurs immobiliers pour valoriser leurs programmes en vidéo avant et pendant la commercialisation.\n\nUne vidéo bien réalisée d'une résidence peut multiplier les demandes qualifiées dès la première semaine de mise en ligne.\n\nEst-ce que vous avez des programmes en cours de commercialisation en ce moment ?\n\nNaatal Studio · naatalstudio.com` },
                          { label: 'Contact via Instagram', channel: 'instagram', text: `Bonjour [Prénom] 👋\n\nJ'ai vu votre programme [nom du programme] — l'architecture est vraiment bien pensée.\n\nJe suis vidéaste corporate à Abidjan, spécialisé en films de promotion immobilière. Je réalise des vidéos qui donnent envie d'acheter avant même la visite.\n\nEst-ce que vous avez déjà une vidéo de présentation pour ce programme ? Si pas encore, je serais ravi de vous proposer quelque chose.\n\nNaatal Studio · naatalstudio.com 🎬` },
                          { label: 'Relance après 48h', channel: 'whatsapp', text: `Bonjour [Prénom],\n\nJe voulais juste m'assurer que mon message vous était bien parvenu 🙏\n\nSi ce n'est pas le bon moment, pas de souci — je reste disponible pour échanger quand vous le souhaitez.\n\nNaatal Studio · +225 07 19 95 65 86` },
                          { label: 'Réponse quand ils demandent le prix', channel: 'whatsapp', text: `Bien sûr 😊\n\nPour un film de promotion immobilière, nos tarifs démarrent à *400 000 FCFA* selon la durée et le nombre de plans.\n\nLe film inclut :\n🎬 Tournage terrain (extérieur + intérieur)\n🎨 Montage cinématique avec musique\n📱 2 formats livrés (horizontal + vertical réseaux)\n⚡ Livraison sous 4 jours\n\nEst-ce que je peux vous appeler 10 minutes pour mieux comprendre votre programme ?` },
                        ]
                      },
                      {
                        sector: 'Restaurants & Hôtellerie',
                        icon: '🍽️',
                        templates: [
                          { label: 'Premier contact', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe suis Souka de Naatal Studio à Abidjan. Je viens de découvrir [Nom du restaurant] et votre univers culinaire est vraiment unique.\n\nSaviez-vous qu'une vidéo de 60 secondes bien réalisée peut doubler votre visibilité sur Instagram et attirer de nouveaux clients ?\n\nNous réalisons des vidéos food & lifestyle qui subliment l'ambiance et les plats.\n\nOn peut en discuter rapidement ?\n\nCordialement` },
                          { label: 'Relance', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe reviens vers vous — nous avons récemment livré du contenu vidéo pour des restaurants à Abidjan avec des résultats concrets sur les réservations.\n\nUn petit tournage d'une demi-journée suffit pour créer 3-4 vidéos percutantes pour vos réseaux.\n\nIntéressé(e) pour un échange ?\n\nCordialement` },
                        ]
                      },
                      {
                        sector: 'Entreprises & Corporate',
                        icon: '🏢',
                        templates: [
                          { label: 'Premier contact', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe suis Souka, fondateur de Naatal Studio, société de production audiovisuelle à Abidjan.\n\nJe contacte [Entreprise] car nous accompagnons les entreprises qui souhaitent renforcer leur image de marque par la vidéo.\n\nFilm institutionnel, vidéo de présentation, contenu pour les réseaux — nous maîtrisons toute la chaîne de production.\n\nSeriez-vous ouvert à un échange pour explorer comment la vidéo pourrait servir votre communication ?\n\nCordialement` },
                          { label: 'Relance', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe me permets de vous relancer suite à mon message précédent.\n\nNous travaillons actuellement avec plusieurs entreprises à Abidjan sur leur stratégie vidéo et les retours sont excellents.\n\nJe serais ravi de vous présenter nos réalisations et discuter de vos besoins.\n\nQuand seriez-vous disponible pour un court appel ?\n\nBien à vous` },
                          { label: 'Proposition de valeur', channel: 'email', text: `Objet : Donnez une image de marque à [Entreprise]\n\nBonjour [Nom],\n\nL'image que vous donnez commence avant que vous parliez. Votre site, vos réseaux, vos présentations — tout parle avant vous.\n\nChez Naatal Studio, nous construisons des récits visuels qui ancrent votre marque dans l'esprit de vos clients.\n\nCe que nous proposons :\n✓ Films institutionnels\n✓ Vidéos corporate mensuelles\n✓ Couverture d'événements\n✓ Contenu réseaux sociaux\n\nNos packages démarrent à 300 000 FCFA/mois.\n\n→ naatalstudio.com\n\nCordialement,\nSouka — Naatal Studio\n+225 07 19 95 65 86` },
                        ]
                      },
                      {
                        sector: 'E-commerce & Boutiques',
                        icon: '🛍️',
                        templates: [
                          { label: 'Premier contact', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe suis Souka de Naatal Studio. J'ai vu votre boutique [Nom boutique] et vos produits sont vraiment beaux !\n\nUne vidéo produit bien réalisée peut transformer vos ventes en ligne. Nous faisons des vidéos courtes, dynamiques, prêtes pour Instagram et TikTok.\n\nOn en discute ?\n\nCordialement` },
                          { label: 'Relance', channel: 'whatsapp', text: `Re bonjour [Nom] 👋\n\nJe voulais juste vous montrer ce type de rendu qu'on fait pour les boutiques :\n→ Vidéo produit en 30-60s\n→ Format vertical pour les réseaux\n→ Livraison en 5 jours\n\nSi ça vous intéresse, on peut organiser un tournage rapide d'une demi-journée.\n\nBonne journée !` },
                        ]
                      },
                      {
                        sector: 'Événementiel',
                        icon: '🎪',
                        templates: [
                          { label: 'Premier contact', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe suis Souka de Naatal Studio, production audiovisuelle à Abidjan.\n\nNous couvrons des événements corporate et privés avec une approche cinématique : multi-caméra, montage rapide J+2, version courte pour les réseaux.\n\nSi vous organisez des événements et souhaitez en garder une trace professionnelle, je serais ravi d'échanger.\n\nCordialement` },
                          { label: 'Après événement', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJ'ai vu que [Événement] s'est bien passé, félicitations !\n\nPour vos prochains événements, sachez que nous livrons un aftermovie de qualité en 48h, avec des formats courts pour vos réseaux inclus.\n\nOn en discute pour le prochain ?\n\nCordialement` },
                        ]
                      },
                      {
                        sector: 'Politique & Institutions',
                        icon: '🏛️',
                        templates: [
                          { label: 'Premier contact', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe suis Souka, directeur de Naatal Studio, société de production audiovisuelle basée à Abidjan.\n\nNous accompagnons des personnalités et institutions dans leur communication visuelle : vidéos de campagne, documentaires, couverture d'activités sur le terrain.\n\nNous avons récemment produit une vidéo de campagne législative à Gohitafla qui a eu un fort impact local.\n\nSeriez-vous intéressé par une discussion sur votre stratégie de communication vidéo ?\n\nCordialement` },
                          { label: 'Relance', channel: 'whatsapp', text: `Bonjour [Nom],\n\nJe reviens vers vous concernant la production vidéo.\n\nDans le contexte actuel, la vidéo est devenue l'outil numéro 1 de communication pour les institutions et personnalités publiques.\n\nNous proposons des packages adaptés : captation terrain, interviews, montage rapide.\n\nJe reste disponible pour en discuter.\n\nCordialement` },
                        ]
                      },
                    ].map((sector, si) => (
                      <div key={si} className="messages-sector" style={{ marginBottom: 24 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 20 }}>{sector.icon}</span> {sector.sector}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                          {sector.templates.map((tpl, ti) => (
                            <div key={ti} style={{
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 12,
                              padding: 16,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 10,
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{tpl.label}</span>
                                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: tpl.channel === 'whatsapp' ? 'rgba(37,211,102,0.15)' : tpl.channel === 'email' ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.08)', color: tpl.channel === 'whatsapp' ? '#25d366' : tpl.channel === 'email' ? '#818cf8' : '#888' }}>
                                  {tpl.channel === 'whatsapp' ? '💬 WhatsApp' : tpl.channel === 'email' ? '📧 Email' : tpl.channel}
                                </span>
                              </div>
                              <textarea
                                defaultValue={tpl.text}
                                id={`msg-${si}-${ti}`}
                                style={{
                                  fontSize: 12,
                                  color: 'rgba(255,255,255,0.6)',
                                  lineHeight: 1.6,
                                  margin: 0,
                                  minHeight: 140,
                                  resize: 'vertical',
                                  fontFamily: 'inherit',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid rgba(255,255,255,0.06)',
                                  borderRadius: 8,
                                  padding: 10,
                                  width: '100%',
                                  boxSizing: 'border-box',
                                }}
                              />
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <motion.button
                                  onClick={() => { document.getElementById(`msg-${si}-${ti}`).value = tpl.text; }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  style={{
                                    padding: '6px 14px',
                                    fontSize: 12,
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'rgba(255,255,255,0.4)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  ↺ Réinitialiser
                                </motion.button>
                                <motion.button
                                  onClick={() => {
                                    const txt = document.getElementById(`msg-${si}-${ti}`).value;
                                    navigator.clipboard.writeText(txt);
                                  }}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  style={{
                                    padding: '6px 14px',
                                    fontSize: 12,
                                    background: 'rgba(201,168,76,0.15)',
                                    color: '#c9a84c',
                                    border: '1px solid rgba(201,168,76,0.2)',
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    fontFamily: 'inherit',
                                  }}
                                >
                                  📋 Copier le message
                                </motion.button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {leadsSubTab === 'emailing' && (
                  <div className="emailing-section">
                    <div className="leads-empty" style={{ padding: '60px 20px' }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ opacity: 0.3, marginBottom: 16 }}><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/></svg>
                      <h3 style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>Emailing</h3>
                      <p style={{ color: 'rgba(255,255,255,0.3)' }}>Envoyez des emails de prospection a vos prospects et leads.</p>
                      <p style={{ color: 'rgba(255,255,255,0.2)', marginTop: 8, fontSize: 13 }}>Fonctionnalité bientôt disponible</p>
                    </div>
                  </div>
                )}

                {/* Modal Ajouter */}
                <AnimatePresence>
                  {showAddLead && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddLead(false)}>
                      <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h3>Ajouter un lead</h3>
                          <button className="close-btn" onClick={() => setShowAddLead(false)}>{icons.x}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Nom *</label>
                            <input type="text" value={newLead.name} onChange={e => setNewLead({...newLead, name: e.target.value})} placeholder="Nom du prospect" />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Email</label>
                              <input type="email" value={newLead.email} onChange={e => setNewLead({...newLead, email: e.target.value})} placeholder="email@exemple.com" />
                            </div>
                            <div className="form-group">
                              <label>Téléphone</label>
                              <input type="text" value={newLead.phone} onChange={e => setNewLead({...newLead, phone: e.target.value})} placeholder="+225 07..." />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Téléphone 2</label>
                              <input type="text" value={newLead.phone2} onChange={e => setNewLead({...newLead, phone2: e.target.value})} placeholder="Numéro secondaire" />
                            </div>
                            <div className="form-group">
                              <label>Téléphone 3</label>
                              <input type="text" value={newLead.phone3} onChange={e => setNewLead({...newLead, phone3: e.target.value})} placeholder="Numéro tertiaire" />
                            </div>
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Entreprise</label>
                              <input type="text" value={newLead.company} onChange={e => setNewLead({...newLead, company: e.target.value})} placeholder="Nom entreprise" />
                            </div>
                            <div className="form-group">
                              <label>Service demandé</label>
                              <select value={newLead.service} onChange={e => setNewLead({...newLead, service: e.target.value})}>
                                <option value="">-- Sélectionner --</option>
                                <option value="Film institutionnel">Film institutionnel</option>
                                <option value="Documentaire">Documentaire</option>
                                <option value="Publicité">Publicité</option>
                                <option value="Clip musical">Clip musical</option>
                                <option value="Couverture événement">Couverture événement</option>
                                <option value="Autre">Autre</option>
                              </select>
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Budget estimé</label>
                            <select value={newLead.budget} onChange={e => setNewLead({...newLead, budget: e.target.value})}>
                              <option value="">-- Sélectionner --</option>
                              <option value="< 500 000 FCFA">Moins de 500 000 FCFA</option>
                              <option value="500K - 1M FCFA">500 000 - 1 000 000 FCFA</option>
                              <option value="1M - 3M FCFA">1 000 000 - 3 000 000 FCFA</option>
                              <option value="3M - 5M FCFA">3 000 000 - 5 000 000 FCFA</option>
                              <option value="> 5M FCFA">Plus de 5 000 000 FCFA</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Canal de contact</label>
                            <select value={newLead.channel} onChange={e => setNewLead({...newLead, channel: e.target.value})}>
                              <option value="whatsapp">💬 WhatsApp</option>
                              <option value="instagram">📸 Instagram</option>
                              <option value="linkedin">💼 LinkedIn</option>
                              <option value="email">📧 Email</option>
                              <option value="telephone">📞 Téléphone</option>
                              <option value="facebook">👥 Facebook</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Message / Détails</label>
                            <textarea value={newLead.message} onChange={e => setNewLead({...newLead, message: e.target.value})} placeholder="Détails du projet..." rows={3} />
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-cancel" onClick={() => setShowAddLead(false)}>Annuler</button>
                          <motion.button className="btn-primary" onClick={handleCreateLead} whileHover={{ scale: 1.02 }}>
                            {icons.plus} Ajouter
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* PARTENAIRES */}
            {/* ============================================ */}
            {activeTab === 'partners' && (
              <motion.div key="partners" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    Partenaires
                  </h3>
                  <motion.button
                    className="btn-primary"
                    onClick={() => setShowAddPartner(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {icons.plus} Ajouter un partenaire
                  </motion.button>
                </div>

                <AnimatePresence>
                  {partnerError && (
                    <motion.div className="alert alert-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {partnerError}
                    </motion.div>
                  )}
                  {partnerSuccess && (
                    <motion.div className="alert alert-success" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      {partnerSuccess}
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="partners-admin-grid">
                  {partnersItems.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-icon">{icons.partners}</div>
                      <h3>Aucun partenaire</h3>
                      <p>Commencez par ajouter votre premier partenaire</p>
                    </div>
                  ) : (
                    partnersItems.map((partner, index) => (
                      <motion.div
                        key={partner.id}
                        className="partner-admin-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className="partner-card-logo">
                          {partner.logo_url ? (
                            <img src={getPartnerLogoUrl(partner.logo_url)} alt={partner.name} onError={(e) => e.target.style.display = 'none'} />
                          ) : (
                            <div className="partner-no-logo">{icons.partners}</div>
                          )}
                        </div>
                        <div className="partner-card-info">
                          <h3>{partner.name}</h3>
                          {partner.website_url && <span className="partner-url">{partner.website_url}</span>}
                          <div className="partner-card-meta">
                            <span className={`badge badge-status ${partner.is_active ? 'active' : 'inactive'}`}>
                              {partner.is_active ? 'Actif' : 'Inactif'}
                            </span>
                            <span className="partner-order">Ordre: {partner.display_order || 0}</span>
                          </div>
                        </div>
                        <div className="partner-card-actions">
                          <motion.button
                            className="btn-icon"
                            onClick={() => setEditingPartner({...partner})}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Modifier"
                          >
                            {icons.edit}
                          </motion.button>
                          <motion.button
                            className="btn-icon btn-danger"
                            onClick={() => handleDeletePartner(partner.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Supprimer"
                          >
                            {icons.trash}
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Modal: Ajouter un partenaire */}
                <AnimatePresence>
                  {showAddPartner && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddPartner(false)}>
                      <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Ajouter un partenaire</h2>
                          <button className="modal-close" onClick={() => setShowAddPartner(false)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Nom du partenaire *</label>
                            <input type="text" value={newPartner.name} onChange={(e) => setNewPartner({...newPartner, name: e.target.value})} placeholder="Nom du partenaire" />
                          </div>
                          <div className="form-group">
                            <label>Logo *</label>
                            <div className="cover-upload-group">
                              <input
                                type="url"
                                value={newPartner.logo_url}
                                onChange={(e) => setNewPartner({...newPartner, logo_url: e.target.value})}
                                placeholder="https://... ou importez un fichier PNG"
                              />
                              <input
                                type="file"
                                ref={partnerLogoInputRef}
                                accept="image/png,image/svg+xml,image/webp"
                                style={{ display: 'none' }}
                                onChange={(e) => handlePartnerLogoUpload(e.target.files[0], false)}
                              />
                              <button
                                type="button"
                                className="btn-upload"
                                onClick={() => partnerLogoInputRef.current?.click()}
                                disabled={uploadingCover}
                              >
                                {uploadingCover ? (
                                  <span className="upload-spinner"></span>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="17 8 12 3 7 8"/>
                                      <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    Importer
                                  </>
                                )}
                              </button>
                            </div>
                            {newPartner.logo_url && (
                              <div className="cover-preview partner-logo-preview">
                                <img src={getPartnerLogoUrl(newPartner.logo_url)} alt="Aperçu" onError={(e) => e.target.style.display = 'none'} />
                              </div>
                            )}
                          </div>
                          <div className="form-group">
                            <label>Site web</label>
                            <input type="url" value={newPartner.website_url} onChange={(e) => setNewPartner({...newPartner, website_url: e.target.value})} placeholder="https://..." />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Ordre d'affichage</label>
                              <input type="number" value={newPartner.display_order} onChange={(e) => setNewPartner({...newPartner, display_order: parseInt(e.target.value) || 0})} />
                            </div>
                            <div className="form-group">
                              <label>Statut</label>
                              <select value={newPartner.is_active ? 'true' : 'false'} onChange={(e) => setNewPartner({...newPartner, is_active: e.target.value === 'true'})}>
                                <option value="true">Actif</option>
                                <option value="false">Inactif</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-cancel" onClick={() => setShowAddPartner(false)}>Annuler</button>
                          <button type="button" className="btn-primary" onClick={handleCreatePartner}>Ajouter le partenaire</button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Modal: Modifier un partenaire */}
                <AnimatePresence>
                  {editingPartner && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingPartner(null)}>
                      <motion.div className="modal" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                          <h2>Modifier le partenaire</h2>
                          <button className="modal-close" onClick={() => setEditingPartner(null)}>{icons.close}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Nom du partenaire *</label>
                            <input type="text" value={editingPartner.name} onChange={(e) => setEditingPartner({...editingPartner, name: e.target.value})} />
                          </div>
                          <div className="form-group">
                            <label>Logo *</label>
                            <div className="cover-upload-group">
                              <input
                                type="url"
                                value={editingPartner.logo_url}
                                onChange={(e) => setEditingPartner({...editingPartner, logo_url: e.target.value})}
                                placeholder="https://... ou importez un fichier PNG"
                              />
                              <input
                                type="file"
                                ref={editPartnerLogoInputRef}
                                accept="image/png,image/svg+xml,image/webp"
                                style={{ display: 'none' }}
                                onChange={(e) => handlePartnerLogoUpload(e.target.files[0], true)}
                              />
                              <button
                                type="button"
                                className="btn-upload"
                                onClick={() => editPartnerLogoInputRef.current?.click()}
                                disabled={uploadingCover}
                              >
                                {uploadingCover ? (
                                  <span className="upload-spinner"></span>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                      <polyline points="17 8 12 3 7 8"/>
                                      <line x1="12" y1="3" x2="12" y2="15"/>
                                    </svg>
                                    Importer
                                  </>
                                )}
                              </button>
                            </div>
                            {editingPartner.logo_url && (
                              <div className="cover-preview partner-logo-preview">
                                <img src={getPartnerLogoUrl(editingPartner.logo_url)} alt="Aperçu" onError={(e) => e.target.style.display = 'none'} />
                              </div>
                            )}
                          </div>
                          <div className="form-group">
                            <label>Site web</label>
                            <input type="url" value={editingPartner.website_url || ''} onChange={(e) => setEditingPartner({...editingPartner, website_url: e.target.value})} placeholder="https://..." />
                          </div>
                          <div className="form-row">
                            <div className="form-group">
                              <label>Ordre d'affichage</label>
                              <input type="number" value={editingPartner.display_order} onChange={(e) => setEditingPartner({...editingPartner, display_order: parseInt(e.target.value) || 0})} />
                            </div>
                            <div className="form-group">
                              <label>Statut</label>
                              <select value={editingPartner.is_active ? 'true' : 'false'} onChange={(e) => setEditingPartner({...editingPartner, is_active: e.target.value === 'true'})}>
                                <option value="true">Actif</option>
                                <option value="false">Inactif</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-cancel" onClick={() => setEditingPartner(null)}>Annuler</button>
                          <motion.button className="btn-primary" onClick={handleUpdatePartner} whileHover={{ scale: 1.02 }}>
                            {icons.check} Enregistrer
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* PORTFOLIO SOUKAVISUALS */}
            {/* ============================================ */}
            {activeTab === 'portfolio' && (
              <motion.div key="portfolio" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                    Portfolio Soukavisuals
                  </h3>
                </div>
                <PortfolioAdmin />
              </motion.div>
            )}

            {/* PARAMÈTRES */}
            {/* ============================================ */}
            {activeTab === 'settings' && (
              <motion.div key="settings" {...pageTransition} className="dash-section">
                <div className="dash-section-header">
                  <h3>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                    Parametres
                  </h3>
                </div>

                <div className="settings-grid">
                  <motion.div className="setting-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3>Informations générales</h3>
                    {GENERAL_FIELDS.map(field => (
                      <div className="setting-item" key={field.key}>
                        <label htmlFor={`setting-${field.key}`}>{field.label}</label>
                        <input
                          id={`setting-${field.key}`}
                          type={field.type}
                          maxLength={100}
                          value={generalValue(field)}
                          onChange={(e) => {
                            setGeneralDraft(draft => ({ ...draft, [field.key]: e.target.value }))
                            setGeneralStatus(null)
                          }}
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      className="setting-save"
                      onClick={handleSaveGeneral}
                      disabled={savingGeneral || Object.keys(generalChanges).length === 0}
                    >
                      {savingGeneral ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                    {generalStatus && (
                      <div className={`user-alert ${generalStatus.type}`}>{generalStatus.text}</div>
                    )}
                  </motion.div>

                  <motion.div className="setting-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h3>Base de données</h3>
                    <div className="db-status">
                      <span className="status-indicator online"></span>
                      <span>PostgreSQL connecté</span>
                    </div>
                    <ul className="db-info">
                      <li><strong>Version du site :</strong> {__APP_VERSION__}</li>
                      <li><strong>Tables:</strong> medias, messages, settings</li>
                      <li><strong>Médias:</strong> {totalMedias} enregistrements</li>
                      <li><strong>Messages:</strong> {messages.length} enregistrements</li>
                    </ul>
                  </motion.div>

                  <motion.div className="setting-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h3>Administrateur</h3>
                    <div className="admin-info">
                      <div className="admin-avatar">{admin?.username?.[0]?.toUpperCase()}</div>
                      <div>
                        <strong>{admin?.username}</strong>
                        <span>{admin?.email}</span>
                        <span className="role-badge">{admin?.role}</span>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Section Gestion des utilisateurs (superadmin uniquement) */}
                {admin?.role === 'superadmin' && (
                  <motion.div 
                    className="users-management"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="users-header">
                      <h3>Gestion des utilisateurs</h3>
                      <motion.button 
                        className="btn-add-user"
                        onClick={() => setShowAddUser(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {icons.plus} Nouvel utilisateur
                      </motion.button>
                    </div>

                    {/* Messages de feedback */}
                    <AnimatePresence>
                      {userError && (
                        <motion.div 
                          className="user-alert error"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          {userError}
                        </motion.div>
                      )}
                      {userSuccess && (
                        <motion.div 
                          className="user-alert success"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          {userSuccess}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Liste des utilisateurs */}
                    <div className="users-list">
                      {users.map((user, index) => (
                        <motion.div 
                          key={user.id}
                          className={`user-card ${!user.is_active ? 'inactive' : ''}`}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="user-avatar">
                            {user.username[0]?.toUpperCase()}
                          </div>
                          <div className="user-info">
                            <div className="user-name">
                              {user.username}
                              {user.id === admin?.id && <span className="current-badge">Vous</span>}
                            </div>
                            <div className="user-email">{user.email}</div>
                            <div className="user-meta">
                              <span className={`role-badge ${user.role}`}>{user.role}</span>
                              {!user.is_active && <span className="status-badge inactive">Inactif</span>}
                            </div>
                          </div>
                          <div className="user-actions">
                            <motion.button 
                              className="btn-edit"
                              onClick={() => setEditingUser({ ...user, newPassword: '' })}
                              whileHover={{ scale: 1.1 }}
                              title="Modifier"
                            >
                              {icons.edit}
                            </motion.button>
                            {user.id !== admin?.id && (
                              <motion.button 
                                className="btn-delete"
                                onClick={() => handleDeleteUser(user.id)}
                                whileHover={{ scale: 1.1 }}
                                title="Supprimer"
                              >
                                {icons.trash}
                              </motion.button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Modal Ajouter utilisateur */}
                    <AnimatePresence>
                      {showAddUser && (
                        <motion.div 
                          className="modal-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setShowAddUser(false)}
                        >
                          <motion.div 
                            className="modal-content user-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="modal-header">
                              <h3>Nouvel utilisateur</h3>
                              <button className="close-btn" onClick={() => setShowAddUser(false)}>{icons.x}</button>
                            </div>
                            <div className="modal-body">
                              <div className="form-group">
                                <label>Nom d'utilisateur *</label>
                                <input 
                                  type="text" 
                                  value={newUser.username}
                                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                                  placeholder="Ex: john.doe"
                                />
                              </div>
                              <div className="form-group">
                                <label>Email *</label>
                                <input 
                                  type="email" 
                                  value={newUser.email}
                                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                                  placeholder="Ex: john@naatal.com"
                                />
                              </div>
                              <div className="form-group">
                                <label>Mot de passe *</label>
                                <input 
                                  type="password" 
                                  value={newUser.password}
                                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                                  placeholder="Minimum 6 caractères"
                                />
                              </div>
                              <div className="form-group">
                                <label>Rôle</label>
                                <select 
                                  value={newUser.role}
                                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="superadmin">Super Admin</option>
                                </select>
                              </div>
                            </div>
                            <div className="modal-footer">
                              <button className="btn-cancel" onClick={() => setShowAddUser(false)}>Annuler</button>
                              <motion.button className="btn-primary" onClick={handleCreateUser} whileHover={{ scale: 1.02 }}>
                                {icons.plus} Créer
                              </motion.button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Modal Modifier utilisateur */}
                    <AnimatePresence>
                      {editingUser && (
                        <motion.div 
                          className="modal-overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setEditingUser(null)}
                        >
                          <motion.div 
                            className="modal-content user-modal"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                          >
                            <div className="modal-header">
                              <h3>Modifier l'utilisateur</h3>
                              <button className="close-btn" onClick={() => setEditingUser(null)}>{icons.x}</button>
                            </div>
                            <div className="modal-body">
                              <div className="form-group">
                                <label>Nom d'utilisateur *</label>
                                <input 
                                  type="text" 
                                  value={editingUser.username}
                                  onChange={e => setEditingUser({...editingUser, username: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Email *</label>
                                <input 
                                  type="email" 
                                  value={editingUser.email}
                                  onChange={e => setEditingUser({...editingUser, email: e.target.value})}
                                />
                              </div>
                              <div className="form-group">
                                <label>Nouveau mot de passe (laisser vide pour ne pas changer)</label>
                                <input 
                                  type="password" 
                                  value={editingUser.newPassword || ''}
                                  onChange={e => setEditingUser({...editingUser, newPassword: e.target.value})}
                                  placeholder="Nouveau mot de passe..."
                                />
                              </div>
                              <div className="form-group">
                                <label>Rôle</label>
                                <select 
                                  value={editingUser.role}
                                  onChange={e => setEditingUser({...editingUser, role: e.target.value})}
                                >
                                  <option value="admin">Admin</option>
                                  <option value="superadmin">Super Admin</option>
                                </select>
                              </div>
                              {editingUser.id !== admin?.id && (
                                <div className="form-group checkbox">
                                  <label>
                                    <input 
                                      type="checkbox"
                                      checked={editingUser.is_active}
                                      onChange={e => setEditingUser({...editingUser, is_active: e.target.checked})}
                                    />
                                    <span>Compte actif</span>
                                  </label>
                                </div>
                              )}
                            </div>
                            <div className="modal-footer">
                              <button className="btn-cancel" onClick={() => setEditingUser(null)}>Annuler</button>
                              <motion.button className="btn-primary" onClick={handleUpdateUser} whileHover={{ scale: 1.02 }}>
                                {icons.check} Enregistrer
                              </motion.button>
                            </div>
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
