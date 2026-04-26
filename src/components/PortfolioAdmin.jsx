// ============================================
// Portfolio Soukavisuals - Admin Panel
// ============================================
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { portfolioAPI, uploadsAPI } from '../services/api'

export default function PortfolioAdmin() {
  const [subTab, setSubTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState([])
  const [projects, setProjects] = useState([])
  const [skills, setSkills] = useState([])
  const [marquee, setMarquee] = useState([])
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  // Load all data
  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [p, st, pr, sk, mq, ms] = await Promise.all([
        portfolioAPI.getProfile().catch(() => ({ data: null })),
        portfolioAPI.getStats().catch(() => ({ data: [] })),
        portfolioAPI.getProjects().catch(() => ({ data: [] })),
        portfolioAPI.getSkills().catch(() => ({ data: [] })),
        portfolioAPI.getMarquee().catch(() => ({ data: [] })),
        portfolioAPI.getMessages().catch(() => ({ data: [] })),
      ])
      setProfile(p.data)
      setStats(st.data || [])
      setProjects(pr.data || [])
      setSkills(sk.data || [])
      setMarquee(mq.data || [])
      setMessages(ms.data || [])
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  // ── PROFILE ──
  const saveProfile = async () => {
    if (!profile) return
    setSaving(true)
    try {
      const res = await portfolioAPI.updateProfile(profile)
      setProfile(res.data)
      showToast('Profil sauvegardé')
    } catch { showToast('Erreur de sauvegarde') }
    setSaving(false)
  }

  const handleProfileImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const res = await uploadsAPI.uploadCover(file, 'portfolio')
      if (res.data?.url) {
        const updated = { ...profile, profile_image_url: res.data.url }
        setProfile(updated)
        await portfolioAPI.updateProfile({ profile_image_url: res.data.url })
        showToast('Photo de profil mise à jour')
      } else {
        showToast('Erreur: ' + (res.error || 'upload échoué'))
      }
    } catch (err) { showToast('Erreur upload: ' + err.message) }
  }

  // ── STATS ──
  const addStat = async () => {
    try {
      const res = await portfolioAPI.createStat({ value: 0, label: 'Nouveau', display_order: stats.length + 1 })
      setStats([...stats, res.data])
      showToast('Stat ajoutée')
    } catch { showToast('Erreur') }
  }

  const updateStat = async (id, data) => {
    try {
      await portfolioAPI.updateStat(id, data)
      setStats(stats.map(s => s.id === id ? { ...s, ...data } : s))
    } catch { showToast('Erreur') }
  }

  const removeStat = async (id) => {
    if (!confirm('Supprimer cette stat ?')) return
    try {
      await portfolioAPI.deleteStat(id)
      setStats(stats.filter(s => s.id !== id))
      showToast('Supprimé')
    } catch { showToast('Erreur') }
  }

  // ── PROJECTS ──
  const addProject = async () => {
    try {
      const res = await portfolioAPI.createProject({ name: 'Nouveau projet', category: '', description: '', display_order: projects.length + 1 })
      setProjects([...projects, res.data])
      showToast('Projet ajouté')
    } catch { showToast('Erreur') }
  }

  const updateProject = async (id, data) => {
    try {
      await portfolioAPI.updateProject(id, data)
      setProjects(projects.map(p => p.id === id ? { ...p, ...data } : p))
    } catch { showToast('Erreur') }
  }

  const removeProject = async (id) => {
    if (!confirm('Supprimer ce projet ?')) return
    try {
      await portfolioAPI.deleteProject(id)
      setProjects(projects.filter(p => p.id !== id))
      showToast('Supprimé')
    } catch { showToast('Erreur') }
  }

  // ── SKILLS ──
  const addSkill = async () => {
    try {
      const res = await portfolioAPI.createSkill({ name: 'Nouvelle compétence', icon: '◆', description: '', percentage: 80, display_order: skills.length + 1 })
      setSkills([...skills, res.data])
      showToast('Skill ajouté')
    } catch { showToast('Erreur') }
  }

  const updateSkill = async (id, data) => {
    try {
      await portfolioAPI.updateSkill(id, data)
      setSkills(skills.map(s => s.id === id ? { ...s, ...data } : s))
    } catch { showToast('Erreur') }
  }

  const removeSkill = async (id) => {
    if (!confirm('Supprimer ce skill ?')) return
    try {
      await portfolioAPI.deleteSkill(id)
      setSkills(skills.filter(s => s.id !== id))
      showToast('Supprimé')
    } catch { showToast('Erreur') }
  }

  // ── MARQUEE ──
  const addMarquee = async () => {
    try {
      const res = await portfolioAPI.createMarquee({ text: 'Nouveau', display_order: marquee.length + 1 })
      setMarquee([...marquee, res.data])
    } catch { showToast('Erreur') }
  }

  const updateMarqueeItem = async (id, data) => {
    try {
      await portfolioAPI.updateMarquee(id, data)
      setMarquee(marquee.map(m => m.id === id ? { ...m, ...data } : m))
    } catch { showToast('Erreur') }
  }

  const removeMarquee = async (id) => {
    try {
      await portfolioAPI.deleteMarquee(id)
      setMarquee(marquee.filter(m => m.id !== id))
    } catch { showToast('Erreur') }
  }

  // ── MESSAGES ──
  const markRead = async (id) => {
    try {
      await portfolioAPI.markMessageRead(id)
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m))
    } catch {}
  }

  const removeMessage = async (id) => {
    if (!confirm('Supprimer ?')) return
    try {
      await portfolioAPI.deleteMessage(id)
      setMessages(messages.filter(m => m.id !== id))
    } catch {}
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#808098' }}>Chargement du portfolio...</div>

  const subtabs = [
    { id: 'profile', label: 'Profil & Hero' },
    { id: 'stats', label: 'Stats' },
    { id: 'projects', label: 'Projets' },
    { id: 'skills', label: 'Skills' },
    { id: 'marquee', label: 'Marquee' },
    { id: 'messages', label: `Messages (${messages.filter(m => !m.is_read).length})` },
  ]

  return (
    <div className="portfolio-admin">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="portfolio-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sub-tabs */}
      <div className="portfolio-subtabs">
        {subtabs.map(t => (
          <button
            key={t.id}
            className={`portfolio-subtab ${subTab === t.id ? 'active' : ''}`}
            onClick={() => setSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══ PROFILE & HERO ═══ */}
      {subTab === 'profile' && profile && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="portfolio-section">
          <div className="portfolio-card">
            <h3>Photo de profil</h3>
            <div className="profile-image-row">
              <div className="profile-image-preview">
                {profile.profile_image_url ? (
                  <img src={profile.profile_image_url} alt="Profil" />
                ) : (
                  <div className="profile-placeholder">SV</div>
                )}
              </div>
              <label className="upload-btn">
                Changer la photo
                <input type="file" accept="image/*" onChange={handleProfileImage} hidden />
              </label>
              {profile.profile_image_url && (
                <button className="remove-btn" onClick={() => {
                  setProfile({ ...profile, profile_image_url: '' })
                  portfolioAPI.updateProfile({ profile_image_url: '' })
                }}>Supprimer</button>
              )}
            </div>
          </div>

          <div className="portfolio-card">
            <h3>Hero</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Nom d'artiste</label>
                <input value={profile.artist_name || ''} onChange={e => setProfile({ ...profile, artist_name: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Sous-titre</label>
                <input value={profile.subtitle || ''} onChange={e => setProfile({ ...profile, subtitle: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Titre Hero Ligne 1</label>
                <input value={profile.hero_title_line1 || ''} onChange={e => setProfile({ ...profile, hero_title_line1: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Titre Hero Ligne 2</label>
                <input value={profile.hero_title_line2 || ''} onChange={e => setProfile({ ...profile, hero_title_line2: e.target.value })} />
              </div>
              <div className="form-field full">
                <label>Sous-titre Hero</label>
                <textarea value={profile.hero_subtitle || ''} onChange={e => setProfile({ ...profile, hero_subtitle: e.target.value })} rows={2} />
              </div>
              <div className="form-field">
                <label>Texte du badge</label>
                <input value={profile.badge_text || ''} onChange={e => setProfile({ ...profile, badge_text: e.target.value })} />
              </div>
              <div className="form-field">
                <label>Badge actif</label>
                <select value={profile.badge_active ? 'true' : 'false'} onChange={e => setProfile({ ...profile, badge_active: e.target.value === 'true' })}>
                  <option value="true">Oui</option>
                  <option value="false">Non</option>
                </select>
              </div>
            </div>
          </div>

          <div className="portfolio-card">
            <h3>A propos</h3>
            <div className="form-grid">
              <div className="form-field full">
                <label>Titre section</label>
                <input value={profile.bio_title || ''} onChange={e => setProfile({ ...profile, bio_title: e.target.value })} />
              </div>
              <div className="form-field full">
                <label>Paragraphe 1</label>
                <textarea value={profile.bio_text1 || ''} onChange={e => setProfile({ ...profile, bio_text1: e.target.value })} rows={3} />
              </div>
              <div className="form-field full">
                <label>Paragraphe 2</label>
                <textarea value={profile.bio_text2 || ''} onChange={e => setProfile({ ...profile, bio_text2: e.target.value })} rows={3} />
              </div>
            </div>
          </div>

          <div className="portfolio-card">
            <h3>Contact & Réseaux</h3>
            <div className="form-grid">
              <div className="form-field"><label>Email</label><input value={profile.email || ''} onChange={e => setProfile({ ...profile, email: e.target.value })} /></div>
              <div className="form-field"><label>Téléphone</label><input value={profile.phone || ''} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></div>
              <div className="form-field"><label>Adresse</label><input value={profile.address || ''} onChange={e => setProfile({ ...profile, address: e.target.value })} /></div>
              <div className="form-field"><label>Site web</label><input value={profile.website || ''} onChange={e => setProfile({ ...profile, website: e.target.value })} /></div>
              <div className="form-field"><label>Contact - Titre</label><input value={profile.contact_title || ''} onChange={e => setProfile({ ...profile, contact_title: e.target.value })} /></div>
              <div className="form-field full"><label>Contact - Texte</label><textarea value={profile.contact_text || ''} onChange={e => setProfile({ ...profile, contact_text: e.target.value })} rows={2} /></div>
              <div className="form-field"><label>Dribbble</label><input value={profile.social_dribbble || ''} onChange={e => setProfile({ ...profile, social_dribbble: e.target.value })} placeholder="https://" /></div>
              <div className="form-field"><label>Behance</label><input value={profile.social_behance || ''} onChange={e => setProfile({ ...profile, social_behance: e.target.value })} placeholder="https://" /></div>
              <div className="form-field"><label>Github</label><input value={profile.social_github || ''} onChange={e => setProfile({ ...profile, social_github: e.target.value })} placeholder="https://" /></div>
              <div className="form-field"><label>LinkedIn</label><input value={profile.social_linkedin || ''} onChange={e => setProfile({ ...profile, social_linkedin: e.target.value })} placeholder="https://" /></div>
              <div className="form-field"><label>Instagram</label><input value={profile.social_instagram || ''} onChange={e => setProfile({ ...profile, social_instagram: e.target.value })} placeholder="https://" /></div>
              <div className="form-field"><label>YouTube</label><input value={profile.social_youtube || ''} onChange={e => setProfile({ ...profile, social_youtube: e.target.value })} placeholder="https://" /></div>
              <div className="form-field"><label>TikTok</label><input value={profile.social_tiktok || ''} onChange={e => setProfile({ ...profile, social_tiktok: e.target.value })} placeholder="https://" /></div>
            </div>
          </div>

          <button className="save-btn" onClick={saveProfile} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder le profil'}
          </button>
        </motion.div>
      )}

      {/* ═══ STATS ═══ */}
      {subTab === 'stats' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="portfolio-section">
          <div className="section-header">
            <h3>Statistiques ({stats.length})</h3>
            <button className="add-btn" onClick={addStat}>+ Ajouter</button>
          </div>
          {stats.map(s => (
            <div key={s.id} className="portfolio-card item-card">
              <div className="form-grid">
                <div className="form-field"><label>Valeur</label><input type="number" value={s.value} onChange={e => updateStat(s.id, { value: parseInt(e.target.value) || 0 })} /></div>
                <div className="form-field"><label>Label</label><input value={s.label} onChange={e => updateStat(s.id, { label: e.target.value })} /></div>
                <div className="form-field"><label>Ordre</label><input type="number" value={s.display_order} onChange={e => updateStat(s.id, { display_order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <button className="remove-btn small" onClick={() => removeStat(s.id)}>Supprimer</button>
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ PROJECTS ═══ */}
      {subTab === 'projects' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="portfolio-section">
          <div className="section-header">
            <h3>Projets ({projects.length})</h3>
            <button className="add-btn" onClick={addProject}>+ Ajouter</button>
          </div>
          {projects.map(p => (
            <div key={p.id} className="portfolio-card item-card">
              <div className="form-grid">
                <div className="form-field"><label>Nom</label><input value={p.name} onChange={e => updateProject(p.id, { name: e.target.value })} /></div>
                <div className="form-field"><label>Catégorie</label><input value={p.category} onChange={e => updateProject(p.id, { category: e.target.value })} /></div>
                <div className="form-field full"><label>Description</label><textarea value={p.description} onChange={e => updateProject(p.id, { description: e.target.value })} rows={2} /></div>
                <div className="form-field"><label>Année</label><input value={p.year || ''} onChange={e => updateProject(p.id, { year: e.target.value })} /></div>
                <div className="form-field"><label>Lien URL</label><input value={p.link_url || ''} onChange={e => updateProject(p.id, { link_url: e.target.value })} placeholder="https://" /></div>
                <div className="form-field"><label>Image URL</label><input value={p.image_url || ''} onChange={e => updateProject(p.id, { image_url: e.target.value })} placeholder="URL de l'image" /></div>
                <div className="form-field"><label>Ordre</label><input type="number" value={p.display_order} onChange={e => updateProject(p.id, { display_order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <button className="remove-btn small" onClick={() => removeProject(p.id)}>Supprimer</button>
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ SKILLS ═══ */}
      {subTab === 'skills' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="portfolio-section">
          <div className="section-header">
            <h3>Skills ({skills.length})</h3>
            <button className="add-btn" onClick={addSkill}>+ Ajouter</button>
          </div>
          {skills.map(s => (
            <div key={s.id} className="portfolio-card item-card">
              <div className="form-grid">
                <div className="form-field"><label>Nom</label><input value={s.name} onChange={e => updateSkill(s.id, { name: e.target.value })} /></div>
                <div className="form-field"><label>Icône</label><input value={s.icon} onChange={e => updateSkill(s.id, { icon: e.target.value })} style={{ width: 60 }} /></div>
                <div className="form-field"><label>Pourcentage</label><input type="number" min="0" max="100" value={s.percentage} onChange={e => updateSkill(s.id, { percentage: parseInt(e.target.value) || 0 })} /></div>
                <div className="form-field full"><label>Description</label><input value={s.description || ''} onChange={e => updateSkill(s.id, { description: e.target.value })} /></div>
                <div className="form-field"><label>Ordre</label><input type="number" value={s.display_order} onChange={e => updateSkill(s.id, { display_order: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <button className="remove-btn small" onClick={() => removeSkill(s.id)}>Supprimer</button>
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ MARQUEE ═══ */}
      {subTab === 'marquee' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="portfolio-section">
          <div className="section-header">
            <h3>Bandeau défilant ({marquee.length})</h3>
            <button className="add-btn" onClick={addMarquee}>+ Ajouter</button>
          </div>
          {marquee.map(m => (
            <div key={m.id} className="portfolio-card item-card inline-card">
              <input value={m.text} onChange={e => updateMarqueeItem(m.id, { text: e.target.value })} />
              <input type="number" value={m.display_order} onChange={e => updateMarqueeItem(m.id, { display_order: parseInt(e.target.value) || 0 })} style={{ width: 60 }} />
              <button className="remove-btn small" onClick={() => removeMarquee(m.id)}>X</button>
            </div>
          ))}
        </motion.div>
      )}

      {/* ═══ MESSAGES ═══ */}
      {subTab === 'messages' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="portfolio-section">
          <h3>Messages portfolio ({messages.length})</h3>
          {messages.length === 0 && <p style={{ color: '#808098', padding: 20 }}>Aucun message</p>}
          {messages.map(m => (
            <div key={m.id} className={`portfolio-card message-card ${m.is_read ? 'read' : 'unread'}`}>
              <div className="msg-header">
                <strong>{m.name}</strong>
                <span className="msg-email">{m.email}</span>
                <span className="msg-date">{new Date(m.created_at).toLocaleDateString('fr-FR')}</span>
              </div>
              <p className="msg-body">{m.message}</p>
              <div className="msg-actions">
                {!m.is_read && <button className="mark-btn" onClick={() => markRead(m.id)}>Marquer lu</button>}
                <button className="remove-btn small" onClick={() => removeMessage(m.id)}>Supprimer</button>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      <style>{`
        .portfolio-admin { padding: 0 0 40px; }
        .portfolio-toast { position: fixed; top: 20px; right: 20px; background: #22c55e; color: #000; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; z-index: 9999; }
        .portfolio-subtabs { display: flex; gap: 4px; padding: 0 0 24px; flex-wrap: wrap; }
        .portfolio-subtab { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); color: #808098; padding: 8px 18px; border-radius: 100px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all .3s; }
        .portfolio-subtab.active { background: rgba(255,255,255,.1); color: #e8e8f0; border-color: rgba(255,255,255,.15); }
        .portfolio-subtab:hover { color: #e8e8f0; }
        .portfolio-section { display: flex; flex-direction: column; gap: 16px; }
        .portfolio-card { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.06); border-radius: 16px; padding: 24px; }
        .portfolio-card h3 { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #e8e8f0; }
        .section-header { display: flex; justify-content: space-between; align-items: center; }
        .section-header h3 { margin: 0; }
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-field { display: flex; flex-direction: column; gap: 4px; }
        .form-field.full { grid-column: 1 / -1; }
        .form-field label { font-size: 11px; font-weight: 500; color: #808098; text-transform: uppercase; letter-spacing: .05em; }
        .form-field input, .form-field textarea, .form-field select { background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 10px; color: #e8e8f0; padding: 10px 14px; font-size: 13px; font-family: inherit; outline: none; transition: border .3s; }
        .form-field input:focus, .form-field textarea:focus { border-color: #d4a574; }
        .form-field textarea { resize: vertical; }
        .form-field select { cursor: pointer; }
        .profile-image-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .profile-image-preview { width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); flex-shrink: 0; }
        .profile-image-preview img { width: 100%; height: 100%; object-fit: cover; }
        .profile-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 24px; color: #505068; }
        .upload-btn { background: rgba(212,165,116,.1); color: #d4a574; border: 1px solid rgba(212,165,116,.2); padding: 8px 18px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .3s; }
        .upload-btn:hover { background: rgba(212,165,116,.2); }
        .save-btn { background: linear-gradient(135deg, #d4a574, #c08050); color: #08080c; border: none; padding: 14px 32px; border-radius: 100px; font-size: 14px; font-weight: 700; cursor: pointer; align-self: flex-start; transition: all .3s; }
        .save-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(212,165,116,.2); }
        .save-btn:disabled { opacity: .5; cursor: not-allowed; transform: none; }
        .add-btn { background: rgba(255,255,255,.06); color: #e8e8f0; border: 1px solid rgba(255,255,255,.1); padding: 8px 18px; border-radius: 100px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all .3s; }
        .add-btn:hover { background: rgba(255,255,255,.1); }
        .remove-btn { background: rgba(255,59,48,.1); color: #ff3b30; border: 1px solid rgba(255,59,48,.15); padding: 8px 16px; border-radius: 100px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all .3s; margin-top: 12px; }
        .remove-btn.small { padding: 5px 12px; font-size: 10px; margin-top: 8px; }
        .remove-btn:hover { background: rgba(255,59,48,.2); }
        .item-card { position: relative; }
        .item-card .remove-btn { position: absolute; top: 16px; right: 16px; margin: 0; }
        .inline-card { display: flex; align-items: center; gap: 10px; padding: 12px 18px; }
        .inline-card input { flex: 1; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); border-radius: 8px; color: #e8e8f0; padding: 8px 12px; font-size: 13px; outline: none; }
        .message-card { transition: border-color .3s; }
        .message-card.unread { border-color: rgba(212,165,116,.2); }
        .msg-header { display: flex; align-items: center; gap: 12px; margin-bottom: 8px; flex-wrap: wrap; }
        .msg-header strong { font-size: 14px; color: #e8e8f0; }
        .msg-email { font-size: 12px; color: #808098; }
        .msg-date { font-size: 11px; color: #505068; margin-left: auto; }
        .msg-body { font-size: 13px; color: #a0a0b4; line-height: 1.6; }
        .msg-actions { display: flex; gap: 8px; margin-top: 10px; }
        .mark-btn { background: rgba(34,197,94,.1); color: #22c55e; border: 1px solid rgba(34,197,94,.15); padding: 5px 14px; border-radius: 100px; font-size: 11px; font-weight: 600; cursor: pointer; }
        @media (max-width: 768px) {
          .form-grid { grid-template-columns: 1fr; }
          .portfolio-subtabs { gap: 6px; }
          .portfolio-subtab { padding: 6px 14px; font-size: 11px; }
        }
      `}</style>
    </div>
  )
}
