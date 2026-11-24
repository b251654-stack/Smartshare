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

const examplesByType: Record<string, Array<{ name: string; image: string }>> = {
  "Social Media": [
    { name: "Fresh & bright", image: "photo-1611162617474-5b21e879e113" },
    { name: "Color pop", image: "photo-1611262588024-d12430b98920" },
    { name: "Editorial", image: "photo-1611162616305-c69b3fa7fbe0" },
    { name: "Minimal", image: "photo-1490750967868-88aa4486c946" },
    { name: "Lifestyle", image: "photo-1500530855697-b586d89ba3ee" },
    { name: "Bold story", image: "photo-1530103862676-de8c9debad1d" },
    { name: "Product focus", image: "photo-1523275335684-37898b6baf30" },
    { name: "Street style", image: "photo-1483985988355-763728e1935b" },
    { name: "Travel notes", image: "photo-1500534623283-312aade485b7" },
    { name: "Creator life", image: "photo-1492619375914-88005aa9e8fb" },
    { name: "Colorful moments", image: "photo-1513364776144-60967b0f800f" },
    { name: "Daily inspiration", image: "photo-1511988617509-a57c8a288659" },
  ],
  Video: [
    { name: "Creator spotlight", image: "photo-1611162616475-46b635cb6868" },
    { name: "Big reveal", image: "photo-1611162618071-b39a2ec055fb" },
    { name: "Travel vlog", image: "photo-1500530855697-b586d89ba3ee" },
    { name: "How-to guide", image: "photo-1454165804606-c3d57bc86b40" },
    { name: "New episode", image: "photo-1492619375914-88005aa9e8fb" },
    { name: "Weekend edit", image: "photo-1470225620780-dba8ba36b745" },
  ],
  Presentation: [
    { name: "Modern business", image: "photo-1454165804606-c3d57bc86b40" },
    { name: "Startup pitch", image: "photo-1497366754035-f200968a6e72" },
    { name: "Clean minimal", image: "photo-1497366216548-37526070297c" },
    { name: "Creative studio", image: "photo-1497366811353-6870744d04b2" },
    { name: "Strategy deck", image: "photo-1552664730-d307ca884978" },
    { name: "Project overview", image: "photo-1507679799987-c73779587ccf" },
    { name: "Team workshop", image: "photo-1521737711867-e3b97375f902" },
    { name: "Product roadmap", image: "photo-1460925895917-afdab827c52f" },
    { name: "Research report", image: "photo-1450101499163-c8848c66ca85" },
    { name: "Creative portfolio", image: "photo-1455390582262-044cdead277a" },
    { name: "Marketing plan", image: "photo-1556761175-b413da4baf72" },
    { name: "Annual review", image: "photo-1553877522-43269d4ea984" },
  ],
  Logo: [
    { name: "Studio identity", image: "photo-1626785774573-4b799315345d" },
    { name: "Modern mark", image: "photo-1504270997636-07ddfbd48945" },
    { name: "Creative brand", image: "photo-1634942536790-2537db5a8e3d" },
    { name: "Natural style", image: "photo-1490750967868-88aa4486c946" },
    { name: "Bold identity", image: "photo-1558655146-d09347e92766" },
    { name: "Simple & clean", image: "photo-1500534623283-312aade485b7" },
  ],
  Marketing: [
    { name: "Product launch", image: "photo-1611162616305-c69b3fa7fbe0" },
    { name: "Seasonal offer", image: "photo-1490481651871-ab68de25d43d" },
    { name: "Outdoor campaign", image: "photo-1500530855697-b586d89ba3ee" },
    { name: "Bright promotion", image: "photo-1542291026-7eec264c27ff" },
    { name: "New collection", image: "photo-1483985988355-763728e1935b" },
    { name: "Product story", image: "photo-1523275335684-37898b6baf30" },
  ],
  Business: [
    { name: "Team & culture", image: "photo-1497366754035-f200968a6e72" },
    { name: "Professional", image: "photo-1507679799987-c73779587ccf" },
    { name: "Service highlight", image: "photo-1497366216548-37526070297c" },
    { name: "Business growth", image: "photo-1552664730-d307ca884978" },
    { name: "Product showcase", image: "photo-1523275335684-37898b6baf30" },
    { name: "Workspace", image: "photo-1497366811353-6870744d04b2" },
  ],
  Event: [
    { name: "Wedding day", image: "photo-1519741497674-611481863552" },
    { name: "Garden party", image: "photo-1511285560929-80b456fea0bc" },
    { name: "Birthday party", image: "photo-1530103862676-de8c9debad1d" },
    { name: "Evening celebration", image: "photo-1511795409834-ef04bbd61622" },
    { name: "Save the date", image: "photo-1464366400600-7168b8af9bc3" },
    { name: "Special moment", image: "photo-1464366400600-7168b8af9bc3" },
  ],
  Education: [
    { name: "Learning together", image: "photo-1503676260728-1c00da094a0b" },
    { name: "Study guide", image: "photo-1434030216411-0b793f4b4173" },
    { name: "Classroom", image: "photo-1509062522246-3755977927d7" },
    { name: "Creative learning", image: "photo-1503454537195-1dcabb73ffb9" },
    { name: "School project", image: "photo-1427504494785-3a9ca7044f45" },
    { name: "New ideas", image: "photo-1509062522246-3755977927d7" },
  ],
};

const homeQuickLinks = [
  { icon: "▦", title: "Templates", color: "blue", category: "All" },
  { icon: "▤", title: "Presentation", color: "orange", category: "Presentation" },
  { icon: "◎", title: "Social media", color: "pink", category: "Social Media" },
  { icon: "▶", title: "Video", color: "purple", category: "Video" },
  { icon: "✳", title: "Printables", color: "yellow", category: "Marketing" },
  { icon: "▤", title: "Documents", color: "blue", category: "Business" },
  { icon: "◇", title: "Whiteboard", color: "green", category: "Education" },
  { icon: "▦", title: "Sheets", color: "green", category: "Business" },
  { icon: "▧", title: "Website", color: "purple", category: "Marketing" },
  { icon: "✎", title: "Education", color: "orange", category: "Education" },
  { icon: "✦", title: "Events", color: "pink", category: "Event" },
];

const searchFormats = [
  { title: "Instagram Post", type: "Social Media", size: "1080 × 1080", icon: "◎", keywords: "instagram social post feed square", templateTitle: "Instagram Post" },
  { title: "Instagram Story", type: "Social Media", size: "1080 × 1920", icon: "▯", keywords: "instagram story vertical", templateTitle: "Instagram Story" },
  { title: "Instagram Reel", type: "Social Media", size: "1080 × 1920", icon: "▶", keywords: "instagram reel video vertical", templateTitle: "Instagram Story" },
  { title: "Instagram Carousel", type: "Social Media", size: "1080 × 1080", icon: "▧", keywords: "instagram carousel swipe post", templateTitle: "Instagram Post" },
  { title: "Instagram Ad", type: "Social Media", size: "1080 × 1350", icon: "✦", keywords: "instagram ad promotion", templateTitle: "Instagram Post" },
  { title: "Instagram Profile", type: "Social Media", size: "320 × 320", icon: "◉", keywords: "instagram profile picture avatar", templateTitle: "Instagram Post" },
  { title: "Reel Cover", type: "Social Media", size: "1080 × 1920", icon: "▣", keywords: "instagram reel cover thumbnail", templateTitle: "Instagram Story" },
  { title: "Instagram Highlight", type: "Social Media", size: "1080 × 1920", icon: "◌", keywords: "instagram highlight story cover", templateTitle: "Instagram Story" },
  { title: "Presentation (16:9)", type: "Presentation", size: "1920 × 1080", icon: "▤", keywords: "presentation slides widescreen", templateTitle: "Business Presentation" },
  { title: "Presentation (4:3)", type: "Presentation", size: "1024 × 768", icon: "▤", keywords: "presentation slides classic", templateTitle: "Business Presentation" },
  { title: "Pitch deck", type: "Presentation", size: "16:9", icon: "↗", keywords: "presentation pitch deck startup", templateTitle: "Pitch Deck Cover" },
  { title: "Presentation cover", type: "Presentation", size: "16:9", icon: "✦", keywords: "presentation cover title slide", templateTitle: "Business Presentation" },
  { title: "YouTube Thumbnail", type: "Video", size: "1280 × 720", icon: "▶", keywords: "youtube video thumbnail", templateTitle: "YouTube Thumbnail" },
  { title: "YouTube Banner", type: "Video", size: "2560 × 1440", icon: "▰", keywords: "youtube channel banner", templateTitle: "YouTube Channel Banner" },
  { title: "Logo", type: "Logo", size: "500 × 500", icon: "✦", keywords: "logo brand identity", templateTitle: "Brand Logo" },
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

function createTemplateDesign(
  template: typeof templates[number],
  example?: { imageDataUrl: string; name: string; variant: number }
) {
  if (example) {
    const align = example.variant % 2 === 0 ? "left" : "center";
    const x = align === "left" ? 64 : 400;
    return {
      items: [
        { id: 1, type: "image", x: 0, y: 0, width: 800, height: 500, src: example.imageDataUrl, color: "#ffffff", fontSize: 24 },
        { id: 2, type: "shape", shapeKind: "rectangle", x: 0, y: 280, width: 800, height: 220, color: "#171521", fontSize: 24, opacity: 0.68, fillType: "solid" },
        { id: 3, type: "text", x, y: 338, text: example.name.toUpperCase(), color: "#ffffff", fontSize: 14, bold: true, textAlign: align, letterSpacing: 2 },
        { id: 4, type: "text", x, y: 395, text: template.headline, color: "#ffffff", fontSize: 36, bold: true, textAlign: align },
        { id: 5, type: "text", x, y: 438, text: template.subtitle, color: "#ffffff", fontSize: 18, textAlign: align },
        { id: 6, type: "text", x, y: 475, text: "MAKE IT YOURS  →", color: "#ffffff", fontSize: 12, bold: true, textAlign: align, letterSpacing: 1 },
      ],
      background: "#171521",
      backgroundFillType: "solid",
      backgroundColor2: template.accent,
      backgroundColor3: template.textColor,
      backgroundUseThirdColor: false,
      backgroundDirection: "horizontal",
    };
  }

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

function getProjectPreview(design: unknown): string | null {
  if (typeof design !== "object" || design === null || !("items" in design) || !Array.isArray(design.items)) {
    return null;
  }

  const image = design.items.find(item =>
    typeof item === "object" &&
    item !== null &&
    "type" in item &&
    item.type === "image" &&
    "src" in item &&
    typeof item.src === "string"
  );

  return image && typeof image === "object" && "src" in image && typeof image.src === "string"
    ? image.src
    : null;
}

function App() {
  const [projects, setProjects] = useState<ProjectRecord<unknown>[]>(() => readProjects());
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<typeof templates[number] | null>(null);
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
    if (name !== 'Templates') setSelectedTemplate(null);
    setSearch('');
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

  const createProject = (
    name = 'Untitled design',
    starterTitle?: string,
    example?: { imageDataUrl: string; name: string; variant: number }
  ) => {
    const now = new Date().toISOString();
    const selectedTemplate = templates.find(template => template.title === starterTitle);
    const project: ProjectRecord<unknown> = {
      id: createProjectId(),
      name,
      createdAt: now,
      updatedAt: now,
      design: selectedTemplate ? createTemplateDesign(selectedTemplate, example) : {
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

  const chooseTemplate = (template: typeof templates[number]) => {
    setSelectedTemplate(template);
    navigate('Templates');
  };

  const createExampleProject = async (
    template: typeof templates[number],
    example: { name: string; image: string },
    variant: number
  ) => {
    const imageUrl = `https://images.unsplash.com/${example.image}?auto=format&fit=crop&w=800&h=500&q=82`;

    try {
      const response = await fetch(imageUrl, { mode: 'cors' });
      if (!response.ok) throw new Error(`Example image request failed with status ${response.status}.`);
      const blob = await response.blob();
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve(reader.result)
          : reject(new Error('Could not read the selected example image.'));
        reader.onerror = () => reject(reader.error ?? new Error('Could not read the selected example image.'));
        reader.readAsDataURL(blob);
      });

      createProject(`${template.title} - ${example.name}`, template.title, {
        imageDataUrl,
        name: example.name,
        variant
      });
    } catch (error) {
      console.error('Could not create a design from the selected example.', error);
      window.alert('This example could not be loaded. Please choose another one or try again.');
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
  const normalizedSearch = search.trim().toLowerCase();
  const matchingSearchTemplates = normalizedSearch
    ? templates.filter(item => item.title.toLowerCase().includes(normalizedSearch) || item.type.toLowerCase().includes(normalizedSearch))
    : [];
  const searchFormatsForQuery = normalizedSearch
    ? searchFormats.filter(item => `${item.title} ${item.keywords}`.toLowerCase().includes(normalizedSearch))
    : [];
  const searchType = matchingSearchTemplates[0]?.type ?? searchFormatsForQuery[0]?.type;
  const searchTemplate = matchingSearchTemplates[0] ?? templates.find(item => item.type === searchType);
  const searchExamples = searchType ? examplesByType[searchType] ?? [] : [];
  const showSearchResults = normalizedSearch.length > 0 &&
    (active === "Home" || active === "Templates") &&
    !selectedTemplate;
  const renderHomeTemplateCard = (item: typeof templates[number]) => (
    <button className="home-template-card" key={item.title} type="button" onClick={() => chooseTemplate(item)}>
      <div className="home-template-image">
        <img
          src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=640&h=420&q=82`}
          alt={`${item.title} photo template`}
          loading="lazy"
          decoding="async"
        />
        <span>{item.type}</span>
      </div>
      <strong>{item.title}</strong>
      <small>{item.size}</small>
    </button>
  );

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
          {showSearchResults ? (
            <section className="search-results-page">
              <div className="search-results-heading">
                <div className="eyebrow">SMARTSHARE SEARCH</div>
                <h1>Results for “{search.trim()}”</h1>
                <p>Choose a format to start, or pick a photo example to customize.</p>
              </div>

              {searchFormatsForQuery.length > 0 && (
                <section className="search-format-section">
                  <div className="section-heading">
                    <div><h2>Start with a format</h2><p>Popular sizes and design types</p></div>
                  </div>
                  <div className="search-format-row">
                    {searchFormatsForQuery.map(format => (
                      <button
                        className="search-format-card"
                        key={format.title}
                        type="button"
                        onClick={() => createProject(format.title, format.templateTitle)}
                      >
                        <span className={`quick-icon ${format.type === "Social Media" ? "pink" : format.type === "Presentation" ? "blue" : "purple"}`}>{format.icon}</span>
                        <strong>{format.title}</strong>
                        <small>{format.size}</small>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {searchTemplate && searchExamples.length > 0 && (
                <section className="search-example-section">
                  <div className="section-heading">
                    <div><h2>Photo templates for {searchType}</h2><p>Choose a design, then edit its text and details in the editor.</p></div>
                    <button className="view-all" type="button" onClick={() => { setCategory(searchType ?? "All"); navigate("Templates"); }}>Browse all →</button>
                  </div>
                  <div className="search-example-grid">
                    {searchExamples.map((example, index) => (
                      <button
                        className="search-example-card"
                        key={`${searchType}-${example.name}`}
                        type="button"
                        onClick={() => void createExampleProject(searchTemplate, example, index)}
                      >
                        <img
                          src={`https://images.unsplash.com/${example.image}?auto=format&fit=crop&w=600&h=420&q=82`}
                          alt={`${searchType} example: ${example.name}`}
                          loading="lazy"
                          decoding="async"
                        />
                        <span className="search-example-overlay"><strong>{example.name}</strong><small>Edit this design ↗</small></span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {searchFormatsForQuery.length === 0 && searchExamples.length === 0 && (
                <div className="search-empty-state">
                  <span>⌕</span>
                  <h2>No matching designs yet</h2>
                  <p>Try another search, like Instagram, presentation, video, or logo.</p>
                </div>
              )}
            </section>
          ) : active === 'Team' ? (
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
          ) : active === 'Templates' && selectedTemplate ? (
            <section className="template-examples-section">
              <button className="view-all" type="button" onClick={() => setSelectedTemplate(null)}>← All templates</button>
              <div className="section-heading">
                <div>
                  <div className="eyebrow">{selectedTemplate.type.toUpperCase()} EXAMPLES</div>
                  <h1>{selectedTemplate.title}</h1>
                  <p>Pick an example to open it in the editor. Change anything you like, or download it from the editor.</p>
                </div>
              </div>
              <div className="template-examples-grid">
                {(examplesByType[selectedTemplate.type] ?? []).map((example, index) => (
                  <article className="template-example-card" key={`${selectedTemplate.title}-${example.name}`}>
                    <div className={`template-photo-preview ${selectedTemplate.style}`}>
                      <img
                        src={`https://images.unsplash.com/${example.image}?auto=format&fit=crop&w=800&h=500&q=82`}
                        alt={`${selectedTemplate.title} example: ${example.name}`}
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="template-photo-type">{example.name}</span>
                      <div className="template-photo-caption">
                        <strong>{selectedTemplate.headline}</strong>
                        <small>{selectedTemplate.subtitle}</small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="template-example-action"
                      onClick={() => void createExampleProject(selectedTemplate, example, index)}
                    >
                      Edit & download ↗
                    </button>
                  </article>
                ))}
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
                  <button className="template-card" key={item.title} onClick={() => chooseTemplate(item)}>
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
          <section className="home-discovery-hero">
            <div className="eyebrow">YOUR SMARTSHARE WORKSPACE</div>
            <h1>What will you create today?</h1>
            <p>Start with a format, find a photo template, and make it your own.</p>
            <div className="home-view-toggle" role="group" aria-label="Workspace pages">
              <button className="selected" type="button" onClick={() => navigate("Home")}>⌂ Home</button>
              <button type="button" onClick={() => navigate("Templates")}>▦ Templates</button>
            </div>
            <label className="home-search-box">
              <span aria-hidden="true">⌕</span>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Search Instagram, presentations, posters..."
                aria-label="Search design formats and photo templates"
              />
              <kbd>↵</kbd>
            </label>
            <div className="home-quick-row" aria-label="Popular design categories">
              {homeQuickLinks.map(item => (
                <button
                  type="button"
                  className="home-quick-link"
                  key={item.title}
                  onClick={() => { setCategory(item.category); navigate("Templates"); }}
                >
                  <span className={`quick-icon ${item.color}`}>{item.icon}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="home-section">
            <div className="section-heading">
              <div><h2>Continue designing</h2><p>{user ? 'Your designs sync to your account.' : 'Your designs are saved in this browser.'}</p></div>
              {sortedProjects.length > 0 && <button className="view-all" type="button" onClick={() => navigate("Projects")}>See all →</button>}
            </div>
            {sortedProjects.length > 0 ? (
              <div className="home-card-strip">
                {sortedProjects.slice(0, 8).map(project => {
                  const preview = getProjectPreview(project.design);
                  return (
                    <button className="home-project-card" key={project.id} type="button" onClick={() => setOpenProjectId(project.id)}>
                      <div className="home-project-image">
                        {preview ? <img src={preview} alt="" loading="lazy" /> : <span>✦</span>}
                      </div>
                      <strong>{project.name}</strong>
                      <small>Edited {new Date(project.updatedAt).toLocaleDateString()}</small>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="home-empty-design">
                <span>✦</span>
                <div><strong>Your recent designs will show up here</strong><small>Pick a photo template below or start with a blank design.</small></div>
                <button type="button" onClick={() => createProject()}>＋ Create a design</button>
              </div>
            )}
          </section>

          <section className="home-section">
            <div className="section-heading">
              <div><h2>Templates for you</h2><p>Photo-rich starting points for your next idea.</p></div>
              <button className="view-all" type="button" onClick={() => { setCategory("All"); navigate("Templates"); }}>See all →</button>
            </div>
            <div className="home-card-strip">{templates.slice(0, 6).map(renderHomeTemplateCard)}</div>
          </section>

          <section className="home-section">
            <div className="section-heading">
              <div><h2>Browse template categories</h2><p>Jump straight into the kind of design you need.</p></div>
            </div>
            <div className="home-category-grid">
              {categories.slice(1).map(type => {
                const item = templates.find(template => template.type === type);
                if (!item) return null;
                return (
                  <button
                    className="home-category-card"
                    key={type}
                    type="button"
                    onClick={() => { setCategory(type); navigate("Templates"); }}
                  >
                    <img src={`https://images.unsplash.com/${item.image}?auto=format&fit=crop&w=420&h=180&q=78`} alt="" loading="lazy" />
                    <span><strong>{type}</strong><small>{templates.filter(template => template.type === type).length} design types</small></span>
                    <b aria-hidden="true">→</b>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="home-section">
            <div className="section-heading">
              <div><h2>Frequently used</h2><p>Quickly start with a popular canvas size.</p></div>
            </div>
            <div className="home-format-strip">
              {[searchFormats[0], searchFormats[8], searchFormats[12], searchFormats[1], searchFormats[10], searchFormats[14]].map(format => (
                <button className="home-format-card" key={format.title} type="button" onClick={() => createProject(format.title, format.templateTitle)}>
                  <span>{format.icon}</span><strong>{format.title}</strong><small>{format.size}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="home-section">
            <div className="section-heading">
              <div><h2>Popular on SmartShare</h2><p>Fresh ideas picked for the community.</p></div>
              <button className="view-all" type="button" onClick={() => { setCategory("All"); navigate("Templates"); }}>Browse templates →</button>
            </div>
            <div className="home-card-strip">{templates.slice(6, 12).map(renderHomeTemplateCard)}</div>
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