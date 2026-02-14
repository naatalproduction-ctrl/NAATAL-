// ============================================
// NAATAL - Panel d'Administration
// ============================================
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useSite } from '../context/SiteContext'
import { usersAPI, comptabiliteAPI, projetsAPI, attachmentsAPI, cinemaAPI, boutiqueAPI, uploadsAPI, storyboardAPI } from '../services/api'
import Storyboard from './Storyboard'
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

export default function Admin() {
  const { 
    categories, 
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
    loading
  } = useSite()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [editingMedia, setEditingMedia] = useState(null)
  const [showAddMedia, setShowAddMedia] = useState(false)
  const [addToCategory, setAddToCategory] = useState(null)
  const [newMedia, setNewMedia] = useState({ 
    name: '', 
    type: 'youtube', 
    url: '', 
    description: '',
    category_id: null,
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

  useEffect(() => {
    if (isAuthenticated && admin?.role === 'superadmin') {
      fetchUsers()
    }
  }, [isAuthenticated, admin])

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

  // Créer une transaction
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
    const result = await addMedia({
      ...newMedia,
      category_id: addToCategory || newMedia.category_id
    })
    if (result.success) {
      setShowAddMedia(false)
      setAddToCategory(null)
      setNewMedia({ name: '', type: 'youtube', url: '', description: '', category_id: null, featured: false })
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
    )
  }

  // Icône par catégorie
  const getCategoryIcon = (iconName) => {
    switch(iconName) {
      case 'film': return icons.film
      case 'briefcase': return icons.briefcase
      case 'megaphone': return icons.megaphone
      default: return icons.play
    }
  }

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
    { id: 'dashboard', label: 'Tableau de bord', icon: icons.dashboard },
    { id: 'projets', label: 'Projets', icon: icons.projets },
    { id: 'media', label: 'Médias', icon: icons.media },
    { id: 'cinema', label: 'Cinéma', icon: icons.cinema },
    { id: 'boutique', label: 'Boutique', icon: icons.boutique },
    { id: 'messages', label: 'Messages', icon: icons.messages, badge: unreadCount },
    { id: 'comptabilite', label: 'Comptabilité', icon: icons.comptabilite },
    { id: 'storyboard', label: 'Storyboard', icon: icons.storyboard },
    { id: 'settings', label: 'Paramètres', icon: icons.settings }
  ]

  const totalMedias = categories.reduce((sum, cat) => sum + (cat.medias?.length || 0), 0)

  return (
    <div className="admin">
      {/* Sidebar */}
      <motion.aside className="admin-sidebar" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.5 }}>
        <div className="admin-logo">
          <motion.img src="/img/logo 3.png" alt="N PROD" className="logo-icon-img" whileHover={{ scale: 1.05 }} />
        </div>
        
        <nav className="admin-nav">
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
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
      </motion.aside>

      {/* Main Content */}
      <main className="admin-main">
        <motion.header className="admin-header" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1>{tabs.find(t => t.id === activeTab)?.label}</h1>
          <div className="admin-user">
            <div className="user-avatar">{admin?.username?.[0]?.toUpperCase() || 'A'}</div>
            <span>{admin?.username || 'Admin'}</span>
          </div>
        </motion.header>

        <div className="admin-content">
          <AnimatePresence mode="wait">
            
            {/* ============================================ */}
            {/* DASHBOARD */}
            {/* ============================================ */}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" {...pageTransition} className="dashboard">
                <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
                  {[
                    { icon: icons.media, value: totalMedias, label: 'Médias', color: '#8b5cf6', onClick: () => setActiveTab('media') },
                    { icon: icons.film, value: categories.find(c => c.slug === 'documentaire')?.medias?.length || 0, label: 'Documentaires', color: '#8b5cf6' },
                    { icon: icons.briefcase, value: categories.find(c => c.slug === 'corporate')?.medias?.length || 0, label: 'Corporate', color: '#3b82f6' },
                    { icon: icons.megaphone, value: categories.find(c => c.slug === 'publicite')?.medias?.length || 0, label: 'Publicités', color: '#ec4899' },
                    { icon: icons.messages, value: messages.length, label: `Messages (${unreadCount} non lus)`, color: '#22c55e', onClick: () => setActiveTab('messages') },
                    { icon: icons.globe, value: 'En ligne', label: 'Statut du site', color: '#22c55e' }
                  ].map((stat, index) => (
                    <motion.div 
                      key={index} 
                      className="stat-card" 
                      variants={itemVariants} 
                      whileHover={{ y: -5 }} 
                      onClick={stat.onClick}
                      style={{ cursor: stat.onClick ? 'pointer' : 'default' }}
                    >
                      <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                      <div className="stat-info"><h3>{stat.value}</h3><p>{stat.label}</p></div>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div className="section-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <h3>Informations du site</h3>
                  <ul className="info-list">
                    <li><strong>Nom:</strong> {siteInfo.name || 'NAATAL Production'}</li>
                    <li><strong>Email:</strong> {siteInfo.email || 'naatalproduction@gmail.com'}</li>
                    <li><strong>Téléphone:</strong> {siteInfo.phone || '+225 07 19 95 65 86'}</li>
                    <li><strong>Adresse:</strong> {siteInfo.address || 'Abidjan, Côte d\'Ivoire'}</li>
                  </ul>
                </motion.div>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* PROJETS */}
            {/* ============================================ */}
            {activeTab === 'projets' && (
              <motion.div key="projets" {...pageTransition} className="projets-section">
                <div className="section-header">
                  <div>
                    <h2>Gestion des Projets</h2>
                    <p>Gérez tous vos projets de production</p>
                  </div>
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
            {/* MÉDIAS - NOUVELLE INTERFACE */}
            {/* ============================================ */}
            {activeTab === 'media' && (
              <motion.div key="media" {...pageTransition} className="media-section">
                <div className="section-header">
                  <div>
                    <h2>Gestion des Médias</h2>
                    <p>{totalMedias} vidéo(s) au total - Organisées par catégorie</p>
                  </div>
                </div>

                {/* Catégories avec leurs médias */}
                {categories.map((category) => (
                  <motion.div 
                    key={category.id} 
                    className="media-category-section"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="category-header" style={{ borderColor: category.color }}>
                      <div className="category-info">
                        <div className="category-icon" style={{ background: `${category.color}20`, color: category.color }}>
                          {getCategoryIcon(category.icon)}
                        </div>
                        <div>
                          <h3>{category.name}</h3>
                          <p>{category.description} • {category.medias?.length || 0} vidéo(s)</p>
                        </div>
                      </div>
                      <motion.button 
                        className="btn-add-category"
                        style={{ background: category.color }}
                        onClick={() => { setAddToCategory(category.id); setShowAddMedia(true) }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {icons.plus} Ajouter
                      </motion.button>
                    </div>

                    <div className="media-cards-grid">
                      {category.medias?.map((media) => (
                        <motion.div 
                          key={media.id} 
                          className="media-card-new"
                          variants={itemVariants}
                          whileHover={{ y: -5, boxShadow: `0 10px 40px ${category.color}20` }}
                          layout
                        >
                          {/* Thumbnail YouTube */}
                          <div className="media-thumbnail">
                            {media.type === 'youtube' && getYouTubeThumbnail(media.url) ? (
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
                            {media.featured && <span className="featured-badge">Vedette</span>}
                          </div>

                          {/* Info */}
                          <div className="media-card-content">
                            {editingMedia?.id === media.id ? (
                              <div className="media-edit-inline">
                                <input 
                                  type="text" 
                                  value={editingMedia.name} 
                                  onChange={e => setEditingMedia({...editingMedia, name: e.target.value})}
                                  placeholder="Nom"
                                />
                                <input 
                                  type="text" 
                                  value={editingMedia.url} 
                                  onChange={e => setEditingMedia({...editingMedia, url: e.target.value})}
                                  placeholder="URL YouTube embed"
                                />
                                <textarea
                                  value={editingMedia.description || ''}
                                  onChange={e => setEditingMedia({...editingMedia, description: e.target.value})}
                                  placeholder="Description"
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

                      {/* Carte pour ajouter */}
                      <motion.div 
                        className="media-card-add"
                        onClick={() => { setAddToCategory(category.id); setShowAddMedia(true) }}
                        whileHover={{ scale: 1.02, borderColor: category.color }}
                        style={{ '--hover-color': category.color }}
                      >
                        <div className="add-icon">{icons.plus}</div>
                        <span>Ajouter une vidéo</span>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}

                {/* Modal Ajouter */}
                <AnimatePresence>
                  {showAddMedia && (
                    <motion.div 
                      className="modal-overlay" 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      exit={{ opacity: 0 }}
                      onClick={() => { setShowAddMedia(false); setAddToCategory(null) }}
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
                          <button className="close-btn" onClick={() => { setShowAddMedia(false); setAddToCategory(null) }}>{icons.x}</button>
                        </div>
                        <div className="modal-body">
                          <div className="form-group">
                            <label>Nom de la vidéo *</label>
                            <input 
                              type="text" 
                              value={newMedia.name} 
                              onChange={e => setNewMedia({...newMedia, name: e.target.value})}
                              placeholder="Ex: Documentaire - Les Racines"
                            />
                          </div>
                          <div className="form-group">
                            <label>URL YouTube Embed *</label>
                            <input 
                              type="text" 
                              value={newMedia.url} 
                              onChange={e => setNewMedia({...newMedia, url: e.target.value})}
                              placeholder="https://www.youtube.com/embed/VIDEO_ID"
                            />
                            <span className="form-hint">Format: https://www.youtube.com/embed/VIDEO_ID</span>
                          </div>
                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              value={newMedia.description}
                              onChange={e => setNewMedia({...newMedia, description: e.target.value})}
                              placeholder="Brève description de la vidéo..."
                              rows={3}
                            />
                          </div>
                          <div className="form-group">
                            <label>Catégorie</label>
                            <select 
                              value={addToCategory || newMedia.category_id || ''} 
                              onChange={e => setNewMedia({...newMedia, category_id: parseInt(e.target.value)})}
                            >
                              {categories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                              ))}
                            </select>
                          </div>
                          <div className="form-group checkbox">
                            <label>
                              <input 
                                type="checkbox"
                                checked={newMedia.featured}
                                onChange={e => setNewMedia({...newMedia, featured: e.target.checked})}
                              />
                              <span>Mettre en vedette</span>
                            </label>
                          </div>
                        </div>
                        <div className="modal-footer">
                          <button className="btn-cancel" onClick={() => { setShowAddMedia(false); setAddToCategory(null) }}>Annuler</button>
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
                    <li>Cliquez sur "Partager" puis "Intégrer"</li>
                    <li>Copiez l'URL qui ressemble à: <code>https://www.youtube.com/embed/VIDEO_ID</code></li>
                    <li>Collez cette URL dans le champ "URL YouTube Embed"</li>
                  </ol>
                </motion.div>
              </motion.div>
            )}

            {/* ============================================ */}
            {/* CINÉMA */}
            {/* ============================================ */}
            {activeTab === 'cinema' && (
              <motion.div key="cinema" {...pageTransition} className="cinema-admin-section">
                <div className="section-header">
                  <h2>Gestion du Cinéma</h2>
                  <p>Gérez les films affichés sur le site</p>
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
              <motion.div key="boutique" {...pageTransition} className="boutique-admin-section">
                <div className="section-header">
                  <h2>Gestion de la Boutique</h2>
                  <p>Gérez les produits de votre boutique</p>
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
            {/* MESSAGES */}
            {/* ============================================ */}
            {activeTab === 'messages' && (
              <motion.div key="messages" {...pageTransition} className="messages-section">
                <div className="section-header">
                  <h2>Messages de contact</h2>
                  <p>{messages.length} message(s) - {unreadCount} non lu(s)</p>
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
              <motion.div key="comptabilite" {...pageTransition} className="comptabilite-section">
                <div className="section-header">
                  <h2>Comptabilité</h2>
                  <motion.button 
                    className="btn-add-transaction"
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

                {/* Stats Cards */}
                <div className="compta-stats">
                  <motion.div className="compta-stat-card revenus" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="stat-icon">{icons.arrowUp}</div>
                    <div className="stat-content">
                      <span className="stat-label">Revenus</span>
                      <span className="stat-value">
                        <AnimatedCounter value={comptaStats?.totals?.revenus || 0} duration={600} suffix=" FCFA" />
                      </span>
                      <span className="stat-count">
                        <AnimatedCounter value={comptaStats?.totals?.countRevenus || 0} duration={400} /> transactions
                      </span>
                    </div>
                  </motion.div>
                  
                  <motion.div className="compta-stat-card depenses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="stat-icon">{icons.arrowDown}</div>
                    <div className="stat-content">
                      <span className="stat-label">Dépenses</span>
                      <span className="stat-value">
                        <AnimatedCounter value={comptaStats?.totals?.depenses || 0} duration={600} suffix=" FCFA" />
                      </span>
                      <span className="stat-count">
                        <AnimatedCounter value={comptaStats?.totals?.countDepenses || 0} duration={400} /> transactions
                      </span>
                    </div>
                  </motion.div>
                  
                  <motion.div className={`compta-stat-card balance ${comptaStats?.totals?.balance >= 0 ? 'positive' : 'negative'}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="stat-icon">{icons.comptabilite}</div>
                    <div className="stat-content">
                      <span className="stat-label">Balance</span>
                      <span className="stat-value">
                        <AnimatedCounter value={comptaStats?.totals?.balance || 0} duration={700} suffix=" FCFA" />
                      </span>
                      <span className="stat-count">{comptaStats?.totals?.balance >= 0 ? 'Bénéfice' : 'Déficit'}</span>
                    </div>
                  </motion.div>
                </div>

                {/* Filtres */}
                <motion.div className="compta-filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                  <div className="period-filter">
                    {icons.calendar}
                    <span className="period-label">Période :</span>
                    <select 
                      className="year-select"
                      value={comptaFilter.year} 
                      onChange={e => setComptaFilter({...comptaFilter, year: parseInt(e.target.value)})}
                    >
                      {[...Array(5)].map((_, i) => {
                        const year = currentYear - 2 + i
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                    <select 
                      className="month-select"
                      value={comptaFilter.month} 
                      onChange={e => setComptaFilter({...comptaFilter, month: e.target.value ? parseInt(e.target.value) : ''})}
                    >
                      <option value="">Toute l'année</option>
                      <option value="1">Janvier</option>
                      <option value="2">Février</option>
                      <option value="3">Mars</option>
                      <option value="4">Avril</option>
                      <option value="5">Mai</option>
                      <option value="6">Juin</option>
                      <option value="7">Juillet</option>
                      <option value="8">Août</option>
                      <option value="9">Septembre</option>
                      <option value="10">Octobre</option>
                      <option value="11">Novembre</option>
                      <option value="12">Décembre</option>
                    </select>
                    <button 
                      className="btn-reset-filter"
                      onClick={() => setComptaFilter({ type: '', year: currentYear, month: currentMonth })}
                    >
                      Réinitialiser
                    </button>
                  </div>
                  <select 
                    className="type-select"
                    value={comptaFilter.type} 
                    onChange={e => setComptaFilter({...comptaFilter, type: e.target.value})}
                  >
                    <option value="">Tous les types</option>
                    <option value="revenu">Revenus</option>
                    <option value="depense">Dépenses</option>
                  </select>
                </motion.div>

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
              <motion.div key="storyboard" {...pageTransition} className="storyboard-section">
                <Storyboard embedded={true} />
              </motion.div>
            )}

            {/* ============================================ */}
            {/* PARAMÈTRES */}
            {/* ============================================ */}
            {activeTab === 'settings' && (
              <motion.div key="settings" {...pageTransition} className="settings-section">
                <div className="section-header">
                  <h2>Paramètres du site</h2>
                  <p>Configuration générale</p>
                </div>

                <div className="settings-grid">
                  <motion.div className="setting-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h3>Informations générales</h3>
                    <div className="setting-item">
                      <label>Nom du site</label>
                      <input type="text" defaultValue={siteInfo.name} disabled />
                    </div>
                    <div className="setting-item">
                      <label>Email</label>
                      <input type="email" defaultValue={siteInfo.email} disabled />
                    </div>
                    <div className="setting-item">
                      <label>Téléphone</label>
                      <input type="text" defaultValue={siteInfo.phone} disabled />
                    </div>
                    <p className="setting-note">Contactez le développeur pour modifier ces paramètres.</p>
                  </motion.div>

                  <motion.div className="setting-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <h3>Base de données</h3>
                    <div className="db-status">
                      <span className="status-indicator online"></span>
                      <span>PostgreSQL connecté</span>
                    </div>
                    <ul className="db-info">
                      <li><strong>Tables:</strong> categories, medias, messages, settings</li>
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
