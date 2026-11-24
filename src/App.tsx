import { useEffect, useState } from "react";
import "./App.css";
import Editor from './Editor';
import { createProjectId, deleteProject, readProjects, saveProject, type ProjectRecord } from './projects';
import AuthDialog from './AuthDialog';
import { createPhonePeCheckout, createPublicProjectLink, getPublicProject, listCloudProjects, removeCloudProject, saveCloudProject, supabase, trackProductEvent, type AuthUser } from './supabase';

const categories = [
  "All",
  "Social Media",
  "Presentation",
  "Video",
  "Logo",
  "Marketing",
  "Business",
  "Event",
  "Education",
];

const templates = [
  { title: "Instagram Post", type: "Social Media", size: "1080 × 1080", style: "pink", image: "photo-1611162617474-5b21e879e113", icon: "◎", headline: "Make today memorable", subtitle: "A little inspiration for your feed", background: "#fff1f6", accent: "#d64f89", textColor: "#70234b" },
  { title: "Instagram Story", type: "Social Media", size: "1080 × 1920", style: "green", image: "photo-1611262588024-d12430b98920", icon: "▯", headline: "Your next chapter", subtitle: "Share something worth remembering", background: "#eaf8f1", accent: "#319c70", textColor: "#164e40" },
  { title: "YouTube Thumbnail", type: "Video", size: "1280 × 720", style: "orange", image: "photo-1611162616475-46b635cb6868", icon: "▶", headline: "You need to see this!", subtitle: "The complete guide starts here", background: "#fff0df", accent: "#e56e40", textColor: "#71331d" },
  { title: "YouTube Channel Banner", type: "Video", size: "2560 × 1440", style: "dark", image: "photo-1611162618071-b39a2ec055fb", icon: "▶", headline: "Create. Learn. Repeat.", subtitle: "New videos every week", background: "#242236", accent: "#f9e7a6", textColor: "#ffffff" },
  { title: "Business Presentation", type: "Presentation", size: "16:9", style: "blue", image: "photo-1454165804606-c3d57bc86b40", icon: "▤", headline: "Ideas into impact", subtitle: "A clear plan for what comes next", background: "#edf3ff", accent: "#527ee3", textColor: "#24385f" },
  { title: "Pitch Deck Cover", type: "Presentation", size: "16:9", style: "purple", image: "photo-1497366754035-f200968a6e72", icon: "↗", headline: "The future starts here", subtitle: "Company name · Investor presentation", background: "#f4efff", accent: "#8054dc", textColor: "#39275f" },
  { title: "Brand Logo", type: "Logo", size: "500 × 500", style: "dark", image: "photo-1626785774573-4b799315345d", icon: "✦", headline: "YOUR BRAND", subtitle: "Make it unforgettable", background: "#26243a", accent: "#f9e7a6", textColor: "#ffffff" },
  { title: "Startup Logo", type: "Logo", size: "500 × 500", style: "blue", image: "photo-1504270997636-07ddfbd48945", icon: "✧", headline: "NOVA", subtitle: "Ideas that move us forward", background: "#eaf1ff", accent: "#527ee3", textColor: "#24385f" },
  { title: "Marketing Poster", type: "Marketing", size: "A4 Portrait", style: "purple", image: "photo-1500530855697-b586d89ba3ee", icon: "✳", headline: "A brighter kind of bold", subtitle: "Discover the collection made for you", background: "#f4efff", accent: "#8054dc", textColor: "#39275f" },
  { title: "Product Launch Ad", type: "Marketing", size: "1080 × 1350", style: "orange", image: "photo-1611162616305-c69b3fa7fbe0", icon: "✦", headline: "Meet your new favorite", subtitle: "Available now · Explore the launch", background: "#fff4e8", accent: "#d97736", textColor: "#653a20" },
  { title: "Business Flyer", type: "Business", size: "A4 Portrait", style: "blue", image: "photo-1497366754035-f200968a6e72", icon: "▣", headline: "Good work starts here", subtitle: "Professional service, personal care", background: "#edf3ff", accent: "#527ee3", textColor: "#24385f" },
  { title: "Business Card", type: "Business", size: "3.5 × 2 in", style: "dark", image: "photo-1504270997636-07ddfbd48945", icon: "▤", headline: "ALEX MORGAN", subtitle: "Creative Director · hello@example.com", background: "#242236", accent: "#f0bf72", textColor: "#ffffff" },
  { title: "Wedding Invitation", type: "Event", size: "5 × 7 in", style: "pink", image: "photo-1519741497674-611481863552", icon: "♡", headline: "Together with our families", subtitle: "Join us to celebrate love · June 20", background: "#fff7f2", accent: "#b76e79", textColor: "#684852" },
  { title: "Birthday Invitation", type: "Event", size: "1080 × 1350", style: "yellow", image: "photo-1530103862676-de8c9debad1d", icon: "✳", headline: "Let's celebrate!", subtitle: "You're invited · Saturday at 6 PM", background: "#fff8df", accent: "#c29331", textColor: "#624d1f" },
  { title: "Education Poster", type: "Education", size: "A4 Portrait", style: "green", image: "photo-1503676260728-1c00da094a0b", icon: "✎", headline: "Curiosity changes everything", subtitle: "Learn something new every day", background: "#eaf8f1", accent: "#319c70", textColor: "#164e40" },
  { title: "Event Announcement", type: "Event", size: "1080 × 1350", style: "orange", image: "photo-1511285560929-80b456fea0bc", icon: "✦", headline: "Save the date", subtitle: "An evening of ideas, music and people", background: "#fff0df", accent: "#dd8b3f", textColor: "#71331d" },
];

const menu = [
  ["⌂", "Home"],
  ["▦", "Templates"],
  ["✦", "AI Studio"],
  ["▶", "Video Studio"],
  ["▤", "Projects"],
  ["◈", "Brand Kit"],
  ["▧", "Photo Editor"],
  ["👥", "Team"],
  ["◉", "Admin"],
];

function createTemplateDesign(template: typeof templates[number]) {
  const align = ["Business", "Presentation", "Video", "Marketing"].includes(template.type)
    ? "left"
    : "center";
  const x = align === "left" ? 82 : 400;

  return {
    items: [
      { id: 1, type: "text", x, y: 82, text: template.title.toUpperCase(), color: template.accent, fontSize: 15, bold: true, textAlign: align, letterSpacing: 2 },
      { id: 2, type: "text", x, y: 195, text: template.icon, color: template.accent, fontSize: 52, bold: true, textAlign: align },
      { id: 3, type: "text", x, y: 270, text: template.headline, color: template.textColor, fontSize: 34, bold: true, textAlign: align },
      { id: 4, type: "text", x, y: 322, text: template.subtitle, color: template.accent, fontSize: 18, textAlign: align },
      { id: 5, type: "text", x, y: 420, text: "MAKE IT YOURS  →", color: template.textColor, fontSize: 14, bold: true, textAlign: align, letterSpacing: 1 },
    ],
    background: template.background,
    backgroundFillType: "solid",
    backgroundColor2: template.accent,
    backgroundColor3: template.textColor,
    backgroundUseThirdColor: false,
    backgroundDirection: "horizontal",
  };
}

function App() {
  const [projects, setProjects] = useState<ProjectRecord<unknown>[]>(() => readProjects());
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [active, setActive] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'Home';
  });
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [cloudStatus, setCloudStatus] = useState(supabase ? 'Checking account…' : 'Local save only');
  const [cloudError, setCloudError] = useState('');
  const [authReady, setAuthReady] = useState(!supabase);
  const [cloudSyncReady, setCloudSyncReady] = useState(!supabase);
  const [shareBusyId, setShareBusyId] = useState<string | null>(null);
  const [sharedProject, setSharedProject] = useState<{ id: string; name: string; design: unknown } | null>(null);
  const userId = user?.id;

  useEffect(() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const shareIndex = parts.indexOf('share');
    if (shareIndex === -1) return;

    const token = parts[shareIndex + 1];
    if (!token) return;

    void getPublicProject(token)
      .then(project => setSharedProject(project))
      .catch(error => {
        console.error('Could not load shared project.', error);
        setCloudError('This share link is invalid or has expired.');
      });
  }, []);

  useEffect(() => {
    const mainArea = document.querySelector('.main-area');
    if (mainArea) mainArea.scrollTo({ top: 0, behavior: 'smooth' });
  }, [active]);

  useEffect(() => {
    const onHashChange = () => {
      setActive(window.location.hash.replace('#/', '').replace('#', '') || 'Home');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (name: string) => {
    setActive(name);
    window.location.hash = `/${name}`;
  };

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (!active) return;
        const sessionUser = data.session?.user ?? null;
        setUser(sessionUser);
        setProjects(readProjects(sessionUser?.id));
        setCloudStatus(sessionUser ? 'Syncing projects…' : 'Signed out');
        setAuthReady(true);
        setCloudSyncReady(!sessionUser);
      })
      .catch(error => {
        console.error('Could not restore the signed-in session.', error);
        if (active) {
          setCloudStatus('Account unavailable');
          setAuthReady(true);
          setCloudSyncReady(true);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      setProjects(readProjects(sessionUser?.id));
      setCloudStatus(sessionUser ? 'Syncing projects…' : 'Signed out');
      setCloudSyncReady(!sessionUser);
      setAuthReady(true);
      setCloudError('');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!userId || !supabase) return;

    let active = true;
    void listCloudProjects(userId)
      .then(async cloudProjects => {
        const localProjects = readProjects<unknown>(userId);
        const cloudById = new Map(cloudProjects.map(project => [project.id, project]));

        for (const localProject of localProjects) {
          const cloudProject = cloudById.get(localProject.id);
          if (!cloudProject || Date.parse(localProject.updatedAt) > Date.parse(cloudProject.updatedAt)) {
            await saveCloudProject(userId, localProject);
            cloudById.set(localProject.id, localProject);
          }
        }

        for (const cloudProject of cloudProjects) {
          const localProject = localProjects.find(project => project.id === cloudProject.id);
          if (!localProject || Date.parse(cloudProject.updatedAt) >= Date.parse(localProject.updatedAt)) {
            saveProject(cloudProject, userId);
          }
        }

        if (active) {
          setProjects(readProjects(userId));
          setCloudStatus('Cloud synced');
          setCloudSyncReady(true);
        }
      })
      .catch(error => {
        console.error('Could not sync projects from cloud.', error);
        if (active) {
          setProjects(readProjects(userId));
          setCloudError('Cloud sync failed. Your browser copy is still available.');
          setCloudStatus('Sync failed');
          setCloudSyncReady(true);
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  const signOut = async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Could not sign out.', error);
      setCloudError('Sign out failed. Please try again.');
    }
  };

  const createProject = (name = 'Untitled design', starterTitle?: string) => {
    const now = new Date().toISOString();
    const selectedTemplate = templates.find(template => template.title === starterTitle);
    const project: ProjectRecord<unknown> = {
      id: createProjectId(),
      name,
      createdAt: now,
      updatedAt: now,
      design: selectedTemplate ? createTemplateDesign(selectedTemplate) : {
        items: starterTitle ? [
          {
            id: 1,
            type: 'text',
            x: 400,
            y: 205,
            text: starterTitle,
            color: '#222222',
            fontSize: 42,
            bold: true
          },
          {
            id: 2,
            type: 'text',
            x: 400,
            y: 270,
            text: 'Customize your design',
            color: '#7546dc',
            fontSize: 24
          }
        ] : [],
        background: '#ffffff',
        backgroundFillType: 'solid',
        backgroundColor2: '#8b5cf6',
        backgroundColor3: '#ec4899',
        backgroundUseThirdColor: false,
        backgroundDirection: 'horizontal'
      }
    };

    try {
      saveProject(project, user?.id);
      setProjects(readProjects(user?.id));
      setOpenProjectId(project.id);
    } catch (error) {
      console.error('Could not create project.', error);
      window.alert('Could not create this project. Please check available browser storage.');
    }
  };

  const closeEditor = () => {
    setOpenProjectId(null);
    setProjects(readProjects(user?.id));
  };

  const removeProject = async (id: string) => {
    if (!window.confirm('Delete this project? This cannot be undone.')) return;

    try {
      if (user) await removeCloudProject(user.id, id);
      deleteProject(id, user?.id);
      setProjects(readProjects(user?.id));
    } catch (error) {
      console.error('Could not delete project.', error);
      window.alert('Could not delete this project. Please try again.');
    }
  };

  const duplicateProject = (project: ProjectRecord<unknown>) => {
    const now = new Date().toISOString();
    const copy: ProjectRecord<unknown> = {
      ...project,
      id: createProjectId(),
      name: `${project.name} copy`,
      createdAt: now,
      updatedAt: now,
      design: JSON.parse(JSON.stringify(project.design)) as unknown
    };

    try {
      saveProject(copy, user?.id);
      setProjects(readProjects(user?.id));
      if (user) {
        void saveCloudProject(user.id, copy).catch(error => {
          console.error('Could not sync duplicated project.', error);
          setCloudError('The copy is saved here, but could not be synced to your account.');
        });
      }
    } catch (error) {
      console.error('Could not duplicate project.', error);
      window.alert('Could not duplicate this project. Please check available browser storage.');
    }
  };

  const shareProject = async (project: ProjectRecord<unknown>) => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    setShareBusyId(project.id);
    try {
      const url = await createPublicProjectLink(user.id, project.id);
      await navigator.clipboard.writeText(url);
      await trackProductEvent(user.id, 'public_link_created', { projectId: project.id });
      setCloudStatus('Share link copied');
    } catch (error) {
      console.error('Could not create a public share link.', error);
      setCloudError('Could not create a share link. Please try again.');
    } finally {
      setShareBusyId(null);
    }
  };

  const startPaidPlan = async (plan: 'monthly' | 'yearly') => {
    if (!user) {
      setAuthDialogOpen(true);
      return;
    }

    try {
      setCloudStatus('Opening secure PhonePe checkout…');
      const checkoutUrl = await createPhonePeCheckout(plan);
      window.location.assign(checkoutUrl);
    } catch (error) {
      console.error('Could not start PhonePe checkout.', error);
      setCloudError(error instanceof Error
        ? error.message
        : 'Could not start checkout. Please try again.');
      setCloudStatus('Checkout unavailable');
    }
  };

  const sortedProjects = [...projects].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt)
  );
  const filteredTemplates = templates.filter((item) => {
    const matchesCategory = category === "All" || item.type === category;
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (supabase && (!authReady || (user && !cloudSyncReady))) {
    return <div className="auth-loading" role="status">Connecting your SmartShare workspace…</div>;
  }

  if (openProjectId) {
    return (
      <Editor
        projectId={openProjectId}
        userId={user?.id}
        onBack={closeEditor}
        onUpgrade={() => {
          closeEditor();
          navigate('Premium');
        }}
      />
    );
  }

  if (sharedProject) {
    return (
      <main className="public-share-page">
        <section className="public-share-card">
          <div className="brand"><div className="brand-icon">S</div><span>smart<span>share</span></span></div>
          <div className="eyebrow">SHARED DESIGN</div>
          <h1>{sharedProject.name}</h1>
          <p>This SmartShare design was shared with you.</p>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarExpanded ? 'sidebar-expanded' : ''}`}>
        <div className="sidebar-scroll-area">
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={sidebarExpanded ? 'Collapse navigation' : 'Expand navigation'}
            aria-expanded={sidebarExpanded}
            onClick={() => setSidebarExpanded(expanded => !expanded)}
          >
            {sidebarExpanded ? '×' : '☰'}
          </button>
          <div className="brand">
            <div className="brand-icon">S</div>
            <span>smart<span>share</span></span>
          </div>

          <button className="create-button" onClick={() => createProject()}>
            <span>＋</span> Create a design
          </button>

          <div className="menu-label">WORKSPACE</div>
          <nav className="nav-menu">
            {menu.map(([icon, name]) => (
              <button
                key={name}
                type="button"
                className={`nav-item ${active === name ? "active" : ""}`}
                onClick={() => {
                  navigate(name);
                  if (window.innerWidth <= 760) setSidebarExpanded(false);
                }}
              >
                <span className="nav-icon">{icon}</span>
                {name}
              </button>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <div className="upgrade-card">
              <div className="upgrade-star">✦</div>
              <strong>Unlock your creativity</strong>
              <p>Get premium templates and AI tools.</p>
              <button onClick={() => navigate('Premium')}>Explore Premium ↗</button>
            </div>
            <div className="profile">
              <div className="avatar">{user?.email?.charAt(0).toUpperCase() ?? 'U'}</div>
              <div>
                <strong>{user?.email ?? 'Guest workspace'}</strong>
                <small>{user ? cloudStatus : 'Local save only'}</small>
              </div>
              <button className="profile-dots" onClick={user ? signOut : () => {
                if (supabase) setAuthDialogOpen(true);
                else setCloudError('To enable accounts, configure Supabase using the steps in README.md.');
              }}>
                {user ? 'Sign out' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span>/</span> {active}</div>
          <div className="top-actions">
            <label className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates, designs..."
              />
              <kbd>⌘ K</kbd>
            </label>
            <button className="icon-button" aria-label="Notifications">♧</button>
            <button
              className="top-avatar"
              aria-label={user ? `Sign out ${user.email}` : 'Sign in'}
              title={user?.email ?? (supabase ? 'Sign in' : 'Configure Supabase to enable accounts')}
              onClick={user ? signOut : () => {
                if (supabase) setAuthDialogOpen(true);
                else setCloudError('To enable accounts, configure Supabase using the steps in README.md.');
              }}
            >
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </button>
          </div>
        </header>

        <div className="page-content">
          {!supabase && (
            <div className="cloud-setup-notice" role="status">
              <strong>Local mode</strong>
              <span>Cloud accounts are not connected yet. Configure Supabase to enable sign-in and cross-device project sync.</span>
            </div>
          )}
          {cloudError && <div className="cloud-error-notice" role="alert">{cloudError}</div>}
          {active === 'Team' ? (
            <section className="team-section">
              <div className="section-heading">
                <div><div className="eyebrow">TEAM WORKSPACE</div><h1>Members</h1><p>Invite and manage people in your workspace.</p></div>
                <button className="hero-button" onClick={() => setCloudError('Team invitations will activate when workspace billing is enabled.')}>Invite member</button>
              </div>
              <div className="team-empty">
                <div className="avatar">{user?.email?.charAt(0).toUpperCase() ?? 'U'}</div>
                <div><strong>{user?.email ?? 'Guest'}</strong><small>Owner</small></div>
              </div>
            </section>
          ) : active === 'Admin' ? (
            <section className="admin-section">
              <div className="section-heading"><div><div className="eyebrow">CONTROL CENTER</div><h1>Admin dashboard</h1><p>Workspace usage and account overview.</p></div></div>
              <div className="admin-grid">
                <article><small>Projects</small><strong>{projects.length}</strong></article>
                <article><small>Plan</small><strong>Free</strong></article>
                <article><small>Account</small><strong>{user ? 'Active' : 'Guest'}</strong></article>
              </div>
            </section>
          ) : active === 'Templates' ? (
            <section className="template-library-section">
              <div className="section-heading"><div><div className="eyebrow">TEMPLATE LIBRARY</div><h1>Pick a design you love</h1><p>Choose any template below, then edit its text, colors, and layers in the editor.</p></div></div>
              <div className="category-tabs">
                {categories.map(item => (
                  <button key={item} className={category === item ? 'category active-category' : 'category'} onClick={() => setCategory(item)}>{item}</button>
                ))}
              </div>
              <div className="template-grid">
                {filteredTemplates.map(item => (
                  <button className="template-card" key={item.title} onClick={() => createProject(item.title, item.title)}>
                    <div className={`template-photo-preview ${item.style}`}>
                      <img
                        src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=800&q=85`}
                        alt={`${item.title} template preview`}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="template-photo-type">{item.type}</span>
                      <div className="template-photo-caption">
                        <strong>{item.headline}</strong>
                        <small>{item.subtitle}</small>
                      </div>
                    </div>
                    <div className="template-info"><div><strong>{item.title}</strong><small>{item.type} · {item.size}</small></div><span>Customize ↗</span></div>
                  </button>
                ))}
              </div>
            </section>
          ) : active === 'AI Studio' || active === 'Video Studio' || active === 'Brand Kit' || active === 'Photo Editor' ? (
            <section className="studio-section">
              <div className="section-heading">
                <div><div className="eyebrow">SMARTSHARE STUDIO</div><h1>{active}</h1>
                  <p>{active === 'AI Studio' ? 'Generate and customize a new creative direction.'
                    : active === 'Video Studio' ? 'Create a canvas sized for short-form and YouTube videos.'
                    : active === 'Brand Kit' ? 'Keep your brand colors and identity ready.'
                    : 'Upload an image and start editing it in the design workspace.'}</p>
                </div>
              </div>
              <div className="studio-grid">
                <button onClick={() => createProject(`${active} design`)}>
                  <span>＋</span><strong>Create {active} design</strong><small>Open the editor and start creating</small>
                </button>
                {active === 'Brand Kit' && (
                  <button onClick={() => createProject('Brand Kit')}>
                    <span>✦</span><strong>Set brand colors</strong><small>Create a reusable brand canvas</small>
                  </button>
                )}
                {active === 'AI Studio' && (
                  <button onClick={() => createProject('AI Campaign', 'Your AI-powered campaign')}>
                    <span>✧</span><strong>AI campaign starter</strong><small>Generate a campaign layout</small>
                  </button>
                )}
              </div>
            </section>
          ) : active === 'Projects' ? (
            <section className="all-projects-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">YOUR WORKSPACE</div>
                  <h1>My projects</h1>
                  <p>{user ? 'Your designs sync to your account.' : 'Your designs are saved in this browser.'}</p>
                </div>
                <button className="hero-button project-create-button" onClick={() => createProject()}>＋ Create a design</button>
              </div>
              {sortedProjects.length === 0 ? (
                <div className="empty-projects">
                  <span>✦</span>
                  <h2>Your next great idea starts here</h2>
                  <p>Create a design and it will appear here automatically.</p>
                  <button className="hero-button project-create-button" onClick={() => createProject()}>Create your first design →</button>
                </div>
              ) : (
                <div className="projects-grid all-projects-grid">
                  {sortedProjects.map(project => (
                    <article className="project-card project-record-card" key={project.id}>
                      <button
                        className="project-card-open"
                        onClick={() => setOpenProjectId(project.id)}
                        aria-label={`Open ${project.name}`}
                      >
                        <span className="project-card-preview">S</span>
                        <strong>{project.name}</strong>
                        <small>Edited {new Date(project.updatedAt).toLocaleDateString()}</small>
                      </button>
                      <div className="project-card-actions">
                        <button onClick={() => duplicateProject(project)}>Make a copy</button>
                        <button onClick={() => void shareProject(project)} disabled={shareBusyId === project.id}>
                          {shareBusyId === project.id ? 'Creating…' : 'Share'}
                        </button>
                        <button onClick={() => removeProject(project.id)}>Delete</button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          ) : active === 'Premium' ? (
            <section className="billing-section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">SMARTSHARE PREMIUM</div>
                  <h1>Choose your plan</h1>
                  <p>Secure checkout powered by PhonePe UPI.</p>
                </div>
              </div>
              <div className="billing-grid">
                <article className="billing-card">
                  <span className="billing-badge">MONTHLY</span>
                  <div className="billing-price"><strong>₹199</strong><small>/month</small></div>
                  <p>Flexible monthly access for creators.</p>
                  <ul>
                    <li>Unlimited saved projects</li>
                    <li>Premium templates</li>
                    <li>Cloud image storage</li>
                  </ul>
                  <button className="hero-button" onClick={() => void startPaidPlan('monthly')}>
                    Pay ₹199 with PhonePe
                  </button>
                </article>
                <article className="billing-card billing-card-featured">
                  <span className="billing-badge">BEST VALUE · YEARLY</span>
                  <div className="billing-price"><strong>₹1499</strong><small>/year</small></div>
                  <p>SmartShare Pro for the whole year.</p>
                  <ul>
                    <li>Everything in Monthly</li>
                    <li>Priority exports</li>
                    <li>Save ₹889 per year</li>
                  </ul>
                  <button className="hero-button" onClick={() => void startPaidPlan('yearly')}>
                    Pay ₹1499 with PhonePe
                  </button>
                </article>
              </div>
              <p className="billing-note">UPI, PhonePe, Paytm and other supported methods are handled securely by PhonePe.</p>
            </section>
          ) : (
            <>
          <section className="welcome-row">
            <div>
              <div className="eyebrow">YOUR CREATIVE SPACE</div>
              <h1>Good things start with<br /><span>an idea.</span></h1>
              <p>Bring your imagination to life. Create something extraordinary with SmartShare.</p>
              <button className="hero-button" onClick={() => createProject()}>
                ＋ Create a design <span>→</span>
              </button>
            </div>
            <div className="hero-art">
              <div className="art-card art-card-one">✦</div>
              <div className="art-card art-card-two">Aa</div>
              <div className="art-card art-card-three">◈</div>
              <div className="art-circle">S</div>
              <div className="art-caption">MAKE IT<br />YOURS.</div>
            </div>
          </section>

          <section className="quick-section">
            <div className="section-heading">
              <div>
                <h2>What would you like to create?</h2>
                <p>Choose a canvas and let your creativity flow.</p>
              </div>
            </div>
            <div className="quick-grid">
              {[
                ["▣", "Social Post", "pink"],
                ["▶", "Video", "orange"],
                ["▤", "Presentation", "blue"],
                ["✦", "Logo", "purple"],
                ["▧", "Photo Edit", "green"],
                ["＋", "Custom Size", "yellow"],
              ].map(([icon, title, color]) => (
                <button className="quick-card" key={title} onClick={() => createProject(`${title} design`)}>
                  <span className={`quick-icon ${color}`}>{icon}</span>
                  <strong>{title}</strong>
                  <span className="quick-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>

          {sortedProjects.length > 0 && (
            <section className="projects-section">
              <div className="section-heading">
                <div>
                  <h2>Recent projects</h2>
                  <p>{user ? 'Your designs sync to your account.' : 'Your designs are saved in this browser.'}</p>
                </div>
                <button className="view-all" onClick={() => setActive('Projects')}>View all →</button>
              </div>
              <div className="projects-grid">
                {sortedProjects.slice(0, 3).map(project => (
                  <button
                    className="project-card"
                    key={project.id}
                    onClick={() => setOpenProjectId(project.id)}
                  >
                    <span className="project-card-preview">S</span>
                    <strong>{project.name}</strong>
                    <small>Edited {new Date(project.updatedAt).toLocaleDateString()}</small>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="template-section">
            <div className="section-heading template-heading">
              <div>
                <h2>Explore templates</h2>
                <p>Beautiful starting points for your next big idea.</p>
              </div>
              <button className="view-all" onClick={() => setCategory("All")}>View all →</button>
            </div>

            <div className="category-tabs">
              {categories.map((item) => (
                <button
                  key={item}
                  className={category === item ? "category active-category" : "category"}
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="template-grid">
              {filteredTemplates.map((item) => (
                <button className="template-card" key={item.title} onClick={() => createProject(item.title, item.title)}>
                  <div className={`template-photo-preview ${item.style}`}>
                    <img
                      src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=800&q=85`}
                      alt={`${item.title} template preview`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="template-photo-type">{item.type}</span>
                    <div className="template-photo-caption">
                      <strong>{item.headline}</strong>
                      <small>{item.subtitle}</small>
                    </div>
                  </div>
                  <div className="template-info">
                    <div><strong>{item.title}</strong><small>{item.type} · {item.size}</small></div>
                    <span>Customize ↗</span>
                  </div>
                </button>
              ))}
              {filteredTemplates.length === 0 && <p>No matching templates found.</p>}
            </div>
          </section>

          <section className="ai-banner">
            <div>
              <span className="ai-label">✦ POWERED BY AI</span>
              <h2>Your imagination.<br />AI-powered creation.</h2>
              <p>Discover new possibilities with SmartShare AI Studio.</p>
              <button onClick={() => setActive("AI Studio")}>Explore AI Studio →</button>
            </div>
            <div className="ai-art">✧</div>
          </section>

          <footer className="footer">© 2026 SmartShare. Create without limits.</footer>
            </>
          )}
        </div>
      </main>
      {authDialogOpen && <AuthDialog onClose={() => setAuthDialogOpen(false)} />}
    </div>
  );
}

export default App;